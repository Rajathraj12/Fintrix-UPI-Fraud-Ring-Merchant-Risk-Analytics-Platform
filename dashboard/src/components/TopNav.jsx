import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import fintrixLogo from '../assets/Fintrix logo.png';

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'map',        label: 'India Map' },
  { id: 'dispute',    label: 'Disputes & Chargebacks' },
  { id: 'merchant',  label: 'Merchants' },
  { id: 'integrity', label: 'KYC & Risk' },
  { id: 'ai',        label: 'Fintrix AI' },

];

export default function TopNav({ activePage, onNavigate }) {
  return (
    <header className="top-nav">
      {/* Brand */}
      <div 
        className="brand-section" 
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
            >
              {isActive && <span className="nav-pill-dot" />}
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
  );
}
