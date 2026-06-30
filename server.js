const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize Native SQLite File Engine
const dbPath = path.resolve(__dirname, 'analytics.db');
const db = new DatabaseSync(dbPath);

// Create Core Analytics Ledger Tables
db.exec(`CREATE TABLE IF NOT EXISTS sales_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    revenue REAL NOT NULL,
    units_sold INTEGER NOT NULL,
    sale_date TEXT NOT NULL
)`);

// Seed Database with Mock Business Data if completely empty
const checkData = db.prepare("SELECT COUNT(*) as count FROM sales_performance").get();
if (checkData && checkData.count === 0) {
    const insertStmt = db.prepare(`
        INSERT INTO sales_performance (product_name, category, revenue, units_sold, sale_date)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const mockRecords = [
        ['Enterprise SaaS', 'Software', 5000.00, 10, '2026-06-01'],
        ['Cloud Storage Tier 2', 'Software', 2400.00, 40, '2026-06-05'],
        ['Developer Workstation', 'Hardware', 3500.00, 2, '2026-06-10'],
        ['AI API Tokens', 'Software', 1200.00, 150, '2026-06-12'],
        ['Premium Desk Set', 'Furniture', 850.00, 5, '2026-06-15'],
        ['Consulting Block', 'Services', 6000.00, 3, '2026-06-20']
    ];

    for (const record of mockRecords) {
        insertStmt.run(...record);
    }
    console.log("Business intelligence database initialized with mock sales data.");
}

// --- ANALYTICS BI REST ENDPOINTS ---

// 1. Fetch Executive KPI High-Level Totals
app.get('/api/kpis', (req, res) => {
    try {
        const stats = db.prepare(`
            SELECT 
                SUM(revenue) as totalRevenue,
                SUM(units_sold) as totalUnits,
                AVG(revenue) as averageDealSize
            FROM sales_performance
        `).get();
        
        res.json({
            totalRevenue: stats.totalRevenue || 0,
            totalUnits: stats.totalUnits || 0,
            averageDealSize: Math.round(stats.averageDealSize || 0)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Fetch Category Breakdown Data Segment (For Chart Breakdown Visuals)
app.get('/api/charts/category-breakdown', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT category, SUM(revenue) as revenue 
            FROM sales_performance 
            GROUP BY category
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Data Import Feature: Bulk Ingest CSV Data Records Dynamically
app.post('/api/import-csv', (req, res) => {
    const { csvData } = req.body; // Expects an array of objects
    if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "Invalid data format submitted." });
    }

    try {
        const insertStmt = db.prepare(`
            INSERT INTO sales_performance (product_name, category, revenue, units_sold, sale_date)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        for (const row of csvData) {
            insertStmt.run(row.product_name, row.category, parseFloat(row.revenue), parseInt(row.units_sold));
        }
        res.json({ status: "success", message: `${csvData.length} records appended to system ledger.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 6060; // Running distinct port away from standard configurations
server = app.listen(PORT, () => console.log(`BI Dashboard Server executing on http://127.0.0.1:${PORT}`));