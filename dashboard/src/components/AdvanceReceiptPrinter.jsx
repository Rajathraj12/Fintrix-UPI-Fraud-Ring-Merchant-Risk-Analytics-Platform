import React, { useState, useEffect, useRef } from 'react';

/**
 * AdvanceReceiptPrinter Component
 * 
 * A skeuomorphic thermal receipt printer web component featuring:
 * 1. Dark-mode card container with "Order complete" / "Audit complete" checkmark header.
 * 2. Narrow printer slit mouth with `overflow: hidden`.
 * 3. Stepped mechanical feed animation mimicking authentic thermal POS printers.
 * 4. Crisp white receipt paper with jagged torn thermal paper edges.
 * 5. Full TransOrg Sentinel AI Datathon project summary details.
 * 6. Interactive Re-print, Tear, and Copy actions with sound effects.
 */
export default function AdvanceReceiptPrinter({ data = {}, onNavigate }) {
  const [printState, setPrintState] = useState('printing'); // 'printing' | 'printed' | 'torn'
  const [copied, setCopied] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  // Synthesize realistic thermal printer stepper motor sound
  const playPrinterSound = () => {
    if (!audioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      // 5 stepped motor feed pulses
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160 + (i % 2) * 40, now + i * 0.36);
        gain.gain.setValueAtTime(0.035, now + i * 0.36);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.36 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.36);
        osc.stop(now + i * 0.36 + 0.23);
      }
    } catch {
      // Audio fallback
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

      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio fallback
    }
  };

  // Trigger stepped print animation
  const handlePrint = () => {
    setPrintState('printing');
    playPrinterSound();
    setTimeout(() => {
      setPrintState('printed');
    }, 2200);
  };

  // Toggle receipt tear
  const handleTear = () => {
    if (printState === 'torn') {
      setPrintState('printed');
    } else {
      setPrintState('torn');
      playTearSound();
    }
  };

  // Copy plain text summary to clipboard
  const handleCopy = () => {
    const summary = `
========================================
     SENTINEL INTELLIGENCE ENGINE
  TRANSORG AGENTIQ DATATHON SUMMARY
========================================
Status:       Order Complete ✓
Tracking:     TXN-7451188122-8M
Date:         14 Sep 2026 | 20:45 UTC
Terminal:     POS-SENTINEL-9942
----------------------------------------
PROJECT DELIVERABLES & METRICS:
• Dataset Scope:      2,800 Verified Records
• Financial Volume:   ₹24.85 Cr Processed
• Dispute Intake:     2,800 Cases Analyzed
  - OPEN:             1,492 (53.3%)
  - CLOSED:           865   (30.9%)
  - REJECTED:         443   (15.8%)
• Top Intake Channel: IVR (709) | Bot (698)
• Risk Mitigation:    ₹4.12 Cr Intercepted
• Fraud Prevented:    +₹1.85 Cr Loss Saved
• Identity Pass Rate: 94.2% KYC Verified
----------------------------------------
SUBTOTAL AUDITED:     ₹2,797.00
DISPUTE SHIELD:       -₹100.00
RESERVE FUND:         +₹20.00
TAX (GST 5%):         ₹134.85
----------------------------------------
GRAND TOTAL:          ₹2,851.85
STATUS:               AUDITED & COMPLIANT
========================================
  TRANSORG AGENTIQ DATATHON 2026
`;
    navigator.clipboard.writeText(summary.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  // Auto-play print animation on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="receipt-side-container">
      {/* Dark-Mode Card Container */}
      <div className="receipt-dark-card">
        {/* Top Status: Order Complete with Checkmark Icon */}
        <div className="order-complete-header">
          <div className="status-badge-row">
            <div className="status-check-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="status-title-text">Order complete</div>
              <div className="status-sub-text">Audit slip generated automatically</div>
            </div>
          </div>
          <div className="live-pulse-indicator" title="Live Terminal Feed">
            <span className="pulse-dot" />
            <span>LIVE POS</span>
          </div>
        </div>

        {/* Physical Printer Slot Container */}
        <div className="printer-assembly">
          {/* Printer Bezel / Mouth Bar */}
          <div className="printer-slot-bezel">
            <div className={`printer-status-led ${printState === 'printing' ? 'led-active' : 'led-ready'}`} />
            <div className="printer-slit-opening" />
            <div className="printer-brand-emboss">SENTINEL POS-80 THERMAL FEED</div>
          </div>

          {/* Narrow Slit with overflow:hidden acting as the physical mouth */}
          <div className="printer-mouth-window">
            {/* The Receipt Component moving downwards */}
            <div className={`receipt-feed-carriage ${printState === 'printing' ? 'stepped-printing' : ''} ${printState === 'torn' ? 'torn-detached' : ''}`}>
              <div className="thermal-paper-slip">
                
                {/* Jagged / Dashed Top Border mimicking torn thermal paper */}
                <div className="jagged-top-perforation" />

                {/* Receipt Header & Logo */}
                <div className="slip-header-brand">
                  <div className="slip-brand-left">
                    <div className="slip-logo-glyph">✦</div>
                    <div>
                      <div className="slip-brand-title">BIZY MEDIA AGENCY</div>
                      <div className="slip-brand-subtitle">DIGITAL SERVICES RECEIPT</div>
                    </div>
                  </div>
                  {/* Brand Mark Icon */}
                  <div className="slip-brand-mark">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M5 4H14C16.2091 4 18 5.79086 18 8C18 10.2091 16.2091 12 14 12H5V4Z" fill="#2563eb" />
                      <path d="M5 12H15C17.2091 12 19 13.7909 19 16C19 18.2091 17.2091 20 15 20H5V12Z" fill="#1d4ed8" />
                    </svg>
                  </div>
                </div>

                {/* Client Metadata */}
                <div className="slip-meta-table">
                  <div>
                    <span className="slip-lbl">CLIENT:</span>
                    <span className="slip-val">USMAN SHAMS</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="slip-lbl">Visa</span>
                    <span className="slip-val">•••• 4242</span>
                  </div>
                </div>

                {/* Headline Total & Slanted Stamp */}
                <div className="slip-headline-section">
                  <div>
                    <div className="slip-big-amount">£2851.85</div>
                    <div className="slip-invoice-date">10TH AUGUST 2026 | INVOICE PAID</div>
                  </div>

                  {/* Red Tilted PAID Stamp */}
                  <div className="slip-stamp-paid">
                    <div className="stamp-title">PAID</div>
                    <div className="stamp-sub">30 AUG 2026</div>
                  </div>
                </div>

                <div className="slip-dotted-line" />

                {/* Project Breakdown Content Details */}
                <div className="slip-line-items">
                  <div className="slip-item-row">
                    <span className="slip-item-desc">1X Web Development & Design</span>
                    <span className="slip-item-price">£1499.00</span>
                  </div>
                  <div className="slip-item-row">
                    <span className="slip-item-desc">1X SEO Optimization (Monthly)</span>
                    <span className="slip-item-price">£499.00</span>
                  </div>
                  <div className="slip-item-row">
                    <span className="slip-item-desc">1X Digital Marketing & Branding</span>
                    <span className="slip-item-price">£799.00</span>
                  </div>
                </div>

                <div className="slip-dotted-line" />

                {/* Subtotals & Taxes */}
                <div className="slip-totals-table">
                  <div className="slip-calc-line">
                    <span>Subtotal</span>
                    <span>£2797.00</span>
                  </div>
                  <div className="slip-calc-line slip-discount-line">
                    <span>Discount (Promo)</span>
                    <span>-£100.00</span>
                  </div>
                  <div className="slip-calc-line">
                    <span>Gratuity (Tip)</span>
                    <span>+£20.00</span>
                  </div>
                  <div className="slip-calc-line">
                    <span>Tax (5%)</span>
                    <span>£134.85</span>
                  </div>
                </div>

                <div className="slip-solid-line" />

                {/* Grand Total */}
                <div className="slip-grand-total-row">
                  <span className="grand-lbl">GRAND TOTAL</span>
                  <span className="grand-val">£2851.85</span>
                </div>

                {/* Thank you text */}
                <div className="slip-thankyou-note">
                  THANK YOU FOR PARTNERING WITH BIZY MEDIA!
                </div>

                {/* Thermal Barcode */}
                <div className="slip-barcode-area">
                  <svg className="thermal-barcode-svg" viewBox="0 0 240 38" preserveAspectRatio="none">
                    <rect x="0" y="0" width="3" height="38" fill="#111" />
                    <rect x="5" y="0" width="2" height="38" fill="#111" />
                    <rect x="9" y="0" width="4" height="38" fill="#111" />
                    <rect x="15" y="0" width="1" height="38" fill="#111" />
                    <rect x="19" y="0" width="3" height="38" fill="#111" />
                    <rect x="24" y="0" width="5" height="38" fill="#111" />
                    <rect x="31" y="0" width="2" height="38" fill="#111" />
                    <rect x="35" y="0" width="3" height="38" fill="#111" />
                    <rect x="41" y="0" width="1" height="38" fill="#111" />
                    <rect x="45" y="0" width="4" height="38" fill="#111" />
                    <rect x="51" y="0" width="2" height="38" fill="#111" />
                    <rect x="56" y="0" width="5" height="38" fill="#111" />
                    <rect x="63" y="0" width="1" height="38" fill="#111" />
                    <rect x="67" y="0" width="3" height="38" fill="#111" />
                    <rect x="73" y="0" width="4" height="38" fill="#111" />
                    <rect x="79" y="0" width="2" height="38" fill="#111" />
                    <rect x="84" y="0" width="5" height="38" fill="#111" />
                    <rect x="91" y="0" width="2" height="38" fill="#111" />
                    <rect x="95" y="0" width="3" height="38" fill="#111" />
                    <rect x="100" y="0" width="1" height="38" fill="#111" />
                    <rect x="104" y="0" width="4" height="38" fill="#111" />
                    <rect x="111" y="0" width="2" height="38" fill="#111" />
                    <rect x="115" y="0" width="5" height="38" fill="#111" />
                    <rect x="123" y="0" width="2" height="38" fill="#111" />
                    <rect x="127" y="0" width="4" height="38" fill="#111" />
                    <rect x="134" y="0" width="1" height="38" fill="#111" />
                    <rect x="138" y="0" width="3" height="38" fill="#111" />
                    <rect x="143" y="0" width="5" height="38" fill="#111" />
                    <rect x="151" y="0" width="2" height="38" fill="#111" />
                    <rect x="155" y="0" width="4" height="38" fill="#111" />
                    <rect x="162" y="0" width="2" height="38" fill="#111" />
                    <rect x="167" y="0" width="5" height="38" fill="#111" />
                    <rect x="174" y="0" width="1" height="38" fill="#111" />
                    <rect x="178" y="0" width="4" height="38" fill="#111" />
                    <rect x="185" y="0" width="2" height="38" fill="#111" />
                    <rect x="190" y="0" width="5" height="38" fill="#111" />
                    <rect x="197" y="0" width="2" height="38" fill="#111" />
                    <rect x="201" y="0" width="3" height="38" fill="#111" />
                    <rect x="207" y="0" width="1" height="38" fill="#111" />
                    <rect x="211" y="0" width="4" height="38" fill="#111" />
                    <rect x="217" y="0" width="2" height="38" fill="#111" />
                    <rect x="222" y="0" width="5" height="38" fill="#111" />
                    <rect x="230" y="0" width="2" height="38" fill="#111" />
                    <rect x="235" y="0" width="4" height="38" fill="#111" />
                  </svg>
                  <div className="slip-barcode-text">TXN-7451188122-8M</div>
                </div>

                {/* Jagged Bottom Perforation */}
                <div className="jagged-bottom-perforation" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Section below receipt */}
        <div className="slip-status-footer">
          <div className="status-footer-headline">
            {printState === 'printing'
              ? 'Printing receipt...'
              : printState === 'torn'
              ? 'Receipt Cut & Torn'
              : 'Payment Successful'}
          </div>
          <div className="status-footer-sub">
            {printState === 'printing'
              ? 'Mechanical thermal feed in progress.'
              : printState === 'torn'
              ? 'Ready to print a fresh copy anytime.'
              : "You're all set—now let the receipt roll!"}
          </div>
        </div>

        {/* Responsive Control Buttons */}
        <div className="slip-action-buttons">
          <button
            onClick={handlePrint}
            disabled={printState === 'printing'}
            className="action-btn-print"
          >
            <span className="btn-icon-symbol">🖨️</span>
            <span>{printState === 'printing' ? 'Printing...' : 'Re-print receipt'}</span>
          </button>

          <button
            onClick={handleTear}
            disabled={printState === 'printing'}
            className={`action-btn-tear ${printState === 'torn' ? 'btn-torn-active' : ''}`}
          >
            <span className="btn-icon-symbol">📄</span>
            <span>{printState === 'torn' ? 'Attach receipt' : 'Tear receipt'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="action-btn-copy"
          >
            <span className="btn-icon-symbol">{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Secondary controls */}
        <div className="slip-micro-toggles">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="micro-audio-toggle"
          >
            {audioEnabled ? '🔊 Sound On' : '🔇 Muted'}
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('dispute')}
              className="micro-link-nav"
            >
              Dispute Analytics →
            </button>
          )}
        </div>
      </div>

      <style>{`
        .receipt-side-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        /* Dark-Mode Card Container */
        .receipt-dark-card {
          width: 100%;
          max-width: 360px;
          background: #11141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px 18px 18px 18px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          user-select: none;
        }

        /* Top Order Complete Header */
        .order-complete-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          margin-bottom: 16px;
        }

        .status-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-check-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.15);
          border: 1.5px solid #10b981;
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.3);
        }

        .status-title-text {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.2px;
        }

        .status-sub-text {
          font-size: 11px;
          color: var(--text-2);
          margin-top: 1px;
        }

        .live-pulse-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9.5px;
          font-weight: 800;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 2px 7px;
          border-radius: var(--radius-pill);
          border: 1px solid rgba(180, 243, 41, 0.3);
        }

        .pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        /* Printer Hardware Slot */
        .printer-assembly {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .printer-slot-bezel {
          width: 290px;
          height: 34px;
          background: linear-gradient(180deg, #2b3140 0%, #161a22 55%, #0d0f15 100%);
          border-radius: 18px;
          position: relative;
          z-index: 10;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6), inset 0 1.5px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 6px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .printer-slit-opening {
          width: 245px;
          height: 5px;
          background: #000000;
          border-radius: 3px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .printer-status-led {
          position: absolute;
          left: 14px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .led-ready {
          background: #10b981;
          box-shadow: 0 0 7px #10b981;
        }

        .led-active {
          background: var(--accent);
          box-shadow: 0 0 9px var(--accent);
          animation: ledBlink 0.3s infinite alternate;
        }

        .printer-brand-emboss {
          position: absolute;
          bottom: -13px;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: rgba(255, 255, 255, 0.22);
          pointer-events: none;
        }

        /* Narrow Slit Container with overflow:hidden */
        .printer-mouth-window {
          width: 260px;
          position: relative;
          margin-top: -10px;
          z-index: 5;
          overflow: visible;
        }

        /* Stepped mechanical feed animation */
        .receipt-feed-carriage {
          width: 100%;
          transform-origin: top center;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .receipt-feed-carriage.stepped-printing {
          animation: mechanicalPrintSteps 2.1s cubic-bezier(0.1, 0.85, 0.25, 1) forwards;
        }

        /* Stepped / mechanical feeder keyframe curve */
        @keyframes mechanicalPrintSteps {
          0% {
            clip-path: inset(0 0 95% 0);
            transform: translateY(-90px) scaleY(0.4);
            opacity: 0.6;
          }
          20% {
            clip-path: inset(0 0 75% 0);
            transform: translateY(-60px) scaleY(0.65);
          }
          45% {
            clip-path: inset(0 0 50% 0);
            transform: translateY(-35px) scaleY(0.82);
          }
          70% {
            clip-path: inset(0 0 25% 0);
            transform: translateY(-12px) scaleY(0.94);
          }
          88% {
            clip-path: inset(0 0 5% 0);
            transform: translateY(-2px) scaleY(0.99);
          }
          100% {
            clip-path: inset(0 0 0 0);
            transform: translateY(0) scaleY(1);
            opacity: 1;
          }
        }

        .receipt-feed-carriage.torn-detached {
          transform: translateY(18px) rotate(-1.5deg);
          filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.7));
        }

        /* Crisp White Thermal Paper Slip */
        .thermal-paper-slip {
          background: #fafafc;
          color: #171c26;
          border-radius: 4px 4px 0 0;
          padding: 20px 16px 24px 16px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.15);
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: text;
        }

        /* Jagged / Dashed Top Perforation */
        .jagged-top-perforation {
          position: absolute;
          top: -6px;
          left: 0;
          right: 0;
          height: 6px;
          background: #fafafc;
          clip-path: polygon(
            0% 100%, 3.33% 0%, 6.66% 100%, 10% 0%, 13.33% 100%, 16.66% 0%, 20% 100%, 23.33% 0%, 26.66% 100%, 30% 0%, 
            33.33% 100%, 36.66% 0%, 40% 100%, 43.33% 0%, 46.66% 100%, 50% 0%, 53.33% 100%, 56.66% 0%, 60% 100%, 63.33% 0%, 
            66.66% 100%, 70% 0%, 73.33% 100%, 76.66% 0%, 80% 100%, 83.33% 0%, 86.66% 100%, 90% 0%, 93.33% 100%, 96.66% 0%, 100% 100%
          );
        }

        /* Header Brand */
        .slip-header-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          margin-top: 2px;
        }

        .slip-brand-left {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .slip-logo-glyph {
          width: 22px;
          height: 22px;
          border-radius: 5px;
          background: #1e293b;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
        }

        .slip-brand-title {
          font-size: 11px;
          font-weight: 900;
          color: #111827;
          letter-spacing: 0.3px;
          font-family: var(--font-mono);
        }

        .slip-brand-subtitle {
          font-size: 7.5px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        /* Client Meta */
        .slip-meta-table {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          font-family: var(--font-mono);
          padding: 5px 0;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 10px;
          color: #475569;
        }

        .slip-lbl {
          font-weight: 800;
          margin-right: 4px;
          color: #1e293b;
        }

        .slip-val {
          font-weight: 600;
        }

        /* Headline & Stamp */
        .slip-headline-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .slip-big-amount {
          font-size: 23px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .slip-invoice-date {
          font-size: 8px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-top: 2px;
          font-family: var(--font-mono);
        }

        .slip-stamp-paid {
          border: 2px dashed #dc2626;
          padding: 2px 5px;
          border-radius: 4px;
          transform: rotate(10deg);
          background: rgba(220, 38, 38, 0.05);
          text-align: center;
        }

        .stamp-title {
          font-size: 10px;
          font-weight: 900;
          color: #dc2626;
          letter-spacing: 1.5px;
          line-height: 1;
        }

        .stamp-sub {
          font-size: 6.5px;
          font-weight: 800;
          color: #dc2626;
          margin-top: 2px;
        }

        /* Lines */
        .slip-dotted-line {
          border-bottom: 1.5px dashed #cbd5e1;
          margin: 8px 0;
        }

        .slip-solid-line {
          border-bottom: 1.5px solid #0f172a;
          margin: 8px 0 6px 0;
        }

        /* Line Items */
        .slip-line-items {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .slip-item-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-family: var(--font-mono);
        }

        .slip-item-desc {
          color: #334155;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 155px;
        }

        .slip-item-price {
          font-weight: 700;
          color: #0f172a;
        }

        /* Totals */
        .slip-totals-table {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .slip-calc-line {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #475569;
          font-family: var(--font-mono);
        }

        .slip-discount-line {
          color: #dc2626;
        }

        .slip-grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2px;
          margin-bottom: 8px;
        }

        .grand-lbl {
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.4px;
          font-family: var(--font-mono);
        }

        .grand-val {
          font-size: 13px;
          font-weight: 900;
          color: #0f172a;
          font-family: var(--font-mono);
        }

        .slip-thankyou-note {
          font-size: 7px;
          font-weight: 800;
          color: #64748b;
          text-align: center;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
          font-family: var(--font-mono);
        }

        /* Barcode */
        .slip-barcode-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2px 0 4px 0;
        }

        .thermal-barcode-svg {
          width: 100%;
          height: 30px;
        }

        .slip-barcode-text {
          font-size: 7.5px;
          font-family: var(--font-mono);
          letter-spacing: 2px;
          font-weight: 700;
          color: #334155;
          margin-top: 2px;
        }

        /* Jagged Bottom Perforation */
        .jagged-bottom-perforation {
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 8px;
          background: #fafafc;
          clip-path: polygon(
            0% 0%, 3.33% 100%, 6.66% 0%, 10% 100%, 13.33% 0%, 16.66% 100%, 20% 0%, 23.33% 100%, 26.66% 0%, 30% 100%, 
            33.33% 0%, 36.66% 100%, 40% 0%, 43.33% 100%, 46.66% 0%, 50% 100%, 53.33% 0%, 56.66% 100%, 60% 0%, 63.33% 100%, 
            66.66% 0%, 70% 100%, 73.33% 0%, 76.66% 100%, 80% 0%, 83.33% 100%, 86.66% 0%, 90% 100%, 93.33% 0%, 96.66% 100%, 100% 0%
          );
        }

        /* Footer Status */
        .slip-status-footer {
          text-align: center;
          margin-top: 20px;
          margin-bottom: 12px;
        }

        .status-footer-headline {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
        }

        .status-footer-sub {
          font-size: 11.5px;
          color: var(--text-2);
          margin-top: 2px;
        }

        /* Buttons */
        .slip-action-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          flex-wrap: wrap;
        }

        .action-btn-print {
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

        .action-btn-print:hover:not(:disabled) {
          background: #ffffff;
          transform: translateY(-1.5px);
        }

        .action-btn-print:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .action-btn-tear {
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

        .action-btn-tear:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-torn-active {
          background: rgba(239, 68, 68, 0.15);
          border-color: #ef4444;
          color: #fca5a5;
        }

        .action-btn-copy {
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

        .action-btn-copy:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-icon-symbol {
          font-size: 13px;
        }

        /* Micro Toggles */
        .slip-micro-toggles {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin-top: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 10.5px;
        }

        .micro-audio-toggle {
          background: transparent;
          border: none;
          color: var(--text-2);
          cursor: pointer;
        }

        .micro-audio-toggle:hover {
          color: #ffffff;
        }

        .micro-link-nav {
          background: transparent;
          border: none;
          color: var(--accent);
          font-weight: 700;
          cursor: pointer;
        }

        .micro-link-nav:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
