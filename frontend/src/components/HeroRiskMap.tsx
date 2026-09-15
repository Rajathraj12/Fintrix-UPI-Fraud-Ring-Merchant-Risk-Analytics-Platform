import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, risk: 'high', rings: 89, value: '₹42.8L' },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, risk: 'high', rings: 114, value: '₹68.9L' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, risk: 'medium', rings: 45, value: '₹19.4L' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, risk: 'medium', rings: 28, value: '₹11.2L' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, risk: 'low', rings: 8, value: '₹2.1L' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, risk: 'high', rings: 62, value: '₹28.5L' }
];

export default function HeroRiskMap() {
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.0, 78.0],
        zoom: 4,
        minZoom: 3,
        maxZoom: 8,
        zoomControl: false, // Disabled default to use custom ones
        attributionControl: false,
        dragging: true, // Enabled
        scrollWheelZoom: true, // Keep false so scrolling down the page doesn't get trapped
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
      }).addTo(map);

      CITIES.forEach(city => {
        const color = city.risk === 'high' ? '#ff3b30' : city.risk === 'medium' ? '#ffd60a' : '#aaff00';
        
        const iconHtml = `
          <div style="position: relative; width: 14px; height: 14px; cursor: pointer;">
            <div style="position: absolute; inset: 0; background: ${color}; border-radius: 50%; opacity: 0.8;"></div>
            <div style="position: absolute; inset: -10px; border: 2px solid ${color}; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.5;"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-ping-icon',
          html: iconHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const tooltipHtml = `
          <div style="background: #0a0a0a; border: 1px solid #1e1e1e; padding: 12px; border-radius: 8px; color: #fff; min-width: 140px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: ${color}; margin-bottom: 8px;">${city.name}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; color: #888;">Active Rings:</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;">${city.rings}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 10px; color: #888;">Threat Value:</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: #ff3b30;">${city.value}</span>
            </div>
          </div>
        `;

        L.marker([city.lat, city.lng], { icon })
          .addTo(map)
          .bindTooltip(tooltipHtml, {
            direction: 'top',
            className: 'custom-dark-tooltip',
            offset: [0, -10]
          });
      });

      mapInstanceRef.current = map;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: 400, borderRadius: 16, overflow: "hidden", border: "1px solid #1e1e1e", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
      {/* Ping Animation CSS & Tooltip CSS */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        /* Override default Leaflet tooltip styles */
        .leaflet-tooltip.custom-dark-tooltip {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .leaflet-tooltip-top.custom-dark-tooltip::before {
          border-top-color: #1e1e1e; /* Match border of custom tooltip */
          bottom: 0;
          margin-bottom: -13px; /* Adjust pointer position */
        }
        
        /* Make zoom controls dark */
        .leaflet-control-zoom a {
          background-color: #111 !important;
          color: #aaff00 !important;
          border-color: #333 !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #222 !important;
        }
      `}</style>
      
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#0a0c10', zIndex: 1 }} />
      
      {/* Overlay gradient to fade edges into dark background, pointer-events: none is critical! */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 30%, #000 100%)', zIndex: 10 }} />
      
      
      {/* Custom Zoom Controls */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button 
          onClick={handleZoomIn}
          style={{ width: 36, height: 36, background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(4px)", border: "1px solid #333", borderRadius: 8, color: "#aaff00", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#222"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(10, 10, 10, 0.8)"}
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          style={{ width: 36, height: 36, background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(4px)", border: "1px solid #333", borderRadius: 8, color: "#aaff00", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", paddingBottom: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = "#222"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(10, 10, 10, 0.8)"}
        >
          -
        </button>
      </div>

      {/* Overlay tags */}
      <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", border: "1px solid #1e1e1e", padding: "6px 12px", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, zIndex: 20 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff3b30", animation: "ping 2s infinite" }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#e0e0e0", letterSpacing: "1px" }}>LIVE RISK MAP</span>
      </div>

      {/* Floating Info Stats */}
      <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(8px)", border: "1px solid #1e1e1e", padding: "12px 16px", borderRadius: 8, zIndex: 20, display: "flex", gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.5px", marginBottom: 2 }}>TOTAL DETECTED</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#aaff00" }}>346</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.5px", marginBottom: 2 }}>AT RISK VALUE</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#ff3b30" }}>₹1.7Cr</div>
        </div>
      </div>
    
      {/* Map Legend */}
      <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(10, 10, 10, 0.8)", backdropFilter: "blur(8px)", border: "1px solid #1e1e1e", padding: "10px 14px", borderRadius: 8, zIndex: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 9, color: "#888", letterSpacing: "1px", marginBottom: 2 }}>THREAT LEVEL</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3b30", boxShadow: "0 0 8px #ff3b30" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ddd" }}>High Risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd60a", boxShadow: "0 0 8px #ffd60a" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ddd" }}>Medium Risk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#aaff00", boxShadow: "0 0 8px #aaff00" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ddd" }}>Low Risk</span>
        </div>
      </div>

    </div>
  );
}
