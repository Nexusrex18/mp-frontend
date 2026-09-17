"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Dashboard (/pharmacy)
   Primary operational dispensary portal with prominent 'Scan Medicine' CTA.
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  QrCode,
  Package,
  Inbox,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  getStoredBatches,
  getStoredDispensings,
} from "@/lib/mockData";
import { BatchRecord, DispensingRecord } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function PharmacyDashboard() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [dispensings, setDispensings] = useState<DispensingRecord[]>([]);

  useEffect(() => {
    setBatches(getStoredBatches());
    setDispensings(getStoredDispensings());
    const handleUpdate = () => {
      setBatches(getStoredBatches());
      setDispensings(getStoredDispensings());
    };
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const pharmacyStock = batches.filter(
    (b) => b.currentCustodianRole === "Pharmacy" && b.status === "Valid"
  );
  const pendingIncoming = batches.filter(
    (b) =>
      b.currentCustodianRole === "Pharmacy" &&
      b.status === "PendingAcceptance"
  );
  const lowStockBatches = pharmacyStock.filter((b) => b.quantity < 500);

  return (
    <div className="space-y-8">
      {/* Primary Hero CTA Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-emerald-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
              <Sparkles size={13} className="text-emerald-300" />
              <span>Licensed Dispensary Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              CityCare Central Pharmacy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-emerald-200 leading-relaxed">
              Verify medicine packaging QRs, auto-detect dispensing rules (OTC vs Doctor Prescription), and cryptographically record patient handoffs on L2.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/pharmacy/dispense"
              className="px-8 py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 28px rgba(246, 32, 136, 0.5)",
              }}
            >
              <Zap size={20} className="text-yellow-300 fill-yellow-300" />
              <span className="tracking-wide uppercase">⚡ Scan & Dispense Medicine</span>
            </Link>

            <Link
              href="/pharmacy/inventory"
              className="px-5 py-4 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Package size={17} />
              <span>Inventory ({pharmacyStock.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: "#059669" }}
          >
            <Package size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {pharmacyStock.reduce((acc, b) => acc + b.quantity, 0)}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Total Units in Stock
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Inbox size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {pendingIncoming.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Incoming Deliveries
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <History size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {dispensings.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Dispensed to Patients
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {pharmacyStock.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Active Batches Held
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Deliveries Alert */}
      {pendingIncoming.length > 0 && (
        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Inbox size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                {pendingIncoming.length} Shipment(s) Dispatched by Distributors Awaiting Intake
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Verify and accept incoming shipments into dispensary stock
              </p>
            </div>
          </div>

          <Link
            href="/pharmacy/incoming"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:scale-105 self-start sm:self-auto"
            style={{ backgroundColor: COLORS.indigo }}
          >
            Accept Shipments →
          </Link>
        </div>
      )}

      {/* Recent Dispensing Feed */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Recent Dispensing Activity
            </h2>
            <p className="text-xs text-gray-500">
              Patient dispenses registered to Arbitrum Sepolia L2 ledger
            </p>
          </div>

          <Link
            href="/pharmacy/history"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {dispensings.slice(0, 4).map((disp) => (
            <div
              key={disp.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/60 rounded-xl px-2 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{
                    backgroundColor:
                      disp.dispensingType === "OTC" ? "#059669" : COLORS.indigo,
                  }}
                >
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {disp.productName}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        disp.dispensingType === "OTC"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {disp.dispensingType}
                    </span>
                  </div>
                  <div className="text-gray-500 font-mono text-[11px] mt-0.5">
                    Batch: {disp.batchId} • Qty: {disp.quantityDispensed} • Pharmacist: {disp.pharmacistName}
                  </div>
                </div>
              </div>

              <div className="font-mono text-gray-400 text-[11px] self-end sm:self-center">
                {new Date(disp.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
