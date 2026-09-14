import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import InteractiveCategoryPie from '../components/InteractiveCategoryPie';
import VerticalBarChart from '../components/VerticalBarChart';

const fmt = (n) => n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const fmtINR = (n) => `₹${fmt(n)}`;

const MerchantIntelligence = () => {
  const { data } = useData();
  const merchants = data.merchants || [];
  const txns = data.upi || [];
  const cb = data.chargebacks || [];

  const [catFilter, setCatFilter] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(merchants.map(m => m.merchant_category).filter(Boolean))].sort(), [merchants]);

  const filteredMerchants = useMemo(() => (
    catFilter === 'All' ? merchants : merchants.filter(m => m.merchant_category === catFilter)
  ), [merchants, catFilter]);

  // Status counts
  const activeCount = merchants.filter(m => m.merchant_status === 'ACTIVE').length;
  const suspendedCount = merchants.filter(m => m.merchant_status === 'SUSPENDED').length;
  const inactiveCount = merchants.filter(m => m.merchant_status === 'INACTIVE').length;

  // Category risk and volume details for the Interactive Pie Chart
  const catRiskData = useMemo(() => {
    const mCatMap = {};
    merchants.forEach(m => { mCatMap[m.merchant_id] = m.merchant_category; });
    const catTxn = {}, catCb = {}, catVol = {};
    txns.forEach(t => {
      const cat = mCatMap[t.merchant_id];
      if (cat) {
        catTxn[cat] = (catTxn[cat] || 0) + 1;
        catVol[cat] = (catVol[cat] || 0) + t.amount;
      }
    });
    cb.forEach(c => {
      const cat = mCatMap[c.merchant_id];
      if (cat) catCb[cat] = (catCb[cat] || 0) + 1;
    });
    return Object.keys(catTxn)
      .map(cat => ({
        cat,
        txns: catTxn[cat],
        cbs: catCb[cat] || 0,
        vol: catVol[cat] || 0,
        rate: ((catCb[cat] || 0) / catTxn[cat]) * 100,
      }))
      .sort((a,b) => b.rate - a.rate);
  }, [merchants, txns, cb]);

  // Business type breakdown
  const bizData = useMemo(() => {
    const map = {};
    filteredMerchants.forEach(m => { if (m.business_type) map[m.business_type] = (map[m.business_type] || 0) + 1; });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }, [filteredMerchants]);

  return (
    <div className="page-anim">
      {/* Category filter pills */}
      <div className="pills" style={{ marginBottom: 20 }}>
        {categories.slice(0, 12).map(c => (
          <button key={c} className={`pill ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid g-3" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div className="kpi-label">ACTIVE MERCHANTS</div>
          <div className="kpi-value">{activeCount.toLocaleString()}</div>
          <div className="kpi-delta down">↓ Healthy portfolio</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">SUSPENDED MERCHANTS</div>
          <div className="kpi-value" style={{ color: 'var(--red)' }}>{suspendedCount.toLocaleString()}</div>
          <div className="kpi-delta up">↑ Risk flagged</div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">INACTIVE MERCHANTS</div>
          <div className="kpi-value" style={{ color: 'var(--text-2)' }}>{inactiveCount.toLocaleString()}</div>
          <div className="kpi-delta flat">— Dormant accounts</div>
        </div>
      </div>

      {/* Interactive Pie Chart (Pops out on hover with rich details) */}
      <div style={{ marginBottom: 20 }}>
        <InteractiveCategoryPie 
          data={catRiskData} 
          onSelectCategory={(cat) => setCatFilter(cat)} 
        />
      </div>

      {/* Additional Deep Dives */}
      <div className="grid g-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-h" style={{ marginBottom: 12 }}>
            <div>
              <div className="card-title">Business Type Distribution</div>
              <div className="card-desc">Legal entity structure of {catFilter === 'All' ? 'all' : catFilter} merchants.</div>
            </div>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
              {filteredMerchants.length} MERCHANTS
            </span>
          </div>

          {/* Interactive Vertical Bar Chart without wasted empty space */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <VerticalBarChart data={bizData} totalMerchants={filteredMerchants.length} />
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Top Merchants by Volume</div>
              <div className="card-desc">Highest transacting merchants in portfolio.</div>
            </div>
          </div>
          {(() => {
            const mVol = {};
            txns.forEach(t => { if (t.merchant_id) mVol[t.merchant_id] = (mVol[t.merchant_id] || 0) + t.amount; });
            const mInfo = {};
            merchants.forEach(m => { mInfo[m.merchant_id] = m.merchant_name; });
            return Object.entries(mVol)
              .sort((a,b) => b[1]-a[1])
              .slice(0, 5)
              .map(([id, vol]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-0)', fontWeight: 700, display: 'block' }}>{mInfo[id] || id}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{id}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--lime)' }}>{fmtINR(vol)}</span>
                </div>
              ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default MerchantIntelligence;

