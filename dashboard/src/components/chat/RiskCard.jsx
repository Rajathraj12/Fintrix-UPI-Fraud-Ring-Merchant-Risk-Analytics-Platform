import React from 'react';

/**
 * Forensic Risk Badge and Evaluation Card for Fintrix AI Chat.
 */
export default function RiskCard({
  riskLevel = 'LOW',
  signals = [],
  amount = null,
  txnId = null,
  merchantName = null,
}) {
  const getRiskTheme = () => {
    switch ((riskLevel || '').toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'rgba(255, 82, 113, 0.15)',
          border: 'rgba(255, 82, 113, 0.4)',
          text: 'var(--red)',
          glow: '0 0 20px rgba(255, 82, 113, 0.25)',
          pulse: true,
        };
      case 'HIGH':
        return {
          bg: 'rgba(255, 184, 52, 0.15)',
          border: 'rgba(255, 184, 52, 0.4)',
          text: 'var(--amber)',
          glow: '0 0 16px rgba(255, 184, 52, 0.2)',
          pulse: false,
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(91, 140, 255, 0.15)',
          border: 'rgba(91, 140, 255, 0.35)',
          text: 'var(--blue)',
          glow: 'none',
          pulse: false,
        };
      case 'LOW':
      default:
        return {
          bg: 'rgba(180, 243, 41, 0.12)',
          border: 'rgba(180, 243, 41, 0.3)',
          text: 'var(--accent)',
          glow: 'none',
          pulse: false,
        };
    }
  };

  const theme = getRiskTheme();

  return (
    <div
      className="fintrix-risk-card"
      style={{
        background: 'linear-gradient(135deg, rgba(22, 26, 35, 0.95), rgba(15, 18, 24, 0.9))',
        border: `1px solid ${theme.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        boxShadow: theme.glow,
        margin: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
            Forensic Risk Classification
          </span>
          {txnId && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-1)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
              {txnId}
            </span>
          )}
        </div>

        {/* Risk Level Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            padding: '4px 12px',
            borderRadius: 'var(--radius-pill)',
            color: theme.text,
            fontWeight: 800,
            fontSize: '12px',
            letterSpacing: '0.5px',
            fontFamily: 'var(--font-display)',
            animation: theme.pulse ? 'pulse-danger 2s infinite' : 'none',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.text }} />
          {riskLevel.toUpperCase()} RISK
        </div>
      </div>

      {/* Transaction Details & Signals */}
      {(amount || merchantName) && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-1)', flexWrap: 'wrap' }}>
          {amount && (
            <div>
              <span style={{ color: 'var(--text-2)', marginRight: '4px' }}>Amount:</span>
              <strong style={{ color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>{amount}</strong>
            </div>
          )}
          {merchantName && (
            <div>
              <span style={{ color: 'var(--text-2)', marginRight: '4px' }}>Merchant:</span>
              <strong style={{ color: 'var(--text-0)' }}>{merchantName}</strong>
            </div>
          )}
        </div>
      )}

      {signals && signals.length > 0 && (
        <div style={{ marginTop: '2px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Triggered Heuristic Signals ({signals.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {signals.map((sig, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-1)',
                }}
              >
                • {sig.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
