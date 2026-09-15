import React from 'react';

/**
 * Structured Evidence / Signal Breakdown Card for Fintrix AI Chat.
 */
export default function EvidenceCard({ title = 'Forensic Evidence Factors', factors = [] }) {
  if (!factors || factors.length === 0) return null;

  return (
    <div
      className="fintrix-evidence-card"
      style={{
        background: 'rgba(21, 24, 32, 0.75)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        margin: '8px 0',
      }}
    >
      <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {factors.map((factor, idx) => {
          const isTriggered = factor.triggered !== false;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12.5px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isTriggered ? 'rgba(255, 82, 113, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                borderLeft: isTriggered ? '3px solid var(--red)' : '3px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: isTriggered ? 'var(--text-0)' : 'var(--text-2)', fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                  {factor.factor ? factor.factor.replace(/_/g, ' ') : `Signal #${idx + 1}`}
                </div>
                {factor.evidence && (
                  <div style={{ color: 'var(--text-1)', fontSize: '12px', marginTop: '2px', lineHeight: 1.4 }}>
                    {factor.evidence}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
