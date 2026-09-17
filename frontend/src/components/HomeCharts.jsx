import React, { useRef, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#aaff00" }}>TXN: {payload[0]?.value}</div>
        <div style={{ color: "#ff3b30" }}>DSP: {payload[1]?.value}</div>
      </div>
    );
  }
  return null;
};

const BarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
        <div style={{ color: "#888", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#ffd60a" }}>CB Ratio: {payload[0]?.value}%</div>
      </div>
    );
  }
  return null;
};

export default function HomeCharts({ txData, merchantData }) {
  const chartRef = useRef(null);
  const [chartVisible, setChartVisible] = useState(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setChartVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={chartRef} style={{ padding: "0", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-[1px] bg-[#111]">
        
        {/* Transaction velocity */}
        <div style={{ background: "#0a0a0a", padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>UPI Transaction Velocity & Disputes</h3>
            <span style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#aaff00", letterSpacing: "1px" }}>● LIVE</span>
          </div>
          <p style={{ fontSize: 12, color: "#333", marginBottom: 20, marginTop: 0 }}>Q4 daily volume with dispute overlay</p>
          <div style={{ height: 220, opacity: chartVisible ? 1 : 0, transition: "opacity 0.8s ease" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={txData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="txG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#aaff00" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#aaff00" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff3b30" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f0f0f" />
                <XAxis dataKey="date" tick={{ fill: "#2a2a2a", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#2a2a2a", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="txns" stroke="#aaff00" strokeWidth={2} fill="url(#txG)" dot={false} animationDuration={1500} />
                <Area type="monotone" dataKey="disputes" stroke="#ff3b30" strokeWidth={1.5} fill="url(#dG)" dot={false} animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chargeback ratio by category */}
        <div style={{ background: "#0a0a0a", padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>CB Ratio by Category</h3>
            <span style={{ background: "#1a0a00", border: "1px solid #ffd60a33", padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#ffd60a", letterSpacing: "1px" }}>Q4 2026</span>
          </div>
          <p style={{ fontSize: 12, color: "#333", marginBottom: 20, marginTop: 0 }}>Chargeback-to-transaction % · Gaming highest at 14.7%</p>
          <div style={{ height: 220, opacity: chartVisible ? 1 : 0, transition: "opacity 0.9s ease" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f0f0f" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#2a2a2a", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#2a2a2a", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar dataKey="ratio" radius={[2, 2, 0, 0]} animationDuration={1200}>
                  {merchantData.map((entry, i) => (
                    <Cell key={i} fill={entry.ratio > 13 ? "#ff3b30" : entry.ratio > 10 ? "#ffd60a" : "#aaff00"} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}
