import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

const fmt = (n) => n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));

const AnomalyCard = ({ icon, num, label, desc, theme = 'default' }) => {
  const isAccent = theme === 'accent' || theme === 'lime';
  const isPurple = theme === 'purple';
  const isAmber = theme === 'amber';
  
  return (
    <div className="anomaly-card">
      <div 
        className="anomaly-icon"
        style={{
          background: isAccent ? 'var(--lime-soft)' : isPurple ? 'var(--purple-soft)' : isAmber ? 'var(--amber-soft)' : 'rgba(255,255,255,0.06)',
          color: isAccent ? 'var(--lime)' : isPurple ? 'var(--purple)' : isAmber ? 'var(--amber)' : '#ffffff',
          borderColor: isAccent ? 'rgba(180,243,41,0.3)' : isPurple ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.1)'
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div 
          className="anomaly-num" 
          style={{ 
            color: isAccent ? 'var(--lime)' : isPurple ? 'var(--purple)' : isAmber ? 'var(--amber)' : '#ffffff' 
          }}
        >
          {num.toLocaleString()}
        </div>
        <div className="anomaly-label">{label}</div>
        {desc && <div className="anomaly-desc">{desc}</div>}
      </div>
    </div>
  );
};

const IdentityIntegrity = () => {
  const { data } = useData();
  const merchants = data.merchants || [];
  const kyc = data.kyc || [];

  // Merchant duplicates
  const merStats = useMemo(() => {
    const seen = {};
    merchants.forEach(m => {
      if (!m.merchant_id) return;
      if (!seen[m.merchant_id]) seen[m.merchant_id] = [];
      seen[m.merchant_id].push(m);
    });
    const dupes = Object.entries(seen).filter(([, rows]) => rows.length > 1);
    const statusFlip = dupes.filter(([, rows]) => new Set(rows.map(r => r.merchant_status)).size > 1);
    const nameFlip = dupes.filter(([, rows]) => new Set(rows.map(r => r.merchant_name)).size > 1);
    // Example entity
    const exampleEntry = dupes.sort((a,b) => b[1].length - a[1].length)[0];
    return {
      multiCount: dupes.length,
      statusFlipCount: statusFlip.length,
      nameFlipCount: nameFlip.length,
      example: exampleEntry,
    };
  }, [merchants]);

  // User KYC duplicates
  const kycStats = useMemo(() => {
    const seen = {};
    kyc.forEach(k => {
      if (!k.user_id) return;
      if (!seen[k.user_id]) seen[k.user_id] = [];
      seen[k.user_id].push(k);
    });
    const dupes = Object.entries(seen).filter(([, rows]) => rows.length > 1);
    const riskFlip = dupes.filter(([, rows]) => new Set(rows.map(r => r.risk_segment)).size > 1);
    const statusFlip = dupes.filter(([, rows]) => new Set(rows.map(r => r.kyc_status)).size > 1);
    return {
      multiCount: dupes.length,
      riskFlipCount: riskFlip.length,
      statusFlipCount: statusFlip.length,
    };
  }, [kyc]);

  // KYC distribution
  const kycDist = useMemo(() => {
    const m = {};
    kyc.forEach(k => { if (k.kyc_status) m[k.kyc_status] = (m[k.kyc_status] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [kyc]);

  // Risk segment distribution
  const riskDist = useMemo(() => {
    const m = {};
    kyc.forEach(k => { if (k.risk_segment) m[k.risk_segment] = (m[k.risk_segment] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [kyc]);

  const totalKyc = kyc.length || 1;
  const maxKyc = kycDist[0]?.[1] || 1;
  const maxRisk = riskDist[0]?.[1] || 1;

  const KYC_COLORS = { VERIFIED: '#b4f329', PENDING: '#ffb834', REJECTED: '#ff5271', EXPIRED: '#a78bfa' };
  const RISK_COLORS = { LOW: '#b4f329', MEDIUM: '#ffb834', HIGH: '#ff5271' };

  return (
    <div className="page-anim">
      {/* Merchant Integrity Header & Anomaly Cards */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <div>
            <div className="card-title" style={{ fontSize: 16 }}>Merchant Entity Discrepancies &amp; State Instability</div>
            <div className="card-desc" style={{ maxWidth: 820 }}>
              The same <code style={{ color: 'var(--lime)', background: 'rgba(180,243,41,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>merchant_id</code> or <code style={{ color: 'var(--purple)', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>user_id</code> appears multiple times across datasets with conflicting registration status, names, or risk tiers — indicating pipeline ingestion duplication or re-registration evasion.
            </div>
          </div>
          <span className="card-badge badge-alert">INTEGRITY ALERT</span>
        </div>

        <div className="grid g-3" style={{ marginBottom: 20 }}>
          <AnomalyCard 
            icon="⧉" 
            num={merStats.multiCount} 
            label="Multi-Record Merchant IDs" 
            desc="Merchants with >1 record in database"
            theme="purple" 
          />
          <AnomalyCard 
            icon="⇄" 
            num={merStats.statusFlipCount} 
            label="Status Flip Anomaly" 
            desc="Flipped between ACTIVE & SUSPENDED"
            theme="amber" 
          />
          <AnomalyCard 
            icon="✎" 
            num={merStats.nameFlipCount} 
            label="Name Mutation Anomaly" 
            desc="Registered under conflicting names"
            theme="lime" 
          />
        </div>

        {/* Sleek State Transition Audit Trail Flow */}
        {merStats.example && (
          <div className="audit-flow-card">
            <div className="audit-flow-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="audit-entity-tag">{merStats.example[0]}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#ffffff' }}>Audit Trail Case: Status Flip Pattern</span>
              </div>
              <span className="audit-total-badge">{merStats.example[1].length} Records Found</span>
            </div>

            <div className="audit-timeline-track">
              {merStats.example[1].slice(0, 4).map((row, i) => {
                const isSuspended = row.merchant_status === 'SUSPENDED' || row.merchant_status === 'INACTIVE';
                return (
                  <React.Fragment key={i}>
                    <div className="audit-step-card">
                      <div className="audit-step-top">
                        <span className="audit-step-num">Step {i + 1}</span>
                        <span className={`audit-step-badge ${isSuspended ? 'badge-suspended' : 'badge-active'}`}>
                          {isSuspended ? '● SUSPENDED' : '✓ ACTIVE'}
                        </span>
                      </div>
                      <div className="audit-step-name">{row.merchant_name || 'Registered Entity'}</div>
                      <div className="audit-step-cat">{row.merchant_category || 'Merchant'}</div>
                    </div>
                    {i < 3 && (
                      <div className="audit-step-connector">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {merStats.example[1].length > 4 && (
                <>
                  <div className="audit-step-connector">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <div className="audit-step-card audit-step-more">
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--lime)' }}>+{merStats.example[1].length - 4}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>more records</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User KYC Integrity */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <div>
            <div className="card-title">Customer KYC &amp; Verification Instability</div>
            <div className="card-desc">User KYC records show cross-file discrepancies in assigned risk tiers and verification status.</div>
          </div>
          <span className="card-badge badge-amber">USER ANOMALIES</span>
        </div>
        <div className="grid g-3">
          <AnomalyCard 
            icon="👥" 
            num={kycStats.multiCount} 
            label="Multi-KYC Users" 
            desc="Users with multiple KYC filings"
            theme="purple" 
          />
          <AnomalyCard 
            icon="⚠" 
            num={kycStats.riskFlipCount} 
            label="Risk Segment Disagreement" 
            desc="Conflicting risk tier assignments"
            theme="amber" 
          />
          <AnomalyCard 
            icon="🔍" 
            num={kycStats.statusFlipCount} 
            label="KYC Status Mismatch" 
            desc="Different verification states"
            theme="lime" 
          />
        </div>
      </div>

      {/* Distributions */}
      <div className="grid g-2">
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">KYC Status Distribution</div>
              <div className="card-desc">Spread of users across KYC verification states.</div>
            </div>
            <span className="card-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)' }}>
              {totalKyc.toLocaleString()} USERS
            </span>
          </div>
          {kycDist.map(([status, count]) => {
            const p = ((count / totalKyc) * 100).toFixed(1);
            return (
              <div key={status} className="cat-bar-row">
                <div className="cat-bar-label">{status}</div>
                <div className="cat-bar-track">
                  <div 
                    className="cat-bar-fill" 
                    style={{ 
                      width: `${(count / maxKyc) * 100}%`, 
                      background: KYC_COLORS[status] || 'var(--lime)' 
                    }} 
                  />
                </div>
                <div className="cat-bar-val" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', width: 90 }}>
                  <span style={{ color: 'var(--text-0)' }}>{fmt(count)}</span>
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>({p}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">User Risk Segment Distribution</div>
              <div className="card-desc">Spread of users across risk classifications.</div>
            </div>
          </div>
          {riskDist.map(([seg, count]) => {
            const p = ((count / totalKyc) * 100).toFixed(1);
            return (
              <div key={seg} className="cat-bar-row">
                <div className="cat-bar-label">{seg} RISK</div>
                <div className="cat-bar-track">
                  <div 
                    className="cat-bar-fill" 
                    style={{ 
                      width: `${(count / maxRisk) * 100}%`, 
                      background: RISK_COLORS[seg] || 'var(--lime)' 
                    }} 
                  />
                </div>
                <div className="cat-bar-val" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', width: 90 }}>
                  <span style={{ color: 'var(--text-0)' }}>{fmt(count)}</span>
                  <span style={{ color: 'var(--text-2)', fontSize: 11 }}>({p}%)</span>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(255,184,52,0.06)', borderRadius: 12, border: '1px solid rgba(255,184,52,0.2)' }}>
            <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠</span> Data Pipeline Integrity Guidance
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6 }}>
              Duplicate entities with contradictory risk tiers should be sanitized before calculating portfolio risk exposure. Consider implementing deduplication keys on <code style={{ color: '#fff' }}>merchant_pan</code> or phone numbers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityIntegrity;

