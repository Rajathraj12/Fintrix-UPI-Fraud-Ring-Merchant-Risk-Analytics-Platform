import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import fintrixLogo from "../assets/Fintrix logo.png";
import { Menu, X } from "lucide-react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Our Journey", href: "/about" },
    { label: "Fintrix AI", href: "/dashboard?page=ai", isFeatured: true },
  ];

  const NavItem = ({ link, location }: any) => {
    const [hovered, setHovered] = useState(false);
    const timerRef = useRef<any>(null);

    const handleMouseEnter = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setHovered(true);
    };

    const handleMouseLeave = () => {
      timerRef.current = setTimeout(() => {
        setHovered(false);
      }, 400); // 400ms delay
    };

    const active = location.pathname === link.href || (link.dropdown && location.pathname.startsWith(link.href));
    
    return (
      <div 
        style={{ position: 'relative', display: 'flex' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          to={link.href}
          className={`nav-pill ${active ? 'active' : ''}`}
          style={{ 
            textDecoration: "none",
            ...(link.isFeatured && !active ? {
              background: 'rgba(180, 243, 41, 0.1)',
              border: '1px solid rgba(180, 243, 41, 0.4)',
              color: '#aaff00',
              boxShadow: '0 0 10px rgba(180, 243, 41, 0.2)',
              padding: '6px 10px'
            } : {})
          }}
        >
          {link.isFeatured && <span style={{ marginRight: 4 }}>✨</span>}
          {active && !link.isFeatured && <span className="nav-pill-dot" />}
          {link.label}
        </Link>
        {link.dropdown && hovered && (
          <div className="nav-dropdown">
            {link.dropdown.map((dl: any) => (
              <Link key={dl.label} to={dl.href} className="nav-dropdown-item">
                {dl.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", top: 12, left: 0, right: 0, zIndex: 1000, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      
      {/* Desktop Nav */}
      <header className={`top-nav desktop-only ${scrolled ? 'scrolled' : ''}`} style={{ width: "100%", maxWidth: 1472, pointerEvents: "auto", margin: "0 24px", transition: "all 0.3s ease", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(17, 20, 26, 0.85)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        
        {/* Brand */}
        <div className="brand-section" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img src={fintrixLogo} alt="Fintrix" style={{ height: 32, width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        {/* Center Nav */}
        <nav className="nav-capsule-container">
          {navLinks.map((link) => (
            <NavItem key={link.label} link={link} location={location} />
          ))}
        </nav>

        {/* CTA & Actions */}
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to="/dashboard"
            style={{
              background: "#aaff00",
              color: "#000",
              fontWeight: 600,
              padding: "7px 15px",
              borderRadius: "20px",
              textDecoration: "none",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              pointerEvents: "auto",
              transition: 'all 0.2s ease',
              border: '1px solid #aaff00'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Go to Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </header>

      {/* Mobile Nav */}
      <header className="mobile-only" style={{ width: "100%", pointerEvents: "auto", margin: "0 16px", transition: "all 0.3s ease", background: "rgba(17, 20, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* Mobile Top Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <img src={fintrixLogo} alt="Fintrix" style={{ height: 26, width: "auto", objectFit: "contain" }} />
          </Link>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
              {navLinks.map((link) => {
                const active = location.pathname === link.href || (link.dropdown && location.pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 12,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: active ? 800 : 600,
                      color: active ? "#000" : (link.isFeatured ? "#aaff00" : "#9da6b7"),
                      background: active ? "#aaff00" : (link.isFeatured ? "rgba(180, 243, 41, 0.1)" : "rgba(255,255,255,0.03)"),
                      border: link.isFeatured && !active ? '1px solid rgba(180, 243, 41, 0.3)' : '1px solid transparent',
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    {link.isFeatured && <span style={{ marginRight: 8 }}>✨</span>}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: "#aaff00",
                color: "#000",
                fontWeight: 800,
                padding: "14px 16px",
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8
              }}
            >
              Go to Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
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
    </div>
  );
}
