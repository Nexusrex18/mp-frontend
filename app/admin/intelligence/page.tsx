"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  TrendingUp,
  BarChart3,
  Lightbulb,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { isFeatureEnabled } from "@/lib/config/features";

/* ---------------------------------------------------------------
   Admin — Demand Intelligence (Stage 9 — Optional Module)
   
   Purpose: Read-only display of off-chain AI forecasting & sentiment analysis.
   Isolation Rule: No other page, contract, or backend service depends on this.
   Feature Flag: Controlled by NEXT_PUBLIC_ENABLE_AI_MODULE.
   When disabled: Returns disabled state; zero impact on core operations.
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
  const [enabled, setEnabled] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(isFeatureEnabled("ENABLE_AI_MODULE"));
    setMounted(true);
  }, []);

  const handleToggleLocal = () => {
    const next = !enabled;
    setEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("FEATURE_ENABLE_AI_MODULE", String(next));
    }
  };

  if (!mounted) {
    return null;
  }

  // Feature Flag OFF: Display isolated disabled state
  if (!enabled) {
    return (
      <div style={{ maxWidth: 720, margin: "60px auto", padding: "0 24px" }}>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <Brain size={32} />
          </div>

          <span className="mt-mono text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Stage 9 Optional Module
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Demand Intelligence is Disabled
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
            The AI Demand Intelligence module is currently disabled by configuration (`NEXT_PUBLIC_ENABLE_AI_MODULE=false`).
            In adherence to the system isolation rules, core supply chain operations, batch tracking, and dispensing continue unaffected.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>

            <button
              onClick={handleToggleLocal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <ToggleRight size={16} /> Enable in This Session (Demo Mode)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Feature Flag ON: Display full read-only intelligence dashboard
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <Brain size={22} color={COLORS.indigo} />
            <span
              className="mt-mono text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{
                color: COLORS.indigo,
                backgroundColor: "rgba(62,54,176,0.08)",
              }}
            >
              OPTIONAL MODULE (ISOLATED)
            </span>
          </div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            Demand Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            AI-generated forecasts, sentiment trends, and supply quota suggestions.
            This module is strictly read-only and does not modify core supply chain state.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleLocal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Toggle module on/off to test isolation rule"
          >
            <ToggleLeft size={16} /> Disable Module
          </button>

          <Link
            href="/admin"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Isolation Notice Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
        <Info size={16} className="text-indigo-600 shrink-0" />
        <span>
          <strong>Architecture Rule #7:</strong> This module is decoupled from the core supply chain ledger.
          No on-chain state or database entity depends on CNN-LSTM or BERT pipelines.
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Demand Forecast */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <TrendingUp size={16} color={COLORS.indigo} /> Demand Forecast
            </div>
            <span className="mt-mono text-xs font-semibold text-slate-400">
              CNN-LSTM Model
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {FORECAST_DATA.map((item) => (
              <div
                key={item.drug}
                className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-900">{item.drug}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Current: {item.current.toLocaleString()} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="mt-mono font-bold text-sm text-slate-900">
                    {item.predicted.toLocaleString()} units
                  </div>
                  <div
                    className="mt-mono text-xs font-semibold"
                    style={{
                      color: item.trend === "up" ? "#0a5c5f" : COLORS.magenta,
                    }}
                  >
                    {item.change} projected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Trends */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <BarChart3 size={16} color={COLORS.indigo} /> Public Sentiment Trends
            </div>
            <span className="mt-mono text-xs font-semibold text-slate-400">
              BERT Analysis
            </span>
          </div>

          <div className="p-4 space-y-4">
            {SENTIMENT_DATA.map((item) => (
              <div key={item.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.topic}</span>
                  <span
                    className="mt-mono font-bold"
                    style={{
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
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor:
                        item.label === "Positive"
                          ? "#0a5c5f"
                          : item.label === "Negative"
                          ? COLORS.magenta
                          : COLORS.indigo,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Suggested Supply Quotas */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2 font-bold text-sm text-slate-900">
          <Lightbulb size={16} color={COLORS.indigo} /> AI-Suggested Supply Quotas (Non-blocking Suggestions)
        </div>

        <div className="divide-y divide-slate-100">
          {QUOTA_SUGGESTIONS.map((item) => (
            <div
              key={item.drug}
              className="p-4 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex-1 min-w-[240px]">
                <div className="font-semibold text-sm text-slate-900">{item.drug}</div>
                <div className="text-xs text-slate-500 mt-1">{item.reason}</div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-center">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Current</span>
                  <span className="mt-mono font-semibold text-slate-700 text-sm">
                    {item.currentQuota.toLocaleString()}
                  </span>
                </div>
                <span className="text-slate-300 font-bold">→</span>
                <div className="text-center">
                  <span className="text-indigo-600 font-bold block text-[10px] uppercase">Suggested</span>
                  <span className="mt-mono font-bold text-indigo-600 text-sm">
                    {item.suggestedQuota.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
