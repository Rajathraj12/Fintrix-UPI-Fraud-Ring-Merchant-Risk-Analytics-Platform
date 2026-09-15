import React from 'react';

const icons = {
  overview: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  map: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  dispute: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  merchant: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  integrity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  insights: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',              icon: icons.overview },
  { id: 'map',        label: 'India City Map',        icon: icons.map },
  { id: 'dispute',    label: 'Chargebacks & Disputes', icon: icons.dispute },
  { id: 'merchant',  label: 'Merchant Analytics',     icon: icons.merchant },
  { id: 'integrity', label: 'Data Quality & KYC',     icon: icons.integrity },
  { id: 'insights',  label: 'Risk Insights',          icon: icons.insights },
];

const Sidebar = ({ activePage, onNavigate }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="brand-mark">S</div>
      <div>
        <div className="brand-name">Fintrix</div>
        <div className="brand-sub">Risk Intelligence</div>
      </div>
    </div>

    <div className="nav-section">Navigation</div>

    {NAV_ITEMS.map(item => (
      <button
        key={item.id}
        className={`nav-item${activePage === item.id ? ' active' : ''}`}
        onClick={() => onNavigate(item.id)}
      >
        {item.icon}
        {item.label}
      </button>
    ))}

    <div className="sidebar-bottom">
      <div style={{ marginBottom: 4 }}>Data: Local CSV files</div>
      <div>Payments Risk · 2024</div>
    </div>
  </aside>
);

export default Sidebar;
