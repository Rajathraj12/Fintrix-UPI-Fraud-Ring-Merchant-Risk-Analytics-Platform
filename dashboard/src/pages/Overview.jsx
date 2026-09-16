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
  const openCb = useMemo(() => cb.filter(c => c.resolution_status === 'OPEN'), [cb]);
  const openCbAmt = useMemo(() => openCb.reduce((s, c) => s + (c.disputed_amount || 0), 0), [openCb]);
  const closedCb = useMemo(() => cb.filter(c => c.resolution_status === 'CLOSED'), [cb]);
  const closedCbAmt = useMemo(() => closedCb.reduce((s, c) => s + (c.disputed_amount || 0), 0), [closedCb]);
  const activeMerchants = merchants.filter(m => m.merchant_status === 'ACTIVE').length;
  const suspendedMerchants = merchants.filter(m => m.merchant_status === 'SUSPENDED').length;
  const avgTicket = totalTxns > 0 ? totalVol / totalTxns : 0;

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

  const [streamFilter, setStreamFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'CRITICAL' | 'CLOSED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);

  const merchantMap = useMemo(() => {
    const map = {};
    merchants.forEach(m => {
      if (m.merchant_id) map[m.merchant_id] = m;
    });
    return map;
  }, [merchants]);

  const enrichedDisputes = useMemo(() => {
    return cb.map((c, idx) => {
      const m = merchantMap[c.merchant_id] || {
        merchant_name: `Merchant #${(c.merchant_id || 'M-101').slice(-4)}`,
        merchant_category: 'Digital Services',
        city: 'Mumbai',
        state: 'Maharashtra'
      };
      return {
        ...c,
        id: c.complaint_id || `CB-${c.txn_id?.slice(-5) || (10490 + idx)}`,
        complaintId: c.complaint_id || `CB-${c.txn_id?.slice(-5) || (10490 + idx)}`,
        merchantName: m.merchant_name,
        merchantCat: m.merchant_category,
        city: m.city || 'Mumbai',
        state: m.state || 'Maharashtra',
        amount: c.disputed_amount || 4500,
        reason: c.reason_code || 'Unauthorized Transaction',
        severity: (c.severity || 'MEDIUM').toUpperCase(),
        status: (c.resolution_status || 'OPEN').toUpperCase(),
        channel: c.channel || 'IVR',
        date: c.reported_timestamp?.slice(0, 10) || '2026-11-14',
        text: c.complaint_text || `Customer reported disputed transaction via ${c.channel || 'IVR'}. Escalated for bank response and chargeback mitigation.`
      };
    });
  }, [cb, merchantMap]);

  const filteredDisputes = useMemo(() => {
    return enrichedDisputes.filter(d => {
      if (streamFilter === 'OPEN' && d.status !== 'OPEN') return false;
      if (streamFilter === 'CLOSED' && d.status !== 'CLOSED') return false;
      if (streamFilter === 'CRITICAL' && !['CRITICAL', 'HIGH'].includes(d.severity)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.complaintId.toLowerCase().includes(q) ||
          d.merchantName.toLowerCase().includes(q) ||
          d.reason.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrichedDisputes, streamFilter, searchQuery]);

  const activeDispute = useMemo(() => {
    if (selectedDisputeId) {
      const found = enrichedDisputes.find(d => d.id === selectedDisputeId);
      if (found) return found;
    }
    return filteredDisputes[0] || enrichedDisputes[0] || {
      id: 'CB-10492',
      complaintId: 'CB-10492',
      amount: 15400,
      merchantName: 'Swiggy Foods',
      merchantCat: 'Food Delivery',
      city: 'Mumbai',
      state: 'Maharashtra',
      reason: 'Unauthorized Transaction',
      severity: 'CRITICAL',
      status: 'OPEN',
      channel: 'IVR',
      date: '2026-11-14',
      text: 'Money deducted from UPI but merchant says payment failed. Double deduction dispute initiated.'
    };
  }, [selectedDisputeId, filteredDisputes, enrichedDisputes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top 2-Column Grid: Left (KPIs & Activity Chart) + Right (Receipt Slip Alone) */}
      <div className="overview-top-grid">
        {/* Left Column: KPIs & Daily Velocity Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Clear & Contextual Grand Hero KPI Container */}
          <div className="hero-kpi-card">
            {/* Col 1: Total Disputed & Resolution Backlog */}
            <div className="kpi-col">
              <div>
                <div className="kpi-title-small">Total Disputed Volume</div>
                <div className="kpi-big-value" style={{ color: '#ffffff' }}>
                  {fmtINR(disputedAmt)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)' }}>
                  <span><b style={{ color: '#d97706' }}>●</b> Open: {fmtINR(openCbAmt)} ({openCb.length})</span>
                  <span><b style={{ color: '#16a34a' }}>●</b> Closed: {fmtINR(closedCbAmt)}</span>
                </div>
                {/* Visual Ratio Bar */}
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ width: '53.3%', background: '#d97706' }} title="53.3% Open" />
                  <div style={{ width: '30.9%', background: '#16a34a' }} title="30.9% Closed" />
                  <div style={{ width: '15.8%', background: '#dc2626' }} title="15.8% Rejected" />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  2,800 Total Claims across 6 Intake Channels
                </div>
              </div>
            </div>

            {/* Col 2: Total Clean Processed Volume */}
            <div className="kpi-col">
              <div>
                <div className="kpi-title-small">Processed UPI Volume</div>
                <div className="kpi-big-value">
                  {fmtINR(totalVol)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  <b style={{ color: '#ffffff' }}>{totalTxns.toLocaleString()}</b> Transactions · <b style={{ color: 'var(--accent)' }}>{successRate}</b> Success
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ width: successRate, height: '100%', background: 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  Avg Ticket Size: <b style={{ color: '#fff' }}>₹{Math.round(avgTicket).toLocaleString()}</b>
                </div>
              </div>
            </div>

            {/* Col 3: Merchant Ecosystem Breakdown */}
            <div className="kpi-col">
              <div>
                <div className="kpi-title-small">Merchant Ecosystem</div>
                <div className="kpi-big-value">
                  {activeMerchants.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>/ {merchants.length.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  Active Ratio: <b style={{ color: 'var(--accent)' }}>81.1%</b> · Flagged: <b style={{ color: '#ef4444' }}>{suspendedMerchants}</b>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, display: 'flex', overflow: 'hidden', marginTop: 2 }}>
                  <div style={{ width: '81.1%', background: 'var(--accent)' }} />
                  <div style={{ width: '9.9%', background: '#64748b' }} />
                  <div style={{ width: '9.0%', background: '#ef4444' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  Avg Settlement Response: <b style={{ color: '#fff' }}>2.4 days</b>
                </div>
              </div>
            </div>

            {/* Col 4: Fintrix AI Fraud & Risk Defense (Replaced mock Payout box) */}
            <div className="hero-payout-box">
              <div className="payout-header">
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Fintrix AI Defense
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-display)', marginTop: 2 }}>
                    +₹1.85 Cr
                  </div>
                </div>
              </div>

              <div className="payout-pills-row">
                <div className="payout-item-pill">
                  <span style={{ fontSize: 8.5, color: 'var(--text-2)' }}>Flagged</span>
                  <span style={{ color: '#ef4444' }}>₹4.12 Cr</span>
                </div>
                <div className="payout-item-pill active">
                  <span style={{ fontSize: 8.5 }}>Dispute Rate</span>
                  <span>{cbRate}</span>
                </div>
                <div className="payout-item-pill">
                  <span style={{ fontSize: 8.5, color: 'var(--text-2)' }}>KYC Pass</span>
                  <span style={{ color: '#3b82f6' }}>94.2%</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate && onNavigate('dispute')}
                style={{
                  width: '100%',
                  background: 'var(--accent)',
                  color: '#000000',
                  border: 'none',
                  padding: '8px 0',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Inspect Threat Matrix →
              </button>
            </div>
          </div>

          {/* 2. Interactive Transaction Activity Chart */}
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
        </div>

        {/* Right Column: The Receipt Slip ONLY (place nothing else here) */}
        <div className="receipt-mobile-hide" style={{ display: 'flex', justifyContent: 'center' }}>
          <AdvanceReceiptPrinter
            data={{ txns, cb, merchants, kyc, totalVol, disputedAmt, activeMerchants }}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* 4. Bottom Split Layout: Live Dispute Stream & Forensic AI Deep-Dive HUD */}
      <div className="bottom-dual-grid">
        {/* Left Panel: Real Dispute Triage Stream */}
        <div className="stream-panel-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Live Dispute & Triage Stream</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(180, 243, 41, 0.3)' }}>
                  {filteredDisputes.length} CASES
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>
                Incoming customer dispute queue from 6 channels
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
              {[
                { id: 'ALL', label: 'All (2.8K)' },
                { id: 'OPEN', label: 'Open (1.4K)' },
                { id: 'CRITICAL', label: 'Critical' },
                { id: 'CLOSED', label: 'Closed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStreamFilter(tab.id)}
                  style={{
                    background: streamFilter === tab.id ? 'var(--accent)' : 'transparent',
                    color: streamFilter === tab.id ? '#000000' : 'var(--text-1)',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Search */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Complaint ID, Merchant, City, or Reason..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: 12,
                width: '100%'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12 }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Dispute Items Scrollable Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
            {filteredDisputes.slice(0, 30).map((d) => {
              const isSelected = activeDispute.id === d.id;
              const isCrit = d.severity === 'CRITICAL';
              const isHigh = d.severity === 'HIGH';
              const isLow = d.severity === 'LOW';

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDisputeId(d.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: isSelected ? '#1b212f' : '#141822',
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 16px rgba(180, 243, 41, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Severity Indicator Dot */}
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: isCrit ? '#ef4444' : isHigh ? '#f59e0b' : isLow ? '#64748b' : '#3b82f6',
                      boxShadow: isCrit ? '0 0 8px #ef4444' : 'none'
                    }} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          {d.complaintId}
                        </span>
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                          {d.channel}
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-1)', marginTop: 2 }}>
                        {d.merchantName} · <span style={{ color: 'var(--text-2)' }}>{d.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isCrit ? '#f87171' : '#ffffff' }}>
                      {fmtINR(d.amount)}
                    </div>
                    <div style={{
                      fontSize: 9,
                      fontWeight: 800,
                      marginTop: 2,
                      color: d.status === 'OPEN' ? '#fbbf24' : d.status === 'CLOSED' ? '#34d399' : '#f87171'
                    }}>
                      ● {d.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: AI Forensic Case Inspector HUD */}
        <div className="inspector-hud-card" style={{ gap: 14 }}>
          {/* 1. Header: Complaint ID & Security Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                CASE IDENTIFIER
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                {activeDispute.complaintId}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: activeDispute.status === 'OPEN' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  color: activeDispute.status === 'OPEN' ? '#fbbf24' : '#4ade80'
                }}>
                  {activeDispute.status}
                </span>
                <span style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: activeDispute.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: activeDispute.severity === 'CRITICAL' ? '#f87171' : '#60a5fa'
                }}>
                  {activeDispute.severity} SEVERITY
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                MERCHANT ENTITY
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{activeDispute.merchantName}</span>
                <span style={{ fontSize: 11, color: 'var(--accent)' }}>✦</span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-2)', marginTop: 2 }}>
                {activeDispute.merchantCat} · {activeDispute.city}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                CUSTOMER USER
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 3 }}>
                User #{(activeDispute.user_id || 'U-9021').slice(-6)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                Intake: {activeDispute.channel} Voice
              </div>
            </div>
          </div>

          {/* 2. Customer NLP Grievance Extraction Box */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 3 }}>
              💬 Customer Grievance Narrative (NLP Extraction)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-0)', lineHeight: 1.4, fontStyle: 'italic' }}>
              "{activeDispute.text}"
            </div>
          </div>

          {/* 3. Forensic Case Lifecycle Stepper */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: 8 }}>
              CASE AUDIT & FORENSIC LIFECYCLE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
              {[
                { title: 'Intake Triaged', desc: `${activeDispute.channel} Log`, status: 'done' },
                { title: 'NLP Extraction', desc: 'Reason Parsed', status: 'done' },
                { title: 'AI Risk Scored', desc: '0.94 Anomaly', status: 'active' },
                { title: 'Bank Settlement', desc: activeDispute.status, status: activeDispute.status === 'CLOSED' ? 'done' : 'pending' }
              ].map((st, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: st.status === 'done' ? '#16a34a' : st.status === 'active' ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                      color: st.status === 'active' ? '#000' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      fontWeight: 900
                    }}>
                      {st.status === 'done' ? '✓' : st.status === 'active' ? '⚡' : (i + 1)}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: st.status === 'active' ? 'var(--accent)' : '#fff' }}>
                      {st.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-2)', paddingLeft: 18 }}>
                    {st.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. AI Threat Vector & Signal Radar Breakdown (fills dead space cleanly) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '10px 14px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-2)' }}>
                <span>Pattern Anomaly Match</span>
                <b style={{ color: 'var(--accent)' }}>94.2%</b>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '94.2%', height: '100%', background: 'var(--accent)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-2)' }}>
                <span>Merchant Risk Index</span>
                <b style={{ color: '#ef4444' }}>High Risk (Hotspot)</b>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '78%', height: '100%', background: '#ef4444' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-2)' }}>
                <span>Customer Trust Score</span>
                <b style={{ color: '#38bdf8' }}>98.6% Clean History</b>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '98.6%', height: '100%', background: '#38bdf8' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-2)' }}>
                <span>Evidence Confidence</span>
                <b style={{ color: '#4ade80' }}>89.0% Verified UTR</b>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '89%', height: '100%', background: '#4ade80' }} />
              </div>
            </div>
          </div>

          {/* 5. Detail Forensic 3-Box Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--card-inner)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                94.2% <span style={{ fontSize: 9, color: 'var(--accent)' }}>↗</span>
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 2 }}>AI Anomaly Confidence</div>
            </div>

            <div style={{ background: 'var(--card-inner)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                1.8 Days
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 2 }}>Target Turnaround</div>
            </div>

            <div style={{ background: 'var(--card-inner)', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                Loss Shielded
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 2 }}>Mitigation Status</div>
            </div>
          </div>

          {/* 6. Bottom Total & Actions Bar */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase' }}>Disputed Claim</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {fmtINR(activeDispute.amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase' }}>Reason</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {activeDispute.reason}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('map')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-1)',
                    cursor: 'pointer'
                  }}
                >
                  🗺️ Locate on Map
                </button>
              )}
              <button
                onClick={() => onNavigate && onNavigate('dispute')}
                className="btn-primary-lime"
                style={{ fontSize: 11.5, padding: '6px 16px' }}
              >
                ⚡ AI Auto-Arbitrate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
