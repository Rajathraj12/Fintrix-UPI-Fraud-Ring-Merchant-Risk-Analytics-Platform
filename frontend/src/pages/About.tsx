import React, { useState, useEffect, useRef } from 'react';

// Screenshots
import imgDashOverview from '../assets/screenshots/dash_overview.png';
import imgDashMap from '../assets/screenshots/dash_map.png';
import imgDashDisputes from '../assets/screenshots/dash_disputes.png';
import imgDashMerchant from '../assets/screenshots/dash_merchant.png';
import imgDashKyc from '../assets/screenshots/dash_kyc.png';
import imgDashAI from '../assets/screenshots/dash_ai.png';
import imgWebsiteHome from '../assets/screenshots/website_home.png';
import imgWebsiteChatbot from '../assets/screenshots/website_chatbot.png';

const CHAPTERS = [
  {
    id: "problem",
    title: "The Problem",
    subtitle: "Why we started",
    text: "UPI fraud is growing rapidly across India. Investigators struggle to connect transaction data, merchant behaviour, KYC signals and dispute history into one unified view. We built Fintrix to solve exactly that.",
    image: imgWebsiteHome,
    extra: (
      <div className="flow-diagram mt-6">
        <div className="node">Fraud</div>
        <div className="arrow">→</div>
        <div className="node">No Visibility</div>
        <div className="arrow">→</div>
        <div className="node highlight">Fintrix</div>
      </div>
    )
  },
  {
    id: "data",
    title: "The Dataset",
    subtitle: "What we worked with",
    text: "We used a synthetic UPI transaction dataset of 20,000 records designed to mirror real-world payment ecosystems — covering transactions, merchants, customers and disputes.",
    image: imgDashOverview,
    extra: (
      <div className="metrics-grid mt-6">
        <div className="metric"><strong>20,000</strong><small>TRANSACTIONS</small></div>
        <div className="metric"><strong>85.17%</strong><small>SUCCESS RATE</small></div>
        <div className="metric"><strong>9.78%</strong><small>FAILURE RATE</small></div>
        <div className="metric"><strong>₹12,487</strong><small>AVG AMOUNT</small></div>
      </div>
    )
  },
  {
    id: "eda",
    title: "EDA & Analysis",
    subtitle: "Understanding the data",
    text: "We performed exploratory data analysis to understand transaction distribution, failure rates, chargeback patterns and merchant risk tiers before building anything.",
    image: imgDashDisputes,
    extra: (
      <div className="feature-list mt-6">
        <div className="item"><b>01.</b> Transaction amount & status distributions</div>
        <div className="item"><b>02.</b> Merchant category and chargeback patterns</div>
        <div className="item"><b>03.</b> Customer failure rate and KYC completeness</div>
        <div className="item"><b>04.</b> City-level and time-series risk trends</div>
      </div>
    )
  },
  {
    id: "pipeline",
    title: "Data Pipeline",
    subtitle: "ETL & preparation",
    text: "Raw CSV data was cleaned, validated and loaded into a structured in-memory store. Merchants, customers and transactions were cross-linked for analytics queries.",
    image: imgDashOverview,
    extra: (
      <>
        <div className="flow-diagram mt-6">
          <div className="node">CSV Load</div><div className="arrow">→</div>
          <div className="node">Clean</div><div className="arrow">→</div>
          <div className="node">Cross-link</div><div className="arrow">→</div>
          <div className="node highlight">FastAPI</div>
        </div>
        <div className="feature-list mt-4">
          <div className="item"><b>Stack:</b> Python · Pandas · FastAPI</div>
          <div className="item"><b>Endpoints:</b> /api/chat · /api/analytics</div>
        </div>
      </>
    )
  },
  {
    id: "risk",
    title: "Risk Engine",
    subtitle: "Heuristic scoring — no ML",
    text: "Instead of a black-box ML model, we built a transparent heuristic risk engine. Each transaction is scored based on explainable rules tied to real fraud signals.",
    image: imgDashMerchant,
    extra: (
      <div className="feature-list mt-6">
        <div className="item"><b>Rule 01</b> Transaction amount vs. merchant average</div>
        <div className="item"><b>Rule 02</b> High chargeback merchant flag</div>
        <div className="item"><b>Rule 03</b> Customer failure rate threshold</div>
        <div className="item"><b>Rule 04</b> Incomplete KYC verification</div>
        <div className="item"><b>Rule 05</b> Dispute history spike detection</div>
      </div>
    )
  },
  {
    id: "agent",
    title: "Fintrix AI Agent",
    subtitle: "Local LLM + tools",
    text: "We built an agentic AI using Ollama (llama3.2) running fully locally. The agent calls deterministic analytics tools and returns structured, evidence-backed answers.",
    image: imgDashAI,
    extra: (
      <div className="feature-list mt-6">
        <div className="item"><b>LLM:</b> Ollama · llama3.2 · runs fully locally</div>
        <div className="item"><b>Tools:</b> Analytics integration via function calling</div>
        <div className="item highlight"><b>100% private & offline. No cloud API keys.</b></div>
      </div>
    )
  },
  {
    id: "dashboard",
    title: "Analytics Dashboard",
    subtitle: "5 interactive views",
    text: "A React dashboard gives investigators 5 interactive views — Overview, City Risk Map, Disputes, Merchant Intelligence and KYC Data Quality — all wired to live data.",
    image: imgDashMap,
    extra: (
      <div className="feature-list mt-6">
        <div className="item"><b>01.</b> Overview — KPIs, trends, volume charts</div>
        <div className="item"><b>02.</b> India City Risk Map — geographic heatmap</div>
        <div className="item"><b>03.</b> Disputes & Chargebacks — reason codes</div>
        <div className="item"><b>04.</b> Merchant Intelligence — risk tiers</div>
        <div className="item"><b>05.</b> KYC & Data Quality — identity integrity</div>
      </div>
    )
  },
  {
    id: "website",
    title: "The Website",
    subtitle: "Public-facing product",
    text: "The public website introduces Fintrix, demonstrates the AI chatbot and routes users to the full analytics dashboard — built with React, Vite and TypeScript.",
    image: imgWebsiteChatbot,
    extra: (
      <div className="feature-list mt-6">
        <div className="item"><b>Home</b> — Hero, features, live chatbot preview</div>
        <div className="item"><b>About</b> — This scrollytelling investigation journey</div>
        <div className="item"><b>Chatbot</b> — Live AI agent powered by llama3.2</div>
      </div>
    )
  }
];

export default function About() {
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1) setActiveIdx(idx);
        }
      });
    }, observerOptions);

    sectionRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  // Calculate progress for the timeline line
  const progressPercentage = (activeIdx / (CHAPTERS.length - 1)) * 100;

  return (
    <div className="about-scrolly">
      <style>{`
        .about-scrolly {
          position: relative;
          background: #000;
          color: #fff;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }

        /* Fixed Background that Crossfades */
        .fixed-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .bg-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center top;
          opacity: 0;
          transition: opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 10s ease-out;
          transform: scale(1.05);
          filter: blur(12px) brightness(0.3) saturate(1.2);
        }

        .bg-layer.active {
          opacity: 1;
          transform: scale(1);
        }
        
        .bg-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, #000 90%);
          z-index: 1;
        }

        /* Scrolling Content */
        .scroll-container {
          position: relative;
          z-index: 10;
          padding: 120px 0 120px;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 80px;
        }

        /* Timeline Track */
        .timeline-container {
          position: sticky;
          top: 50vh;
          transform: translateY(-50%);
          height: 80vh;
          width: 60px;
          display: flex;
          justify-content: center;
          margin-left: 40px;
        }

        .timeline-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .timeline-progress {
          position: absolute;
          top: 0;
          width: 2px;
          background: linear-gradient(180deg, transparent, #aaff00, #aaff00);
          box-shadow: 0 0 15px #aaff00;
          border-radius: 2px;
          transition: height 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .timeline-nodes {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-node {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #000;
          border: 2px solid rgba(255,255,255,0.2);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .timeline-node.active {
          border-color: #aaff00;
          box-shadow: 0 0 20px rgba(170, 255, 0, 0.5);
          transform: scale(1.4);
        }

        .timeline-node.active::after {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #aaff00;
        }
        
        .timeline-node.past {
          border-color: rgba(170, 255, 0, 0.5);
          background: rgba(170, 255, 0, 0.2);
        }

        /* Sections */
        .sections-wrapper {
          flex: 1;
          padding-right: 40px;
        }

        .chapter-section {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 80px 0;
        }

        .glass-card {
          background: rgba(10, 10, 12, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 60px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform: translateY(40px);
          opacity: 0.2;
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(170,255,0,0.5), transparent);
          opacity: 0;
          transition: opacity 1s;
        }

        .glass-card.in-view {
          transform: translateY(0);
          opacity: 1;
        }
        
        .glass-card.in-view::before {
          opacity: 1;
        }

        .chapter-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          color: #aaff00;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .chapter-eyebrow::before {
          content: '';
          width: 30px;
          height: 1px;
          background: #aaff00;
        }

        .chapter-title {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin: 0 0 24px 0;
          line-height: 1.1;
          color: #fff;
        }

        .chapter-text {
          font-size: 18px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 32px;
          max-width: 600px;
        }

        /* Extra Elements */
        .mt-6 { margin-top: 32px; }
        .mt-4 { margin-top: 16px; }

        .flow-diagram {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .flow-diagram .node {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .flow-diagram .node.highlight {
          background: rgba(170, 255, 0, 0.1);
          border-color: #aaff00;
          color: #aaff00;
        }
        
        .flow-diagram .arrow {
          color: rgba(255, 255, 255, 0.3);
          font-size: 20px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .metric {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
        }
        
        .metric strong {
          display: block;
          font-size: 32px;
          color: #aaff00;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 4px;
        }
        
        .metric small {
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.1em;
          font-size: 11px;
          font-weight: 700;
        }

        .feature-list {
          display: grid;
          gap: 12px;
        }
        
        .feature-list .item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 20px;
          border-radius: 8px;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .feature-list .item b {
          color: #aaff00;
          margin-right: 8px;
        }
        
        .feature-list .item.highlight {
          background: rgba(170, 255, 0, 0.05);
          border-color: rgba(170, 255, 0, 0.3);
        }

        @media(max-width: 900px) {
          .scroll-container { gap: 20px; padding: 60px 20px; }
          .timeline-container { display: none; }
          .glass-card { padding: 30px; }
          .chapter-title { font-size: 32px; }
          .chapter-text { font-size: 16px; }
        }
      `}</style>

      {/* Crossfading Backgrounds */}
      <div className="fixed-bg">
        {CHAPTERS.map((ch, i) => (
          <div 
            key={`bg-${ch.id}`} 
            className={`bg-layer ${i === activeIdx ? 'active' : ''}`} 
            style={{ backgroundImage: `url(${ch.image})` }} 
          />
        ))}
        <div className="bg-vignette" />
      </div>

      <div className="scroll-container">
        
        {/* Left Timeline Track */}
        <div className="timeline-container">
          <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="timeline-line" />
            <div className="timeline-progress" style={{ height: `${progressPercentage}%` }} />
            <div className="timeline-nodes">
              {CHAPTERS.map((ch, i) => (
                <div 
                  key={`node-${ch.id}`} 
                  className={`timeline-node ${i === activeIdx ? 'active' : ''} ${i < activeIdx ? 'past' : ''}`}
                  onClick={() => {
                    const el = sectionRefs.current[i];
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Sections */}
        <div className="sections-wrapper">
          {CHAPTERS.map((ch, i) => (
            <div 
              key={ch.id} 
              id={ch.id}
              className="chapter-section" 
              ref={(el) => { sectionRefs.current[i] = el; }}
            >
              <div className={`glass-card ${i === activeIdx ? 'in-view' : ''}`}>
                <div className="chapter-eyebrow">
                  Phase 0{i + 1} — {ch.subtitle}
                </div>
                <h2 className="chapter-title">{ch.title}</h2>
                <p className="chapter-text">{ch.text}</p>
                {ch.extra}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
