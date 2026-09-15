import React from 'react';

/**
 * Chat History Drawer / Sidebar for Fintrix AI.
 * Public fintech demo interface — supports New Chat, Previous Conversations, and Delete Chat.
 */
export default function ChatHistorySidebar({
  conversations = [],
  activeConversationId = null,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isOpen = true,
  onToggle = null,
}) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        title="Open Conversation History"
        style={{
          position: 'absolute',
          left: '12px',
          top: '74px',
          zIndex: 20,
          background: 'rgba(21, 24, 32, 0.9)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent)',
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span>📂</span> History ({conversations.length})
      </button>
    );
  }

  return (
    <aside
      className="fintrix-chat-history-sidebar"
      style={{
        width: '240px',
        background: 'rgba(15, 18, 24, 0.92)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backdropFilter: 'blur(16px)',
        zIndex: 10,
      }}
    >
      {/* Sidebar Header & New Chat Button */}
      <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '11px', color: 'var(--text-2)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Investigation Log
          </span>
          {onToggle && (
            <button
              onClick={onToggle}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px 4px',
              }}
              title="Collapse History"
            >
              ◀
            </button>
          )}
        </div>

        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(180, 243, 41, 0.15), rgba(180, 243, 41, 0.05))',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '12px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 12px rgba(180, 243, 41, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.color = '#000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(180, 243, 41, 0.15), rgba(180, 243, 41, 0.05))';
            e.currentTarget.style.color = 'var(--accent)';
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 900 }}>+</span> New Investigation
        </button>
      </div>

      {/* Conversations List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {conversations.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-2)', fontSize: '11.5px', lineHeight: 1.5 }}>
            No previous investigations recorded. Start a new chat!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId || conv.conversationId === activeConversationId;
            const timeStr = conv.updatedAt
              ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : 'Recent';

            return (
              <div
                key={conv.id || conv.conversationId}
                onClick={() => onSelectConversation(conv.id || conv.conversationId)}
                style={{
                  padding: '9px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  background: isActive ? 'rgba(180, 243, 41, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(180, 243, 41, 0.35)' : '1px solid transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-1)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--text-0)' : 'var(--text-1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.title || 'Investigation'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                    {timeStr}
                  </span>
                </div>

                {/* Delete Conversation Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onDeleteConversation) {
                      onDeleteConversation(conv.id || conv.conversationId);
                    }
                  }}
                  title="Delete Investigation"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                    transition: 'opacity 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = 'var(--red)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.6';
                    e.currentTarget.style.color = 'var(--text-2)';
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '10.5px',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>⚡ Public Demo Session</span>
      </div>
    </aside>
  );
}
