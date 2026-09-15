import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import fintrixLogo from "../assets/Fintrix logo.png";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    
    { label: "About Us", href: "/about" },
    { label: "Chatbot", href: "http://localhost:5173/?page=ai" },
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
      }, 400); // 400ms delay to make it easier to click dropdown items
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
          style={{ textDecoration: "none" }}
        >
          {active && <span className="nav-pill-dot" />}
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
      <header className={`top-nav ${scrolled ? 'scrolled' : ''}`} style={{ width: "100%", maxWidth: 1472, pointerEvents: "auto", margin: "0 24px", transition: "all 0.3s ease" }}>
        
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
          <a
            href="http://localhost:5173"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Go to Dashboard
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </a>
        </div>
      </header>
    </div>
  );
}
