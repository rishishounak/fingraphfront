// StockChart.js
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function StockChart({ data }) {
  const [yUnit, setYUnit] = useState(50); // default Y-axis per unit
  const [yScaleMax, setYScaleMax] = useState(100);

  useEffect(() => {
    if (data && data.length > 0) {
      const maxClose = Math.max(...data.map((d) => d.close));
      // round up to nearest multiple of yUnit
      const roundedMax = Math.ceil(maxClose / yUnit) * yUnit;
      setYScaleMax(roundedMax);
    }
  }, [data, yUnit]);

  if (!data || data.length === 0) return null;

  return (
    <div style={{ display: "flex" }}>
      {/* Side panel for Y-axis unit selection */}
      <div
        style={{
          width: 180,
          padding: 12,
          borderRight: "1px solid #ccc",
          fontFamily: "Arial",
        }}
      >
        <h4>Y Axis Scale</h4>
        <select value={yUnit} onChange={(e) => setYUnit(Number(e.target.value))}>
          <option value={0.5}>0.5 per unit</option>
          <option value={25}>25 per unit</option>
          <option value={50}>50 per unit</option>
          <option value={100}>100 per unit</option>
        </select>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          Y-axis will scale in units of selected value
        </p>
      </div>

      {/* Chart container */}
      <div style={{ flex: 1, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" />
            <YAxis domain={[0, yScaleMax]} />
            <Tooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Bar dataKey="close" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default StockChart;
