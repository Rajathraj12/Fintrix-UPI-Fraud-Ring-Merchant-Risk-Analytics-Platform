import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

const fmt = (n) => n >= 1e7 ? `${(n/1e7).toFixed(1)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const pct = (n, d) => d === 0 ? '0.0' : ((n/d)*100).toFixed(1);

const SEV_COLORS = {
  CRITICAL: { bg: 'rgba(255,93,122,0.15)', color: 'var(--red)', border: 'rgba(255,93,122,0.3)' },
  HIGH: { bg: 'rgba(245,182,66,0.15)', color: 'var(--amber)', border: 'rgba(245,182,66,0.3)' },
  MEDIUM: { bg: 'rgba(91,140,255,0.12)', color: 'var(--accent)', border: 'rgba(91,140,255,0.25)' },
  LOW: { bg: 'rgba(61,220,151,0.1)', color: 'var(--green)', border: 'rgba(61,220,151,0.2)' },
};

const InsightCard = ({ title, severity, body, action }) => {
  const style = SEV_COLORS[severity] || SEV_COLORS.LOW;
  return (
    <div className="insight-card" style={{ borderColor: style.border }}>
      <div className="insight-top">
        <span className="insight-sev" style={{ background: style.bg, color: style.color }}>{severity}</span>
        <span className="insight-title">{title}</span>
      </div>
      <div className="insight-body">{body}</div>
      {action && <div className="insight-action"><b>Recommended action:</b> {action}</div>}
    </div>
  );
};

const AIInsights = () => {
  const { data } = useData();
  const cb = data.chargebacks || [];
  const txns = data.upi || [];
  const merchants = data.merchants || [];
  const kyc = data.kyc || [];

  const insights = useMemo(() => {
    const totalTxns = txns.length;
    const cbRate = totalTxns > 0 ? (cb.length / totalTxns) * 100 : 0;
    const critCount = cb.filter(c => c.severity === 'CRITICAL').length;
    const openCount = cb.filter(c => c.resolution_status === 'OPEN').length;
    const suspended = merchants.filter(m => m.merchant_status === 'SUSPENDED').length;
    const highRisk = kyc.filter(k => k.risk_segment === 'HIGH').length;
    const failedTxns = txns.filter(t => t.status === 'FAILED').length;
    const failRate = pct(failedTxns, totalTxns);

    // Top category by CB rate
    const mCatMap = {};
    merchants.forEach(m => { mCatMap[m.merchant_id] = m.merchant_category; });
    const catCb = {}, catTxn = {};
    txns.forEach(t => { const c = mCatMap[t.merchant_id]; if (c) catTxn[c] = (catTxn[c] || 0) + 1; });
    cb.forEach(c => { const cat = mCatMap[c.merchant_id]; if (cat) catCb[cat] = (catCb[cat] || 0) + 1; });
    const topRiskCat = Object.keys(catTxn)
      .map(cat => ({ cat, rate: ((catCb[cat] || 0) / catTxn[cat]) * 100 }))
      .sort((a,b) => b.rate - a.rate)[0];

    const result = [];

    if (critCount > 0) {
      result.push({
        severity: 'CRITICAL',
        title: `${critCount} critical chargeback case${critCount > 1 ? 's' : ''} require immediate review`,
        body: `${critCount} disputes have been flagged as CRITICAL severity and remain unresolved. These represent your highest-exposure risk events with potential regulatory and financial consequences.`,
        action: `Pull the full dispute records for all CRITICAL cases. Escalate to the risk team. Temporarily suspend merchants with multiple critical flags pending investigation.`,
      });
    }

    if (cbRate > 2) {
      result.push({
        severity: cbRate > 5 ? 'HIGH' : 'MEDIUM',
        title: `Overall chargeback rate is ${cbRate.toFixed(1)}% — above industry benchmarks`,
        body: `With ${fmt(cb.length)} chargebacks across ${fmt(totalTxns)} transactions, your dispute rate exceeds the typical 1-2% industry baseline. This suggests systemic issues with either merchant quality, fraud controls, or customer experience.`,
        action: `Conduct a deep-dive on categories with >5% chargeback rates. Review fraud detection thresholds and consider requiring additional friction for high-risk transaction types.`,
      });
    }

    if (openCount > 50) {
      result.push({
        severity: 'HIGH',
        title: `${fmt(openCount)} disputes remain OPEN with no resolution`,
        body: `A backlog of unresolved open cases creates financial liability and customer dissatisfaction. Depending on dispute age, some may be approaching chargeback deadlines.`,
        action: `Prioritize dispute resolution queue by severity. Automate resolutions for cases below ₹500 with clear evidence to reduce backlog.`,
      });
    }

    if (topRiskCat && topRiskCat.rate > 5) {
      result.push({
        severity: 'HIGH',
        title: `"${topRiskCat.cat}" category shows ${topRiskCat.rate.toFixed(1)}% chargeback rate`,
        body: `This category has a significantly elevated dispute rate compared to your portfolio average. This could indicate fraud rings targeting specific merchant types or systematic fulfillment failures.`,
        action: `Implement enhanced monitoring for all new transactions in ${topRiskCat.cat}. Consider temporary transaction limits for new merchants in this category.`,
      });
    }

    if (suspended > 0) {
      result.push({
        severity: 'MEDIUM',
        title: `${suspended} suspended merchants still have transaction records`,
        body: `Suspended merchants appear in your transaction database, which may indicate transactions processed before suspension or data pipeline delays. Each case needs verification.`,
        action: `Cross-reference suspended merchant IDs against recent transaction timestamps. Flag any transactions processed post-suspension date for manual review.`,
      });
    }

    if (highRisk > 100) {
      result.push({
        severity: 'MEDIUM',
        title: `${fmt(highRisk)} users classified as HIGH risk are actively transacting`,
        body: `Your platform has a significant population of high-risk users generating transaction volume. This increases exposure to chargebacks and potential fraud losses.`,
        action: `Apply enhanced transaction monitoring for HIGH risk users. Consider implementing step-up authentication for transactions above ₹10,000 for this segment.`,
      });
    }

    if (failRate > 10) {
      result.push({
        severity: 'MEDIUM',
        title: `Transaction failure rate is ${failRate}% — above acceptable threshold`,
        body: `${fmt(failedTxns)} transactions have FAILED status out of ${fmt(totalTxns)} total. High failure rates can indicate payment gateway issues, fraud blocking, or UPI infrastructure problems.`,
        action: `Analyze failure patterns by merchant, time of day, and amount. Partner with your payment gateway team to diagnose systemic failures vs. fraud-related declines.`,
      });
    }

    result.push({
      severity: 'LOW',
      title: 'Data pipeline shows timestamp anomalies in chargeback records',
      body: 'Some chargeback records have reported timestamps that precede or closely follow transaction timestamps in suspicious ways. This may indicate batch processing delays or clock drift in the logging system.',
      action: 'Audit the chargeback ingestion pipeline for timestamp normalization issues. Ensure all timestamps are recorded in the same timezone and precision.',
    });

    return result;
  }, [cb, txns, merchants, kyc]);

  return (
    <div className="page-anim">
      <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(91,140,255,0.1), rgba(167,139,250,0.1))', border: '1px solid rgba(91,140,255,0.2)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
          ✦ AI-Powered Risk Intelligence
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
          These insights are generated by analyzing patterns across your transaction, chargeback, merchant, and KYC datasets.
          Each finding includes severity context and a recommended action. Treat these as prioritized investigative leads — not automated decisions.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(
          insights.reduce((acc, i) => { acc[i.severity] = (acc[i.severity] || 0) + 1; return acc; }, {})
        ).map(([sev, count]) => {
          const style = SEV_COLORS[sev] || SEV_COLORS.LOW;
          return (
            <div key={sev} style={{ padding: '6px 14px', borderRadius: 20, background: style.bg, color: style.color, fontSize: 12, fontWeight: 700, border: `1px solid ${style.border}` }}>
              {count} {sev}
            </div>
          );
        })}
      </div>

      {insights.map((ins, i) => (
        <InsightCard key={i} {...ins} />
      ))}
    </div>
  );
};

export default AIInsights;
