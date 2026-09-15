import React, { useState, useRef, useEffect } from 'react';

/**
 * High-performance Chat Composer for Fintrix AI.
 * Supports auto-expanding multiline input, keyboard shortcuts, and glowing send button.
 */
export default function ChatComposer({
  onSendMessage,
  isLoading = false,
  placeholder = 'Ask Fintrix AI about your financial data, transactions, or merchant risk...',
  onQuickPrompt = null,
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fintrix-chat-composer-wrap" style={{ width: '100%', marginTop: 'auto' }}>
      {/* Quick Prompt Chips */}
      <div
        className="fintrix-quick-chips-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          scrollbarWidth: 'none',
        }}
      >
        {[
          'Total transaction volume?',
          'Which merchants have highest chargeback rate?',
          'Why is TXN00011869 risky?',
          'How many transactions failed?',
          'Disputed amount summary',
        ].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="fintrix-chip-btn"
            onClick={() => {
              if (onQuickPrompt) onQuickPrompt(chip);
              else {
                setText(chip);
                if (textareaRef.current) textareaRef.current.focus();
              }
            }}
            style={{
              whiteSpace: 'nowrap',
              fontSize: '11.5px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-1)',
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Main Composer Box */}
      <form
        onSubmit={handleSubmit}
        className="fintrix-composer-box"
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(21, 24, 32, 0.95)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Analyzing financial intelligence...' : placeholder}
          disabled={isLoading}
          rows={1}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            resize: 'none',
            maxHeight: '140px',
            lineHeight: 1.5,
            padding: '2px 0 8px 0',
          }}
        />

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {/* Attachment / Clear Tools Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              title="Attach financial record or CSV filter (coming soon)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontSize: '15px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              📎
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              Press <b>Enter ↵</b> to send
            </span>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="fintrix-send-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: text.trim() && !isLoading ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)',
              color: text.trim() && !isLoading ? '#000000' : 'var(--text-2)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '7px 18px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: text.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.18s ease',
              boxShadow: text.trim() && !isLoading ? '0 0 16px rgba(180, 243, 41, 0.4)' : 'none',
            }}
          >
            {isLoading ? (
              <>
                <span className="fintrix-loading-spinner" />
                <span>ANALYZING...</span>
              </>
            ) : (
              <>
                <span>SEND</span>
                <span>↑</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
