import React, { useState, useEffect, useRef } from "react";

export default function StatCard({ stat, delay = 0 }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const end = stat.value;
        const step = end / (1400 / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { start = end; clearInterval(timer); }
          setDisplayed(start);
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stat.value]);

  return (
    <div ref={ref} className="reveal card-3d" style={{ animationDelay: `${delay}ms`, background: "#0f0f0f", border: "1px solid #1e1e1e", padding: "28px 24px"  }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(170,255,0,0.4)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(170,255,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: "#aaff00", lineHeight: 1 }}>
        {stat.isCurrency ? '₹' : ''}{Math.floor(displayed).toLocaleString()}{stat.suffix}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#555", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>
        {stat.label}
      </div>
    </div>
  );
}
