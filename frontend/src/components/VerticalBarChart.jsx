import React, { useState } from 'react';

const BIZ_ICONS = {
  'Individual': '👤',
  'Private Limited': '🏢',
  'Sole Proprietor': '🏪',
  'Partnership': '🤝',
};

const BIZ_COLORS = [
  { bar: '#5b8cff', glow: 'rgba(91,140,255,0.4)', grad: 'linear-gradient(180deg, #7da7ff 0%, #4075f0 100%)' },
  { bar: '#a78bfa', glow: 'rgba(167,139,250,0.4)', grad: 'linear-gradient(180deg, #c4b5fd 0%, #8b5cf6 100%)' },
  { bar: '#3ddc97', glow: 'rgba(61,220,151,0.4)', grad: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 100%)' },
  { bar: '#ffb834', glow: 'rgba(255,184,52,0.4)', grad: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)' },
];

export default function VerticalBarChart({ data = [], totalMerchants = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data.length) return null;

  const maxVal = Math.max(...data.map(d => d[1]), 1);
  // Round up max for clean Y-axis ceiling
  const yCeil = Math.ceil(maxVal * 1.15 / 20) * 20 || 200;
  const yTicks = [yCeil, Math.round(yCeil * 0.66), Math.round(yCeil * 0.33), 0];

  const total = totalMerchants || data.reduce((s, [, c]) => s + c, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 240, justifyContent: 'space-between' }}>
      {/* Chart Plot Area with Grid Lines */}
      <div style={{ position: 'relative', flex: 1, minHeight: 180, display: 'flex', alignItems: 'flex-end', padding: '16px 12px 0 38px' }}>
        {/* Horizontal Background Gridlines & Y-Axis Labels */}
        <div style={{ position: 'absolute', inset: 0, right: 12, left: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {yTicks.map((tick, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ width: 32, fontSize: 10, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', textAlign: 'right', paddingRight: 6 }}>
                {tick}
              </span>
              <div style={{ flex: 1, height: 1, background: i === yTicks.length - 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>

        {/* Vertical Bars Columns */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', width: '100%', height: '100%', zIndex: 1, gap: 14 }}>
          {data.map(([type, count], i) => {
            const isHovered = hoveredIdx === i;
            const heightPct = Math.min((count / yCeil) * 100, 100);
            const colorScheme = BIZ_COLORS[i % BIZ_COLORS.length];
            const pctShare = ((count / total) * 100).toFixed(1);

            return (
              <div
                key={type}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {/* Floating Hover Indicator Badge above Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: `${heightPct}%`,
                    marginBottom: 8,
                    background: '#1c2230',
                    border: `1px solid ${isHovered ? colorScheme.bar : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 8,
                    padding: '3px 7px',
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isHovered ? colorScheme.bar : '#ffffff',
                    boxShadow: isHovered ? `0 0 14px ${colorScheme.glow}` : '0 4px 10px rgba(0,0,0,0.4)',
                    transform: isHovered ? 'scale(1.1) translateY(-3px)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  {count} <span style={{ fontSize: 9.5, color: 'var(--text-2)', fontWeight: 600 }}>({pctShare}%)</span>
                </div>

                {/* Vertical Bar Cylinder */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 48,
                    height: `${heightPct}%`,
                    minHeight: 8,
                    background: colorScheme.grad,
                    borderRadius: '8px 8px 3px 3px',
                    boxShadow: isHovered 
                      ? `0 0 20px ${colorScheme.glow}, inset 0 1px 2px rgba(255,255,255,0.4)` 
                      : `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)`,
                    transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    filter: isHovered ? 'brightness(1.15)' : (hoveredIdx !== null ? 'opacity(0.45)' : 'opacity(1)'),
                    transition: 'all 0.22s ease',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-Axis Labels Row */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 12px 0 38px', gap: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
        {data.map(([type, count], i) => {
          const isHovered = hoveredIdx === i;
          const icon = BIZ_ICONS[type] || '📁';
          const colorScheme = BIZ_COLORS[i % BIZ_COLORS.length];
          const pctShare = ((count / total) * 100).toFixed(1);

          return (
            <div
              key={type}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 2 }}>{icon}</div>
              <div 
                style={{ 
                  fontSize: 11.5, 
                  fontWeight: isHovered ? 800 : 600, 
                  color: isHovered ? '#ffffff' : 'var(--text-1)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={type}
              >
                {type}
              </div>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: isHovered ? colorScheme.bar : 'var(--text-2)', marginTop: 2, fontWeight: 700 }}>
                {pctShare}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
