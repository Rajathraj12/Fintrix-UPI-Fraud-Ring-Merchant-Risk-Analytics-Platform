import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/Nav";
import HeroRiskMap from "../components/HeroRiskMap";
import HomeCharts from "../components/HomeCharts";
import StatCard from "../components/StatCard";
import { Activity, ShieldAlert, Fingerprint, Store, Sparkles, LayoutDashboard } from "lucide-react";

/* ── REAL DATA FROM DATATHON DATASETS ── */

const txData = [
  { date: "Jan W1", txns: 1620, disputes: 210 },
  { date: "Jan W2", txns: 1780, disputes: 245 },
  { date: "Jan W3", txns: 1540, disputes: 198 },
  { date: "Feb W1", txns: 1890, disputes: 267 },
  { date: "Feb W2", txns: 1720, disputes: 230 },
  { date: "Feb W3", txns: 1950, disputes: 289 },
  { date: "Mar W1", txns: 2010, disputes: 310 },
  { date: "Mar W2", txns: 1860, disputes: 275 },
  { date: "Mar W3", txns: 1780, disputes: 248 },
  { date: "Apr W1", txns: 1690, disputes: 220 },
  { date: "Apr W2", txns: 1850, disputes: 260 },
  { date: "Apr W3", txns: 1930, disputes: 285 },
];

const merchantData = [
  { name: "Clothing", ratio: 10.4, txns: 644 },
  { name: "Telecom", ratio: 9.8, txns: 635 },
  { name: "Hotel", ratio: 11.2, txns: 622 },
  { name: "Medical", ratio: 8.6, txns: 619 },
  { name: "Grocery", ratio: 4.2, txns: 602 },
  { name: "Food", ratio: 7.5, txns: 597 },
  { name: "Books", ratio: 6.1, txns: 593 },
  { name: "Transport", ratio: 9.3, txns: 525 },
];

const features = [
  {
    icon: Activity,
    title: "UPI Transaction Analytics",
    desc: "20,000 UPI transactions cleaned and normalised — standardised amounts, timestamps, UTR numbers, and transaction statuses across SUCCESS, FAILED, and PENDING states.",
    tag: "TRANSACTIONS",
    color: "#aaff00",
  },
  {
    icon: ShieldAlert,
    title: "Chargeback Forensics",
    desc: "2,800 dispute records parsed from raw JSON. Reason codes, severity levels, and resolution statuses linked back to originating transactions and merchants.",
    tag: "DISPUTES",
    color: "#ffd60a",
  },
  {
    icon: Fingerprint,
    title: "KYC Risk Profiling",
    desc: "36,122 KYC records with PAN, Aadhaar, income, and identity verification data. Cleaned OCR errors and normalised ID formats to surface synthetic identity risk.",
    tag: "KYC",
    color: "#4d9cff",
  },
  {
    icon: Store,
    title: "Merchant Risk Intelligence",
    desc: "6,198 merchants across 10 categories profiled for chargeback ratios, settlement anomalies, and sudden velocity spikes. 560 flagged as SUSPENDED.",
    tag: "MERCHANT",
    color: "#bf5af2",
  },
  {
    icon: Sparkles,
    title: "Data Cleaning Pipeline",
    desc: "Standardised user_id/merchant_id formats, stripped currency symbols from amounts, parsed mixed timestamps, deduplicated records, and reconciled missing UTR numbers.",
    tag: "ETL",
    color: "#ff6b35",
  },
  {
    icon: LayoutDashboard,
    title: "Risk Scoring Dashboard",
    desc: "Interactive dashboard with city-level drill-down, merchant risk views, dispute trend analysis, and an AI-powered chatbot agent for natural language queries.",
    tag: "DASHBOARD",
    color: "#aaff00",
  },
];

const stats = [
  { value: 20000, suffix: "", label: "UPI Transactions" },
  { value: 2800, suffix: "", label: "Chargebacks Tracked" },
  { value: 6198, suffix: "", label: "Merchants Profiled" },
  { value: 36122, suffix: "", label: "KYC Records" },
];

const dataProblems = [
  { issue: "Missing UTR Numbers", pct: 9.8, fix: "Format validation + sequential gap-fill", color: "#ff3b30" },
  { issue: "Mixed User ID Formats", pct: 15.2, fix: "Regex normalisation → USR##### standard", color: "#ffd60a" },
  { issue: "Currency in Numeric Fields", pct: 12.6, fix: "Strip ₹/commas → float coercion → audit log", color: "#4d9cff" },
  { issue: "Mixed Timestamp Formats", pct: 8.4, fix: "Multi-format parser → ISO 8601 standard", color: "#bf5af2" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
        <div style={{ color: "#666", marginBottom: 4 }}>{label}</div>
        <div style={{ color: "#aaff00" }}>TXN: {payload[0]?.value}</div>
        <div style={{ color: "#ff3b30" }}>DSP: {payload[1]?.value}</div>
      </div>
    );
  }
  return null;
};

export default function Home() {
  const revealRef = useRef<HTMLDivElement>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  const [liveCount, setLiveCount] = useState(20000);
  const [typedText, setTypedText] = useState("");
  const fullText = "UPI Fraud Ring &\nMerchant Risk\nAnalytics Platform.";

  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3) + 1), 800);
    
    let currentIndex = 0;
    const typeTimer = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeTimer);
      }
    }, 60);

    return () => { clearInterval(t); clearInterval(typeTimer); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 400);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.1 });
    el.querySelectorAll(".reveal").forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={revealRef} style={{ background: "#000", color: "#f0f0f0", minHeight: "100vh" }}>
      <Nav />
      {/* ── HERO ── */}
      <section className="grid-bg" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(170,255,0,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "120px 24px 80px", width: "100%", position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          {/* Left copy */}
          <div>
            
            <h1 style={{ position: "relative", fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-2px", marginBottom: 24 }}>
              {typedText.split('\n').map((line, i) => (
                <span key={i} style={{ display: "block", color: i === 0 ? "#aaff00" : "#fff", animation: i === 0 ? "glow 3s ease-in-out infinite" : "none" }}>
                  {line}
                  {i === typedText.split('\n').length - 1 && typedText.length < fullText.length && <span className="typewriter-cursor"></span>}
                </span>
              ))}
              
              {glitchActive && (
                <span style={{ position: "absolute", top: 0, left: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(36px, 4.5vw, 64px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-2px", color: "#ff3b30", mixBlendMode: "screen", animation: "glitch 0.4s steps(1) forwards", opacity: 0.5 }}>
                  <span style={{ display: "block" }}>UPI Fraud Ring &</span>
                  <span style={{ display: "block" }}>Merchant Risk</span>
                  <span style={{ display: "block" }}>Analytics Platform.</span>
                </span>
              )}
            </h1>

            <p style={{ fontSize: 16, color: "#555", lineHeight: 1.75, maxWidth: 460, marginBottom: 16 }}>
              Built for the TransOrg AgentIQ Datathon — an end-to-end fraud intelligence pipeline that cleans messy UPI data, profiles merchant risk, and surfaces chargeback patterns through an interactive dashboard.
            </p>

            {/* Real data callouts */}
            <div style={{ marginBottom: 36, display: "flex", flexDirection: "column", gap: 6 }}>
              {["20,000 UPI transactions cleaned & normalised", "2,800 chargebacks linked to transactions", "6,198 merchants profiled across 10 categories"].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#444", fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ color: "#aaff00" }}>✓</span> {p}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/about" style={{ textDecoration: "none", background: "transparent", color: "#666", fontSize: 13, fontWeight: 500, padding: "13px 30px", border: "1px solid #1e1e1e", fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s", display: "inline-block" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#aaff00"; (e.currentTarget as HTMLElement).style.color = "#aaff00"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e"; (e.currentTarget as HTMLElement).style.color = "#666"; }}>
                Our Journey
              </Link>
            </div>
          </div>

          
          {/* Right: Live Risk Map */}
          <div className="reveal reveal-delay-2" style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
            <HeroRiskMap />
          </div>

        </div>

        {/* Scroll cue */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#222", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px" }}>SCROLL</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, #aaff00, transparent)" }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: "1px solid #111", borderBottom: "1px solid #111", background: "#070707" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {stats.map((s, i) => <StatCard key={i} stat={s} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "100px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#aaff00", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 14 }}>// PLATFORM CAPABILITIES</div>
          <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 700, letterSpacing: "-1px", color: "#fff", maxWidth: 560 }}>
            Every transaction. Every merchant.<br />Every dispute — analysed.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "#111" }}>
          {features.map((f, i) => (
            <div key={i} className={`reveal reveal-delay-${(i % 4) + 1}`}
              style={{ background: "#000", padding: "36px 32px", transition: "background 0.3s", cursor: "default", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#080808"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#000"; }}>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <f.icon size={22} color={f.color} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: f.color, letterSpacing: "1.5px", border: `1px solid ${f.color}33`, padding: "2px 8px" }}>{f.tag}</span>
              </div>
              <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: "#e0e0e0", marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: "#555", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MESSY DATA PANEL ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="reveal" style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#ff3b30", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
                // THE MESSY DATA CHALLENGE
              </div>
              <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", marginBottom: 12 }}>
                Synthetic chaos.<br />Real cleaning strategies.
              </h3>
              <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, marginBottom: 24 }}>
                The TransOrg AgentIQ dataset was intentionally messy — mixed ID formats (USR12345 vs usr-12345), currency symbols in numeric fields, duplicate transactions, inconsistent timestamps, and OCR errors in PAN/Aadhaar. Our ETL pipeline handles all of it.
              </p>
              {dataProblems.map((p, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#888" }}>{p.issue}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: p.color, fontWeight: 700 }}>{p.pct}% affected</span>
                  </div>
                  <div style={{ height: 3, background: "#111", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.pct * 5}%`, background: p.color, boxShadow: `0 0 6px ${p.color}66` }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#2a2a2a", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>→ {p.fix}</div>
                </div>
              ))}
            </div>

            {/* "Terminal" raw log mockup */}
            <div style={{ background: "#060606", border: "1px solid #111", padding: "20px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <div style={{ marginBottom: 14, display: "flex", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3b30", display: "inline-block" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd60a", display: "inline-block" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#aaff00", display: "inline-block" }} />
                <span style={{ marginLeft: 8, color: "#333", fontSize: 11 }}>cleaning_pipeline.log</span>
              </div>
              {[
                { raw: 'USER_ID: USR-12345 | AMT: "₹18,400" | UTR: ---', fixed: 'USR12345 · AMT: 18400.00 · UTR: gap-filled', ok: false },
                { raw: 'PAN: ABCPD1234X | AADH: 7291 4512 —————', fixed: 'AADHAAR: 729145121982 (OCR re-pass)', ok: false },
                { raw: 'TXN: TXN00011869 | STATUS: TXN_SUCCESS', fixed: 'STATUS: SUCCESS (normalised)', ok: true },
                { raw: 'MERCH: mch-7045 → MCH7045 | CAT: 5411', fixed: 'Grocery · Active · Punjab', ok: true },
                { raw: 'CBK: disputed_amt "₹ 9,200.50 INR"', fixed: 'DISPUTED: 9200.50 · REASON: SERVICE_NOT_PROVIDED', ok: false },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: 12, borderLeft: `2px solid ${row.ok ? "#aaff00" : "#ff3b30"}22`, paddingLeft: 10 }}>
                  <div style={{ color: row.ok ? "#aaff00" : "#ff3b30", opacity: 0.6, marginBottom: 2 }}>{row.raw}</div>
                  <div style={{ color: row.ok ? "#aaff00" : "#ffd60a", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10 }}>{row.ok ? "✓" : "→"}</span>
                    {row.fixed}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, borderTop: "1px solid #111", paddingTop: 10, color: "#333", fontSize: 11 }}>
                <span className="animate-blink" style={{ color: "#aaff00" }}>_</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARTS ── */}
      <div style={{ padding: "0 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <HomeCharts txData={txData} merchantData={merchantData} />
      </div>

      {/* ── DISPUTE BREAKDOWN ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="reveal" style={{ background: "#080808", border: "1px solid #1a1a1a", padding: "40px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#4d9cff", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 14 }}>
            // CHARGEBACK ANALYSIS
          </div>
          <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", marginBottom: 24 }}>
            Dispute Reason Distribution
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { reason: "Service Not Provided", count: 704, pct: 25.1, color: "#ff3b30" },
              { reason: "Customer Dispute", count: 376, pct: 13.4, color: "#ffd60a" },
              { reason: "Unauthorized Txn", count: 371, pct: 13.3, color: "#bf5af2" },
              { reason: "Duplicate Debit", count: 352, pct: 12.6, color: "#4d9cff" },
              { reason: "Account Takeover", count: 344, pct: 12.3, color: "#ff6b35" },
              { reason: "Fraud Suspected", count: 327, pct: 11.7, color: "#aaff00" },
              { reason: "Wrong Amount", count: 326, pct: 11.6, color: "#93939c" },
            ].map((d, i) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "16px", borderRadius: 6 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: d.color, letterSpacing: "1px", marginBottom: 8 }}>{d.reason.toUpperCase()}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{d.count}</div>
                <div style={{ height: 3, background: "#111", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${d.pct * 3.5}%`, background: d.color, boxShadow: `0 0 6px ${d.color}44` }} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#444" }}>{d.pct}% of disputes</div>
              </div>
            ))}
            {/* Summary card */}
            <div style={{ background: "#0a0a0a", border: "1px solid #aaff0033", padding: "16px", borderRadius: 6 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#aaff00", letterSpacing: "1px", marginBottom: 8 }}>TOTAL DISPUTED</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 900, color: "#aaff00", marginBottom: 4 }}>₹73.9L</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#444", marginBottom: 6 }}>Avg: ₹2,641 per dispute</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#ff3b30", background: "#1a0a0a", padding: "2px 6px", borderRadius: 3 }}>53.3% OPEN</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#aaff00", background: "#0a1a0a", padding: "2px 6px", borderRadius: 3 }}>30.9% CLOSED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #0f0f0f", padding: "36px 24px", background: "#000" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: "#aaff00" }}>fintrix</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#1a1a1a", letterSpacing: "1px" }}>TRANSORG AGENTIQ DATATHON 2026 · TEAM FINTRIX</div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Dashboard", "AI Agent", "About"].map(link => (
              <a key={link} href="#" style={{ textDecoration: "none", fontSize: 13, color: "#222", transition: "color 0.2s" }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = "#aaff00"}
                onMouseLeave={e => (e.target as HTMLElement).style.color = "#222"}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
