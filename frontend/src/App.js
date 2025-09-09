import React, { useState, useEffect } from "react";
import StockChart from "./components/StockChart"; // make sure path is correct

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiBase = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const fetchStockData = async (tickerSymbol) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/stocks?ticker=${tickerSymbol}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const chartData = json.map((row) => ({
        date: row.record_date,
        close: row.prices?.Close || row.prices?.close || 0,
        insights: row.insights || [],
      }));
      setData(chartData);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData(ticker);
  }, []);

  useEffect(() => {
    const listener = (e) => fetchStockData(e.detail);
    window.addEventListener("fetch-ticker", listener);
    return () => window.removeEventListener("fetch-ticker", listener);
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "Arial" }}>
      <h2>Daily Stock + 3 Actionable Insights</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <button
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("fetch-ticker", { detail: ticker })
            )
          }
          style={{ marginLeft: 8 }}
        >
          Load
        </button>
      </div>

      {loading && <p>Loading chart...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Render the chart */}
      <StockChart data={data} />

      {!loading && !error && data.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h4>Actionable Insights:</h4>
          {data[data.length - 1].insights?.length > 0 ? (
            <ul>
              {data[data.length - 1].insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p>No insights available</p>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: "#666", marginTop: 12 }}>
        Note: this front-end calls your backend API; set REACT_APP_API_URL in
        production to your backend URL.
      </p>
    </div>
  );
}

export default App;
