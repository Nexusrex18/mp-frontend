"use client";

import { Brain, TrendingUp, BarChart3, Lightbulb } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   Admin — Demand Intelligence (Phase 8 — Optional Module)
   
   Purpose: Read-only display of the off-chain AI pipeline's output.
   Data in: reads from SupplyManager.sol (values written by the
            separate Python pipeline — out of scope for this frontend).
   Data out: NONE — display only, never writes to core state.
   Isolation rule: no other page depends on this existing.
----------------------------------------------------------------*/

const FORECAST_DATA = [
  { drug: "Amoxicillin 500mg", current: 2400, predicted: 3100, change: "+29%", trend: "up" },
  { drug: "Paracetamol 650mg", current: 8900, predicted: 7200, change: "-19%", trend: "down" },
  { drug: "Metformin 850mg", current: 1200, predicted: 1500, change: "+25%", trend: "up" },
  { drug: "Ibuprofen 400mg", current: 5600, predicted: 6100, change: "+9%", trend: "up" },
  { drug: "Azithromycin 500mg", current: 800, predicted: 1100, change: "+38%", trend: "up" },
];

const SENTIMENT_DATA = [
  { topic: "Supply reliability", score: 78, label: "Positive" },
  { topic: "Drug quality perception", score: 85, label: "Positive" },
  { topic: "Counterfeit concerns", score: 42, label: "Negative" },
  { topic: "Pricing fairness", score: 61, label: "Neutral" },
];

const QUOTA_SUGGESTIONS = [
  { drug: "Amoxicillin 500mg", currentQuota: 2500, suggestedQuota: 3200, reason: "Seasonal demand spike predicted (monsoon season)" },
  { drug: "Paracetamol 650mg", currentQuota: 9000, suggestedQuota: 7500, reason: "Declining demand trend; reduce to avoid overstock" },
  { drug: "Azithromycin 500mg", currentQuota: 900, suggestedQuota: 1200, reason: "Rising respiratory illness reports in region" },
];

export default function AdminIntelligencePage() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
          <Brain size={20} color={COLORS.indigo} />
          <div
            className="mt-mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.indigo,
              background: "rgba(62,54,176,0.08)",
              padding: "3px 10px",
              borderRadius: 999,
            }}
          >
            OPTIONAL MODULE
          </div>
        </div>
        <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
          Demand Intelligence
        </h1>
        <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
          AI-generated forecasts, sentiment trends, and supply quota suggestions.
          This module is read-only and does not affect core supply chain operations.
        </p>
      </div>

      <div className="grid lg:grid-cols-2" style={{ gap: 20, marginBottom: 24 }}>
        {/* Demand Forecast */}
        <div
          style={{
            border: "1px solid rgba(17,17,17,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center"
            style={{
              padding: "16px 20px",
              gap: 8,
              borderBottom: "1px solid rgba(17,17,17,0.06)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <TrendingUp size={16} color={COLORS.indigo} /> Demand Forecast
            <span className="mt-mono mt-text-muted" style={{ fontSize: 11, marginLeft: "auto" }}>
              CNN-LSTM Model
            </span>
          </div>
          {FORECAST_DATA.map((item) => (
            <div
              key={item.drug}
              className="flex items-center justify-between"
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid rgba(17,17,17,0.04)",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.drug}</div>
                <div className="mt-text-muted" style={{ fontSize: 12 }}>
                  Current: {item.current.toLocaleString()} units
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mt-mono" style={{ fontSize: 14, fontWeight: 700 }}>
                  {item.predicted.toLocaleString()}
                </div>
                <div
                  className="mt-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.trend === "up" ? "#0a5c5f" : COLORS.magenta,
                  }}
                >
                  {item.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sentiment Trends */}
        <div
          style={{
            border: "1px solid rgba(17,17,17,0.08)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center"
            style={{
              padding: "16px 20px",
              gap: 8,
              borderBottom: "1px solid rgba(17,17,17,0.06)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <BarChart3 size={16} color={COLORS.indigo} /> Sentiment Trends
            <span className="mt-mono mt-text-muted" style={{ fontSize: 11, marginLeft: "auto" }}>
              BERT Analysis
            </span>
          </div>
          {SENTIMENT_DATA.map((item) => (
            <div
              key={item.topic}
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid rgba(17,17,17,0.04)",
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {item.topic}
                </span>
                <span
                  className="mt-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      item.label === "Positive"
                        ? "#0a5c5f"
                        : item.label === "Negative"
                          ? COLORS.magenta
                          : "rgba(17,17,17,0.5)",
                  }}
                >
                  {item.score}% {item.label}
                </span>
              </div>
              {/* Progress bar */}
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(17,17,17,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${item.score}%`,
                    height: "100%",
                    borderRadius: 3,
                    background:
                      item.label === "Positive"
                        ? "#0a5c5f"
                        : item.label === "Negative"
                          ? COLORS.magenta
                          : COLORS.indigo,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI-Suggested Quotas */}
      <div
        style={{
          border: "1px solid rgba(17,17,17,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center"
          style={{
            padding: "16px 20px",
            gap: 8,
            borderBottom: "1px solid rgba(17,17,17,0.06)",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          <Lightbulb size={16} color={COLORS.indigo} /> AI-Suggested Supply
          Quotas
        </div>
        {QUOTA_SUGGESTIONS.map((item) => (
          <div
            key={item.drug}
            className="flex items-center justify-between flex-wrap"
            style={{
              padding: "14px 20px",
              gap: 12,
              borderBottom: "1px solid rgba(17,17,17,0.04)",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.drug}</div>
              <div className="mt-text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                {item.reason}
              </div>
            </div>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div className="mt-text-muted" style={{ fontSize: 10 }}>
                  CURRENT
                </div>
                <div className="mt-mono" style={{ fontSize: 14, fontWeight: 600 }}>
                  {item.currentQuota.toLocaleString()}
                </div>
              </div>
              <span className="mt-text-muted">→</span>
              <div style={{ textAlign: "center" }}>
                <div
                  className="mt-mono"
                  style={{ fontSize: 10, color: COLORS.indigo }}
                >
                  SUGGESTED
                </div>
                <div
                  className="mt-mono"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.indigo,
                  }}
                >
                  {item.suggestedQuota.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
