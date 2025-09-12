import React, { useState, useEffect } from "react";
import StockChart from "./components/StockChart"; // make sure path is correct

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawOutput, setRawOutput] = useState(null); // for debugging raw backend output

  // ✅ Always point to backend
  const apiBase =
    process.env.REACT_APP_API_URL || "https://your-backend-domain.com";

  const fetchStockData = async (tickerSymbol) => {
    setLoading(true);
    setError(null);
    setRawOutput(null);

    try {
      // ✅ Call backend API
      const res = await fetch(`${apiBase}/api/stocks?ticker=${tickerSymbol}`);
      const text = await res.text(); // raw text for debugging
      setRawOutput(text);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = JSON.parse(text);
      const chartData = json.slice(0, 3).map((row) => ({
        date: row.record_date,
        close: row.prices?.Close || row.prices?.close || 0,
        insights: row.insights || [],
      }));
      setData(chartData);
    } catch (err) {
      console.error("❌ Backend fetch failed:", err);
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
      {error && (
        <div style={{ color: "red" }}>
          <p>Backend Error: {error}</p>
          {rawOutput && (
            <pre
              style={{
                background: "#f0f0f0",
                padding: 10,
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {rawOutput}
            </pre>
          )}
        </div>
      )}

      {!error && <StockChart data={data} />}

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
        Note: Frontend calls your <b>backend API</b> → set{" "}
        <code>REACT_APP_API_URL</code> in production to your backend URL.
      </p>
    </div>
  );
}

export default App;
