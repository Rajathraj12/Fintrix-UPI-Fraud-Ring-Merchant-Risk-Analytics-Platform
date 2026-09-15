import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import DisputeBubbleField from '../components/DisputeBubbleField';

const fmt = (n) => n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const pct = (n, d) => d === 0 ? '0.0%' : `${((n/d)*100).toFixed(1)}%`;

// Reusable horizontal bar
const HBar = ({ label, value, maxVal, color = '#5b8cff', suffix = '' }) => {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  return (
    <div style={{ 
      marginBottom: 4, 
      cursor: 'pointer', 
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
      position: 'relative',
      height: 28,
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 6,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }} 
    onMouseEnter={(e) => { 
      e.currentTarget.style.transform = 'scale(1.02) translateX(4px)'; 
      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
    }}
    onMouseLeave={(e) => { 
      e.currentTarget.style.transform = 'none'; 
      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
    }}>
      
      {/* Background Fill Track */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}11, ${color}55)`,
        borderRight: `2px solid ${color}`,
        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 0,
        boxShadow: `2px 0 12px ${color}44`
      }} />

      {/* Content Overlay */}
      <div style={{ 
        position: 'relative', zIndex: 1, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        width: '100%', padding: '0 10px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}88` }} />
          <span style={{ fontSize: 10.5, color: '#ffffff', fontWeight: 600, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {label.replace(/_/g, ' ')}
          </span>
        </div>
        <span style={{ fontSize: 12.5, color: '#ffffff', fontFamily: 'var(--font-mono)', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
          {typeof value === 'number' ? (suffix ? `${value.toFixed(1)}${suffix}` : fmt(value)) : value}
        </span>
      </div>
    </div>
  );
};

const DisputeIntel = () => {
  const { data } = useData();
  const cb = data.chargebacks || [];
  const txns = data.upi || [];
  const merchants = data.merchants || [];

  const [severityFilter, setSeverityFilter] = useState('All');

  const filtered = useMemo(() => (
    severityFilter === 'All' ? cb : cb.filter(c => c.severity === severityFilter)
  ), [cb, severityFilter]);

  const severities = useMemo(() => ['All', ...new Set(cb.map(c => c.severity).filter(Boolean))], [cb]);

  // Stats
  const open = filtered.filter(c => c.resolution_status === 'OPEN').length;
  const resolved = filtered.filter(c => c.resolution_status === 'RESOLVED').length;
  const inReview = filtered.filter(c => c.resolution_status === 'IN_REVIEW').length;
  const criticalCount = cb.filter(c => c.severity === 'CRITICAL').length;
  const disputedAmt = filtered.reduce((s, c) => s + c.disputed_amount, 0);

  // Reason breakdown
  const reasonData = useMemo(() => {
    const m = {};
    filtered.forEach(c => { if (c.reason_code) m[c.reason_code] = (m[c.reason_code] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0, 8);
  }, [filtered]);

  const maxReason = reasonData[0]?.[1] || 1;

  // Merchant watchlist — merchants with highest CB rate (min 5 txns)
  const watchlist = useMemo(() => {
    const mCbCount = {};
    cb.forEach(c => { if (c.merchant_id) mCbCount[c.merchant_id] = (mCbCount[c.merchant_id] || 0) + 1; });
    const mTxnCount = {};
    txns.forEach(t => { if (t.merchant_id) mTxnCount[t.merchant_id] = (mTxnCount[t.merchant_id] || 0) + 1; });
    const mInfo = {};
    merchants.forEach(m => { mInfo[m.merchant_id] = { name: m.merchant_name, cat: m.merchant_category, status: m.merchant_status }; });

    return Object.entries(mCbCount)
      .filter(([id]) => (mTxnCount[id] || 0) >= 5)
      .map(([id, cbCt]) => {
        const txnCt = mTxnCount[id] || 1;
        const rate = (cbCt / txnCt) * 100;
        return { id, ...mInfo[id], cbCount: cbCt, txnCount: txnCt, rate };
      })
      .sort((a,b) => b.rate - a.rate)
      .slice(0, 10);
  }, [cb, txns, merchants]);

  // Severity × resolution heatmap
  const heatData = useMemo(() => {
    const sevs = [...new Set(cb.map(c => c.severity).filter(Boolean))];
    const ress = [...new Set(cb.map(c => c.resolution_status).filter(Boolean))];
    const matrix = {};
    cb.forEach(c => {
      const key = `${c.severity}__${c.resolution_status}`;
      matrix[key] = (matrix[key] || 0) + 1;
    });
    return { sevs, ress, matrix, maxVal: Math.max(...Object.values(matrix), 1) };
  }, [cb]);

  const REASON_COLORS = ['#00e676','#651fff','#ff9100','#f50057','#00b0ff','#d50000','#aa00ff','#ffea00'];

  return (
    <div className="page-anim">
      {/* Filter chips */}
      <div className="pills" style={{ marginBottom: 20 }}>
        {severities.map(s => (
          <button key={s} className={`pill ${severityFilter === s ? 'active' : ''}`} onClick={() => setSeverityFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid g-3" style={{ marginBottom: 18 }}>
        <div className="card kpi">
          <div className="kpi-label">CRITICAL CASES</div>
          <div className="kpi-value" style={{ color: 'var(--red)' }}>{criticalCount}</div>
          <div className="kpi-delta up">↑ Requires immediate action</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">OPEN DISPUTES</div>
          <div className="kpi-value" style={{ color: 'var(--amber)' }}>{open}</div>
          <div className="kpi-delta flat">— Pending resolution</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">DISPUTED AMOUNT</div>
          <div className="kpi-value">₹{fmt(disputedAmt)}</div>
        </div>
      </div>

      {/* Full-Width Showcase: Dispute Resolution & Intake (Matching Mockup) */}
      <div style={{ marginBottom: 20 }}>
        <DisputeBubbleField chargebacks={cb} filtered={filtered} />
      </div>

      {/* Chargeback Reason Breakdown & Heatmap in 2-Column Grid */}
      <div className="grid g-2" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="card-h" style={{ marginBottom: 24 }}>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Chargeback by Reason Code</div>
              <div className="card-desc" style={{ marginTop: 4 }}>Volume of disputes filed under each primary network reason code.</div>
            </div>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-0)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {reasonData.length} REASONS
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reasonData.map(([reason, count], i) => (
              <HBar key={reason} label={reason} value={count} maxVal={maxReason} color={REASON_COLORS[i % REASON_COLORS.length]} />
            ))}
          </div>
        </div>

        {/* Severity × Resolution Matrix */}
        <div className="card" style={{ padding: 24 }}>
          <div className="card-h" style={{ marginBottom: 24 }}>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Dispute Resolution Matrix</div>
              <div className="card-desc" style={{ marginTop: 4 }}>Intersection of assigned severity vs current operational status.</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 8px 12px 8px', fontSize: 10, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Severity ↓</th>
                  {heatData.ress.map(r => (
                    <th key={r} style={{ padding: '0 8px 12px 8px', fontSize: 10, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{r.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatData.sevs.map(sev => {
                  let baseColor = '91,140,255'; // blue for medium
                  if (sev === 'CRITICAL') baseColor = '244,67,54'; // red
                  if (sev === 'HIGH') baseColor = '255,193,7'; // amber
                  if (sev === 'LOW') baseColor = '76,175,80'; // green

                  return (
                    <tr key={sev}>
                      <td style={{ padding: '8px', fontSize: 11, color: 'var(--text-1)', fontWeight: 700, letterSpacing: '0.5px' }}>{sev}</td>
                      {heatData.ress.map(res => {
                        const val = heatData.matrix[`${sev}__${res}`] || 0;
                        const intensity = val / heatData.maxVal;
                        const hasData = val > 0;
                        const bg = hasData ? `rgba(${baseColor}, ${(intensity * 0.6 + 0.1).toFixed(2)})` : 'rgba(255,255,255,0.02)';
                        const border = hasData ? `1px solid rgba(${baseColor}, ${(intensity * 0.8 + 0.2).toFixed(2)})` : '1px solid rgba(255,255,255,0.05)';
                        const shadow = hasData ? `inset 0 0 10px rgba(${baseColor}, 0.2), 0 4px 12px rgba(${baseColor}, ${(intensity * 0.4).toFixed(2)})` : 'none';
                        const textColor = hasData ? '#fff' : 'rgba(255,255,255,0.2)';

                        return (
                          <td key={res} title={`${sev} × ${res}: ${val}`} style={{ padding: 0 }}>
                            <div style={{
                              background: bg,
                              border: border,
                              boxShadow: shadow,
                              color: textColor,
                              height: 44,
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              transition: 'all 0.3s ease',
                              cursor: 'default'
                            }}
                            onMouseEnter={(e) => { if(hasData) e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { if(hasData) e.currentTarget.style.transform = 'none'; }}>
                              {val || '–'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="section-title">Merchant Watchlist</div>
      <div className="card">
        <div className="card-h">
          <div>
            <div className="card-title">Top Merchants by Chargeback Rate</div>
            <div className="card-desc">Merchants with ≥5 transactions ranked by disputed-transaction rate. Treat as a review list, not a verdict.</div>
          </div>
          <div className="card-badge badge-alert">NEEDS REVIEW</div>
        </div>
        <table className="risk-table">
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Category</th>
              <th>Status</th>
              <th>CB Rate</th>
              <th>CBs / Txns</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map(m => {
              const rateColor = m.rate > 10 ? 'var(--red)' : m.rate > 5 ? 'var(--amber)' : 'var(--green)';
              return (
                <tr key={m.id}>
                  <td className="name">{m.name || m.id}</td>
                  <td>{m.cat || '—'}</td>
                  <td><span className={`tag ${m.status === 'ACTIVE' ? 'tag-active' : m.status === 'SUSPENDED' ? 'tag-suspended' : 'tag-inactive'}`}>{m.status || '—'}</span></td>
                  <td>
                    <div className="rate-bar-wrap">
                      <div className="rate-bar-fill" style={{ width: `${Math.min(m.rate, 100)}%`, background: rateColor }} />
                    </div>
                    <span style={{ color: rateColor, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.rate.toFixed(1)}%</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)', fontSize: 12 }}>{m.cbCount} / {m.txnCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DisputeIntel;
