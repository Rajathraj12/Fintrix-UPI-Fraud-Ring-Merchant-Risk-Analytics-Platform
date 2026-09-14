import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import DisputeBubbleField from '../components/DisputeBubbleField';

const fmt = (n) => n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const pct = (n, d) => d === 0 ? '0.0%' : `${((n/d)*100).toFixed(1)}%`;

// Reusable horizontal bar
const HBar = ({ label, value, maxVal, color = '#5b8cff', suffix = '' }) => (
  <div className="cat-bar-row">
    <div className="cat-bar-label" title={label}>{label}</div>
    <div className="cat-bar-track">
      <div className="cat-bar-fill" style={{ width: `${maxVal > 0 ? (value/maxVal)*100 : 0}%`, background: color }} />
    </div>
    <div className="cat-bar-val">{typeof value === 'number' ? (suffix ? `${value.toFixed(1)}${suffix}` : fmt(value)) : value}</div>
  </div>
);

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

  const REASON_COLORS = ['#5b8cff','#3ddc97','#a78bfa','#f5b642','#ff5d7a','#38bdf8','#fb923c','#e879f9'];

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
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Chargeback by Reason Code</div>
              <div className="card-desc">Count of disputes filed under each reason code.</div>
            </div>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
              {reasonData.length} REASONS
            </span>
          </div>
          {reasonData.map(([reason, count], i) => (
            <HBar key={reason} label={reason} value={count} maxVal={maxReason} color={REASON_COLORS[i % REASON_COLORS.length]} />
          ))}
        </div>

        {/* Severity × Resolution Heatmap */}
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Dispute Reason vs. Severity Heatmap</div>
              <div className="card-desc">Darker cells = more disputes at that Severity × Reason combination.</div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text-2)', textAlign: 'left', fontWeight: 600 }}>Severity ↓ / Status →</th>
                  {heatData.ress.map(r => (
                    <th key={r} style={{ padding: '6px 10px', fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatData.sevs.map(sev => (
                  <tr key={sev}>
                    <td style={{ padding: '6px 8px', fontSize: 11.5, color: 'var(--text-1)', fontWeight: 600 }}>{sev}</td>
                    {heatData.ress.map(res => {
                      const val = heatData.matrix[`${sev}__${res}`] || 0;
                      const intensity = val / heatData.maxVal;
                      const bg = `rgba(91,140,255,${(intensity * 0.7 + 0.05).toFixed(2)})`;
                      return (
                        <td key={res} title={`${sev} × ${res}: ${val}`}
                          style={{ padding: '10px', textAlign: 'center' }}>
                          <div className="heat-cell" style={{ background: val > 0 ? bg : 'rgba(255,255,255,0.03)', color: val > 0 ? '#fff' : 'var(--text-2)', height: 40 }}>
                            {val || '–'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
