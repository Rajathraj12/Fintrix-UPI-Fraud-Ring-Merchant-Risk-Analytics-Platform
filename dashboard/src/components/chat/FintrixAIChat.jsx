import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../services/fintrixApi";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Lightweight markdown renderer: bold, bullet points, line breaks
function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} style={{ margin: "6px 0 6px 4px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^[\*\+\-]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[\*\+\-]\s+/, ""));
      return;
    }
    flushList(`list-${idx}`);
    if (trimmed === "") {
      elements.push(<div key={idx} style={{ height: 6 }} />);
    } else {
      elements.push(
        <p key={idx} style={{ margin: 0, lineHeight: 1.7, fontSize: 14, color: "#ddd" }}>
          {renderInline(trimmed)}
        </p>
      );
    }
  });
  flushList("list-end");
  return <>{elements}</>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function FintrixAIChat({ onNavigate = null }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);
  const [sessionId] = useState(() => 'dashboard-' + Math.random().toString(36).substring(2, 9));

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I'm Fintrix's fraud intelligence agent.\n\nI can answer questions about UPI fraud rings, synthetic identity detection, merchant chargeback analytics, and our ETL data pipeline.\n\nTry one of the suggested queries below or ask your own question.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showSuggestions: true
    }
  ]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = {
      role: "user",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text.trim(), sessionId, {});
      
      let textToShow = response.answer;
      if (!response.success && response.error) {
        textToShow = `Error: ${response.error.message}`;
      } else if (!textToShow) {
        textToShow = "I'm sorry, I couldn't process that.";
      }

      const botMsg = {
        role: "bot",
        text: textToShow,
        chart: response.data,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showSuggestions: false
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: "bot",
        text: "Error communicating with Fintrix AI backend.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div style={{ background: "transparent", color: "#f0f0f0", height: "100%", width: "100%", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr", gap: 24, height: "100%" }}>
        
        {/* LEFT COLUMN - CHAT INTERFACE */}
        <div style={{ background: "#0a0c10", border: "1px solid #1e2025", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2025", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", border: "2px solid #aaff00", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, background: "#aaff00", borderRadius: "50%", border: "2px solid #0a0c10" }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 2 }}>Fintrix AI Agent</div>
                <div style={{ fontSize: 12, color: "#aaff00", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#aaff00" }} />
                  Online • UPI Fraud Intelligence
                </div>
              </div>
            </div>

          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 12 }}>
                
                <div style={{ display: "flex", gap: 12, maxWidth: "85%", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  {msg.role === "bot" ? (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #aaff00", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>🤖</span>
                    </div>
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ background: msg.role === "user" ? "#15181e" : "#0e1116", border: `1px solid ${msg.role === "user" ? "#2a2d35" : "#1e2025"}`, borderRadius: 12, padding: "14px 16px" }}>
                      {msg.role === "bot" ? renderMarkdown(msg.text) : (
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#ddd" }}>{msg.text}</p>
                      )}
                      
                      {msg.chart && msg.chart.type && Array.isArray(msg.chart.data) && (
                        <div style={{ marginTop: 16, height: 250, width: "100%", background: "#111", borderRadius: 8, padding: 12, border: "1px solid #2a2d35" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            {msg.chart.type === "bar" ? (
                              <BarChart data={msg.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey={msg.chart.x_key || "name"} stroke="#777" fontSize={10} tickLine={false} />
                                <YAxis stroke="#777" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#222'}} contentStyle={{background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12}} />
                                <Bar dataKey={msg.chart.y_key || "value"} fill={msg.chart.color || "#aaff00"} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            ) : msg.chart.type === "line" ? (
                              <LineChart data={msg.chart.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey={msg.chart.x_key || "name"} stroke="#777" fontSize={10} tickLine={false} />
                                <YAxis stroke="#777" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12}} />
                                <Line type="monotone" dataKey={msg.chart.y_key || "value"} stroke={msg.chart.color || "#00e5ff"} strokeWidth={3} dot={{ r: 4, fill: '#111', strokeWidth: 2 }} />
                              </LineChart>
                            ) : msg.chart.type === "scatter" ? (
                              <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey={msg.chart.x_key || "x"} type="number" stroke="#777" fontSize={10} />
                                <YAxis dataKey={msg.chart.y_key || "y"} type="number" stroke="#777" fontSize={10} />
                                <Tooltip contentStyle={{background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12}} />
                                <Scatter data={msg.chart.data} fill={msg.chart.color || "#ff6b35"} />
                              </ScatterChart>
                            ) : null}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {msg.showSuggestions && (
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                        {[
                          "Which merchant category has the highest chargeback ratio?",
                          "Why is TXN00011869 risky?",
                          "Which customers have the most failed transactions?",
                          "Give me a financial risk summary of the entire dataset."
                        ].map(q => (
                          <button key={q} onClick={() => handleSendMessage(q)} style={{ background: "#111", border: "1px solid #2a2d35", borderRadius: 8, padding: "10px 14px", color: "#bbb", fontSize: 12, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flex: "1 1 200px" }}>
                            {q}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaff00" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#555", marginTop: -8, marginLeft: msg.role === "bot" ? 56 : 0, marginRight: msg.role === "user" ? 56 : 0 }}>
                  {msg.time}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #aaff00", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                </div>
                <div style={{ background: "#0e1116", border: "1px solid #1e2025", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#aaff00", display: "inline-block", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            )}
            <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
            
            <div ref={chatBottomRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #1e2025", background: "#0a0c10" }}>
            <div style={{ background: "#111", border: "1px solid #2a2d35", borderRadius: 12, display: "flex", alignItems: "center", padding: "8px 12px", gap: 12 }}>

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(input); }}
                placeholder="Ask anything about your data..."
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 14, outline: "none" }}
              />
              <button onClick={() => handleSendMessage(input)} style={{ background: "#aaff00", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

        </div>



      </div>
    </div>
  );
}
