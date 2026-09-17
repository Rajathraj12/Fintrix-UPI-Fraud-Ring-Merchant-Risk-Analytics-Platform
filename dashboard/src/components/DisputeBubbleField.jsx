import React, { useState, useMemo } from 'react';

const fmt = (n) => n >= 1e7 ? `${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const fmtINR = (n) => `₹${fmt(n)}`;

const CHANNELS = [
  { id: 'IVR', name: 'IVR', count: 709, pct: '25.3%', rawPct: 25.3, color: '#3ddc97', glow: 'rgba(61,220,151,0.6)', icon: '📞', desc: 'Voice-based support calls from customers', x: 10 },
  { id: 'Chatbot', name: 'Chatbot', count: 698, pct: '24.9%', rawPct: 24.9, color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', icon: '💬', desc: 'AI chatbot conversations', x: 34 },
  { id: 'Email', name: 'Email', count: 375, pct: '13.4%', rawPct: 13.4, color: '#a78bfa', glow: 'rgba(167,139,250,0.6)', icon: '✉️', desc: 'Email support tickets', x: 54 },
  { id: 'Branch', name: 'Branch', count: 366, pct: '13.1%', rawPct: 13.1, color: '#ffb834', glow: 'rgba(255,184,52,0.6)', icon: '🏛️', desc: 'In-person branch visits', x: 70 },
  { id: 'App', name: 'App', count: 344, pct: '12.3%', rawPct: 12.3, color: '#ff5271', glow: 'rgba(255,82,113,0.6)', icon: '📱', desc: 'Disputes raised via mobile app', x: 84 },
];

function describeArc(cx, cy, r, R, startAngle, endAngle) {
  const angleDiff = endAngle - startAngle;
  if (angleDiff >= 2 * Math.PI - 0.001) {
    endAngle = startAngle + 2 * Math.PI - 0.001;
  }
  const x1 = cx + R * Math.cos(startAngle);
  const y1 = cy + R * Math.sin(startAngle);
  const x2 = cx + R * Math.cos(endAngle);
  const y2 = cy + R * Math.sin(endAngle);
  
  const x3 = cx + r * Math.cos(endAngle);
  const y3 = cy + r * Math.sin(endAngle);
  const x4 = cx + r * Math.cos(startAngle);
  const y4 = cy + r * Math.sin(startAngle);

  const largeArc = angleDiff > Math.PI ? 1 : 0;

  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${R} ${R} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    'Z'
  ].join(' ');
}

export default function DisputeBubbleField({ chargebacks = [], filtered = [] }) {
  const [metricMode, setMetricMode] = useState('count'); // 'count' | 'amount'
  const [hoveredChannel, setHoveredChannel] = useState('IVR');
  const [hoveredStatus, setHoveredStatus] = useState(null);

  // Status stats
  const statusData = useMemo(() => {
    return [
      { key: 'OPEN', label: 'OPEN', count: 1492, amt: 4250000, pct: '53.3%', color: '#ff5271', gradId: 'dialOpen' },
      { key: 'CLOSED', label: 'CLOSED', count: 865, amt: 2100000, pct: '30.9%', color: '#3ddc97', gradId: 'dialClosed' },
      { key: 'REJECTED', label: 'REJECTED', count: 443, amt: 980000, pct: '15.8%', color: '#a78bfa', gradId: 'dialRejected' },
    ];
  }, []);

  // Geometry for bigger left dial
  const cx = 210;
  const cy = 160;
  const outerR = 114;
  const innerR = 80;

  // Arc angles matching mockup precisely
  const slices = [
    { ...statusData[0], startAngle: 1.45, endAngle: 4.71 }, // OPEN (large pink left/bottom arc)
    { ...statusData[1], startAngle: 4.71, endAngle: 6.63 }, // CLOSED (emerald top/right arc)
    { ...statusData[2], startAngle: 6.63, endAngle: 1.45 + 2 * Math.PI }, // REJECTED (purple bottom right arc)
  ];

  return (
    <>
    <div
      className="card"
      style={{
        padding: '24px 28px',
        background: '#0d111a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial glows */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,82,113,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '25%',
          right: '15%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,220,151,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* TOP HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 5, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: '#ffffff' }}>
                Dispute Resolution &amp; Intake
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: 'rgba(180, 243, 41, 0.15)',
                  color: 'var(--lime)',
                  border: '1px solid rgba(180, 243, 41, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime)' }} />
                LIVE AUDIT
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Track dispute lifecycle stages and intake channels. Click any segment to filter the dashboard.
            </div>
          </div>
        </div>

        {/* View Switcher Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.4)',
              padding: 3,
              borderRadius: 9999,
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              onClick={() => setMetricMode('count')}
              style={{
                padding: '6px 15px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: metricMode === 'count' ? 'var(--lime)' : 'transparent',
                color: metricMode === 'count' ? '#000000' : 'var(--text-2)',
                boxShadow: metricMode === 'count' ? '0 2px 12px rgba(180, 243, 41, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Count
            </button>
            <button
              onClick={() => setMetricMode('amount')}
              style={{
                padding: '6px 15px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: metricMode === 'amount' ? 'var(--lime)' : 'transparent',
                color: metricMode === 'amount' ? '#000000' : 'var(--text-2)',
                boxShadow: metricMode === 'amount' ? '0 2px 12px rgba(180, 243, 41, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Disputed Amount
            </button>
          </div>

          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* DUAL-COLUMN MAIN VISUALIZATION (Bigger Pie Chart & Seamless Progress Bars) */}
      <div className="dbf-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 430px) 1fr', gap: 32, alignItems: 'center', position: 'relative', zIndex: 4, marginBottom: 20 }}>
        
        {/* LEFT COLUMN: Large Resolution Status Donut Dial + Callout Cards */}
        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>Resolution Status Breakdown</span>
              <span style={{ fontSize: 11, color: 'var(--text-2)', cursor: 'help' }}>ⓘ</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 1 }}>
              How cases are currently progressing toward resolution.
            </div>
          </div>

          {/* Bigger Dial SVG Viewport — desktop: absolute callout cards, mobile: static pill row */}
          <div className="dbf-dial-wrap" style={{ position: 'relative', width: '100%', maxWidth: 390, aspectRatio: '420 / 320', margin: '0 auto' }}>
            <svg width="100%" height="100%" viewBox="0 0 420 320" style={{ overflow: 'visible', display: 'block' }}>
              <defs>
                <linearGradient id="dialOpen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff5271" />
                  <stop offset="100%" stopColor="#ff7b54" />
                </linearGradient>
                <linearGradient id="dialClosed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3ddc97" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <linearGradient id="dialRejected" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              {/* Dashed outer precision gauge ring */}
              <circle cx={cx} cy={cy} r={132} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="2 4" />

              {/* Leader Lines — hidden on mobile via CSS */}
              <path className="dbf-leader-line" d="M 96 160 L 70 160" fill="none" stroke="rgba(255,82,113,0.5)" strokeWidth="1.5" />
              <path className="dbf-leader-line" d="M 248 54 L 290 32" fill="none" stroke="rgba(61,220,151,0.5)" strokeWidth="1.5" />
              <path className="dbf-leader-line" d="M 248 266 L 290 286" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" />

              {/* Dial Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredStatus === slice.key;
                const pathD = describeArc(cx, cy, innerR, outerR, slice.startAngle, slice.endAngle);
                return (
                  <g key={slice.key} onMouseEnter={() => setHoveredStatus(slice.key)} onMouseLeave={() => setHoveredStatus(null)}
                    style={{ cursor: 'pointer', transform: isHovered ? 'scale(1.02)' : 'none', transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.2s ease' }}>
                    <path d={pathD} fill={`url(#${slice.gradId})`} stroke="#0d111a" strokeWidth="3.5" />
                  </g>
                );
              })}

              {/* Glowing Indicator Boundary Pins */}
              <circle cx="96" cy="160" r="5" fill="#ffffff" stroke="#ff5271" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 8px #ff5271)' }} />
              <circle cx="248" cy="54" r="5" fill="#ffffff" stroke="#3ddc97" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 8px #3ddc97)' }} />
              <circle cx="248" cy="266" r="5" fill="#ffffff" stroke="#a78bfa" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 8px #a78bfa)' }} />

              {/* Center Dial Hub */}
              <circle cx={cx} cy={cy} r={innerR - 4} fill="#141824" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <path d={`M ${cx - 12} ${cy - 22} Q ${cx - 6} ${cy - 30}, ${cx} ${cy - 22} T ${cx + 12} ${cy - 22}`} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <text x={cx} y={cy + 6} textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="800" fontFamily="var(--font-mono)">2,800</text>
              <text x={cx} y={cy + 25} textAnchor="middle" fill="var(--text-2)" fontSize="11" fontWeight="600">Total Disputes</text>
              <text x={cx} y={cy + 42} textAnchor="middle" fill="var(--lime)" fontSize="10.5" fontWeight="700">↑ 12% <tspan fill="var(--text-2)" fontWeight="400">vs. last month</tspan></text>
            </svg>

            {/* CALLOUT CARDS — desktop: absolute positioned, hidden on mobile */}
            <div className="dbf-callout-abs" onMouseEnter={() => setHoveredStatus('OPEN')} onMouseLeave={() => setHoveredStatus(null)}
              style={{ position: 'absolute', left: 0, top: 110, background: 'rgba(255,82,113,0.08)', border: `1px solid ${hoveredStatus === 'OPEN' ? '#ff5271' : 'rgba(255,82,113,0.3)'}`, borderRadius: 10, padding: '8px 12px', minWidth: 78, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: hoveredStatus === 'OPEN' ? '0 0 16px rgba(255,82,113,0.3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5271' }} /><span style={{ fontSize: 10, fontWeight: 800, color: '#ff5271' }}>OPEN</span></div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{metricMode === 'count' ? '1,492' : '₹42.5L'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>53.3%</div>
            </div>
            <div className="dbf-callout-abs" onMouseEnter={() => setHoveredStatus('CLOSED')} onMouseLeave={() => setHoveredStatus(null)}
              style={{ position: 'absolute', right: 0, top: 12, background: 'rgba(61,220,151,0.08)', border: `1px solid ${hoveredStatus === 'CLOSED' ? '#3ddc97' : 'rgba(61,220,151,0.3)'}`, borderRadius: 10, padding: '8px 12px', minWidth: 78, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: hoveredStatus === 'CLOSED' ? '0 0 16px rgba(61,220,151,0.3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ddc97' }} /><span style={{ fontSize: 10, fontWeight: 800, color: '#3ddc97' }}>CLOSED</span></div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{metricMode === 'count' ? '865' : '₹21.0L'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>30.9%</div>
            </div>
            <div className="dbf-callout-abs" onMouseEnter={() => setHoveredStatus('REJECTED')} onMouseLeave={() => setHoveredStatus(null)}
              style={{ position: 'absolute', right: 0, bottom: 12, background: 'rgba(167,139,250,0.08)', border: `1px solid ${hoveredStatus === 'REJECTED' ? '#a78bfa' : 'rgba(167,139,250,0.3)'}`, borderRadius: 10, padding: '8px 12px', minWidth: 78, cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: hoveredStatus === 'REJECTED' ? '0 0 16px rgba(167,139,250,0.3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa' }} /><span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa' }}>REJECTED</span></div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{metricMode === 'count' ? '443' : '₹9.8L'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>15.8%</div>
            </div>
          </div>

          {/* MOBILE ONLY: Status pills row shown below donut */}
          <div className="dbf-status-pills-mobile" style={{ display: 'none', gap: 8, marginTop: 16 }}>
            {[
              { key: 'OPEN', color: '#ff5271', count: metricMode === 'count' ? '1,492' : '₹42.5L', pct: '53.3%' },
              { key: 'CLOSED', color: '#3ddc97', count: metricMode === 'count' ? '865' : '₹21.0L', pct: '30.9%' },
              { key: 'REJECTED', color: '#a78bfa', count: metricMode === 'count' ? '443' : '₹9.8L', pct: '15.8%' },
            ].map(s => (
              <div key={s.key} style={{ flex: 1, background: `${s.color}11`, border: `1px solid ${s.color}44`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: s.color }}>{s.key}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: '#ffffff' }}>{s.count}</div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s.pct}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: How Disputes Reach the Bank */}
        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff' }}>How Disputes Reach the Bank</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', cursor: 'help' }}>ⓘ</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>Channels through which customers raise disputes.</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 9999, flexShrink: 0 }}>5 Ingestion Vectors</span>
          </div>

          {/* Desktop: absolute-positioned S-flow layout */}
          <div className="dbf-channels-desktop" style={{ position: 'relative', height: 280 }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: 140, height: 280, pointerEvents: 'none', zIndex: 1 }}>
              <defs>
                <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3ddc97" stopOpacity="0.8" />
                  <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.8" />
                  <stop offset="75%" stopColor="#ffb834" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ff5271" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path d="M 28 26 C 28 52, 52 52, 52 80 C 52 106, 72 106, 72 134 C 72 160, 88 160, 88 188 C 88 214, 102 214, 102 242" fill="none" stroke="url(#riverGrad)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.5))' }} />
            </svg>

            {CHANNELS.map((ch, idx) => {
              const isHovered = hoveredChannel === ch.id;
              const yPos = 4 + idx * 55;
              const barWidthPct = (ch.rawPct / 30) * 100;
              return (
                <div key={ch.id} onMouseEnter={() => setHoveredChannel(ch.id)} onMouseLeave={() => setHoveredChannel(null)}
                  style={{ position: 'absolute', top: yPos, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 14, zIndex: 3, cursor: 'pointer', padding: '3px 0' }}>
                  {/* Left: S-offset Bubble Node */}
                  <div style={{ paddingLeft: ch.x, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#131824', border: `2px solid ${isHovered ? '#ffffff' : ch.color}`, boxShadow: `0 0 16px ${ch.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: ch.color, flexShrink: 0, transform: isHovered ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}>
                      {ch.icon}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 110 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff' }}>{ch.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 800, color: ch.color }}>{metricMode === 'count' ? ch.count : fmtINR(ch.count * 2800)}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--text-2)' }}>{ch.pct}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ flex: 1, minWidth: 40, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${barWidthPct}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${ch.color}55 0%, ${ch.color} 100%)`, boxShadow: isHovered ? `0 0 12px ${ch.color}` : 'none', transition: 'width 0.4s ease' }} />
                  </div>

                  {/* Description tag */}
                  <div className="dbf-channel-desc" style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ch.color }} />
                    <span style={{ fontSize: 11.5, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{ch.desc}</span>
                  </div>

                  {/* Popover on hover */}
                  {isHovered && (
                    <div style={{ position: 'absolute', left: ch.x + 135, top: -12, background: 'rgba(18,22,32,0.96)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '7px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 30, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff' }}>{ch.name}</div>
                      <div style={{ fontSize: 10.5, color: ch.color, fontFamily: 'var(--font-mono)', marginTop: 1 }}>{metricMode === 'count' ? `${ch.count} disputes (${ch.pct})` : `${fmtINR(ch.count * 2800)} (${ch.pct})`}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 2 }}>Click to filter dashboard</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* MOBILE: Simple stacked channel list (no absolute positioning) */}
          <div className="dbf-channels-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {CHANNELS.map((ch) => {
              const barWidthPct = (ch.rawPct / 30) * 100;
              return (
                <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#131824', border: `2px solid ${ch.color}`, boxShadow: `0 0 12px ${ch.glow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{ch.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{ch.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 800, color: ch.color }}>
                        {metricMode === 'count' ? ch.count : fmtINR(ch.count * 2800)}&nbsp;
                        <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{ch.pct}</span>
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${barWidthPct}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${ch.color}55, ${ch.color})` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* BOTTOM BANNER: Key Insight */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: 'rgba(255,255,255,0.025)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 5, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(180,243,41,0.12)', border: '1px solid rgba(180,243,41,0.25)', color: 'var(--lime)', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            <span>💡</span> Key Insight
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-1)' }}>
            <b style={{ color: '#ffffff' }}>IVR + Chatbot</b> account for <b style={{ color: 'var(--lime)' }}>50.3%</b> of dispute intake, making them the highest volume channels.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--lime)', fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          <span>📈</span> +12% <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>vs. last month</span>
        </div>
      </div>

    </div>

    <style>{`
      @media (max-width: 900px) {
        .dbf-main-grid {
          grid-template-columns: 1fr !important;
        }
      }
      @media (max-width: 768px) {
        .dbf-main-grid {
          gap: 20px !important;
        }
        .dbf-dial-wrap {
          max-width: 280px !important;
          height: 240px !important;
        }
        /* Hide desktop absolute callout cards → show mobile pill row instead */
        .dbf-callout-abs {
          display: none !important;
        }
        .dbf-status-pills-mobile {
          display: flex !important;
        }
        /* Hide leader lines that point to absolute cards */
        .dbf-leader-line {
          display: none;
        }
        /* Hide desktop absolute channel list → show mobile static list instead */
        .dbf-channels-desktop {
          display: none !important;
        }
        .dbf-channels-mobile {
          display: flex !important;
        }
        /* Hide verbose description tags in all views */
        .dbf-channel-desc {
          display: none !important;
        }
      }
    `}</style>
    </>
  );
}

