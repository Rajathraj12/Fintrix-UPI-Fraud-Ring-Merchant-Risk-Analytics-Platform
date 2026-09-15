import React from 'react';

/**
 * Interactive Suggestion Card for empty state exploration.
 */
export default function SuggestionCard({ title, description, prompt, icon, onSelect }) {
  return (
    <div
      className="fintrix-suggestion-card"
      onClick={() => onSelect(prompt)}
      style={{
        background: 'linear-gradient(145deg, rgba(22, 26, 35, 0.9), rgba(17, 20, 26, 0.8))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(prompt); }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 800,
          }}
        >
          {icon || '✦'}
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--text-0)' }}>
          {title}
        </span>
      </div>

      <div style={{ fontSize: '12.5px', color: 'var(--text-1)', lineHeight: 1.45 }}>
        {description}
      </div>

      <div
        style={{
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--accent)',
          background: 'rgba(180, 243, 41, 0.06)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(180, 243, 41, 0.15)',
        }}
      >
        <span>↳</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{prompt}"</span>
      </div>
    </div>
  );
}
