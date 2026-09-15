import React from 'react';

/**
 * Compact glass user message bubble, right-aligned.
 */
export default function UserMessage({ message, timestamp }) {
  return (
    <div
      className="fintrix-user-message-row"
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        margin: '12px 0',
        width: '100%',
      }}
    >
      <div
        className="fintrix-user-bubble"
        style={{
          maxWidth: '75%',
          background: 'linear-gradient(135deg, rgba(28, 33, 45, 0.9), rgba(20, 24, 33, 0.9))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px 16px 4px 16px',
          padding: '12px 18px',
          color: '#ffffff',
          fontSize: '13.5px',
          lineHeight: 1.5,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}
      >
        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message}
        </div>
        {timestamp && (
          <div style={{ fontSize: '10.5px', color: 'var(--text-2)', textAlign: 'right', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
