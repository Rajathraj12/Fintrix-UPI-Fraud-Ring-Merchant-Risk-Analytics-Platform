import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import fintrixLogo from '../assets/Fintrix logo.png';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'map',        label: 'India Map' },
  { id: 'dispute',    label: 'Disputes & Chargebacks' },
  { id: 'merchant',  label: 'Merchants' },
  { id: 'integrity', label: 'KYC & Risk' },
  { id: 'ai',        label: 'Fintrix AI', isFeatured: true },
];

export default function TopNav({ activePage, onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Nav */}
      <header className="top-nav desktop-only" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(17, 20, 26, 0.85)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        {/* Brand */}
        <div 
          className="brand-section" 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
          onClick={() => onNavigate('overview')}
        >
          <img src={fintrixLogo} alt="Fintrix" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Centered Capsule Nav Bar */}
        <nav className="nav-capsule-container">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-pill ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
                style={item.isFeatured && !isActive ? {
                  background: 'rgba(180, 243, 41, 0.1)',
                  border: '1px solid rgba(180, 243, 41, 0.4)',
                  color: '#aaff00',
                  boxShadow: '0 0 10px rgba(180, 243, 41, 0.2)',
                  padding: '6px 10px'
                } : {}}
              >
                {item.isFeatured && <span style={{ marginRight: 4 }}>✨</span>}
                {isActive && !item.isFeatured && <span className="nav-pill-dot" />}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action / Return to Website */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              padding: '7px 15px',
              borderRadius: '20px',
              textDecoration: 'none',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#aaff00';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.style.borderColor = '#aaff00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Website
          </Link>
        </div>
      </header>

      {/* Mobile Nav */}
      <header className="mobile-only" style={{ width: "100%", pointerEvents: "auto", transition: "all 0.3s ease", background: "rgba(17, 20, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column", marginBottom: 20 }}>
        
        {/* Mobile Top Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", cursor: 'pointer' }} onClick={() => onNavigate('overview')}>
            <img src={fintrixLogo} alt="Fintrix" style={{ height: 26, width: "auto", objectFit: "contain" }} />
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: item.isFeatured && !isActive ? '1px solid rgba(180, 243, 41, 0.3)' : '1px solid transparent',
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "#000" : (item.isFeatured ? "#aaff00" : "#9da6b7"),
                      background: isActive ? "#aaff00" : (item.isFeatured ? "rgba(180, 243, 41, 0.1)" : "rgba(255,255,255,0.03)"),
                      display: "flex",
                      alignItems: "center",
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    {item.isFeatured && <span style={{ marginRight: 8 }}>✨</span>}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <Link
              to="/"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontWeight: 600,
                padding: '12px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Website
            </Link>
          </div>
        )}
      </header>

      <style>{`
        .mobile-only { display: none !important; }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-only { display: flex !important; }
        }
      `}</style>
    </>
  );
}
