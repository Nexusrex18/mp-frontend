"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Dashboard (/distributor)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  Inbox,
  QrCode,
  Package,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
} from "lucide-react";
import { getStoredBatches, saveStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function DistributorDashboard() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    setBatches(getStoredBatches());
    const handleUpdate = () => setBatches(getStoredBatches());
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const pendingIncoming = batches.filter(
    (b) =>
      b.currentCustodianRole === "Distributor" &&
      b.status === "PendingAcceptance"
  );
  const inWarehouse = batches.filter(
    (b) =>
      b.currentCustodianRole === "Distributor" && b.status === "Valid"
  );
  const inTransitToPharmacy = batches.filter(
    (b) =>
      b.currentCustodianRole === "Pharmacy" &&
      b.status === "PendingAcceptance"
  );

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-sky-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
              <Sparkles size={13} className="text-sky-300" />
              <span>Wholesale Logistics Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              SwiftLogistics Cold-Chain Network
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-sky-200 leading-relaxed">
              Verify incoming pharmaceutical shipments via QR camera scanning,
              seal cryptographic custody transfers on Arbitrum Sepolia L2, and
              distribute to licensed pharmacies.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/distributor/scan"
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
              }}
            >
              <QrCode size={18} />
              <span>Scan & Accept Shipment</span>
            </Link>

            <Link
              href="/distributor/transfer"
              className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRightLeft size={16} />
              <span>Transfer to Pharmacy</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Inbox size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {pendingIncoming.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Awaiting Acceptance
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: "#0284C7" }}
          >
            <Package size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {inWarehouse.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              In Warehouse Stock
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {inTransitToPharmacy.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Dispatched to Pharmacies
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {batches.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Total Batches Logged
            </div>
          </div>
        </div>
      </div>

      {/* Pending Incoming Shipments Section */}
      {pendingIncoming.length > 0 && (
        <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-amber-950">
                Shipments Awaiting Physical Acceptance ({pendingIncoming.length})
              </h2>
            </div>
            <Link
              href="/distributor/incoming"
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>View All Incoming</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingIncoming.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {b.productName}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {b.id} • From: {b.manufacturerName}
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">
                    Qty: {b.quantity} {b.unit}
                  </div>
                </div>

                <Link
                  href="/distributor/scan"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5 shrink-0"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  <QrCode size={13} />
                  <span>Scan & Accept</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warehouse Inventory Preview */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Warehouse Inventory
            </h2>
            <p className="text-xs text-gray-500">
              Batches held in Newark Hub cold-storage facility
            </p>
          </div>

          <Link
            href="/distributor/inventory"
            className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
          >
            <span>Full Inventory</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {batches.slice(0, 3).map((batch) => (
            <div
              key={batch.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 rounded-xl px-2 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: "#0284C7" }}
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
                    <span>Stock: {batch.quantity} {batch.unit}</span>
                    <span>•</span>
                    <span>Custodian: {batch.currentCustodianRole}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <StatusBadge status={batch.status} size="sm" />
                <Link
                  href={`/distributor/batches/${batch.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-800 hover:bg-sky-100 transition-colors"
                >
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
