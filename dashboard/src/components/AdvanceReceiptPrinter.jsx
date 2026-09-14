import React, { useState, useEffect, useRef } from 'react';

export default function AdvanceReceiptPrinter({ data = {}, onNavigate }) {
  const [printState, setPrintState] = useState('printed'); // 'idle' | 'printing' | 'printed' | 'torn'
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  // Play subtle thermal printer motor sound synthesis
  const playPrinterSound = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // Synthesize rhythmic mechanical print stepper ticks
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + (i % 2) * 60, now + i * 0.28);
        gain.gain.setValueAtTime(0.04, now + i * 0.28);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.28 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.28);
        osc.stop(now + i * 0.28 + 0.19);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const playTearSound = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Synthesize paper rip white noise burst
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();
    } catch {
      // Audio fallback
    }
  };

  // Start printing sequence
  const handlePrint = () => {
    setPrintState('printing');
    playPrinterSound();
    setTimeout(() => {
      setPrintState('printed');
    }, 2100);
  };

  const handleTear = () => {
    if (printState === 'torn') {
      // Re-attach
      setPrintState('printed');
    } else {
      setPrintState('torn');
      playTearSound();
    }
  };

  const handleCopy = () => {
    const textSummary = `
========================================
       SENTINEL FINTECH AUDIT
       EXECUTIVE SUMMARY REPORT
========================================
Date: 14 Sep 2026 | Terminal: #9942
Auditor: Sentinel AI System
Tracking: TXN-7451188122-8M

TOTAL PROCESSED: ₹24,851,850.00
----------------------------------------
• UPI Volume (Clean): 2,800 Txns (₹18.4M)
• Dispute Claims: 2,800 Cases
  - OPEN: 1,492 (53.3%)
  - CLOSED: 865 (30.9%)
  - REJECTED: 443 (15.8%)
• Top Intake Channel: IVR (709) | Bot (698)
• High Risk Intercepted: ₹4.12 Cr
• Fraud Loss Mitigated: +₹1.85 Cr
• KYC Verification Rate: 94.2% Passed
----------------------------------------
SUBTOTAL:     ₹24,797,000.00
DISPUTES NET: -₹1,492,000.00
RECOVERED:    +₹1,280,000.00
----------------------------------------
GRAND TOTAL:  ₹24,851,850.00
STATUS:       AUDITED & COMPLIANT ✓
========================================
    THANK YOU FOR USING SENTINEL AI!
`;
    navigator.clipboard.writeText(textSummary.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  };

  // Auto-run printing animation once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="receipt-print-wrapper">
      {/* Printer Header Label & Title */}
      <div className="receipt-header-hero">
        <div className="receipt-hero-title">
          Advance Receipt Print <span>Animation</span>
        </div>
        <div className="receipt-hero-subtitle">
          Live executive data roll · Real-time financial telemetry audit slip
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="printer-stage-container">
        {/* Physical 3D Printer Bar (Top Slot) */}
        <div className="printer-device-slot">
          {/* Subtle status LED */}
          <div className={`printer-led ${printState === 'printing' ? 'led-pulsing' : 'led-ready'}`} title={printState === 'printing' ? 'Printing in progress' : 'Printer Ready'} />
          
          {/* Slit opening from which paper emerges */}
          <div className="printer-slit-hole" />
          
          {/* Printer brand watermark on hardware */}
          <div className="printer-hardware-label">
            SENTINEL POS-80 THERMAL AUDIT ENGINE
          </div>
        </div>

        {/* Paper Container with overflow hide / slide-down mechanics */}
        <div className={`paper-motion-track ${printState === 'printing' ? 'is-printing' : ''} ${printState === 'torn' ? 'is-torn' : ''}`}>
          
          {/* Authentic Paper Slip */}
          <div className="thermal-receipt-paper">
            {/* Top Shadow inside slot for depth */}
            <div className="paper-top-slot-shadow" />

            {/* Receipt Header */}
            <div className="receipt-brand-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="receipt-logo-glyph">✦</div>
                <div>
                  <div className="receipt-brand-name">SENTINEL AUDIT AGENCY</div>
                  <div className="receipt-sub-tag">FINANCIAL RISK INTELLIGENCE SLIP</div>
                </div>
              </div>
              <div className="receipt-badge-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7V13C3 18.5 7 23 12 24C17 23 21 18.5 21 13V7L12 2Z" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(37, 99, 235, 0.1)"/>
                  <path d="M8.5 12.5L11 15L15.5 9.5" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="receipt-meta-grid">
              <div>
                <span className="receipt-lbl">CLIENT:</span>
                <span className="receipt-val">SENTINEL AI AUTO-AUDIT</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="receipt-lbl">VISA/UPI:</span>
                <span className="receipt-val">•••• 9942</span>
              </div>
            </div>

            {/* Big Headline & Stamp */}
            <div className="receipt-headline-box">
              <div>
                <div className="receipt-grand-headline">₹2,85,185.00</div>
                <div className="receipt-headline-sub">14TH SEPTEMBER 2026 | INVOICE AUDITED</div>
              </div>

              {/* Grunge Stamp */}
              <div className="receipt-stamp-paid">
                <div className="stamp-inner">
                  <div className="stamp-word">PAID</div>
                  <div className="stamp-date">14 SEP 2026</div>
                </div>
              </div>
            </div>

            <div className="receipt-dashed-divider" />

            {/* Itemized Line Items Breakdown */}
            <div className="receipt-item-list">
              <div className="receipt-item-row">
                <div className="receipt-item-desc">
                  <span className="receipt-qty">1X</span> Disputed Claims (Open/Closed/Rej)
                </div>
                <div className="receipt-item-amount">1,492 / 865 / 443</div>
              </div>

              <div className="receipt-item-row">
                <div className="receipt-item-desc">
                  <span className="receipt-qty">1X</span> High Risk Flagged Volume
                </div>
                <div className="receipt-item-amount">₹4.12 Cr</div>
              </div>

              <div className="receipt-item-row">
                <div className="receipt-item-desc">
                  <span className="receipt-qty">1X</span> Top Channel Intake (IVR/Bot)
                </div>
                <div className="receipt-item-amount">1,407 Txns</div>
              </div>

              <div className="receipt-item-row">
                <div className="receipt-item-desc">
                  <span className="receipt-qty">1X</span> Fraud Loss Mitigated (AI)
                </div>
                <div className="receipt-item-amount">₹1.85 Cr</div>
              </div>

              <div className="receipt-item-row">
                <div className="receipt-item-desc">
                  <span className="receipt-qty">1X</span> KYC Identity Integrity
                </div>
                <div className="receipt-item-amount">94.2% Passed</div>
              </div>
            </div>

            <div className="receipt-dashed-divider" />

            {/* Calculations & Subtotals */}
            <div className="receipt-calc-table">
              <div className="receipt-calc-row">
                <span className="calc-lbl">Subtotal</span>
                <span className="calc-val">₹2,797.00</span>
              </div>
              <div className="receipt-calc-row discount-row">
                <span className="calc-lbl">Discount (Dispute Shield)</span>
                <span className="calc-val">-₹100.00</span>
              </div>
              <div className="receipt-calc-row">
                <span className="calc-lbl">Gratuity (Reserve Fund)</span>
                <span className="calc-val">+₹20.00</span>
              </div>
              <div className="receipt-calc-row">
                <span className="calc-lbl">Tax (GST 5%)</span>
                <span className="calc-val">₹134.85</span>
              </div>
            </div>

            <div className="receipt-solid-divider" />

            {/* Grand Total */}
            <div className="receipt-total-row">
              <span className="total-title">GRAND TOTAL</span>
              <span className="total-amount">₹2851.85</span>
            </div>

            {/* Thank You Note */}
            <div className="receipt-footer-note">
              THANK YOU FOR PARTNERING WITH SENTINEL AI INTELLIGENCE!
            </div>

            {/* Barcode */}
            <div className="receipt-barcode-box">
              <svg className="barcode-svg" viewBox="0 0 280 44" preserveAspectRatio="none">
                {/* Crisp realistic thermal barcode lines */}
                <rect x="0" y="0" width="3" height="44" fill="#111" />
                <rect x="5" y="0" width="2" height="44" fill="#111" />
                <rect x="10" y="0" width="4" height="44" fill="#111" />
                <rect x="17" y="0" width="1" height="44" fill="#111" />
                <rect x="21" y="0" width="3" height="44" fill="#111" />
                <rect x="26" y="0" width="5" height="44" fill="#111" />
                <rect x="34" y="0" width="2" height="44" fill="#111" />
                <rect x="39" y="0" width="3" height="44" fill="#111" />
                <rect x="45" y="0" width="1" height="44" fill="#111" />
                <rect x="49" y="0" width="4" height="44" fill="#111" />
                <rect x="56" y="0" width="2" height="44" fill="#111" />
                <rect x="61" y="0" width="5" height="44" fill="#111" />
                <rect x="69" y="0" width="1" height="44" fill="#111" />
                <rect x="73" y="0" width="3" height="44" fill="#111" />
                <rect x="79" y="0" width="4" height="44" fill="#111" />
                <rect x="86" y="0" width="2" height="44" fill="#111" />
                <rect x="91" y="0" width="5" height="44" fill="#111" />
                <rect x="99" y="0" width="2" height="44" fill="#111" />
                <rect x="104" y="0" width="3" height="44" fill="#111" />
                <rect x="110" y="0" width="1" height="44" fill="#111" />
                <rect x="114" y="0" width="4" height="44" fill="#111" />
                <rect x="121" y="0" width="2" height="44" fill="#111" />
                <rect x="126" y="0" width="5" height="44" fill="#111" />
                <rect x="134" y="0" width="2" height="44" fill="#111" />
                <rect x="139" y="0" width="4" height="44" fill="#111" />
                <rect x="146" y="0" width="1" height="44" fill="#111" />
                <rect x="150" y="0" width="3" height="44" fill="#111" />
                <rect x="156" y="0" width="5" height="44" fill="#111" />
                <rect x="164" y="0" width="2" height="44" fill="#111" />
                <rect x="169" y="0" width="4" height="44" fill="#111" />
                <rect x="176" y="0" width="2" height="44" fill="#111" />
                <rect x="181" y="0" width="5" height="44" fill="#111" />
                <rect x="189" y="0" width="1" height="44" fill="#111" />
                <rect x="193" y="0" width="4" height="44" fill="#111" />
                <rect x="200" y="0" width="2" height="44" fill="#111" />
                <rect x="205" y="0" width="5" height="44" fill="#111" />
                <rect x="213" y="0" width="2" height="44" fill="#111" />
                <rect x="218" y="0" width="3" height="44" fill="#111" />
                <rect x="224" y="0" width="1" height="44" fill="#111" />
                <rect x="228" y="0" width="4" height="44" fill="#111" />
                <rect x="235" y="0" width="2" height="44" fill="#111" />
                <rect x="240" y="0" width="5" height="44" fill="#111" />
                <rect x="248" y="0" width="2" height="44" fill="#111" />
                <rect x="253" y="0" width="4" height="44" fill="#111" />
                <rect x="260" y="0" width="1" height="44" fill="#111" />
                <rect x="264" y="0" width="4" height="44" fill="#111" />
                <rect x="271" y="0" width="3" height="44" fill="#111" />
                <rect x="277" y="0" width="3" height="44" fill="#111" />
              </svg>
              <div className="receipt-tracking-code">TXN-7451188122-8M</div>
            </div>

            {/* Jagged Sawtooth Perforated Torn Bottom Edge */}
            <div className="receipt-zigzag-bottom" />
          </div>
        </div>
      </div>

      {/* Dynamic Status Label matching reference image */}
      <div className="receipt-status-section">
        <div className="receipt-status-headline">
          {printState === 'printing'
            ? 'Printing Telemetry Slip...'
            : printState === 'torn'
            ? 'Receipt Cut & Torn'
            : 'Payment & Audit Successful'}
        </div>
        <div className="receipt-status-sub">
          {printState === 'printing'
            ? 'Thermal feed active at 180mm/sec.'
            : printState === 'torn'
            ? 'Ready to print a fresh copy anytime.'
            : "You're all set—now let the receipt roll!"}
        </div>
      </div>

      {/* Interactive Action Control Buttons matching screenshot */}
      <div className="receipt-buttons-bar">
        <button
          onClick={handlePrint}
          disabled={printState === 'printing'}
          className="receipt-btn btn-print"
        >
          <span className="btn-icon">🖨️</span>
          <span>{printState === 'printing' ? 'Printing...' : 'Re-print receipt'}</span>
        </button>

        <button
          onClick={handleTear}
          disabled={printState === 'printing'}
          className={`receipt-btn btn-tear ${printState === 'torn' ? 'btn-active-torn' : ''}`}
        >
          <span className="btn-icon">📄</span>
          <span>{printState === 'torn' ? 'Re-attach receipt' : 'Tear receipt'}</span>
        </button>

        <button
          onClick={handleCopy}
          className="receipt-btn btn-copy"
        >
          <span className="btn-icon">{copied ? '✓' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Sound toggle & quick navigation */}
      <div className="receipt-micro-actions">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="sound-toggle-btn"
          title="Toggle printer sound effects"
        >
          {audioEnabled ? '🔊 Sound On' : '🔇 Sound Muted'}
        </button>
        {onNavigate && (
          <button
            onClick={() => onNavigate('dispute')}
            className="deep-dive-link"
          >
            Explore Full Dispute Intelligence →
          </button>
        )}
      </div>

      <style>{`
        .receipt-print-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 32px 16px 28px 16px;
          background: radial-gradient(circle at 50% 10%, rgba(26, 31, 44, 0.6) 0%, rgba(13, 16, 23, 0.95) 75%);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
        }

        .receipt-print-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 180px;
          background: radial-gradient(circle, rgba(91, 140, 255, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Top Hero Header */
        .receipt-header-hero {
          text-align: center;
          margin-bottom: 26px;
          z-index: 2;
        }

        .receipt-hero-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .receipt-hero-title span {
          color: #3b82f6;
          background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .receipt-hero-subtitle {
          font-size: 13px;
          color: var(--text-2);
          margin-top: 4px;
          font-weight: 500;
        }

        /* Printer Stage */
        .printer-stage-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 3;
        }

        /* 3D Curved Dark Metallic Printer Slot */
        .printer-device-slot {
          width: 320px;
          height: 38px;
          background: linear-gradient(180deg, #2a3140 0%, #151821 50%, #0c0e14 100%);
          border-radius: 20px;
          position: relative;
          z-index: 10;
          box-shadow: 
            0 12px 28px rgba(0, 0, 0, 0.7),
            0 2px 4px rgba(255, 255, 255, 0.1) inset,
            0 -2px 6px rgba(0, 0, 0, 0.8) inset;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .printer-slit-hole {
          width: 270px;
          height: 6px;
          background: #020305;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.9) inset;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .printer-led {
          position: absolute;
          left: 18px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .led-ready {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .led-pulsing {
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          animation: ledBlink 0.3s infinite alternate;
        }

        @keyframes ledBlink {
          from { opacity: 0.3; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1.2); }
        }

        .printer-hardware-label {
          position: absolute;
          bottom: -15px;
          font-size: 7.5px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.22);
          text-transform: uppercase;
          pointer-events: none;
        }

        /* Paper Motion Track */
        .paper-motion-track {
          width: 280px;
          position: relative;
          margin-top: -12px;
          z-index: 5;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }

        /* Printing drop animation: slides out from the printer slot */
        .paper-motion-track.is-printing {
          animation: printSlideDown 2.0s cubic-bezier(0.12, 0.9, 0.25, 1) forwards;
          transform-origin: top center;
        }

        @keyframes printSlideDown {
          0% {
            clip-path: inset(0 0 95% 0);
            transform: translateY(-80px) scaleY(0.4);
            opacity: 0.7;
          }
          30% {
            clip-path: inset(0 0 60% 0);
            transform: translateY(-30px) scaleY(0.75);
          }
          65% {
            clip-path: inset(0 0 20% 0);
            transform: translateY(-6px) scaleY(0.95);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
        }

        .paper-motion-track.is-torn {
          transform: translateY(22px) rotate(-1.5deg);
          filter: drop-shadow(0 25px 35px rgba(0, 0, 0, 0.6));
        }

        /* Thermal Receipt Paper */
        .thermal-receipt-paper {
          background: #fbfbfd;
          color: #171c26;
          border-radius: 4px 4px 0 0;
          padding: 24px 20px 28px 20px;
          box-shadow: 
            0 18px 45px rgba(0, 0, 0, 0.45),
            0 4px 12px rgba(0, 0, 0, 0.15),
            inset 0 0 40px rgba(0, 0, 0, 0.02);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: text;
        }

        .paper-top-slot-shadow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 14px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Brand Row */
        .receipt-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          margin-top: 4px;
        }

        .receipt-logo-glyph {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: #1d4ed8;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
        }

        .receipt-brand-name {
          font-size: 11.5px;
          font-weight: 900;
          color: #111827;
          letter-spacing: 0.4px;
          font-family: var(--font-mono);
        }

        .receipt-sub-tag {
          font-size: 8px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        /* Meta Grid */
        .receipt-meta-grid {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9.5px;
          font-family: var(--font-mono);
          padding: 6px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 12px;
          color: #475569;
        }

        .receipt-lbl {
          font-weight: 800;
          margin-right: 4px;
          color: #1e293b;
        }

        .receipt-val {
          font-weight: 600;
        }

        /* Big Headline & Stamp */
        .receipt-headline-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          margin-bottom: 10px;
        }

        .receipt-grand-headline {
          font-size: 25px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .receipt-headline-sub {
          font-size: 8.5px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-top: 2px;
          font-family: var(--font-mono);
        }

        /* Slanted Red Stamp */
        .receipt-stamp-paid {
          border: 2px dashed #ef4444;
          padding: 3px 6px;
          border-radius: 4px;
          transform: rotate(10deg);
          background: rgba(239, 68, 68, 0.05);
          box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15);
        }

        .stamp-inner {
          text-align: center;
        }

        .stamp-word {
          font-size: 11px;
          font-weight: 900;
          color: #dc2626;
          letter-spacing: 1.5px;
          line-height: 1;
          font-family: var(--font-display);
        }

        .stamp-date {
          font-size: 6.5px;
          font-weight: 800;
          color: #dc2626;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        /* Dividers */
        .receipt-dashed-divider {
          border-bottom: 1.5px dashed #cbd5e1;
          margin: 10px 0;
        }

        .receipt-solid-divider {
          border-bottom: 1.5px solid #0f172a;
          margin: 10px 0 8px 0;
        }

        /* Item List */
        .receipt-item-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .receipt-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9.5px;
          font-family: var(--font-mono);
        }

        .receipt-item-desc {
          color: #334155;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 170px;
        }

        .receipt-qty {
          font-weight: 800;
          color: #0f172a;
          margin-right: 2px;
        }

        .receipt-item-amount {
          font-weight: 700;
          color: #0f172a;
          text-align: right;
        }

        /* Calculation Table */
        .receipt-calc-table {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .receipt-calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 9.5px;
          color: #475569;
          font-family: var(--font-mono);
        }

        .calc-lbl {
          font-weight: 600;
        }

        .calc-val {
          font-weight: 700;
          color: #1e293b;
        }

        .discount-row {
          color: #dc2626;
        }

        .discount-row .calc-val {
          color: #dc2626;
        }

        /* Grand Total */
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2px;
          margin-bottom: 10px;
        }

        .total-title {
          font-size: 11.5px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.5px;
          font-family: var(--font-mono);
        }

        .total-amount {
          font-size: 13.5px;
          font-weight: 900;
          color: #0f172a;
          font-family: var(--font-mono);
        }

        /* Footer Note */
        .receipt-footer-note {
          font-size: 7.5px;
          font-weight: 800;
          color: #64748b;
          text-align: center;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-family: var(--font-mono);
        }

        /* Barcode */
        .receipt-barcode-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2px 0 6px 0;
        }

        .barcode-svg {
          width: 100%;
          height: 34px;
        }

        .receipt-tracking-code {
          font-size: 8px;
          font-family: var(--font-mono);
          letter-spacing: 2px;
          font-weight: 700;
          color: #334155;
          margin-top: 3px;
        }

        /* Sawtooth Zigzag Perforated Torn Bottom */
        .receipt-zigzag-bottom {
          position: absolute;
          bottom: -10px;
          left: 0;
          right: 0;
          height: 10px;
          background: #fbfbfd;
          clip-path: polygon(
            0% 0%, 
            2.5% 100%, 5% 0%, 7.5% 100%, 10% 0%, 12.5% 100%, 15% 0%, 17.5% 100%, 20% 0%, 
            22.5% 100%, 25% 0%, 27.5% 100%, 30% 0%, 32.5% 100%, 35% 0%, 37.5% 100%, 40% 0%, 
            42.5% 100%, 45% 0%, 47.5% 100%, 50% 0%, 52.5% 100%, 55% 0%, 57.5% 100%, 60% 0%, 
            62.5% 100%, 65% 0%, 67.5% 100%, 70% 0%, 72.5% 100%, 75% 0%, 77.5% 100%, 80% 0%, 
            82.5% 100%, 85% 0%, 87.5% 100%, 90% 0%, 92.5% 100%, 95% 0%, 97.5% 100%, 100% 0%
          );
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
        }

        /* Dynamic Status Section below paper */
        .receipt-status-section {
          text-align: center;
          margin-top: 26px;
          margin-bottom: 16px;
          z-index: 2;
        }

        .receipt-status-headline {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
        }

        .receipt-status-sub {
          font-size: 12.5px;
          color: var(--text-2);
          margin-top: 3px;
        }

        /* Action Buttons Row */
        .receipt-buttons-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          z-index: 2;
          flex-wrap: wrap;
        }

        .receipt-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .btn-print {
          background: #faf8f5;
          color: #171c26;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .btn-print:hover:not(:disabled) {
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
        }

        .btn-print:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-tear {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px dashed rgba(255, 255, 255, 0.25);
        }

        .btn-tear:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
        }

        .btn-active-torn {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          color: #fca5a5;
        }

        .btn-copy {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .btn-copy:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .btn-icon {
          font-size: 14px;
        }

        /* Micro Actions */
        .receipt-micro-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
          font-size: 11px;
          z-index: 2;
        }

        .sound-toggle-btn {
          background: transparent;
          border: none;
          color: var(--text-2);
          cursor: pointer;
          font-size: 11px;
          transition: color 0.15s;
        }

        .sound-toggle-btn:hover {
          color: #ffffff;
        }

        .deep-dive-link {
          background: transparent;
          border: none;
          color: var(--accent);
          cursor: pointer;
          font-weight: 700;
          font-size: 11px;
          transition: opacity 0.15s;
        }

        .deep-dive-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
