import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function App() {
  const [kpis, setKpis] = useState({ totalRevenue: 0, totalUnits: 0, averageDealSize: 0 });
  const [chartData, setChartData] = useState([]);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const kpiRes = await axios.get('http://127.0.0.1:6060/api/kpis');
      const chartRes = await axios.get('http://127.0.0.1:6060/api/charts/category-breakdown');
      setKpis(kpiRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      console.error("API Fetch Error:", err.message);
    }
  };

  const handleCSVImport = async () => {
    if(!importText.trim()) return alert("Paste clean values first!");
    const lines = importText.trim().split('\n');
    const parsedRows = lines.map(line => {
      const [product_name, category, revenue, units_sold] = line.split(',');
      return { product_name, category, revenue, units_sold };
    });

    try {
      await axios.post('http://127.0.0.1:6060/api/import-csv', { csvData: parsedRows });
      alert("Ingestion pipeline completed successfully.");
      setImportText("");
      fetchMetrics();
    } catch (err) {
      alert("Error uploading source parameters: " + err.message);
    }
  };

  const exportBIReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + `KPI,Value\nTotal Revenue,$${kpis.totalRevenue}\nVolume Distributed,${kpis.totalUnits} Units\nAvg Transaction Value,$${kpis.averageDealSize}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Executive_BI_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pieChartConfig = {
    labels: chartData.map(item => item.category),
    datasets: [{
      data: chartData.map(item => item.revenue),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { family: 'system-ui', size: 12 } }
      }
    }
  };

  return (
    <div style={dashboardWrapper}>
      {/* Header Panel */}
      <div style={headerContainer}>
        <div>
          <h1 style={mainTitle}>Enterprise BI & Analytics</h1>
          <p style={subtitle}>Real-time performance ledger & business intelligence node</p>
        </div>
        <button onClick={exportBIReport} style={exportBtnStyle}>Export Executive Summary</button>
      </div>

      {/* Modern Gradient KPI Row */}
      <div style={kpiRowStyle}>
        <div style={{...kpiCardStyle, backgroundImage: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'}}>
          <p style={kpiLabel}>Total Revenue Pool</p>
          <h2 style={kpiValue}>${kpis.totalRevenue.toLocaleString()}</h2>
        </div>
        <div style={{...kpiCardStyle, backgroundImage: 'linear-gradient(135deg, #10b981, #047857)'}}>
          <p style={kpiLabel}>Volume Distributed</p>
          <h2 style={kpiValue}>{kpis.totalUnits.toLocaleString()} <span style={{fontSize:'16px'}}>Units</span></h2>
        </div>
        <div style={{...kpiCardStyle, backgroundImage: 'linear-gradient(135deg, #8b5cf6, #6d28d9)'}}>
          <p style={kpiLabel}>Avg Transaction Value</p>
          <h2 style={kpiValue}>${kpis.averageDealSize.toLocaleString()}</h2>
        </div>
      </div>

      {/* Main Control Grid */}
      <div style={gridContainer}>
        {/* Glassmorphism Chart Container */}
        <div style={glassPanelStyle}>
          <h3 style={panelTitle}>Revenue Distribution</h3>
          <div style={{ height:'280px', display:'flex', justifyContent:'center', alignItems:'center' }}>
            {chartData.length > 0 ? (
              <Pie data={pieChartConfig} options={chartOptions} />
            ) : (
              <p style={{color: '#94a3b8'}}>Awaiting analytical data payload...</p>
            )}
          </div>
        </div>

        {/* Data Import Container */}
        <div style={glassPanelStyle}>
          <h3 style={panelTitle}>Ingest Stream Ledger</h3>
          <p style={panelSubtitle}>Format: <code>Product,Category,Revenue,Units</code></p>
          <textarea 
            value={importText} 
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Enterprise Package,Software,2500,2&#10;Hardware Array,Hardware,4100,1" 
            style={textareaStyle}
          />
          <button onClick={handleCSVImport} style={importBtnStyle}>
            Execute Ingest Protocol
          </button>
        </div>
      </div>
    </div>
  );
}

// --- GRADIENT THEME STYLE OBJECTS ---
const dashboardWrapper = {
  minHeight: '100vh',
  backgroundColor: '#0f172a',
  backgroundImage: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)',
  padding: '40px',
  color: '#f8fafc',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const headerContainer = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '40px',
  borderBottom: '1px solid #334155',
  paddingBottom: '20px'
};

const mainTitle = { margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' };
const subtitle = { margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' };

const exportBtnStyle = { padding: '12px 24px', background: 'rgba(255, 255, 255, 0.05)', color: '#f8fafc', border: '1px solid #475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', fontSize: '14px' };
exportBtnStyle[':hover'] = { backgroundColor: 'rgba(255,255,255,0.1)' };

const kpiRowStyle = { display: 'flex', gap: '24px', marginBottom: '40px' };
const kpiCardStyle = { padding: '24px', borderRadius: '16px', flex: 1, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)', color: 'white' };
const kpiLabel = { margin: 0, fontSize: '14px', fontWeight: '500', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' };
const kpiValue = { margin: '8px 0 0 0', fontSize: '36px', fontWeight: '700', letterSpacing: '-1px' };

const gridContainer = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' };
const glassPanelStyle = { padding: '30px', backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(12px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' };

const panelTitle = { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#f1f5f9' };
const panelSubtitle = { margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' };

const textareaStyle = { width: '100%', height: '140px', backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: '#f8fafc', fontFamily: 'monospace', fontSize: '13px', boxSizing: 'border-box', resize: 'none' };
const importBtnStyle = { width: '100%', marginTop: '16px', padding: '14px', backgroundImage: 'linear-gradient(to right, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)' };

export default App;