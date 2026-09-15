import React from 'react';

/**
 * Technical tool activity badge showing deterministic tools executed.
 */
export default function ToolActivity({ toolName, status = 'VERIFIED', latencyMs = null }) {
  if (!toolName) return null;

  return (
    <div
      className="fintrix-tool-activity"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(17, 20, 26, 0.9)',
        border: '1px solid rgba(180, 243, 41, 0.25)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-1)',
        margin: '4px 4px 4px 0',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
      <span style={{ color: 'var(--text-2)', textTransform: 'uppercase', fontSize: '10px' }}>TOOL:</span>
      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{toolName}</span>
      <span style={{ color: 'var(--border-strong)' }}>|</span>
      <span style={{ color: 'var(--green)', fontSize: '10px', fontWeight: 700 }}>{status}</span>
      {latencyMs !== null && latencyMs > 0 && (
        <>
          <span style={{ color: 'var(--border-strong)' }}>|</span>
          <span style={{ color: 'var(--text-2)', fontSize: '10px' }}>{latencyMs}ms</span>
        </>
      )}
    </div>
  );
}
