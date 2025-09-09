require('dotenv').config();
const pool = require('./db');

const sql = `
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

(async () => {
  try {
    await pool.query(sql);
    console.log("DB ready");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
