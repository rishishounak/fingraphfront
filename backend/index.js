require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[backend ${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to PostgreSQL with SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Railway
});

// Table creation SQL
const createTableSQL = `
CREATE TABLE IF NOT EXISTS stock_records (
  id SERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  record_date DATE NOT NULL,
  prices JSONB NOT NULL,
  insights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (ticker, record_date)
);
`;

// Function to create table with retry
async function ensureTable(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(createTableSQL);
      console.log("✅ backend Table 'stock_records' is ready");
      return;
    } catch (err) {
      console.error(`❌ backend Attempt ${i + 1} to create table failed:`, err.code || err);
      await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
    }
  }
  console.error("🚨 backend Failed to create table after multiple attempts");
}

ensureTable();

// API endpoint to fetch latest 10 stock records for a ticker
app.get('/api/stocks', async (req, res) => {
  const ticker = req.query.ticker;
  if (!ticker) {
    console.warn("⚠️ backend Missing ticker query parameter");
    return res.status(400).json({ error: "Ticker query parameter required" });
  }

  try {
    console.log(`🔍 backend Fetching records for ticker: ${ticker.toUpperCase()}`);
    const result = await pool.query(
      `SELECT * FROM stock_records WHERE ticker=$1 ORDER BY record_date DESC LIMIT 10`,
      [ticker.toUpperCase()]
    );
    console.log(`✅ backend Found ${result.rows.length} records for ${ticker.toUpperCase()}`);
    res.json(result.rows);
  } catch (err) {
    console.error("🚨 backend DB fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stock records" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 backend API listening on port ${PORT}`);
});
