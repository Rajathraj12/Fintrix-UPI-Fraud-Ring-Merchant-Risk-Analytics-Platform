import React from 'react';

/**
 * AI Telemetry Side Panel inspired by Fintrix financial terminal feeds.
 */
export default function TelemetryPanel({
  isOnline = true,
  isAnalyzing = false,
  activeTool = null,
  latency = 0,
  requestCount = 0,
  maxRequests = 20,
  recentTools = [],
  llmMode = 'mock',
  onClearSession = null,
}) {
  return (
    <aside
      className="fintrix-telemetry-panel"
      style={{
        width: '280px',
        background: 'rgba(17, 20, 26, 0.75)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontSize: '12px',
        backdropFilter: 'blur(16px)',
        height: 'fit-content',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isOnline ? 'var(--accent)' : 'var(--amber)',
              boxShadow: isOnline ? '0 0 8px var(--accent)' : 'none',
              animation: isAnalyzing ? 'pulse 1s infinite' : 'none',
            }}
          />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '12px', letterSpacing: '0.5px' }}>
            AI TELEMETRY FEED
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: isOnline ? 'var(--accent)' : 'var(--amber)',
            background: isOnline ? 'rgba(180, 243, 41, 0.1)' : 'rgba(255, 184, 52, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 700,
          }}
        >
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Engine Status Block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ color: 'var(--text-2)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Inference Engine
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-0)', fontSize: '11.5px', wordBreak: 'break-all' }}>
          Llama-3.3-70B-Instruct
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-1)', fontSize: '11px' }}>
          <span>Framework:</span>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>SmolAgents</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-1)', fontSize: '11px' }}>
          <span>LLM Mode:</span>
          <span
            style={{
              color: llmMode === 'live' ? 'var(--accent)' : 'var(--amber)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            {llmMode === 'live' ? 'LIVE' : 'MOCK / DEV'}
          </span>
        </div>
      </div>

      {/* Live Tool Activity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ color: 'var(--text-2)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Current State
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: isAnalyzing ? 'var(--accent)' : 'var(--text-1)', fontWeight: 600 }}>
            {isAnalyzing ? '● ANALYZING...' : '○ READY / IDLE'}
          </span>
        </div>
        {activeTool && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>
            TOOL: {activeTool}
          </div>
        )}
        {latency > 0 && (
          <div style={{ fontSize: '11px', color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Last Latency:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{latency}ms</span>
          </div>
        )}
      </div>

      {/* Session Guard Tracking */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-2)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 600 }}>
          <span>Session Budget</span>
          <span>{requestCount} / {maxRequests}</span>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, (requestCount / maxRequests) * 100)}%`,
              height: '100%',
              background: requestCount >= maxRequests ? 'var(--red)' : 'var(--accent)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Deterministic Tools Available */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ color: 'var(--text-2)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          Registered Tools (9)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {['get_risk_score', 'get_transaction_analytics', 'get_merchant_analytics', 'get_customer_analytics', 'get_chargeback_analytics', 'get_transaction', 'get_merchant_profile', 'get_customer_profile', 'get_risk_analytics'].map((tool, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '9.5px',
                fontFamily: 'var(--font-mono)',
                padding: '2px 6px',
                borderRadius: '3px',
                background: recentTools.includes(tool) ? 'rgba(180, 243, 41, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: recentTools.includes(tool) ? 'var(--accent)' : 'var(--text-2)',
                border: recentTools.includes(tool) ? '1px solid rgba(180, 243, 41, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {tool.replace('get_', '')}
            </span>
          ))}
        </div>
      </div>

      {/* Session Controls */}
      {onClearSession && (
        <button
          onClick={onClearSession}
          style={{
            marginTop: 'auto',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-2)',
            fontSize: '11px',
            padding: '6px 10px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
        >
          <span>↺</span> Clear Session History
        </button>
      )}
    </aside>
  );
}
