"use client";

/* ---------------------------------------------------------------
   MedTrace — Manufacturer Dashboard (/manufacturer)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  PlusCircle,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function ManufacturerDashboard() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchesApi.listBatches();
        const apiBatches = (res.data || []).map(mapApiBatchToRecord);
        const stored = getStoredBatches();
        const ids = new Set(apiBatches.map((b) => b.id));
        const merged = [...apiBatches, ...stored.filter((b) => !ids.has(b.id))];
        setBatches(merged);
      } catch {
        setBatches(getStoredBatches());
      }
    };

    loadBatches();
    const handleUpdate = () => loadBatches();
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const totalBatches = batches.length;
  const inCustody = batches.filter(
    (b) => b.currentCustodianRole === "Manufacturer"
  ).length;
  const inTransit = batches.filter(
    (b) => b.status === "InTransit" || b.status === "PendingAcceptance"
  ).length;
  const dispensed = batches.filter((b) => b.status === "Dispensed").length;

  return (
    <div className="space-y-8">
      {/* Header & Primary CTA Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
              <Sparkles size={13} className="text-pink-400" />
              <span>Pharmaceutical Manufacturing Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Apex BioPharma — Production Vault
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Mint immutable on-chain pharmaceutical batches, anchor IPFS
              laboratory certificates, and initiate cryptographically sealed
              custody transfers across the L2 supply chain.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/manufacturer/batches/new"
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
              }}
            >
              <PlusCircle size={18} />
              <span>+ Create New Batch</span>
            </Link>

            <Link
              href="/manufacturer/batches"
              className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <Package size={16} />
              <span>View All Batches</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: COLORS.indigo }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {totalBatches}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Total Batches Minted
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {inCustody}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              In Facility Custody
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {inTransit}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              In Transit / Pending
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {dispensed}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Dispensed to Patients
            </div>
          </div>
        </div>
      </div>

      {/* Recent Batches List */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Recent Production Batches
            </h2>
            <p className="text-xs text-gray-500">
              Latest pharmaceuticals minted and serialized onto Arbitrum Sepolia L2
            </p>
          </div>

          <Link
            href="/manufacturer/batches"
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
          >
            <span>Full Inventory</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {batches.slice(0, 4).map((batch) => (
            <div
              key={batch.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 rounded-xl px-2 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{
                    backgroundColor:
                      batch.dispensingType === "OTC"
                        ? "#059669"
                        : COLORS.indigo,
                  }}
                >
                  <Package size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900">
                      {batch.productName}
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        batch.dispensingType === "OTC"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {batch.dispensingType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5 font-mono">
                    <span>Batch ID: {batch.id}</span>
                    <span>•</span>
                    <span>Qty: {batch.quantity} {batch.unit}</span>
                    <span>•</span>
                    <span>Exp: {batch.expDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <StatusBadge status={batch.status} size="sm" />
                <Link
                  href={`/manufacturer/batches/${batch.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
