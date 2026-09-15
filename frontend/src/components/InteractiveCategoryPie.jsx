import React, { useState, useMemo } from 'react';

const fmt = (n) => n >= 1e7 ? `${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const fmtINR = (n) => `₹${fmt(n)}`;

// Curated modern fintech palette
const PALETTE = [
  '#ff5271', // Coral red
  '#ff7849', // Orange
  '#ffb834', // Amber
  '#facc15', // Yellow
  '#a78bfa', // Soft purple
  '#818cf8', // Indigo
  '#38bdf8', // Sky blue
  '#5b8cff', // Royal blue
  '#2dd4bf', // Teal
  '#34d399', // Emerald
  '#84cc16', // Lime green
  '#b4f329', // Electric signature lime
];

function describeArc(cx, cy, r, R, startAngle, endAngle) {
  // Ensure we don't exceed full circle in one arc
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

export default function InteractiveCategoryPie({ data = [], onSelectCategory }) {
  const [metricMode, setMetricMode] = useState('rate'); // 'rate' | 'volume' | 'disputes'
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, show: false });

  // Slices data based on selected metric
  const slices = useMemo(() => {
    if (!data.length) return [];
    
    // Calculate values
    const items = data.map((d, i) => {
      let val = d.rate;
      if (metricMode === 'volume') val = d.vol || 0;
      if (metricMode === 'disputes') val = d.cbs || 0;
      return {
        ...d,
        color: PALETTE[i % PALETTE.length],
        calcVal: Math.max(val, 0.001),
      };
    });

    const totalVal = items.reduce((sum, item) => sum + item.calcVal, 0) || 1;

    let currentAngle = -Math.PI / 2; // Start from top 12 o'clock
    return items.map((item) => {
      const sliceAngle = (item.calcVal / totalVal) * (2 * Math.PI);
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;
      currentAngle = endAngle;

      // Displacement vector for explosion on hover
      const popDistance = 14;
      const dx = Math.cos(midAngle) * popDistance;
      const dy = Math.sin(midAngle) * popDistance;

      return {
        ...item,
        startAngle,
        endAngle,
        midAngle,
        dx,
        dy,
        pctShare: (item.calcVal / totalVal) * 100,
      };
    });
  }, [data, metricMode]);

  // Active item info for center display
  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : slices[0] || null;

  const cx = 175;
  const cy = 175;
  const outerR = 140;
  const innerR = 85;

  const handleMouseMove = (e, idx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      show: true,
    });
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    setTooltipPos(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="card" style={{ padding: '24px 28px' }}>
      {/* Header & Metric Switcher */}
      <div className="card-h" style={{ marginBottom: 20 }}>
        <div>
          <div className="card-title" style={{ fontSize: 16 }}>Category Risk &amp; Portfolio Distribution</div>
          <div className="card-desc">
            Hover any slice to explode the section and inspect dispute frequency, transaction volume, and risk tier.
          </div>
        </div>

        <div className="pills" style={{ margin: 0 }}>
          <button
            className={`pill ${metricMode === 'rate' ? 'active' : ''}`}
            onClick={() => setMetricMode('rate')}
          >
            Dispute Rate %
          </button>
          <button
            className={`pill ${metricMode === 'disputes' ? 'active' : ''}`}
            onClick={() => setMetricMode('disputes')}
          >
            Dispute Count
          </button>
          <button
            className={`pill ${metricMode === 'volume' ? 'active' : ''}`}
            onClick={() => setMetricMode('volume')}
          >
            Volume (₹)
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Exploding SVG Donut on Left, Rich Breakdown on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 32, alignItems: 'center' }}>
        {/* SVG Interactive Donut Container */}
        <div 
          style={{ 
            position: 'relative', 
            width: 350, 
            height: 350, 
            margin: '0 auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            width="350"
            height="350"
            viewBox="0 0 350 350"
            style={{ overflow: 'visible', filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.4))' }}
          >
            <defs>
              <filter id="pieGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background track circle */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="55" />

            {/* Donut Slices */}
            {slices.map((slice, i) => {
              const isHovered = hoveredIdx === i;
              const pathD = describeArc(cx, cy, innerR, outerR, slice.startAngle, slice.endAngle);
              
              return (
                <g
                  key={slice.cat}
                  style={{
                    transform: isHovered ? `translate(${slice.dx}px, ${slice.dy}px) scale(1.03)` : 'translate(0px, 0px) scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease',
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 0 14px ${slice.color})` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseMove={(e) => handleMouseMove(e, i)}
                  onClick={() => onSelectCategory && onSelectCategory(slice.cat)}
                >
                  <path
                    d={pathD}
                    fill={slice.color}
                    fillOpacity={hoveredIdx !== null ? (isHovered ? 1 : 0.4) : 0.88}
                    stroke={isHovered ? '#ffffff' : '#151820'}
                    strokeWidth={isHovered ? 2.5 : 2}
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* Dynamic Center Badge (Hover details in center of donut) */}
          <div
            style={{
              position: 'absolute',
              width: innerR * 2 - 16,
              height: innerR * 2 - 16,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1a1e29 0%, #11141c 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: 10,
              boxShadow: 'inset 0 0 15px rgba(0,0,0,0.6)',
              zIndex: 10,
            }}
          >
            {activeItem ? (
              <>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)', marginBottom: 2 }}>
                  {hoveredIdx !== null ? 'SELECTED CATEGORY' : 'TOP RISK CATEGORY'}
                </div>
                <div 
                  style={{ 
                    fontSize: 15, 
                    fontWeight: 800, 
                    color: activeItem.color || '#ffffff',
                    lineHeight: 1.2,
                    maxWidth: 130,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activeItem.cat}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
                  {metricMode === 'rate' 
                    ? `${activeItem.rate.toFixed(2)}%` 
                    : metricMode === 'volume' 
                    ? fmtINR(activeItem.vol) 
                    : `${activeItem.cbs} CBs`}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  {activeItem.pctShare.toFixed(1)}% of total
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Right Side: Interactive Legend / Deep Dive Row List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)' }}>
              Category Breakdown ({slices.length})
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)' }}>
              {metricMode === 'rate' ? 'Chargeback Rate' : metricMode === 'volume' ? 'Volume' : 'Disputes'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
            {slices.map((item, i) => {
              const isHovered = hoveredIdx === i;
              const isHighRisk = item.rate > 15;
              const isMediumRisk = item.rate > 10;

              return (
                <div
                  key={item.cat}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSelectCategory && onSelectCategory(item.cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isHovered ? item.color : 'rgba(255,255,255,0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isHovered ? `0 0 12px ${item.color}33` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div 
                      style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        background: item.color, 
                        flexShrink: 0,
                        boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none'
                      }} 
                    />
                    <div style={{ minWidth: 0 }}>
                      <div 
                        style={{ 
                          fontSize: 12.5, 
                          fontWeight: isHovered ? 800 : 600, 
                          color: isHovered ? '#ffffff' : 'var(--text-1)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.cat}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-2)' }}>
                        {item.txns.toLocaleString()} txns • {item.cbs} disputes
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                    <div 
                      style={{ 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 12.5, 
                        fontWeight: 700, 
                        color: isHighRisk ? 'var(--red)' : isMediumRisk ? 'var(--amber)' : 'var(--lime)' 
                      }}
                    >
                      {item.rate.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                      {fmtINR(item.vol)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats Banner under legend */}
          <div 
            style={{ 
              marginTop: 14, 
              padding: '10px 14px', 
              background: 'rgba(180, 243, 41, 0.05)', 
              border: '1px solid rgba(180, 243, 41, 0.2)', 
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--lime)', fontSize: 14 }}>⚡</span>
              <span style={{ fontSize: 12, color: 'var(--text-1)' }}>
                Highest exposure category: <b style={{ color: '#fff' }}>{slices[0]?.cat || 'Retail'}</b> ({slices[0]?.rate.toFixed(2)}% dispute rate)
              </span>
            </div>
            <span 
              className="card-badge" 
              style={{ 
                background: 'rgba(255, 82, 113, 0.15)', 
                color: 'var(--red)', 
                border: '1px solid rgba(255, 82, 113, 0.3)' 
              }}
            >
              HIGH RISK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
