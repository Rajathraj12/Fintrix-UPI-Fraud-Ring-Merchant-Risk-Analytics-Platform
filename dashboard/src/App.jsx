import React, { useState, useContext } from 'react';
import { DataContext, DataProvider } from './context/DataContext';
import TopNav from './components/TopNav';
import Overview from './pages/Overview';
import CityRiskMap from './pages/CityRiskMap';
import DisputeIntel from './pages/DisputeIntel';
import MerchantIntelligence from './pages/MerchantIntelligence';
import IdentityIntegrity from './pages/IdentityIntegrity';
import AIInsights from './pages/AIInsights';

const PAGE_META = {
  overview:   { title: 'Overview',               sub: 'High-level financial health and transaction velocity' },
  map:        { title: 'India City Risk Map',     sub: 'Geographic distribution, city-level chargeback rates, and regional hotspots' },
  dispute:    { title: 'Disputes & Chargebacks',  sub: 'Chargeback patterns, reason codes, and resolution backlog' },
  merchant:   { title: 'Merchant Analytics',      sub: 'Portfolio composition, risk tiers, and category breakdown' },
  integrity:  { title: 'Data Quality & KYC',      sub: 'Record consistency, KYC verification, and anomaly detection' },
  insights:   { title: 'Risk Insights',           sub: 'Data-driven risk findings with recommended actions' },
};

const AppContent = () => {
  const { loading, error, data } = useContext(DataContext);
  const [activePage, setActivePage] = useState('overview');

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ color: 'var(--red)', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Failed to load data</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 20, color: '#000000',
          boxShadow: '0 0 30px rgba(180, 243, 41, 0.5)',
          animation: 'pulse 1.5s infinite',
        }}>✦</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#ffffff' }}>Sentinel</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Initializing telemetry & datasets…</div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  const meta = PAGE_META[activePage] || PAGE_META['overview'];

  return (
    <div className="app-container">
      {/* Floating Capsule Top Navigation */}
      <TopNav
        activePage={activePage}
        onNavigate={setActivePage}
        totalTxns={data.upi?.length || 0}
        totalCb={data.chargebacks?.length || 0}
        totalMerchants={data.merchants?.length || 0}
      />

      {/* Page Title & Action Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <button
            className="back-btn-capsule"
            onClick={() => setActivePage('overview')}
            title="Back to Overview"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h1 className="main-page-title">{meta.title}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{meta.sub}</div>
          </div>
        </div>

        <div className="page-header-actions">
          <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', marginRight: 6 }}>
            {data.upi?.length?.toLocaleString() || 0} txns · {data.chargebacks?.length?.toLocaleString() || 0} disputes
          </div>
          <button className="btn-secondary-capsule">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
              <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
            </svg>
            Filters
          </button>
          <button className="btn-primary-lime">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Live Monitor
          </button>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="main-content-body">
        {activePage === 'overview'   && <Overview onNavigate={setActivePage} />}
        {activePage === 'map'        && <CityRiskMap />}
        {activePage === 'dispute'    && <DisputeIntel />}
        {activePage === 'merchant'   && <MerchantIntelligence />}
        {activePage === 'integrity'  && <IdentityIntegrity />}
        {activePage === 'insights'   && <AIInsights />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
