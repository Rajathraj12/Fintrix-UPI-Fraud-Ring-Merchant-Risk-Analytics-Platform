import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { INDIA_DATASET_STATES } from '../data/indiaStatesGeo';
import L from 'leaflet';

// 12 Dataset Cities with accurate geographical coordinates, state & zone
const CITY_META = {
  'Mumbai':    { lat: 19.0760, lng: 72.8777, state: 'Maharashtra',   zone: 'West' },
  'Delhi':     { lat: 28.6139, lng: 77.2090, state: 'Delhi',         zone: 'North' },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka',     zone: 'South' },
  'Kolkata':   { lat: 22.5726, lng: 88.3639, state: 'West Bengal',   zone: 'East' },
  'Chennai':   { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu',    zone: 'South' },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana',     zone: 'South' },
  'Pune':      { lat: 18.5204, lng: 73.8567, state: 'Maharashtra',   zone: 'West' },
  'Jaipur':    { lat: 26.9124, lng: 75.7873, state: 'Rajasthan',     zone: 'North' },
  'Lucknow':   { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh', zone: 'North' },
  'Ludhiana':  { lat: 30.9010, lng: 75.8573, state: 'Punjab',        zone: 'North' },
  'Amritsar':  { lat: 31.6340, lng: 74.8723, state: 'Punjab',        zone: 'North' },
  'Jalandhar': { lat: 31.3260, lng: 75.5762, state: 'Punjab',        zone: 'North' }
};

// Format utilities
const fmt = (n) => n >= 1e7 ? `${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `${(n/1e5).toFixed(2)}L` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(Math.round(n));
const fmtINR = (n) => `₹${fmt(n)}`;

// Clean Free Tile Providers without watermarks
const TILE_PROVIDERS = {
  dark: {
    name: 'Sleek Dark Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Dark Gray'
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  },
  osm: {
    name: 'Standard Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

// Regional Quick Zoom Targets
const REGION_ZOOMS = [
  { label: 'All India', center: [22.5, 79.5], zoom: 5 },
  { label: 'North States (PB, DL, UP, RJ)', center: [28.5, 77.0], zoom: 6 },
  { label: 'Maharashtra (MH)', center: [19.2, 75.5], zoom: 6.5 },
  { label: 'South States (KA, TN, TS)', center: [14.5, 78.5], zoom: 6 },
  { label: 'West Bengal (WB)', center: [23.5, 87.8], zoom: 6.8 }
];

export default function CityRiskMap() {
  const { data } = useData();
  const [selectedMetric, setSelectedMetric] = useState('disputeRate');
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [selectedState, setSelectedState] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [mapTheme, setMapTheme] = useState('dark');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const cityPinsLayerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Compute aggregated stats for each city from datasets
  const cityMetrics = useMemo(() => {
    const upi = data.upi || [];
    const cb = data.chargebacks || [];
    const merchants = data.merchants || [];
    const kyc = data.kyc || [];

    const mCityMap = {};
    const mCatMap = {};
    merchants.forEach(m => {
      if (m.merchant_id) {
        mCityMap[m.merchant_id] = m.city;
        mCatMap[m.merchant_id] = m.merchant_category;
      }
    });

    const uCityMap = {};
    kyc.forEach(k => {
      if (k.user_id) uCityMap[k.user_id] = k.city;
    });

    const summary = {};

    Object.keys(CITY_META).forEach(cityName => {
      const meta = CITY_META[cityName];
      
      const cityMerchants = merchants.filter(m => m.city === cityName);
      const merchantCount = cityMerchants.length;

      const catCount = {};
      cityMerchants.forEach(m => {
        const c = m.merchant_category || 'Other';
        catCount[c] = (catCount[c] || 0) + 1;
      });

      const cityUsers = kyc.filter(k => k.city === cityName);
      const userCount = cityUsers.length;

      const cityTxns = upi.filter(t => mCityMap[t.merchant_id] === cityName || uCityMap[t.user_id] === cityName);
      const txnCount = cityTxns.length;
      const txnVol = cityTxns.reduce((s, t) => s + (t.amount || 0), 0);
      const avgTicket = txnCount > 0 ? txnVol / txnCount : 0;

      const cityCbs = cb.filter(c => mCityMap[c.merchant_id] === cityName || uCityMap[c.user_id] === cityName);
      const cbCount = cityCbs.length;
      const cbAmt = cityCbs.reduce((s, c) => s + (c.disputed_amount || 0), 0);
      const disputeRate = txnCount > 0 ? (cbCount / txnCount) * 100 : 0;

      const reasons = {};
      const statusMap = { Resolved: 0, Pending: 0, Under_Review: 0 };
      let highSevCount = 0;

      cityCbs.forEach(c => {
        const r = c.reason_code || 'OTHER';
        reasons[r] = (reasons[r] || 0) + 1;

        const st = (c.resolution_status || '').toLowerCase();
        if (st.includes('resolve') || st.includes('closed')) statusMap.Resolved++;
        else if (st.includes('review') || st.includes('investigat')) statusMap.Under_Review++;
        else statusMap.Pending++;

        if ((c.severity || '').toLowerCase() === 'high') highSevCount++;
      });

      let riskTier = 'Low';
      let riskColor = '#3ddc97'; // Green
      if (disputeRate >= 15 || highSevCount >= 40) {
        riskTier = 'High';
        riskColor = '#ff5d7a'; // Red
      } else if (disputeRate >= 12 || highSevCount >= 30) {
        riskTier = 'Moderate';
        riskColor = '#f5b642'; // Amber
      }

      summary[cityName] = {
        city: cityName,
        state: meta.state,
        zone: meta.zone,
        lat: meta.lat,
        lng: meta.lng,
        merchants: merchantCount,
        categories: catCount,
        users: userCount,
        transactions: txnCount,
        volume: txnVol,
        avgTicket: avgTicket,
        disputes: cbCount,
        disputedAmount: cbAmt,
        disputeRate: disputeRate,
        highSeverity: highSevCount,
        reasons: reasons,
        resolutions: statusMap,
        riskTier: riskTier,
        riskColor: riskColor,
        riskScore: Math.min(100, Math.round(disputeRate * 4.5 + highSevCount * 0.6))
      };
    });

    return summary;
  }, [data]);

  // Aggregate State-Level Metrics for all 9 states in dataset
  const stateMetrics = useMemo(() => {
    const summary = {};
    const states = [
      'Punjab', 'Maharashtra', 'Tamil Nadu', 'Karnataka',
      'West Bengal', 'Delhi', 'Telangana', 'Uttar Pradesh', 'Rajasthan'
    ];

    states.forEach(st => {
      const citiesInState = Object.values(cityMetrics).filter(c => c.state === st);
      const totalTxns = citiesInState.reduce((s, c) => s + c.transactions, 0);
      const totalVol = citiesInState.reduce((s, c) => s + c.volume, 0);
      const totalCbs = citiesInState.reduce((s, c) => s + c.disputes, 0);
      const totalDisputedAmt = citiesInState.reduce((s, c) => s + c.disputedAmount, 0);
      const totalMerchants = citiesInState.reduce((s, c) => s + c.merchants, 0);
      const totalUsers = citiesInState.reduce((s, c) => s + c.users, 0);
      const totalHighSev = citiesInState.reduce((s, c) => s + c.highSeverity, 0);
      const stateDisputeRate = totalTxns > 0 ? (totalCbs / totalTxns) * 100 : 0;

      let riskTier = 'Low';
      let riskColor = '#3ddc97'; // Green
      if (stateDisputeRate >= 15 || totalHighSev >= 40) {
        riskTier = 'High';
        riskColor = '#ff5d7a'; // Red
      } else if (stateDisputeRate >= 12 || totalHighSev >= 30) {
        riskTier = 'Moderate';
        riskColor = '#f5b642'; // Amber
      }

      summary[st] = {
        state: st,
        cities: citiesInState.map(c => c.city),
        transactions: totalTxns,
        volume: totalVol,
        disputes: totalCbs,
        disputedAmount: totalDisputedAmt,
        disputeRate: stateDisputeRate,
        merchants: totalMerchants,
        users: totalUsers,
        highSeverity: totalHighSev,
        riskTier: riskTier,
        riskColor: riskColor
      };
    });

    return summary;
  }, [cityMetrics]);

  const uniqueStates = useMemo(() => {
    return Object.keys(stateMetrics).sort();
  }, [stateMetrics]);

  const filteredCities = useMemo(() => {
    return Object.values(cityMetrics).filter(c => {
      if (selectedState !== 'ALL' && c.state !== selectedState) return false;
      if (filterRisk !== 'ALL' && c.riskTier !== filterRisk) return false;
      return true;
    });
  }, [cityMetrics, selectedState, filterRisk]);

  const currentCityData = cityMetrics[selectedCity] || cityMetrics['Mumbai'] || Object.values(cityMetrics)[0];
  const currentStateData = stateMetrics[currentCityData.state] || stateMetrics['Maharashtra'];

  const METRIC_OPTIONS = [
    { id: 'disputeRate',    label: 'Chargeback Rate (%)', unit: '%',  color: '#ff5d7a' },
    { id: 'disputedAmount', label: 'Dispute Volume (₹)',  unit: '₹',  color: '#f5b642' },
    { id: 'disputes',       label: 'Dispute Cases',       unit: '',   color: '#ff7b72' },
    { id: 'volume',         label: 'Transaction Vol (₹)', unit: '₹',  color: '#5b8cff' },
    { id: 'merchants',      label: 'Active Merchants',    unit: '',   color: '#a78bfa' },
    { id: 'highSeverity',   label: 'High Severity Fraud', unit: '',   color: '#f85149' }
  ];

  const activeMetricObj = METRIC_OPTIONS.find(m => m.id === selectedMetric) || METRIC_OPTIONS[0];

  // Helper for State Color based on Metric
  const getStateColor = (stData) => {
    if (!stData) return '#5b8cff';
    if (selectedMetric === 'disputeRate' || selectedMetric === 'highSeverity') {
      return stData.riskColor;
    }
    return activeMetricObj.color;
  };

  const getMetricDisplayVal = (city) => {
    if (selectedMetric === 'disputeRate') return `${city.disputeRate.toFixed(1)}%`;
    if (selectedMetric === 'volume') return fmtINR(city.volume);
    if (selectedMetric === 'disputedAmount') return fmtINR(city.disputedAmount);
    if (selectedMetric === 'disputes') return `${city.disputes} cases`;
    if (selectedMetric === 'merchants') return `${city.merchants} merchants`;
    if (selectedMetric === 'highSeverity') return `${city.highSeverity} alerts`;
    return `${city.disputeRate.toFixed(1)}%`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [22.5, 79.5],
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        zoomControl: true,
      });

      const tile = L.tileLayer(TILE_PROVIDERS[mapTheme].url, {
        attribution: TILE_PROVIDERS[mapTheme].attribution,
        maxZoom: 18,
      }).addTo(map);

      const geojsonGroup = L.layerGroup().addTo(map);
      const cityPinsGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      tileLayerRef.current = tile;
      geojsonLayerRef.current = geojsonGroup;
      cityPinsLayerRef.current = cityPinsGroup;
    }

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTile = L.tileLayer(TILE_PROVIDERS[mapTheme].url, {
      attribution: TILE_PROVIDERS[mapTheme].attribution,
      maxZoom: 18,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapTheme]);

  // Render State Boundary Polygons & Static City Badges
  useEffect(() => {
    if (!mapInstanceRef.current || !geojsonLayerRef.current || !cityPinsLayerRef.current) return;

    geojsonLayerRef.current.clearLayers();
    cityPinsLayerRef.current.clearLayers();

    // 1. Draw State Boundaries with Choropleth Color Fill
    const geoLayer = L.geoJSON(INDIA_DATASET_STATES, {
      style: (feature) => {
        const stateName = feature.properties.state;
        const stData = stateMetrics[stateName];
        const color = getStateColor(stData);
        const isSelectedState = selectedState === stateName || currentCityData.state === stateName;

        return {
          fillColor: color,
          weight: isSelectedState ? 3.5 : 2,
          opacity: 1,
          color: isSelectedState ? '#ffffff' : color,
          dashArray: isSelectedState ? '' : '3',
          fillOpacity: isSelectedState ? 0.6 : 0.38
        };
      },
      onEachFeature: (feature, layer) => {
        const stateName = feature.properties.state;
        const stData = stateMetrics[stateName];

        if (stData) {
          // State Tooltip
          layer.bindTooltip(`
            <div style="padding: 4px; text-align: center;">
              <b style="font-size: 13px; color: #fff;">${stateName}</b>
              <div style="font-size: 11px; color: ${stData.riskColor}; font-weight: 700; margin-top: 2px;">
                ${stData.riskTier} Risk · ${stData.disputeRate.toFixed(1)}% Dispute Rate
              </div>
              <div style="font-size: 10px; color: #aab3c8; margin-top: 4px;">
                ${fmtINR(stData.volume)} Vol · ${stData.merchants} Merchants · ${stData.cities.join(', ')}
              </div>
            </div>
          `, { direction: 'center', permanent: false, sticky: true });

          // Mouse Hover & Click Events
          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 4,
                color: '#ffffff',
                fillOpacity: 0.75
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                l.bringToFront();
              }
            },
            mouseout: (e) => {
              geoLayer.resetStyle(e.target);
            },
            click: () => {
              setSelectedState(stateName);
              if (stData.cities.length > 0) {
                setSelectedCity(stData.cities[0]);
              }
              const bounds = layer.getBounds();
              mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
            }
          });
        }
      }
    });

    geojsonLayerRef.current.addLayer(geoLayer);

    // 2. Draw Clean Non-Blinking City Pin Badges inside the States
    filteredCities.forEach(city => {
      const isSelected = selectedCity === city.city;
      const nodeColor = city.riskColor;

      // Clean static badge marker (No blinking/pulsing animation)
      const cleanBadgeIcon = L.divIcon({
        className: 'clean-city-badge',
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(14, 20, 32, 0.92);
            backdrop-filter: blur(8px);
            border: 1.5px solid ${isSelected ? '#ffffff' : nodeColor};
            border-radius: 20px;
            padding: 3px 8px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            cursor: pointer;
            white-space: nowrap;
            transform: translate(-50%, -50%);
            transition: all 0.15s ease;
          ">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${nodeColor}; flex-shrink: 0;"></span>
            <span style="font-size: 11px; font-weight: 700; color: ${isSelected ? '#ffffff' : '#eef1f8'}; font-family: var(--font-display);">${city.city}</span>
            <span style="font-size: 9.5px; font-weight: 600; color: ${nodeColor}; font-family: var(--font-mono);">${city.disputeRate.toFixed(1)}%</span>
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12]
      });

      const cityMarker = L.marker([city.lat, city.lng], { icon: cleanBadgeIcon });

      cityMarker.on('click', () => {
        handleCitySelect(city.city);
      });

      cityPinsLayerRef.current.addLayer(cityMarker);
    });

  }, [filteredCities, selectedCity, selectedState, selectedMetric, stateMetrics]);

  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    const c = cityMetrics[cityName];
    if (c) {
      setSelectedState(c.state);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([c.lat, c.lng], 7.5, { duration: 1.2 });
      }
    }
  };

  const handleRegionZoom = (reg) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(reg.center, reg.zoom, { duration: 1.2 });
    }
  };

  const topCategories = useMemo(() => {
    if (!currentCityData || !currentCityData.categories) return [];
    const entries = Object.entries(currentCityData.categories);
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0) || 1;
    return entries.slice(0, 5).map(([name, count]) => ({
      name,
      count,
      pct: ((count / total) * 100).toFixed(1)
    }));
  }, [currentCityData]);

  const topReasons = useMemo(() => {
    if (!currentCityData || !currentCityData.reasons) return [];
    const entries = Object.entries(currentCityData.reasons);
    entries.sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0) || 1;
    return entries.slice(0, 4).map(([code, count]) => ({
      code: code.replace(/_/g, ' '),
      count,
      pct: ((count / total) * 100).toFixed(1)
    }));
  }, [currentCityData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Controls & State Metrics Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          {/* Metric Selector Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'var(--text-2)', marginRight: 4 }}>
              STATE COLOR METRIC:
            </span>
            {METRIC_OPTIONS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                style={{
                  background: selectedMetric === m.id ? 'rgba(91,140,255,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selectedMetric === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  color: selectedMetric === m.id ? '#ffffff' : 'var(--text-1)',
                  padding: '6px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: selectedMetric === m.id ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color }} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Map Layer Theme & State Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Tile Layer Selector */}
            <select
              value={mapTheme}
              onChange={(e) => setMapTheme(e.target.value)}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                color: 'var(--text-0)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <option value="dark">Sleek Dark Canvas (No Watermark)</option>
              <option value="satellite">Satellite View</option>
              <option value="osm">Street Map View</option>
            </select>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => {
                const st = e.target.value;
                setSelectedState(st);
                if (st !== 'ALL' && stateMetrics[st]?.cities?.length) {
                  setSelectedCity(stateMetrics[st].cities[0]);
                }
              }}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                color: 'var(--text-0)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All 9 Dataset States</option>
              {uniqueStates.map(st => (
                <option key={st} value={st}>{st} ({stateMetrics[st].cities.join(', ')})</option>
              ))}
            </select>

            {/* Risk Tier Filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                color: 'var(--text-0)',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="High">High Risk Tier (&gt;15%)</option>
              <option value="Moderate">Moderate Risk Tier (12-15%)</option>
              <option value="Low">Low Risk Tier (&lt;12%)</option>
            </select>
          </div>
        </div>

        {/* Quick State/Region Jump Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            STATE FOCUS JUMP:
          </span>
          {REGION_ZOOMS.map((reg, i) => (
            <button
              key={i}
              onClick={() => handleRegionZoom(reg)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-1)',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main State Boundary Map & Deep Dive Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)', gap: 20 }}>
        {/* Left: Real Leaflet Map with State Boundaries & Choropleth Color */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: 620, display: 'flex', flexDirection: 'column' }}>
          {/* Map Header Floating Overlay */}
          <div style={{
            position: 'absolute',
            top: 16,
            left: 20,
            zIndex: 500,
            background: 'rgba(14,20,32,0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            borderRadius: 8,
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>India State Risk Boundaries</span>
              <span style={{
                fontSize: 9,
                background: 'rgba(91,140,255,0.15)',
                color: 'var(--accent)',
                padding: '2px 6px',
                borderRadius: 10,
                border: '1px solid rgba(91,140,255,0.3)'
              }}>
                9 States Colored
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-2)', marginTop: 2 }}>
              Click any state boundary or city badge to inspect deep dive
            </div>
          </div>

          {/* Map Legend Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            zIndex: 500,
            background: 'rgba(14,20,32,0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 11,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>State Risk Tiers</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ff5d7a' }} />
              <span style={{ color: 'var(--text-1)' }}>High Risk (&gt;15% chargeback rate)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f5b642' }} />
              <span style={{ color: 'var(--text-1)' }}>Moderate Risk (12% – 15%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#3ddc97' }} />
              <span style={{ color: 'var(--text-1)' }}>Low Risk (&lt;12%)</span>
            </div>
          </div>

          {/* Leaflet DOM container */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: 620,
              minHeight: 620,
              borderRadius: 12,
              background: '#0a0e17'
            }}
          />
        </div>

        {/* Right: Selected State & City Deep Dive Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-0)' }}>
                    {currentCityData.city}
                  </h2>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: `${currentCityData.riskColor}22`,
                    color: currentCityData.riskColor,
                    border: `1px solid ${currentCityData.riskColor}44`
                  }}>
                    {currentCityData.riskTier} Risk
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                  State: <b style={{ color: 'var(--text-0)' }}>{currentCityData.state}</b> ({currentStateData.riskTier} Risk State) · {currentCityData.zone} Zone
                </div>
              </div>

              {/* City Risk Score Dial */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase' }}>City Risk Index</div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', color: currentCityData.riskColor }}>
                  {currentCityData.riskScore}<span style={{ fontSize: 13, color: 'var(--text-2)' }}>/100</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
              <div style={{ background: 'var(--bg-1)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>City Dispute Rate</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: currentCityData.riskColor, marginTop: 2 }}>
                  {currentCityData.disputeRate.toFixed(2)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  State Avg: {currentStateData.disputeRate.toFixed(1)}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-1)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Disputed Value</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--amber)', marginTop: 2 }}>
                  {fmtINR(currentCityData.disputedAmount)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  {currentCityData.disputes} chargebacks
                </div>
              </div>

              <div style={{ background: 'var(--bg-1)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Txn Volume</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>
                  {fmtINR(currentCityData.volume)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  {currentCityData.transactions} processed txns
                </div>
              </div>

              <div style={{ background: 'var(--bg-1)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 600 }}>Merchant Base</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)', marginTop: 2 }}>
                  {currentCityData.merchants}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                  {currentCityData.users} registered users
                </div>
              </div>
            </div>
          </div>

          {/* Top Merchant Categories in this City */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Top Merchant Categories</span>
              <span style={{ fontSize: 10, color: 'var(--text-2)' }}>Count & Share</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topCategories.map((cat, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text-1)' }}>{cat.name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>
                      {cat.count} ({cat.pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${cat.pct}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--purple))',
                      borderRadius: 3
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Reasons & High Severity Fraud */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Dispute Root Causes</span>
              <span style={{
                fontSize: 10,
                color: currentCityData.highSeverity > 35 ? 'var(--red)' : 'var(--amber)',
                fontWeight: 600
              }}>
                {currentCityData.highSeverity} High-Sev Cases
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topReasons.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-1)',
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-1)' }}>{r.code}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>{r.count}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-2)' }}>({r.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: 9 States Summary Cards Grid */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-0)', marginBottom: 4 }}>
          State-Level Risk & Portfolio Rollup
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 16 }}>
          Click any state card to focus and highlight its boundary on the map
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {Object.values(stateMetrics)
            .sort((a, b) => b.disputeRate - a.disputeRate)
            .map((st) => {
              const isSelected = selectedState === st.state;
              return (
                <div
                  key={st.state}
                  onClick={() => {
                    setSelectedState(st.state);
                    if (st.cities.length) setSelectedCity(st.cities[0]);
                    const c = cityMetrics[st.cities[0]];
                    if (c && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([c.lat, c.lng], 6.5, { duration: 1.2 });
                    }
                  }}
                  style={{
                    background: isSelected ? 'rgba(91,140,255,0.12)' : 'var(--bg-1)',
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{st.state}</span>
                    <span style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: `${st.riskColor}22`,
                      color: st.riskColor,
                      border: `1px solid ${st.riskColor}44`
                    }}>
                      {st.riskTier}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 8 }}>
                    Cities: {st.cities.join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-2)' }}>Dispute Rate</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: st.riskColor, fontFamily: 'var(--font-mono)' }}>
                        {st.disputeRate.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--text-2)' }}>Txn Volume</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-0)', fontFamily: 'var(--font-mono)' }}>
                        {fmtINR(st.volume)}
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
}
