import React, { useMemo } from 'react';
import KPICard from './KPICard';
import RiskCard from './RiskCard';
import EvidenceCard from './EvidenceCard';
import ToolActivity from './ToolActivity';
import DashboardLink from './DashboardLink';

/**
 * Parses markdown-like text and extracts structured cards for telemetry presentation.
 */
export default function AIMessage({
  answer,
  toolsUsed = [],
  processingTimeMs = null,
  timestamp = null,
  llmMode = 'mock',
  responseType = 'text',
  data = null,
  onNavigate = null,
}) {
  // Parse answer text for risk keywords, amounts, and structured entities
  const structuredData = useMemo(() => {
    const text = answer || '';
    const upperText = text.toUpperCase();

    // 1. Detect Risk Level
    let detectedRisk = null;
    if (upperText.includes('CRITICAL RISK') || upperText.includes('CLASSIFIED AS CRITICAL') || upperText.includes('SEVERITY: CRITICAL')) {
      detectedRisk = 'CRITICAL';
    } else if (upperText.includes('HIGH RISK') || upperText.includes('HIGH_RISK') || upperText.includes('SEVERITY: HIGH')) {
      detectedRisk = 'HIGH';
    } else if (upperText.includes('MEDIUM RISK') || upperText.includes('MEDIUM_RISK')) {
      detectedRisk = 'MEDIUM';
    }

    // 2. Extract Txn ID if present
    const txnMatch = text.match(/TXN\d{8}/i);
    const txnId = txnMatch ? txnMatch[0].toUpperCase() : null;

    // 3. Extract Signals if present
    const signals = [];
    if (upperText.includes('HISTORICAL_CHARGEBACK') || upperText.includes('HISTORICAL CHARGEBACK')) signals.push('HISTORICAL_CHARGEBACK');
    if (upperText.includes('CRITICAL_CHARGEBACK') || upperText.includes('CRITICAL CHARGEBACK')) signals.push('CRITICAL_CHARGEBACK');
    if (upperText.includes('SUSPENDED_MERCHANT') || upperText.includes('SUSPENDED MERCHANT')) signals.push('SUSPENDED_MERCHANT');
    if (upperText.includes('TICKET_SIZE_ANOMALY') || upperText.includes('TICKET SIZE ANOMALY')) signals.push('TICKET_SIZE_ANOMALY');
    if (upperText.includes('HIGH_RISK_KYC') || upperText.includes('HIGH RISK KYC')) signals.push('HIGH_RISK_KYC');
    if (upperText.includes('TRANSACTION_FAILED') || upperText.includes('FAILED STATUS')) signals.push('TRANSACTION_FAILED');

    // 4. Extract Amount if present
    const amtMatch = text.match(/₹[\d,.]+(\s*(?:Cr|L|K|Crore|Lakh))?/i) || text.match(/INR\s*[\d,.]+/i);
    const detectedAmount = amtMatch ? amtMatch[0] : null;

    // 5. Extract KPI metric items for analytical responses
    const kpiCards = [];
    if (upperText.includes('TOTAL PROCESSED VOLUME') || upperText.includes('TOTAL TRANSACTION VOLUME') || upperText.includes('TOTAL VOLUME')) {
      if (detectedAmount) {
        kpiCards.push({ label: 'Total Volume', value: detectedAmount, variant: 'lime', icon: '₹' });
      }
    }
    const failRateMatch = text.match(/(\d+\.?\d*%\s*(?:failure\s*rate)?)/i);
    if (failRateMatch && (upperText.includes('FAILURE RATE') || upperText.includes('FAILED TRANSACTIONS'))) {
      const rateVal = text.match(/(\d+\.\d+%)/);
      if (rateVal) {
        kpiCards.push({ label: 'Failure Rate', value: rateVal[0], variant: 'red', subtext: 'UPI Ledger Declines' });
      }
    }
    if (upperText.includes('TOTAL DISPUTES') || upperText.includes('DISPUTED AMOUNT')) {
      const dispAmtMatch = text.match(/Total Disputed Amount[:\s*]+(₹[\d,.]+)/i) || text.match(/(₹[\d,.]+)\s*(?:across|in disputes)/i);
      if (dispAmtMatch) {
        kpiCards.push({ label: 'Disputed Total', value: dispAmtMatch[1], variant: 'amber', icon: '⚠️' });
      }
    }

    return {
      detectedRisk,
      txnId,
      signals,
      detectedAmount,
      kpiCards,
    };
  }, [answer]);

  // Format basic bold and list markdown into styled spans/paragraphs
  const formattedContent = useMemo(() => {
    if (!answer) return null;

    const lines = answer.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} style={{ height: '8px' }} />;
      }

      // Check if line is a bullet
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
      const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed;

      // Simple parser for **bold** text
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} style={{ color: 'var(--text-0)', fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '3px 0' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 800 }}>•</span>
            <div style={{ color: 'var(--text-1)', fontSize: '13.5px', lineHeight: 1.5 }}>
              {renderedParts}
            </div>
          </div>
        );
      }

      return (
        <p key={idx} style={{ margin: '4px 0', color: 'var(--text-1)', fontSize: '13.5px', lineHeight: 1.55 }}>
          {renderedParts}
        </p>
      );
    });
  }, [answer]);

  return (
    <div
      className="fintrix-ai-message-card"
      style={{
        margin: '16px 0',
        padding: '16px 20px',
        background: 'linear-gradient(145deg, rgba(20, 24, 32, 0.95), rgba(15, 18, 24, 0.85))',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        borderRadius: '4px 16px 16px 16px',
        boxShadow: '0 6px 24px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        maxWidth: '92%',
      }}
    >
      {/* Header Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: 'var(--accent)',
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '11px',
              fontFamily: 'var(--font-display)',
            }}
          >
            ✦
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '12px', color: 'var(--text-0)', letterSpacing: '0.4px' }}>
            FINTRIX AI INTELLIGENCE
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9.5px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '3px',
              background: llmMode === 'live' ? 'rgba(180, 243, 41, 0.15)' : 'rgba(255, 184, 52, 0.15)',
              color: llmMode === 'live' ? 'var(--accent)' : 'var(--amber)',
              border: llmMode === 'live' ? '1px solid rgba(180, 243, 41, 0.3)' : '1px solid rgba(255, 184, 52, 0.3)',
            }}
          >
            {llmMode === 'live' ? '● LIVE LLM' : '⚙ DEV MOCK / DETERMINISTIC'}
          </span>
        </div>

        {/* Tools Invoked Telemetry */}
        {toolsUsed && toolsUsed.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {toolsUsed.map((tool, tIdx) => (
              <ToolActivity key={tIdx} toolName={tool} latencyMs={processingTimeMs} />
            ))}
          </div>
        )}
      </div>

      {/* Development Mock Mode Notification Banner if applicable */}
      {llmMode === 'mock' && (
        <div
          style={{
            background: 'rgba(255, 184, 52, 0.08)',
            border: '1px solid rgba(255, 184, 52, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            marginBottom: '10px',
            fontSize: '11px',
            color: 'var(--amber)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>⚡</span>
          <span>DEV MODE: Deterministic engine & live dataset calculation active (LLM credits offline).</span>
        </div>
      )}

      {/* Main Formatted Explanation */}
      <div className="fintrix-ai-body" style={{ margin: '8px 0' }}>
        {formattedContent}
      </div>

      {/* KPI Telemetry Cards Row */}
      {structuredData.kpiCards && structuredData.kpiCards.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '12px 0 6px 0' }}>
          {structuredData.kpiCards.map((kpi, kIdx) => (
            <KPICard
              key={kIdx}
              label={kpi.label}
              value={kpi.value}
              subtext={kpi.subtext}
              variant={kpi.variant}
              icon={kpi.icon}
            />
          ))}
        </div>
      )}

      {/* Forensic Risk Card if Detected */}
      {structuredData.detectedRisk && (
        <RiskCard
          riskLevel={structuredData.detectedRisk}
          signals={structuredData.signals}
          amount={structuredData.detectedAmount}
          txnId={structuredData.txnId}
        />
      )}

      {/* Deep-Link Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
        {structuredData.txnId && (
          <DashboardLink
            label={`Investigate ${structuredData.txnId}`}
            pageId="dispute"
            icon="🔍"
            onClick={() => onNavigate && onNavigate('dispute')}
          />
        )}
        <DashboardLink
          label="View Disputes & Chargebacks"
          pageId="dispute"
          icon="⚡"
          onClick={() => onNavigate && onNavigate('dispute')}
        />
        <DashboardLink
          label="Merchant Risk Analytics"
          pageId="merchant"
          icon="🏪"
          onClick={() => onNavigate && onNavigate('merchant')}
        />
        <DashboardLink
          label="India City Hotspots"
          pageId="map"
          icon="🗺️"
          onClick={() => onNavigate && onNavigate('map')}
        />
        <DashboardLink
          label="KYC & Integrity"
          pageId="integrity"
          icon="🛡️"
          onClick={() => onNavigate && onNavigate('integrity')}
        />
      </div>

      {/* Footer Details */}
      {(processingTimeMs || timestamp) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', fontSize: '10.5px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
          {processingTimeMs && <span>Latency: {processingTimeMs}ms</span>}
          {timestamp && <span>{timestamp}</span>}
        </div>
      )}
    </div>
  );
}
