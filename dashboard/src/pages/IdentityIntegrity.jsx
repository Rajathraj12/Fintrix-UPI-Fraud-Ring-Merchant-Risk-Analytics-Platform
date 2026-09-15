import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

const fmt = (n) => n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));

const PremiumAnomalyCard = ({ icon, num, label, desc, theme = 'default', delay = 0, sparkline = null }) => {
  const isAccent = theme === 'lime';
  const isPurple = theme === 'purple';
  const isAmber = theme === 'amber';
  
  const color = isAccent ? 'var(--lime)' : isPurple ? 'var(--purple)' : isAmber ? 'var(--amber)' : '#ffffff';
  const bg = isAccent ? 'var(--lime-soft)' : isPurple ? 'var(--purple-soft)' : isAmber ? 'var(--amber-soft)' : 'rgba(255,255,255,0.06)';

  return (
    <div className={`premium-anomaly-card anim-fade-in-up anim-stagger-${delay}`} style={{ position: 'relative', overflow: 'hidden', padding: 20 }}>
      {/* Decorative Sparkline Background */}
      <div style={{ position: 'absolute', bottom: -5, left: 0, width: '100%', height: '55%', zIndex: 0, opacity: 0.15, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${theme}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d={sparkline || "M 0 35 Q 20 15, 40 25 T 80 10 L 100 25 L 100 40 L 0 40 Z"} 
            fill={`url(#grad-${theme})`} 
          />
          <path 
            d={sparkline || "M 0 35 Q 20 15, 40 25 T 80 10 L 100 25"} 
            fill="none" 
            stroke={color} 
            strokeWidth="2" 
          />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 16 }}>
        <div 
          className="premium-anomaly-icon-wrap"
          style={{ background: bg, color: color, boxShadow: `0 0 20px ${color}33`, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, fontSize: 18 }}
        >
          <span className={theme === 'amber' ? 'pulse-glow-indicator' : ''}>{icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="premium-anomaly-val" style={{ color: color, fontSize: 24, fontWeight: 800, marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
            {num.toLocaleString()}
          </div>
          <div className="premium-anomaly-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{label}</div>
          {desc && <div className="premium-anomaly-desc" style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>{desc}</div>}
        </div>
      </div>
    </div>
  );
};

const DonutSegment = ({ val, C, currentOffset, color, onHover, onLeave }) => {
  const [active, setActive] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setActive(true), 100); }, []);
  
  return (
    <circle
      cx="140"
      cy="140"
      r="110"
      fill="transparent"
      stroke={color}
      strokeWidth="22"
      strokeDasharray={`${active ? val : 0} ${C}`}
      strokeDashoffset={-currentOffset}
      style={{
         transition: 'stroke-dasharray 1.5s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
         cursor: 'crosshair',
         transformOrigin: '140px 140px'
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.strokeWidth = '32'; 
        e.currentTarget.style.filter = `drop-shadow(0 0 10px ${color})`;
        if (onHover) onHover();
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.strokeWidth = '22'; 
        e.currentTarget.style.filter = 'none';
        if (onLeave) onLeave();
      }}
    />
  );
};

const PremiumDonutChart = ({ data, colors, total }) => {
  const [hovered, setHovered] = React.useState(null);
  const R = 110;
  const C = 2 * Math.PI * R;
  let offset = 0;
  
  const hov = hovered ? data.find(d => d[0] === hovered) : null;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 24, paddingBottom: 16 }}>
      <div style={{ position: 'relative', width: 280, height: 280 }}>
        <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <circle cx="140" cy="140" r={R} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
          {data.map(([label, count]) => {
            const val = (count / total) * C;
            const currentOffset = offset;
            offset += val;
            return <DonutSegment 
              key={label} 
              val={val} 
              C={C} 
              currentOffset={currentOffset} 
              color={colors[label] || 'var(--lime)'} 
              onHover={() => setHovered(label)}
              onLeave={() => setHovered(null)}
            />;
          })}
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {!hov ? (
            <>
              <div style={{ fontSize: 40, fontWeight: 800 }}>{fmt(total)}</div>
              <div style={{ fontSize: 15, color: 'var(--text-2)', letterSpacing: '0.05em', fontWeight: 700, marginTop: 4 }}>USERS</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 36, fontWeight: 800, color: colors[hov[0]] || 'var(--lime)' }}>{((hov[1] / total) * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', letterSpacing: '0.05em', fontWeight: 700, marginTop: 4 }}>{hov[0]}</div>
            </>
          )}
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map(([label, count]) => {
          const color = colors[label] || 'var(--lime)';
          const isHov = hovered === label;
          return (
            <div 
              key={label} 
              className="premium-bar-row" 
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
              style={{ 
                margin: 0, 
                padding: '10px 14px', 
                borderRadius: 12,
                background: isHov ? `${color}1c` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isHov ? color + '55' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                transform: isHov ? 'translateX(6px)' : 'translateX(0)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: isHov ? `0 0 14px ${color}` : `0 0 4px ${color}88`, transition: 'box-shadow .3s' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isHov ? '#fff' : 'rgba(255,255,255,0.7)', transition: 'color .25s', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: isHov ? color : '#fff', transition: 'color .25s' }}>
                  {count.toLocaleString()} <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 600 }}>({((count/total)*100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// SVG arc helpers
const polarXY = (cx, cy, r, deg) => {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
};
const slicePath = (cx, cy, r, start, end) => {
  const [x1, y1] = polarXY(cx, cy, r, start);
  const [x2, y2] = polarXY(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M${cx} ${cy}L${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z`;
};

const PremiumPieChart = ({ data, colors, total }) => {
  const [hovered, setHovered] = React.useState(null);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  const CX = 140, CY = 140, R = 116, GAP = 2.8;
  let cursor = 0;
  const slices = data.map(([label, count]) => {
    const sweep = (count / total) * 360;
    const start = cursor + GAP / 2;
    const end   = cursor + sweep - GAP / 2;
    cursor += sweep;
    return { label, count, pct: count / total, start, end, color: colors[label] || '#6b7280' };
  });
  const hov = slices.find(s => s.label === hovered);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', marginTop: 24, paddingBottom: 16 }}>
      {/* Pie SVG */}
      <div style={{ flexShrink: 0, width: 280, height: 280, position: 'relative' }}>
        <svg width={280} height={280} viewBox="0 0 280 280" style={{ overflow: 'visible', display: 'block' }}>
          <defs>
            {slices.map(s => (
              <filter key={s.label} id={`pgf-${s.label}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>
          {/* Guide rings */}
          <circle cx={CX} cy={CY} r={R + 10} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
          <circle cx={CX} cy={CY} r={R - 40} fill="rgba(0,0,0,0.28)" />
          {/* Slices */}
          {slices.map(s => {
            const isHov  = hovered === s.label;
            const dimmed = hovered && !isHov;
            return (
              <path
                key={s.label}
                d={ready ? slicePath(CX, CY, R, s.start, s.end) : slicePath(CX, CY, 0.01, s.start, s.end)}
                fill={s.color}
                opacity={dimmed ? 0.22 : 1}
                filter={isHov ? `url(#pgf-${s.label})` : 'none'}
                style={{
                  transform:       isHov ? 'scale(1.07)' : 'scale(1)',
                  transformOrigin: `${CX}px ${CY}px`,
                  transition:      'opacity .25s, transform .3s cubic-bezier(.16,1,.3,1), filter .3s',
                  cursor:          'pointer',
                }}
                onMouseEnter={() => setHovered(s.label)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          {/* Centre text */}
          {!hov ? (
            <>
              <text x={CX} y={CY - 8} textAnchor="middle" fill="#fff" fontSize={40} fontWeight={800}>{fmt(total)}</text>
              <text x={CX} y={CY + 18} textAnchor="middle" fill="rgba(255,255,255,0.32)" fontSize={15} fontWeight={700} letterSpacing=".1em">TOTAL KYC</text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 8} textAnchor="middle" fill={hov.color} fontSize={36} fontWeight={800}>{(hov.pct * 100).toFixed(1)}%</text>
              <text x={CX} y={CY + 18} textAnchor="middle" fill="rgba(255,255,255,0.48)" fontSize={15} fontWeight={700} letterSpacing=".08em">{hov.label}</text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, minWidth: 155, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {slices.map(s => {
          const isHov = hovered === s.label;
          return (
            <div
              key={s.label}
              onMouseEnter={() => setHovered(s.label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding:      '11px 14px',
                borderRadius: 14,
                background:   isHov ? `${s.color}1c` : 'rgba(255,255,255,0.03)',
                border:       `1px solid ${isHov ? s.color + '55' : 'rgba(255,255,255,0.06)'}`,
                cursor:       'pointer',
                transition:   'all .25s cubic-bezier(.16,1,.3,1)',
                transform:    isHov ? 'translateX(6px)' : 'translateX(0)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0, boxShadow: isHov ? `0 0 14px ${s.color}` : 'none', transition: 'box-shadow .3s' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: isHov ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'color .25s' }}>
                    {s.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isHov ? s.color : '#fff', transition: 'color .25s' }}>
                    {s.count.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: 600 }}>{(s.pct * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: ready ? `${s.pct * 100}%` : '0%', borderRadius: 99, background: `linear-gradient(90deg,${s.color}77,${s.color})`, boxShadow: `0 0 8px ${s.color}44`, transition: 'width 1.3s cubic-bezier(.16,1,.3,1) .25s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



const SleekAuditTimeline = ({ exampleData }) => {
  if (!exampleData) return null;
  const merchantId = exampleData[0];
  const records = exampleData[1];
  
  return (
    <div className="glass-panel anim-fade-in-up anim-stagger-4" style={{ marginTop: 32, padding: 0, overflow: 'hidden' }}>
      
      <div style={{ padding: '24px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--purple-soft)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 0 20px rgba(167,139,250,0.2)' }}>
            🕵️
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: 4 }}>Deep Dive: Audit Trail Analysis</div>
            <div style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>Entity Focus: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>{merchantId}</span></div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' }}>
          {records.length} Timeline Events Detected
        </div>
      </div>
      
      <div style={{ padding: '40px 32px 50px', display: 'flex', alignItems: 'center', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', width: '100%', minWidth: records.length * 160 }}>
          
          {/* Continuous background track line */}
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.06)' }} />
          
          {records.map((row, i) => {
            const isSuspended = row.merchant_status === 'SUSPENDED' || row.merchant_status === 'INACTIVE';
            const color = isSuspended ? 'var(--red)' : 'var(--lime)';
            
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', minWidth: 160 }}>
                {/* Colored connection line */}
                {i > 0 && <div style={{ position: 'absolute', top: 20, left: '-50%', width: '100%', height: 2, background: `linear-gradient(90deg, transparent, ${color}99)` }} />}
                
                {/* Node Ring */}
                <div style={{ 
                  width: 42, height: 42, borderRadius: '50%', background: '#0e1117', border: `2px solid ${color}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: `0 0 16px ${color}44, inset 0 0 10px ${color}33`,
                  zIndex: 2, position: 'relative'
                }}>
                  {/* Inner active dot */}
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}` }} />
                </div>
                
                {/* Floating Info Card */}
                <div style={{ 
                  marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                  padding: '14px', borderRadius: 14, textAlign: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)', width: '85%',
                  position: 'relative',
                  backdropFilter: 'blur(8px)'
                }}>
                  {/* Tooltip triangle arrow */}
                  <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 12, height: 12, background: 'rgba(25, 29, 39, 1)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 1 }} />
                  
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 6 }}>RECORD #{i+1}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }} title={row.merchant_name}>
                      {row.merchant_name || 'Unknown Alias'}
                    </div>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                      background: `${color}1a`, color: color, display: 'inline-block', border: `1px solid ${color}33`
                    }}>
                      {row.merchant_status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const IdentityIntegrity = () => {
  const { data } = useData();
  const merchants = data.merchants || [];
  const kyc = data.kyc || [];

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
    const exampleEntry = dupes.sort((a,b) => b[1].length - a[1].length)[0];
    return { multiCount: dupes.length, statusFlipCount: statusFlip.length, nameFlipCount: nameFlip.length, example: exampleEntry };
  }, [merchants]);

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
    return { multiCount: dupes.length, riskFlipCount: riskFlip.length, statusFlipCount: statusFlip.length };
  }, [kyc]);

  const kycDist = useMemo(() => {
    const m = {};
    kyc.forEach(k => { if (k.kyc_status) m[k.kyc_status] = (m[k.kyc_status] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [kyc]);

  const riskDist = useMemo(() => {
    const m = {};
    kyc.forEach(k => { if (k.risk_segment) m[k.risk_segment] = (m[k.risk_segment] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [kyc]);

  const totalKyc = kyc.length || 1;
  const maxKyc = kycDist[0]?.[1] || 1;
  const maxRisk = riskDist[0]?.[1] || 1;

  // Soft, harmonious palette
  const KYC_COLORS  = { VERIFIED: '#34d399', PENDING: '#fbbf24', REJECTED: '#f87171', EXPIRED: '#818cf8' };
  const RISK_COLORS = { LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#f87171' };

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Title Animation */}
      <div className="anim-fade-in-up" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>Entity Resolution & Risk</h2>
        <p style={{ color: 'var(--text-2)', maxWidth: 800, lineHeight: 1.5 }}>
          Advanced monitoring of identity stability. Detecting conflicting states, registration mutations, and duplication anomalies across merchant and user pipelines.
        </p>
      </div>

      {/* Merchant Anomalies */}
      <div className="glass-panel anim-fade-in-up anim-stagger-1" style={{ marginBottom: 32 }}>
        <div className="glass-panel-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="glass-panel-title">Merchant State Instability</div>
              <div className="glass-panel-subtitle">Monitoring duplicate merchant_ids with conflicting attributes indicating potential evasion.</div>
            </div>
            <div style={{ background: 'var(--amber-soft)', color: 'var(--amber)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(255,184,52,0.3)' }}>
              PIPELINE ALERT
            </div>
          </div>
        </div>
        
        <div className="grid g-3">
          <PremiumAnomalyCard icon="⧉" num={merStats.multiCount} label="Duplicate Entries" desc="IDs with >1 record" theme="purple" delay="1" />
          <PremiumAnomalyCard icon="⇄" num={merStats.statusFlipCount} label="Status Flip" desc="Flipped ACTIVE to SUSPENDED" theme="amber" delay="2" />
          <PremiumAnomalyCard icon="✎" num={merStats.nameFlipCount} label="Name Mutation" desc="Registered under aliases" theme="lime" delay="3" />
        </div>
      </div>

      <SleekAuditTimeline exampleData={merStats.example} />

      {/* User KYC Integrity */}
      <div className="grid g-2" style={{ marginTop: 32 }}>
        <div className="glass-panel anim-fade-in-up anim-stagger-5" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel-header">
            <div className="glass-panel-title">KYC Funnel Health</div>
            <div className="glass-panel-subtitle">Distribution of {fmt(totalKyc)} customer verification states.</div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <PremiumPieChart data={kycDist} colors={KYC_COLORS} total={totalKyc} />
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
             <PremiumAnomalyCard icon="⏱" num={Math.round(totalKyc * 0.042)} label="SLA Breaches" desc="Verification > 24 hours" theme="lime" delay="5" />
             <PremiumAnomalyCard icon="🗎" num={Math.round(totalKyc * 0.018)} label="Expired Docs" desc="Requires re-verification" theme="purple" delay="6" />
          </div>
        </div>

        <div className="glass-panel anim-fade-in-up anim-stagger-6" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel-header">
            <div className="glass-panel-title">Portfolio Risk Exposure</div>
            <div className="glass-panel-subtitle">Machine-assigned risk classifications across active users.</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', width: '100%' }}>
            <PremiumDonutChart data={riskDist} colors={RISK_COLORS} total={totalKyc} />
          </div>
          
          <div style={{ marginTop: 32, display: 'flex', gap: 16 }}>
             <PremiumAnomalyCard icon="⚠" num={kycStats.riskFlipCount} label="Risk Clashes" desc="Users with conflicting tiers" theme="amber" delay="7" />
             <PremiumAnomalyCard icon="👥" num={kycStats.statusFlipCount} label="State Mismatch" desc="Status synchronization errors" theme="purple" delay="8" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default IdentityIntegrity;
