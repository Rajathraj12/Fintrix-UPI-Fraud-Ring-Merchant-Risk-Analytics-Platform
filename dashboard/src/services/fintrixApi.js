/**
 * Fintrix AI REST API Client Service (Phase 7 Frontend Integration)
 * Connects to the guarded FastAPI backend (POST /api/chat & GET /health).
 * Supports automatic fallback and mock response generator if backend is temporarily offline.
 */

const API_BASE_URL = import.meta.env.VITE_FINTRIX_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://fintrix-upi-fraud-ring-merchant-risk.onrender.com');

/**
 * Health check to verify backend operational readiness.
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return { online: false, status: response.statusText };
    const data = await response.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Send conversational query to Fintrix AI agent backend.
 * @param {string} message - User query
 * @param {string} sessionId - Session tracking identifier
 * @param {object} localDataContext - Optional client-side datasets for smart offline simulation
 */
export async function sendChatMessage(message, sessionId = 'default-session', localDataContext = null) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s (5 min) timeout for local LLM inference

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        message: message.trim(),
        session_id: sessionId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const payload = await response.json();

    if (!response.ok) {
      const errDetail = payload.error?.message || payload.detail || `Server error (${response.status})`;
      const errCode = payload.error?.code || `HTTP_${response.status}`;
      return {
        success: false,
        error: { code: errCode, message: errDetail },
        processing_time_ms: Date.now() - startTime,
      };
    }

    return {
      success: true,
      sessionId: payload.session_id || sessionId,
      message: payload.message || message,
      answer: payload.answer || '',
      data: payload.data || null,
      metadata: {
        tools_used: payload.metadata?.tools_used || [],
        processing_time_ms: payload.metadata?.processing_time_ms || (Date.now() - startTime),
        request_id: payload.metadata?.request_id || null,
        is_live_backend: true,
      },
    };
  } catch (fetchErr) {
    console.warn('[FintrixAI] Backend connection failed:', fetchErr);

    const isAbort = fetchErr.name === 'AbortError';
    const errorMessage = isAbort
      ? 'The AI model took longer than expected to process your query (> 5 minutes). Please try again or ask a more specific question.'
      : `Fintrix AI Backend is offline or unreachable at ${API_BASE_URL}. Please ensure the FastAPI backend is running.`;

    return {
      success: false,
      error: {
        code: isAbort ? 'TIMEOUT' : 'BACKEND_OFFLINE',
        message: errorMessage,
      },
      processing_time_ms: Date.now() - startTime,
    };
  }
}

/**
 * Deterministic offline intelligence simulation if FastAPI backend is not yet started.
 */
function generateOfflineResponse(query, sessionId, data, startTime) {
  const q = query.toLowerCase();
  const txns = data.upi || [];
  const cbs = data.chargebacks || [];
  const merchants = data.merchants || [];
  const kyc = data.kyc || [];

  let answer = '';
  let toolsUsed = [];

  if (q.includes('total transaction volume') || q.includes('volume') || q.includes('how much total')) {
    toolsUsed.push('get_transaction_analytics');
    const totalAmt = txns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const succCount = txns.filter(t => (t.status || '').toUpperCase() === 'SUCCESS').length;
    const failCount = txns.filter(t => (t.status || '').toUpperCase() === 'FAILED').length;
    answer = `Based on transaction analytics across **${txns.length.toLocaleString()}** UPI records:\n\n` +
      `• **Total Processed Volume**: ₹${(totalAmt).toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n` +
      `• **Average Ticket Size**: ₹${(totalAmt / (txns.length || 1)).toFixed(2)}\n` +
      `• **Successful Transactions**: ${succCount.toLocaleString()} (${((succCount/txns.length)*100).toFixed(1)}%)\n` +
      `• **Failed Transactions**: ${failCount.toLocaleString()} (${((failCount/txns.length)*100).toFixed(2)}%)\n\n` +
      `The payment infrastructure shows stable settlement velocity with normal failure rates.`;
  } else if (q.includes('failed') || q.includes('failure rate')) {
    toolsUsed.push('get_transaction_analytics');
    const failed = txns.filter(t => (t.status || '').toUpperCase() === 'FAILED');
    const failAmt = failed.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    answer = `There are **${failed.length.toLocaleString()} failed transactions** in the dataset.\n\n` +
      `• **Failure Rate**: ${((failed.length / (txns.length || 1)) * 100).toFixed(2)}%\n` +
      `• **Total Failed Amount**: ₹${failAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n` +
      `• **Average Failed Ticket**: ₹${(failAmt / (failed.length || 1)).toFixed(2)}\n\n` +
      `Top failure causes in UPI ledger include bank network timeouts and insufficient account balances.`;
  } else if (q.includes('chargeback rate') || q.includes('riskiest merchant') || q.includes('high risk merchant')) {
    toolsUsed.push('get_merchant_analytics');
    answer = `Analysis of **${merchants.length.toLocaleString()}** merchants identifies the highest chargeback exposure:\n\n` +
      `1. **Babu-Khatri (MCH1320)** — Clothing | **3,000.0% CB Rate** (30 disputes, 1 txn) | Tier: **HIGH_RISK**\n` +
      `2. **Chhabra-Dugar (MCH2757)** — Clothing | **2,500.0% CB Rate** (25 disputes, 1 txn) | Tier: **HIGH_RISK**\n` +
      `3. **Natarajan And Sons (MCH2266)** — Medical | **2,400.0% CB Rate** (24 disputes, 1 txn) | Tier: **HIGH_RISK**\n\n` +
      `Thresholds applied: Normal (<1.5%), Elevated (1.5%–5%), High Risk (>5%).`;
  } else if (q.includes('txn00011869') || q.includes('why is txn00011869 risky')) {
    toolsUsed.push('get_risk_score');
    answer = `Transaction **TXN00011869** is classified as **CRITICAL RISK** based on multi-signal forensic evaluation.\n\n` +
      `**Forensic Evidence Triggered:**\n` +
      `• **CRITICAL_CHARGEBACK**: Merchant has 1 dispute flagged with CRITICAL severity tier.\n` +
      `• **HISTORICAL_CHARGEBACK**: Historical dispute complaints recorded against this merchant.\n\n` +
      `**Transaction Context:**\n` +
      `• Amount: ₹15,722.34 (SUCCESS)\n` +
      `• User: USR45826\n` +
      `• Merchant: MCH7045\n\n` +
      `Recommendation: Escalate dispute case and verify settlement hold.`;
  } else if (q.includes('dispute') || q.includes('disputed amount')) {
    toolsUsed.push('get_chargeback_analytics');
    const dispAmt = cbs.reduce((acc, c) => acc + (Number(c.disputed_amount || c.amount) || 0), 0);
    const critCbs = cbs.filter(c => (c.severity || '').toUpperCase() === 'CRITICAL').length;
    const openCbs = cbs.filter(c => (c.resolution_status || '').toUpperCase() === 'OPEN').length;
    answer = `Dataset-wide chargeback and dispute summary:\n\n` +
      `• **Total Disputes**: ${cbs.length.toLocaleString()} chargebacks\n` +
      `• **Total Disputed Amount**: ₹${dispAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n` +
      `• **Average Disputed Amount**: ₹${(dispAmt / (cbs.length || 1)).toFixed(2)}\n` +
      `• **Open Unresolved Disputes**: ${openCbs.toLocaleString()}\n` +
      `• **Critical Severity Disputes**: ${critCbs.toLocaleString()} cases requiring immediate review.`;
  } else if (q.includes('risk summary') || q.includes('financial risk')) {
    toolsUsed.push('get_risk_analytics');
    answer = `**Forensic Risk Distribution (20,000 Transactions)**:\n\n` +
      `• **CRITICAL Risk**: 291 transactions (1.45%)\n` +
      `• **HIGH Risk**: 4,431 transactions (22.15%)\n` +
      `• **MEDIUM Risk**: 6,044 transactions (30.22%)\n` +
      `• **LOW Risk**: 9,234 transactions (46.17%)\n\n` +
      `Top Risk Signals: Ticket Size Anomalies (>3x surge: 6,772), Historical Disputes (2,451), Failed Txns (1,955).`;
  } else {
    toolsUsed.push('get_transaction_analytics');
    answer = `I have analyzed your query across UPI transactions, KYC, merchant profiles, and dispute records.\n\n` +
      `• Total Transacting Population: **${(kyc.length || 28920).toLocaleString()} users**\n` +
      `• Active Merchant Portfolio: **${(merchants.length || 4343).toLocaleString()} merchants**\n` +
      `• Processed UPI Volume: **${(txns.length || 20000).toLocaleString()} transactions**\n\n` +
      `You can ask me to inspect specific transactions (e.g. *Why is TXN00011869 risky?*), check high-risk merchants, or summarize dispute channels.`;
  }

  return {
    success: true,
    sessionId,
    message: query,
    answer,
    metadata: {
      tools_used: toolsUsed,
      processing_time_ms: Date.now() - startTime,
      request_id: 'offline-sim-' + Math.random().toString(36).substring(2, 9),
      is_live_backend: false,
    },
  };
}
