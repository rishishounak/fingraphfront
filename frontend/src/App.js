import React, { useState, useEffect } from "react";

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawOutput, setRawOutput] = useState(null);

  // ✅ Always point to backend
  const apiBase =
    process.env.REACT_APP_API_URL || "https://your-backend-domain.com";

  const fetchStockData = async (tickerSymbol) => {
    setLoading(true);
    setError(null);
    setRawOutput(null);
    setData(null);

    try {
      const res = await fetch(`${apiBase}/api/stocks?ticker=${tickerSymbol}`);
      const text = await res.text(); // always fetch raw text
      setRawOutput(text);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      // Try to parse JSON, fallback to plain text
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      setData(parsed);
    } catch (err) {
      console.error("❌ Backend fetch failed:", err);
      setError(err.message);
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

  const renderData = (val) => {
    if (typeof val === "object") {
      return (
        <pre
          style={{
            background: "#f0f0f0",
            padding: 10,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <p>{String(val)}</p>;
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", fontFamily: "Arial" }}>
      <h2>Backend Response Viewer</h2>

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

      {loading && <p>Loading...</p>}
      {error && (
        <div style={{ color: "red" }}>
          <p>Backend Error: {error}</p>
          {rawOutput && (
            <pre
              style={{
                background: "#ffecec",
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

      {!error && !loading && data !== null && (
        <div>
          <h4>Backend Output:</h4>
          {renderData(data)}
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
