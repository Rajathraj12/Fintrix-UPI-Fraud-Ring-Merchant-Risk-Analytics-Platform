import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import AdvanceReceiptPrinter from '../components/AdvanceReceiptPrinter';

const fmt = (n) => n >= 1e7 ? `${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(2)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const pct = (n, d) => d === 0 ? '0.0%' : `${((n/d)*100).toFixed(1)}%`;
const fmtINR = (n) => `₹${fmt(n)}`;

// Interactive Time Series Chart with Marked Axes & Lime Styling
const InteractiveTimeSeriesChart = ({ dataPoints }) => {
  const containerRef = useRef(null);
  const [timeRange, setTimeRange] = useState('ALL');
  const [showTxns, setShowTxns] = useState(true);
  const [showCb, setShowCb] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 230 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 600,
          height: 230
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const filteredData = useMemo(() => {
    if (!dataPoints || !dataPoints.length) return [];
    if (timeRange === '14D') return dataPoints.slice(-14);
    if (timeRange === '30D') return dataPoints.slice(-30);
    if (timeRange === '90D') return dataPoints.slice(-90);
    return dataPoints;
  }, [dataPoints, timeRange]);

  const padding = { top: 24, right: 24, bottom: 38, left: 46 };
  const chartW = Math.max(100, dimensions.width - padding.left - padding.right);
  const chartH = Math.max(80, dimensions.height - padding.top - padding.bottom);

  const maxY = useMemo(() => {
    let max = 10;
    filteredData.forEach(d => {
      if (showTxns && d.txns > max) max = d.txns;
      if (showCb && d.cb > max) max = d.cb;
    });
    return Math.ceil((max * 1.15) / 20) * 20 || 100;
  }, [filteredData, showTxns, showCb]);

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxY / steps) * i));
  }, [maxY]);

  const getPathData = (key) => {
    if (!filteredData.length || chartW <= 0) return '';
    const points = filteredData.map((d, i) => {
      const val = d[key] || 0;
      const x = padding.left + (i / Math.max(1, filteredData.length - 1)) * chartW;
      const y = padding.top + chartH - (val / maxY) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getAreaPathData = (key) => {
    if (!filteredData.length || chartW <= 0) return '';
    const points = filteredData.map((d, i) => {
      const val = d[key] || 0;
      const x = padding.left + (i / Math.max(1, filteredData.length - 1)) * chartW;
      const y = padding.top + chartH - (val / maxY) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const firstX = padding.left;
    const lastX = padding.left + chartW;
    const bottomY = padding.top + chartH;
    return `M ${firstX},${bottomY} L ${points.join(' L ')} L ${lastX},${bottomY} Z`;
  };

  const xTicks = useMemo(() => {
    if (!filteredData.length) return [];
    const count = Math.min(7, filteredData.length);
    const step = (filteredData.length - 1) / (count - 1 || 1);
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round(i * step);
      const d = filteredData[idx];
      const x = padding.left + (idx / Math.max(1, filteredData.length - 1)) * chartW;
      let label = d?.date || '';
      if (label.length >= 10) {
        const parts = label.split('-');
        if (parts.length === 3) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mIdx = parseInt(parts[1], 10) - 1;
          label = `${months[mIdx] || parts[1]} ${parts[2]}`;
        }
      }
      return { idx, x, label };
    });
  }, [filteredData, chartW, padding.left]);

  const handleMouseMove = (e) => {
    if (!containerRef.current || !filteredData.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - padding.left;
    const ratio = Math.max(0, Math.min(1, mouseX / chartW));
    const idx = Math.round(ratio * (filteredData.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeHoverItem = hoverIndex !== null && filteredData[hoverIndex] ? filteredData[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? padding.left + (hoverIndex / Math.max(1, filteredData.length - 1)) * chartW : null;
  const hoverTxnY = activeHoverItem ? padding.top + chartH - (activeHoverItem.txns / maxY) * chartH : null;
  const hoverCbY = activeHoverItem ? padding.top + chartH - (activeHoverItem.cb / maxY) * chartH : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Legend Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            onClick={() => setShowTxns(!showTxns)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 600,
              color: showTxns ? '#ffffff' : 'var(--text-2)',
              cursor: 'pointer',
              userSelect: 'none',
              opacity: showTxns ? 1 : 0.4
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} />
            <span>Transactions ({showTxns ? 'On' : 'Off'})</span>
          </div>

          <div
            onClick={() => setShowCb(!showCb)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12,
              fontWeight: 600,
              color: showCb ? '#ffffff' : 'var(--text-2)',
              cursor: 'pointer',
              userSelect: 'none',
              opacity: showCb ? 1 : 0.4
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--red)' }} />
            <span>Chargebacks ({showCb ? 'On' : 'Off'})</span>
          </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
          {[
            { id: 'ALL', label: 'All Dates' },
            { id: '90D', label: '90D' },
            { id: '30D', label: '30D' },
            { id: '14D', label: '14D' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              style={{
                background: timeRange === t.id ? 'var(--accent)' : 'transparent',
                color: timeRange === t.id ? '#000000' : 'var(--text-1)',
                border: 'none',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart with Marked Axes */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: dimensions.height,
          position: 'relative',
          cursor: 'crosshair',
          userSelect: 'none'
        }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{ overflow: 'visible', display: 'block' }}
        >
          <defs>
            <linearGradient id="txnGradientLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="cbGradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--red)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--red)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y-Axis Grid Lines & Tick Labels */}
          {yTicks.map((val, i) => {
            const y = padding.top + chartH - (val / maxY) * chartH;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartW}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray={val === 0 ? '0' : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-2)"
                  fontSize="10px"
                  fontFamily="var(--font-mono)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <text
            x={padding.left}
            y={padding.top - 8}
            textAnchor="start"
            fill="var(--text-2)"
            fontSize="9.5px"
            fontWeight="700"
            letterSpacing="0.5px"
          >
            DAILY VOLUME (COUNT)
          </text>

          {/* X-Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />

          {/* X-Axis Ticks */}
          {xTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={padding.top + chartH}
                x2={tick.x}
                y2={padding.top + chartH + 5}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={padding.top + chartH + 18}
                textAnchor="middle"
                fill="var(--text-2)"
                fontSize="10px"
                fontFamily="var(--font-mono)"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Areas */}
          {showTxns && <path d={getAreaPathData('txns')} fill="url(#txnGradientLime)" />}
          {showCb && <path d={getAreaPathData('cb')} fill="url(#cbGradientRed)" />}

          {/* Lines */}
          {showTxns && (
            <path
              d={getPathData('txns')}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {showCb && (
            <path
              d={getPathData('cb')}
              fill="none"
              stroke="var(--red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && hoverX !== null && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={padding.top + chartH}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {showTxns && hoverTxnY !== null && (
                <circle
                  cx={hoverX}
                  cy={hoverTxnY}
                  r="5"
                  fill="var(--accent)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 8px rgba(180,243,41,0.9))"
                />
              )}
              {showCb && hoverCbY !== null && (
                <circle
                  cx={hoverX}
                  cy={hoverCbY}
                  r="5"
                  fill="var(--red)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 8px rgba(255,82,113,0.9))"
                />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {activeHoverItem && hoverX !== null && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: Math.min(hoverX + 14, dimensions.width - 170),
              background: 'rgba(17, 20, 26, 0.96)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-strong)',
              borderRadius: 12,
              padding: '10px 14px',
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: '0 10px 28px rgba(0,0,0,0.7)',
              minWidth: 160
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-0)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
              📅 {activeHoverItem.date}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-2)' }}>Transactions:</span>
                <span style={{ color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {activeHoverItem.txns}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-2)' }}>Disputes:</span>
                <span style={{ color: 'var(--red)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {activeHoverItem.cb}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 2 }}>
                <span style={{ color: 'var(--text-2)', fontSize: 10 }}>Dispute Rate:</span>
                <span style={{ color: activeHoverItem.rate > 15 ? 'var(--red)' : activeHoverItem.rate > 10 ? 'var(--amber)' : 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {activeHoverItem.rate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Overview({ onNavigate }) {
  const { data } = useData();
  const txns = data.upi || [];
  const cb = data.chargebacks || [];
  const merchants = data.merchants || [];
  const kyc = data.kyc || [];

  const [activeTab, setActiveTab] = useState('unpaid'); // 'all' | 'draft' | 'unpaid'
  const [selectedTxn, setSelectedTxn] = useState(null);

  // KPIs
  const totalTxns = txns.length;
  const totalVol = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const successCount = txns.filter(t => t.status === 'SUCCESS').length;
  const successRate = pct(successCount, totalTxns);
  const totalCb = cb.length;
  const cbRate = pct(totalCb, totalTxns);
  const disputedAmt = cb.reduce((s, c) => s + (c.disputed_amount || 0), 0);
  const activeMerchants = merchants.filter(m => m.merchant_status === 'ACTIVE').length;

  // Daily paired data with dates for interactive chart
  const dailyTimeSeriesData = useMemo(() => {
    const txMap = {};
    const cbMap = {};

    txns.forEach(t => {
      if (t.timestamp) {
        const d = String(t.timestamp).substring(0, 10);
        txMap[d] = (txMap[d] || 0) + 1;
      }
    });

    cb.forEach(c => {
      if (c.reported_timestamp) {
        const d = String(c.reported_timestamp).substring(0, 10);
        cbMap[d] = (cbMap[d] || 0) + 1;
      }
    });

    const allDates = Array.from(new Set([...Object.keys(txMap), ...Object.keys(cbMap)]))
      .filter(d => d.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort();

    return allDates.map(date => {
      const txCount = txMap[date] || 0;
      const cbCount = cbMap[date] || 0;
      const r = txCount > 0 ? (cbCount / txCount) * 100 : 0;
      return {
        date,
        txns: txCount,
        cb: cbCount,
        rate: r
      };
    });
  }, [txns, cb]);

  // Sample transactions list matching the invoice table
  const sampleInvoices = useMemo(() => {
    const avatarList = ['👨‍💼', '👩‍💼', '🧔', '🧑‍🔬', '👱‍♀️', '👨‍💻'];
    const statusTypes = ['Unsent', 'Viewed', 'Overdue', 'Unsent', 'Viewed'];

    return txns.slice(0, 6).map((t, idx) => ({
      id: `#${(400 + idx * 6)}-${String(idx * 11 + 2).padStart(3, '0')}`,
      rawId: t.txn_id,
      merchantId: t.merchant_id,
      days: `in ${idx * 4 + 2} days`,
      status: statusTypes[idx % statusTypes.length],
      amount: t.amount || 53154,
      avatar: avatarList[idx % avatarList.length],
      name: `Merchant #${(t.merchant_id || 'M-101').slice(-4)}`,
      customer: `User ${(t.user_id || 'U-902').slice(-4)}`
    }));
  }, [txns]);

  const activeInvoice = selectedTxn || sampleInvoices[2] || sampleInvoices[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Advance Receipt Print Animation: Slide-down thermal audit slip */}
      <AdvanceReceiptPrinter
        data={{ txns, cb, merchants, kyc, totalVol, disputedAmt, activeMerchants }}
        onNavigate={onNavigate}
      />

      {/* 1. Grand Hero KPI Container with Lime Payout Widget & Timeline */}
      <div className="hero-kpi-card">
        {/* Col 1: Overdue / Disputed Amount */}
        <div className="kpi-col">
          <div>
            <div className="kpi-title-small">Disputed & In-Review</div>
            <div className="kpi-big-value">
              {fmtINR(disputedAmt)}
            </div>
          </div>
          <div>
            <div className="kpi-timeline-row">
              <div className="timeline-step">
                <span className="timeline-step-label">Sep</span>
                <div className="timeline-step-bar" />
              </div>
              <div className="timeline-step">
                <span className="timeline-step-label">Oct</span>
                <div className="timeline-step-bar" />
              </div>
              <div className="timeline-step">
                <span className="timeline-step-label" style={{ color: 'var(--accent)' }}>Nov</span>
                <div className="timeline-step-bar active" />
              </div>
              <div className="timeline-step">
                <span className="timeline-step-label">Dec</span>
                <div className="timeline-step-bar" />
              </div>
            </div>
            <div className="avatar-stack">
              <div className="avatar-stack-item">🧑‍💼</div>
              <div className="avatar-stack-item">👩‍💼</div>
              <div className="avatar-stack-item">🧔</div>
              <div className="avatar-stack-item">👩‍🔬</div>
              <div className="avatar-stack-item">+8</div>
            </div>
          </div>
        </div>

        {/* Col 2: Due within next month / Total Volume */}
        <div className="kpi-col">
          <div>
            <div className="kpi-title-small">Processed Volume (30D)</div>
            <div className="kpi-big-value">
              {fmtINR(totalVol)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>Settlement Velocity</div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '78%', height: '100%', background: 'var(--accent)' }} />
            </div>
            <div className="avatar-stack">
              <div className="avatar-stack-item">👨‍💻</div>
              <div className="avatar-stack-item">👱‍♀️</div>
              <div className="avatar-stack-item">🧑‍💼</div>
            </div>
          </div>
        </div>

        {/* Col 3: Average time to get paid / Active Merchants */}
        <div className="kpi-col">
          <div>
            <div className="kpi-title-small">Average Settlement Time</div>
            <div className="kpi-big-value">
              2.4 <span>days</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
              Active Merchants: <b style={{ color: '#fff' }}>{activeMerchants.toLocaleString()}</b>
            </div>
            <div className="avatar-stack">
              <div className="avatar-stack-item">👩‍💼</div>
              <div className="avatar-stack-item">👨‍💼</div>
            </div>
          </div>
        </div>

        {/* Col 4: Highlight Instant Payout Card with Electric Lime Accent */}
        <div className="hero-payout-box">
          <div className="payout-header">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>Available for Instant Payout</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                ₹2,14,390.00
              </div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-2)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
              Auto Payout
            </span>
          </div>

          <div className="payout-pills-row">
            <div className="payout-item-pill">
              <span style={{ fontSize: 9, color: 'var(--text-2)' }}>#4443</span>
              <span>Visa</span>
            </div>
            <div className="payout-item-pill active">
              <span style={{ fontSize: 9 }}>#177210</span>
              <span>UPI Instant</span>
            </div>
            <div className="payout-item-pill">
              <span style={{ fontSize: 9, color: 'var(--text-2)' }}>#711221</span>
              <span>IMPS Net</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('dispute')}
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              padding: '8px 0',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            Pay out now →
          </button>
        </div>
      </div>

      {/* 2. Filter Capsule Bar Row */}
      <div className="filter-capsule-bar">
        <div className="filter-left-group">
          <div className="filter-badge-count">
            Active filters <span>3</span>
          </div>
          <select className="filter-pill-select">
            <option>All Merchants</option>
            <option>High Risk Merchants</option>
            <option>Flagged Accounts</option>
          </select>
          <select className="filter-pill-select">
            <option>All 12 Cities</option>
            <option>Mumbai & Pune</option>
            <option>Delhi NCR</option>
            <option>Bengaluru</option>
          </select>
          <select className="filter-pill-select">
            <option>November 2026</option>
            <option>December 2026</option>
            <option>Full Year 2026</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--text-2)'
          }}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search invoice or txn ID..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 12,
                width: 170
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Interactive Transaction Activity Chart */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
              Daily Transaction Velocity & Disputes
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Interactive timeline with marked axes, hover crosshairs, and live feed telemetry.
            </div>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(180, 243, 41, 0.4)'
          }}>
            ● LIVE FEED
          </span>
        </div>

        <InteractiveTimeSeriesChart dataPoints={dailyTimeSeriesData} />
      </div>

      {/* 4. Bottom Split Layout: High-Contrast Invoices List + Dark Deep-Dive Inspector */}
      <div className="bottom-dual-grid">
        {/* Left Card: High-Contrast Invoices & Merchants Stream */}
        <div className="contrast-card-light">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#000000' }}>
              Unpaid Invoices & Disputes
            </div>
            <div style={{ display: 'flex', background: '#eceef3', padding: 3, borderRadius: 'var(--radius-pill)' }}>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  background: activeTab === 'all' ? '#000000' : 'transparent',
                  color: activeTab === 'all' ? '#ffffff' : '#656f81',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                style={{
                  background: activeTab === 'draft' ? '#000000' : 'transparent',
                  color: activeTab === 'draft' ? '#ffffff' : '#656f81',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Draft 3
              </button>
              <button
                onClick={() => setActiveTab('unpaid')}
                style={{
                  background: activeTab === 'unpaid' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'unpaid' ? '#000000' : '#656f81',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Unpaid 5
              </button>
            </div>
          </div>

          {/* List of Invoices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sampleInvoices.map((inv) => {
              const isSelected = activeInvoice.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedTxn(inv)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isSelected ? '#12161f' : '#f9fafc',
                    color: isSelected ? '#ffffff' : '#0e1117',
                    border: isSelected ? '1.5px solid #000000' : '1px solid #e5e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isSelected ? '#1d222e' : '#e4e7ef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>
                      {inv.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {inv.id}
                      </div>
                      <div style={{ fontSize: 10.5, color: isSelected ? '#9aa3b2' : '#6d7690' }}>
                        {inv.days}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: isSelected ? 'rgba(255,255,255,0.1)' : '#eceef3',
                    color: isSelected ? '#ffffff' : '#4e5767'
                  }}>
                    {inv.status}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {fmtINR(inv.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Dark Deep-Dive Detail Inspector with Lime Action Button */}
        <div className="contrast-card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Invoice Details</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {activeInvoice.id}
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--text-2)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
                  {activeInvoice.status}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Company</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>BlueRock UPI</span>
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>✦</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)' }}>{activeInvoice.name}</div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Customer</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#252a36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                    {activeInvoice.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Maria Jones</div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-2)' }}>CEO BlueRock</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Detail Sub-Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'var(--card-inner)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ₹10,630.80 <span style={{ fontSize: 10, color: 'var(--accent)' }}>↗</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>Concept Development</div>
              </div>

              <div style={{ background: 'var(--card-inner)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ₹31,892.40 <span style={{ fontSize: 10, color: 'var(--accent)' }}>↗</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>CRM Merchant Engine</div>
              </div>

              <div style={{ background: 'var(--card-inner)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ₹10,630.80 <span style={{ fontSize: 10, color: 'var(--accent)' }}>↗</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>API Settlement</div>
              </div>
            </div>
          </div>

          {/* Bottom Total & Payout Action Bar */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase' }}>Sub Total</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {fmtINR(activeInvoice.amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase' }}>Total</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {fmtINR(activeInvoice.amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9.5, color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700 }}>Balance Due</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  {fmtINR(activeInvoice.amount)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-1)',
                cursor: 'pointer'
              }}>
                📄
              </button>
              <button
                onClick={() => onNavigate && onNavigate('map')}
                className="btn-primary-lime"
                style={{ fontSize: 12, padding: '7px 18px' }}
              >
                Pay out now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
