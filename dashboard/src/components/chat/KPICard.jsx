import React from 'react';

/**
 * High-density telemetry KPI metric card matching Fintrix dark obsidian aesthetic.
 */
export default function KPICard({ label, value, subtext, trend, icon, variant = 'default' }) {
  const getBorderColor = () => {
    switch (variant) {
      case 'lime': return 'rgba(180, 243, 41, 0.3)';
      case 'red': return 'rgba(255, 82, 113, 0.3)';
      case 'amber': return 'rgba(255, 184, 52, 0.3)';
      case 'blue': return 'rgba(91, 140, 255, 0.3)';
      default: return 'var(--border)';
    }
  };

  const getAccentColor = () => {
    switch (variant) {
      case 'lime': return 'var(--accent)';
      case 'red': return 'var(--red)';
      case 'amber': return 'var(--amber)';
      case 'blue': return 'var(--blue)';
      default: return 'var(--text-0)';
    }
  };

  return (
    <div 
      className="fintrix-kpi-card"
      style={{
        background: 'linear-gradient(145deg, rgba(21, 24, 32, 0.95), rgba(17, 20, 26, 0.85))',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        minWidth: '160px',
        flex: '1 1 180px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.18s ease, border-color 0.18s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        {icon && <span style={{ color: getAccentColor(), fontSize: '14px', opacity: 0.85 }}>{icon}</span>}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '18px',
        fontWeight: 700,
        color: getAccentColor(),
        letterSpacing: '-0.3px',
        marginTop: '2px',
      }}>
        {value}
      </div>

      {subtext && (
        <div style={{ fontSize: '11.5px', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          {trend && (
            <span style={{
              color: trend.startsWith('+') ? 'var(--red)' : 'var(--accent)',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}>
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}
