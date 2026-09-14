import React, { useState, useEffect, useRef } from 'react';

/**
 * DataTelemetrySlip (Advance Data Dispenser Animation)
 * 
 * An animated intelligence data slip designed to showcase live Datathon metrics:
 * - Replaces generic "bill" concepts with high-tech Sentinel AI Telemetry.
 * - Features a cybernetic dispenser slit with an active laser scanline.
 * - Smooth physics-based continuous drop-down animation with live number reveals.
 * - Mini data visualizations (channel breakdown, resolution ratios, fraud mitigation stats).
 * - Interactive re-stream, detach/tear, and copy controls.
 */
export default function AdvanceReceiptPrinter({ data = {}, onNavigate }) {
  const [streamState, setStreamState] = useState('streaming'); // 'streaming' | 'streamed' | 'detached'
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'channels' | 'risk'
  const audioCtxRef = useRef(null);

  // Synthesize modern high-tech telemetry stream sound
  const playStreamSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Synthesize clean melodic telemetry data blips
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.18);
        gain.gain.setValueAtTime(0.025, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.15);
      });
    } catch {
      // Audio context fallback
    }
  };

  const playDetachSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  };

  // Trigger smooth data slip streaming animation
  const handleReStream = () => {
    setStreamState('streaming');
    playStreamSound();
    setTimeout(() => {
      setStreamState('streamed');
    }, 1800);
  };

  // Toggle detach / floating slip state
  const handleDetach = () => {
    if (streamState === 'detached') {
      setStreamState('streamed');
    } else {
      setStreamState('detached');
      playDetachSound();
    }
  };

  // Copy full analytics summary to clipboard
  const handleCopyTelemetry = () => {
    const report = `
======================================================
     SENTINEL AI // LIVE INTELLIGENCE TELEMETRY SLIP
             TRANSORG AGENTIQ DATATHON 2026
======================================================
Generated: 14 Sep 2026 | Node: SENTINEL-NODE-09
Security Tier: Compliant & Verified ✓

1. EXECUTIVE VOLUME & FLOW:
   • Clean UPI Volume:        ₹18.42 Cr (2,800 Txns)
   • Disputed In-Review:      ₹4.12 Cr
   • Net Processed Velocity:  ₹24.85 Cr

2. DISPUTE RESOLUTION STATUS:
   • Total Claims:            2,800 Cases
   • OPEN:                    1,492 (53.3%)
   • CLOSED:                  865   (30.9%)
   • REJECTED:                443   (15.8%)

3. CHANNEL INTAKE TELEMETRY:
   • IVR Voice:               709 (25.3%)
   • Chatbot AI:              698 (24.9%)
   • Email Support:           375 (13.4%)
   • Branch Desk:             366 (13.1%)
   • Mobile App:              344 (12.3%)

4. RISK MITIGATION & AI DEFENSE:
   • Prevented Fraud Loss:    +₹1.85 Cr
   • KYC Integrity Pass:      94.2%
   • Regional Hotspot:        Mumbai / Delhi NCR (High Tier)
   • Model F1-Confidence:     0.842

======================================================
  VERIFIED BY SENTINEL AUTONOMOUS RISK ORCHESTRATOR
======================================================
`;
    navigator.clipboard.writeText(report.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  };

  // Auto-run animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleReStream();
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="telemetry-slip-wrapper">
      {/* Dark Cyber Card Container */}
      <div className="telemetry-card-container">
        
        {/* Top Header: Live Intelligence Feed */}
        <div className="telemetry-header">
          <div className="header-status-group">
            <div className="cyber-pulse-badge">
              <span className="cyber-radar-ring" />
              <span className="cyber-radar-core" />
            </div>
            <div>
              <div className="telemetry-title">Sentinel Telemetry Feed</div>
              <div className="telemetry-subtitle">Live Autonomous Data Dispatch</div>
            </div>
          </div>

          <div className="ai-verified-chip">
            <span style={{ color: 'var(--accent)' }}>✦</span>
            <span>AI DISPATCH</span>
          </div>
        </div>

        {/* 3D Dispenser Slot Apparatus */}
        <div className="dispenser-apparatus">
          {/* Top Metallic Dispenser Hood */}
          <div className="dispenser-bezel">
            {/* Laser scanning beam */}
            <div className="laser-slit-track">
              <div className="laser-beam" />
            </div>

            {/* Hardware LEDs & Micro Label */}
            <div className="dispenser-hardware-info">
              <div className="status-leds">
                <span className={`led-dot ${streamState === 'streaming' ? 'led-laser-active' : 'led-laser-standby'}`} />
                <span className="led-dot led-blue-dot" />
              </div>
              <div className="dispenser-model-tag">OPTICAL TELEMETRY DISPENSER // v3.4</div>
            </div>
          </div>

          {/* Slit Mask for Dispensing Motion */}
          <div className="dispenser-mouth-channel">
            {/* The Intelligence Data Slip with Smooth Sliding Drop Motion */}
            <div className={`intel-slip-carrier ${streamState === 'streaming' ? 'is-streaming-flow' : ''} ${streamState === 'detached' ? 'is-detached-floating' : ''}`}>
              
              <div className="intel-paper-canvas">
                {/* Perforated Top Jagged Edge */}
                <div className="perforated-top-edge" />

                {/* Slip Brand & Security Strip */}
                <div className="slip-top-brand-row">
                  <div className="slip-brand-identity">
                    <div className="slip-brand-icon">✦</div>
                    <div>
                      <div className="slip-brand-main">SENTINEL AI ENGINE</div>
                      <div className="slip-brand-sub">TRANSORG DATATHON TELEMETRY</div>
                    </div>
                  </div>
                  
                  {/* Holographic Security Pill */}
                  <div className="slip-holo-pill">
                    <span>VERIFIED</span>
                  </div>
                </div>

                {/* Live Timestamp & Node Coordinates */}
                <div className="slip-telemetry-meta">
                  <div>
                    <span className="meta-k">TIMESTAMP:</span>
                    <span className="meta-v">14-SEP-2026 // 20:45</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="meta-k">NODE:</span>
                    <span className="meta-v">BLR-IN-09</span>
                  </div>
                </div>

                {/* Big Metric Display & AI Audit Stamp */}
                <div className="slip-hero-metric-box">
                  <div>
                    <div className="hero-metric-caption">TOTAL AUDITED VOLUME</div>
                    <div className="hero-metric-val">₹24.85 Cr</div>
                    <div className="hero-metric-growth">
                      <span className="growth-arrow">↗</span> +14.2% MoM Velocity
                    </div>
                  </div>

                  {/* Red/Amber Slanted Grunge Security Stamp */}
                  <div className="cyber-stamp-badge">
                    <div className="stamp-core-text">AUDITED</div>
                    <div className="stamp-sub-text">TRANSORG AI</div>
                  </div>
                </div>

                <div className="slip-divider-dashed" />

                {/* Section 1: Resolution Status Progress Bars */}
                <div className="slip-data-section">
                  <div className="section-micro-heading">
                    <span>DISPUTE RESOLUTION RATIOS</span>
                    <span className="pill-metric">2,800 CASES</span>
                  </div>

                  <div className="status-progress-list">
                    {/* OPEN */}
                    <div className="status-progress-row">
                      <div className="progress-info">
                        <span className="dot-label dot-amber">● OPEN</span>
                        <span className="metric-bold">1,492 <span className="pct-mute">(53.3%)</span></span>
                      </div>
                      <div className="progress-track-bg">
                        <div className="progress-fill-bar bar-amber" style={{ width: '53.3%' }} />
                      </div>
                    </div>

                    {/* CLOSED */}
                    <div className="status-progress-row">
                      <div className="progress-info">
                        <span className="dot-label dot-green">● CLOSED</span>
                        <span className="metric-bold">865 <span className="pct-mute">(30.9%)</span></span>
                      </div>
                      <div className="progress-track-bg">
                        <div className="progress-fill-bar bar-green" style={{ width: '30.9%' }} />
                      </div>
                    </div>

                    {/* REJECTED */}
                    <div className="status-progress-row">
                      <div className="progress-info">
                        <span className="dot-label dot-red">● REJECTED</span>
                        <span className="metric-bold">443 <span className="pct-mute">(15.8%)</span></span>
                      </div>
                      <div className="progress-track-bg">
                        <div className="progress-fill-bar bar-red" style={{ width: '15.8%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="slip-divider-dashed" />

                {/* Section 2: Intake Channel Breakdown */}
                <div className="slip-data-section">
                  <div className="section-micro-heading">
                    <span>TOP INTAKE CHANNELS</span>
                    <span className="pill-metric">5 CHANNELS</span>
                  </div>

                  <div className="channel-pill-grid">
                    <div className="channel-stat-card">
                      <div className="chan-icon">📞</div>
                      <div className="chan-name">IVR Voice</div>
                      <div className="chan-val">709</div>
                    </div>
                    <div className="channel-stat-card highlight-chan">
                      <div className="chan-icon">🤖</div>
                      <div className="chan-name">AI Bot</div>
                      <div className="chan-val">698</div>
                    </div>
                    <div className="channel-stat-card">
                      <div className="chan-icon">✉️</div>
                      <div className="chan-name">Email</div>
                      <div className="chan-val">375</div>
                    </div>
                    <div className="channel-stat-card">
                      <div className="chan-icon">🏦</div>
                      <div className="chan-name">Branch</div>
                      <div className="chan-val">366</div>
                    </div>
                  </div>
                </div>

                <div className="slip-divider-dashed" />

                {/* Section 3: Risk & Mitigation KPIs */}
                <div className="slip-kpi-summary-table">
                  <div className="kpi-summary-line">
                    <span className="kpi-k">High Risk Intercepted</span>
                    <span className="kpi-v text-red">₹4.12 Cr</span>
                  </div>
                  <div className="kpi-summary-line">
                    <span className="kpi-k">Fraud Losses Mitigated</span>
                    <span className="kpi-v text-green">+₹1.85 Cr</span>
                  </div>
                  <div className="kpi-summary-line">
                    <span className="kpi-k">KYC Identity Pass Rate</span>
                    <span className="kpi-v text-blue">94.2%</span>
                  </div>
                  <div className="kpi-summary-line">
                    <span className="kpi-k">Model F1-Confidence</span>
                    <span className="kpi-v text-purple">0.842</span>
                  </div>
                </div>

                <div className="slip-divider-solid" />

                {/* Footer Barcode & Hash */}
                <div className="slip-barcode-cluster">
                  <svg className="cyber-barcode-svg" viewBox="0 0 240 32" preserveAspectRatio="none">
                    <rect x="0" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="5" y="0" width="1.5" height="32" fill="#0f172a" />
                    <rect x="8" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="14" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="17" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="22" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="29" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="33" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="38" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="42" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="48" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="52" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="59" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="63" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="68" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="74" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="78" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="85" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="89" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="94" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="98" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="104" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="108" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="115" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="119" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="125" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="128" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="133" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="140" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="144" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="150" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="154" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="161" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="164" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="170" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="174" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="181" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="185" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="190" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="193" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="199" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="203" y="0" width="5" height="32" fill="#0f172a" />
                    <rect x="210" y="0" width="2" height="32" fill="#0f172a" />
                    <rect x="214" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="220" y="0" width="1" height="32" fill="#0f172a" />
                    <rect x="223" y="0" width="4" height="32" fill="#0f172a" />
                    <rect x="229" y="0" width="3" height="32" fill="#0f172a" />
                    <rect x="235" y="0" width="3" height="32" fill="#0f172a" />
                  </svg>
                  <div className="slip-hash-string">HASH-SENTINEL-99482-AI-2026</div>
                </div>

                {/* Perforated Bottom Jagged Edge */}
                <div className="perforated-bottom-edge" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Section */}
        <div className="telemetry-status-panel">
          <div className="status-main-line">
            {streamState === 'streaming'
              ? 'Streaming Telemetry Data...'
              : streamState === 'detached'
              ? 'Telemetry Slip Detached'
              : 'Intelligence Stream Synced'}
          </div>
          <div className="status-detail-line">
            {streamState === 'streaming'
              ? 'Optical feed rendering active data packets.'
              : streamState === 'detached'
              ? 'Ready for export or live re-stream.'
              : 'Real-time telemetry verified and locked.'}
          </div>
        </div>

        {/* Action Controls */}
        <div className="telemetry-actions-row">
          <button
            onClick={handleReStream}
            disabled={streamState === 'streaming'}
            className="action-btn-restream"
            title="Re-run the streaming animation"
          >
            <span className="btn-glyph">⚡</span>
            <span>{streamState === 'streaming' ? 'Streaming...' : 'Re-stream Data'}</span>
          </button>

          <button
            onClick={handleDetach}
            disabled={streamState === 'streaming'}
            className={`action-btn-detach ${streamState === 'detached' ? 'is-detached-btn' : ''}`}
            title="Detach or re-dock the intelligence slip"
          >
            <span className="btn-glyph">✂️</span>
            <span>{streamState === 'detached' ? 'Dock Slip' : 'Detach Slip'}</span>
          </button>

          <button
            onClick={handleCopyTelemetry}
            className="action-btn-copy-telemetry"
            title="Copy full telemetry summary"
          >
            <span className="btn-glyph">{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Footer Micro Links */}
        <div className="telemetry-micro-footer">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sound-toggle-action"
          >
            {soundEnabled ? '🔊 Audio FX On' : '🔇 Audio Muted'}
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('dispute')}
              className="deep-dive-btn"
            >
              Dispute Matrix →
            </button>
          )}
        </div>
      </div>

      <style>{`
        .telemetry-slip-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Dark Obsidian Cyber Card */
        .telemetry-card-container {
          width: 100%;
          max-width: 360px;
          background: #11141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px 18px 18px 18px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          user-select: none;
        }

        /* Top Header */
        .telemetry-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 16px;
        }

        .header-status-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cyber-pulse-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(180, 243, 41, 0.12);
          border: 1.5px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .cyber-radar-core {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
        }

        .cyber-radar-ring {
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1px solid var(--accent);
          opacity: 0.5;
          animation: radarPing 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }

        @keyframes radarPing {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .telemetry-title {
          font-family: var(--font-display);
          font-size: 14.5px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.2px;
        }

        .telemetry-subtitle {
          font-size: 11px;
          color: var(--text-2);
          margin-top: 1px;
        }

        .ai-verified-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 800;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
          padding: 3px 8px;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(255, 255, 255, 0.1);
          letter-spacing: 0.5px;
        }

        /* Dispenser Apparatus */
        .dispenser-apparatus {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .dispenser-bezel {
          width: 295px;
          height: 36px;
          background: linear-gradient(180deg, #2b3140 0%, #151822 55%, #0c0e14 100%);
          border-radius: 18px;
          position: relative;
          z-index: 10;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.65), inset 0 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 6px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .laser-slit-track {
          width: 250px;
          height: 5px;
          background: #000000;
          border-radius: 3px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .laser-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 45px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          box-shadow: 0 0 10px var(--accent);
          animation: laserScan 1.6s ease-in-out infinite alternate;
        }

        @keyframes laserScan {
          0% { left: -20px; }
          100% { left: 220px; }
        }

        .dispenser-hardware-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 250px;
          margin-top: 3px;
        }

        .status-leds {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .led-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        .led-laser-active {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: ledFlicker 0.25s infinite alternate;
        }

        .led-laser-standby {
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }

        .led-blue-dot {
          background: #3b82f6;
          box-shadow: 0 0 6px #3b82f6;
        }

        @keyframes ledFlicker {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }

        .dispenser-model-tag {
          font-size: 6.5px;
          font-weight: 800;
          letter-spacing: 1px;
          color: rgba(255, 255, 255, 0.25);
        }

        /* Dispenser Mouth Channel */
        .dispenser-mouth-channel {
          width: 265px;
          position: relative;
          margin-top: -10px;
          z-index: 5;
        }

        /* Carrier with Fluid Drop Animation */
        .intel-slip-carrier {
          width: 100%;
          transform-origin: top center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
        }

        /* Improved Fluid Drop-Down Animation */
        .intel-slip-carrier.is-streaming-flow {
          animation: fluidSlipDrop 1.8s cubic-bezier(0.12, 0.95, 0.2, 1) forwards;
        }

        @keyframes fluidSlipDrop {
          0% {
            clip-path: inset(0 0 96% 0);
            transform: translateY(-90px) scale(0.96);
            opacity: 0.5;
          }
          35% {
            clip-path: inset(0 0 65% 0);
            transform: translateY(-40px) scale(0.98);
          }
          70% {
            clip-path: inset(0 0 20% 0);
            transform: translateY(-8px) scale(0.995);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .intel-slip-carrier.is-detached-floating {
          transform: translateY(20px) rotate(-1.5deg);
          filter: drop-shadow(0 24px 35px rgba(0, 0, 0, 0.7));
        }

        /* Crisp Data Slip Paper Canvas */
        .intel-paper-canvas {
          background: #fbfbfd;
          color: #0f172a;
          border-radius: 4px 4px 0 0;
          padding: 22px 18px 24px 18px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.15);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: text;
        }

        /* Jagged Top Perforation */
        .perforated-top-edge {
          position: absolute;
          top: -6px;
          left: 0;
          right: 0;
          height: 6px;
          background: #fbfbfd;
          clip-path: polygon(
            0% 100%, 3.33% 0%, 6.66% 100%, 10% 0%, 13.33% 100%, 16.66% 0%, 20% 100%, 23.33% 0%, 26.66% 100%, 30% 0%, 
            33.33% 100%, 36.66% 0%, 40% 100%, 43.33% 0%, 46.66% 100%, 50% 0%, 53.33% 100%, 56.66% 0%, 60% 100%, 63.33% 0%, 
            66.66% 100%, 70% 0%, 73.33% 100%, 76.66% 0%, 80% 100%, 83.33% 0%, 86.66% 100%, 90% 0%, 93.33% 100%, 96.66% 0%, 100% 100%
          );
        }

        /* Brand Row */
        .slip-top-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          margin-top: 2px;
        }

        .slip-brand-identity {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .slip-brand-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #0f172a;
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .slip-brand-main {
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.3px;
          font-family: var(--font-mono);
        }

        .slip-brand-sub {
          font-size: 7.5px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        .slip-holo-pill {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        /* Telemetry Meta */
        .slip-telemetry-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          font-family: var(--font-mono);
          padding: 5px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 10px;
          color: #475569;
        }

        .meta-k {
          font-weight: 800;
          margin-right: 4px;
          color: #1e293b;
        }

        .meta-v {
          font-weight: 600;
        }

        /* Hero Metric Box & Security Stamp */
        .slip-hero-metric-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .hero-metric-caption {
          font-size: 8px;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          font-family: var(--font-mono);
        }

        .hero-metric-val {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-top: 1px;
        }

        .hero-metric-growth {
          font-size: 9px;
          font-weight: 700;
          color: #16a34a;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .growth-arrow {
          font-weight: 900;
        }

        /* Stamp */
        .cyber-stamp-badge {
          border: 2px dashed #ea580c;
          padding: 3px 6px;
          border-radius: 4px;
          transform: rotate(8deg);
          background: rgba(234, 88, 12, 0.06);
          text-align: center;
        }

        .stamp-core-text {
          font-size: 10px;
          font-weight: 900;
          color: #ea580c;
          letter-spacing: 1.2px;
          line-height: 1;
          font-family: var(--font-display);
        }

        .stamp-sub-text {
          font-size: 6.5px;
          font-weight: 800;
          color: #ea580c;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* Dividers */
        .slip-divider-dashed {
          border-bottom: 1.5px dashed #cbd5e1;
          margin: 9px 0;
        }

        .slip-divider-solid {
          border-bottom: 1.5px solid #0f172a;
          margin: 9px 0 8px 0;
        }

        /* Section Layouts */
        .slip-data-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .section-micro-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
          font-family: var(--font-mono);
        }

        .pill-metric {
          background: #f1f5f9;
          padding: 1px 5px;
          border-radius: 3px;
          color: #334155;
        }

        /* Progress bars for Resolution status */
        .status-progress-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .status-progress-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          font-family: var(--font-mono);
        }

        .dot-label {
          font-weight: 700;
        }

        .dot-amber { color: #d97706; }
        .dot-green { color: #16a34a; }
        .dot-red { color: #dc2626; }

        .metric-bold {
          font-weight: 800;
          color: #0f172a;
        }

        .pct-mute {
          color: #64748b;
          font-weight: 600;
        }

        .progress-track-bg {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.8s ease;
        }

        .bar-amber { background: #f59e0b; }
        .bar-green { background: #22c55e; }
        .bar-red { background: #ef4444; }

        /* Channel Pill Grid */
        .channel-pill-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 4px;
        }

        .channel-stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 3px;
          text-align: center;
        }

        .highlight-chan {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .chan-icon {
          font-size: 10px;
        }

        .chan-name {
          font-size: 7.5px;
          font-weight: 700;
          color: #64748b;
          margin-top: 1px;
        }

        .chan-val {
          font-size: 10px;
          font-weight: 900;
          color: #0f172a;
          font-family: var(--font-mono);
        }

        /* KPI Summary Table */
        .slip-kpi-summary-table {
          display: flex;
          flex-direction: column;
          gap: 3.5px;
        }

        .kpi-summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 8.5px;
          font-family: var(--font-mono);
        }

        .kpi-k {
          color: #475569;
          font-weight: 600;
        }

        .kpi-v {
          font-weight: 800;
        }

        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .text-blue { color: #2563eb; }
        .text-purple { color: #7c3aed; }

        /* Barcode */
        .slip-barcode-cluster {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2px 0 4px 0;
        }

        .cyber-barcode-svg {
          width: 100%;
          height: 26px;
        }

        .slip-hash-string {
          font-size: 7px;
          font-family: var(--font-mono);
          letter-spacing: 1.5px;
          font-weight: 700;
          color: #475569;
          margin-top: 2px;
        }

        /* Jagged Bottom Perforation */
        .perforated-bottom-edge {
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 8px;
          background: #fbfbfd;
          clip-path: polygon(
            0% 0%, 3.33% 100%, 6.66% 0%, 10% 100%, 13.33% 0%, 16.66% 100%, 20% 0%, 23.33% 100%, 26.66% 0%, 30% 100%, 
            33.33% 0%, 36.66% 100%, 40% 0%, 43.33% 100%, 46.66% 0%, 50% 100%, 53.33% 0%, 56.66% 100%, 60% 0%, 63.33% 100%, 
            66.66% 0%, 70% 100%, 73.33% 0%, 76.66% 100%, 80% 0%, 83.33% 100%, 86.66% 0%, 90% 100%, 93.33% 0%, 96.66% 100%, 100% 0%
          );
        }

        /* Status Footer */
        .telemetry-status-panel {
          text-align: center;
          margin-top: 20px;
          margin-bottom: 12px;
        }

        .status-main-line {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
        }

        .status-detail-line {
          font-size: 11px;
          color: var(--text-2);
          margin-top: 2px;
        }

        /* Action Buttons */
        .telemetry-actions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          flex-wrap: wrap;
        }

        .action-btn-restream {
          flex: 1;
          min-width: 120px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 700;
          background: #faf8f5;
          color: #171c26;
          border: 1px solid rgba(255, 255, 255, 0.12);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn-restream:hover:not(:disabled) {
          background: #ffffff;
          transform: translateY(-1.5px);
        }

        .action-btn-restream:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .action-btn-detach {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          border: 1px dashed rgba(255, 255, 255, 0.25);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn-detach:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .is-detached-btn {
          background: rgba(234, 88, 12, 0.15);
          border-color: #ea580c;
          color: #fdba74;
        }

        .action-btn-copy-telemetry {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px 12px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn-copy-telemetry:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-glyph {
          font-size: 13px;
        }

        /* Micro footer */
        .telemetry-micro-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 10.5px;
        }

        .sound-toggle-action {
          background: transparent;
          border: none;
          color: var(--text-2);
          cursor: pointer;
        }

        .sound-toggle-action:hover {
          color: #ffffff;
        }

        .deep-dive-btn {
          background: transparent;
          border: none;
          color: var(--accent);
          font-weight: 700;
          cursor: pointer;
        }

        .deep-dive-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
