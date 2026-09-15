import React from 'react';

/**
 * Reusable Dashboard Deep-Link action button in AI responses.
 */
export default function DashboardLink({ label, pageId, icon, onClick, contextData = null }) {
  return (
    <button
      className="fintrix-dashboard-link-btn"
      onClick={() => onClick && onClick(pageId, contextData)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid var(--border)',
        color: 'var(--text-0)',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        margin: '4px 4px 4px 0',
      }}
    >
      <span style={{ color: 'var(--accent)', fontSize: '13px' }}>{icon || '↗'}</span>
      <span>{label}</span>
    </button>
  );
}
