import React, { useState, useContext } from 'react';
import { DataContext, DataProvider } from './context/DataContext';
import TopNav from './components/TopNav';
import Overview from './pages/Overview';
import CityRiskMap from './pages/CityRiskMap';
import DisputeIntel from './pages/DisputeIntel';
import MerchantIntelligence from './pages/MerchantIntelligence';
import IdentityIntegrity from './pages/IdentityIntegrity';
import FintrixAIChatPage from './pages/FintrixAIChatPage';
import fintrixLogo from './assets/Fintrix logo.png';
const PAGE_META = {
  overview:   { title: 'Overview',               sub: 'High-level financial health and transaction velocity' },
  map:        { title: 'India City Risk Map',     sub: 'Geographic distribution, city-level chargeback rates, and regional hotspots' },
  dispute:    { title: 'Disputes & Chargebacks',  sub: 'Chargeback patterns, reason codes, and resolution backlog' },
  merchant:   { title: 'Merchant Analytics',      sub: 'Portfolio composition, risk tiers, and category breakdown' },
  integrity:  { title: 'Data Quality & KYC',      sub: 'Record consistency, KYC verification, and anomaly detection' },
  ai:         { title: 'Fintrix AI Engine',       sub: 'Conversational financial intelligence and forensics' },

};

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';

const AppContent = () => {
  const { loading, error, data } = useContext(DataContext);
  const [activePage, setActivePage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'overview';
  });

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
          width: 56, height: 56, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          animation: 'pulse 1.5s infinite',
          overflow: 'hidden'
        }}>
          <img src={fintrixLogo} alt="Fintrix Mascot" style={{ height: 56, width: 'auto', objectFit: 'cover', objectPosition: 'left center' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#ffffff' }}>Fintrix</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Initializing telemetry & datasets…</div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  const meta = PAGE_META[activePage] || PAGE_META['overview'];

  return (
    <div className="app-container" style={activePage === 'ai' ? { height: '100vh', paddingBottom: '16px', display: 'flex', flexDirection: 'column' } : {}}>
      {/* Floating Capsule Top Navigation */}
      <TopNav
        activePage={activePage}
        onNavigate={setActivePage}
        totalTxns={data.upi?.length || 0}
        totalCb={data.chargebacks?.length || 0}
        totalMerchants={data.merchants?.length || 0}
      />

      {/* Page Title & Action Header */}
      {activePage !== 'ai' && (
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
            </div>
          </div>

          <div className="page-header-actions">
            <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              {data.upi?.length?.toLocaleString() || 0} txns · {data.chargebacks?.length?.toLocaleString() || 0} disputes
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="main-content-body" style={activePage === 'ai' ? { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : {}}>
        {activePage === 'overview'   && <Overview onNavigate={setActivePage} />}
        {activePage === 'map'        && <CityRiskMap />}
        {activePage === 'dispute'    && <DisputeIntel />}
        {activePage === 'merchant'   && <MerchantIntelligence />}
        {activePage === 'integrity'  && <IdentityIntegrity />}
        {activePage === 'ai'         && <FintrixAIChatPage onNavigate={setActivePage} />}

      </main>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
