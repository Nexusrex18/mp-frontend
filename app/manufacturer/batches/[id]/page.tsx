"use client";

/* ---------------------------------------------------------------
   MedTrace — Manufacturer Batch Detail (Internal Variant)
   Shows complete custody provenance, IPFS documents, L2 state, and actions.
----------------------------------------------------------------*/

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  Calendar,
  Building2,
  ThermometerSnowflake,
  ExternalLink,
  ArrowRightLeft,
  QrCode,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import CustodyTimeline from "@/components/shared/CustodyTimeline";
import IPFSDocPreview from "@/components/shared/IPFSDocPreview";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

export default function ManufacturerBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const batches = getStoredBatches();
    const found = batches.find((b) => b.id === resolvedParams.id);
    if (found) {
      setBatch(found);
    }
  }, [resolvedParams.id]);

  if (!batch) {
    return (
      <div className="py-12 text-center text-xs text-gray-500">
        Loading batch records from on-chain state...
      </div>
    );
  }

  const isHeldByManufacturer = batch.currentCustodianRole === "Manufacturer";

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/manufacturer/batches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to All Batches</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <QrCode size={13} />
            <span>{showQrModal ? "Hide QR" : "Packaging QR"}</span>
          </button>

          {isHeldByManufacturer && (
            <Link
              href={`/manufacturer/batches/${batch.id}/transfer`}
              className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <ArrowRightLeft size={13} />
              <span>Transfer Custody</span>
            </Link>
          )}
        </div>
      </div>

      {/* QR Code Collapsible Drawer */}
      {showQrModal && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md animate-in slide-in-from-top-2">
          <QRCodeDisplay
            value={batch.qrPayload || batch.id}
            title={`${batch.productName} (${batch.id})`}
            subtitle="Scannable by Distributor, Pharmacy, and Patient Verification"
          />
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <Package size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {batch.productName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    batch.dispensingType === "OTC"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {batch.dispensingType} Classification
                </span>
                <StatusBadge status={batch.status} size="sm" />
              </div>
              <div className="text-xs text-gray-500 font-mono flex flex-wrap items-center gap-3 mt-1.5">
                <span>Batch ID: <strong>{batch.id}</strong></span>
                <span>•</span>
                <span>Lot: {batch.batchNumber}</span>
                <span>•</span>
                <span>NDC: {batch.ndcCode}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Custodian
            </div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {batch.currentCustodianName}
            </div>
            <div className="text-xs text-indigo-700 font-bold">
              {batch.currentCustodianRole} Node
            </div>
          </div>
        </div>

        {/* 4-Column Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Dosage & Form
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block">
              {batch.dosage}
            </span>
            <span className="text-gray-500">{batch.formulation}</span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Stock Volume
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block text-sm">
              {batch.quantity} {batch.unit}
            </span>
            <span className="text-gray-500 text-[10px]">
              Initial: {batch.initialQuantity}
            </span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Lifecycle Dates
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block font-mono">
              Exp: {batch.expDate}
            </span>
            <span className="text-gray-500 font-mono text-[10px]">
              Mfg: {batch.mfgDate}
            </span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Storage Condition
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block truncate">
              {batch.storageCondition}
            </span>
            <span className="text-emerald-700 font-semibold text-[10px] flex items-center gap-1 mt-0.5">
              <ThermometerSnowflake size={11} />
              Cold-Chain Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Custody Timeline & IPFS Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Custody Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                End-to-End Custody Timeline (Full Provable Trail)
              </h2>
              <p className="text-xs text-gray-500">
                Immutable handoff record verified on Arbitrum Sepolia L2
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              {batch.custodyTimeline.length} Hops Recorded
            </span>
          </div>

          <CustodyTimeline events={batch.custodyTimeline} mode="full" />
        </div>

        {/* Right: IPFS Documents & Blockchain Details */}
        <div className="space-y-6">
          {/* IPFS Documents Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <IPFSDocPreview
              documents={batch.ipfsDocs}
              title="Attached Laboratory Documents"
            />
          </div>

          {/* Blockchain Explorer Block */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-400" />
                <span>Arbitrum Sepolia L2</span>
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-800">
                Finalized
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Batch Contract:
                </span>
                <span className="text-slate-200 truncate block">
                  {batch.l2ContractAddress}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">
                  Mint Tx Hash:
                </span>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${batch.mintTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-300 hover:text-indigo-100 flex items-center gap-1 underline decoration-indigo-500"
                >
                  <span className="truncate">
                    {batch.mintTxHash.slice(0, 16)}...{batch.mintTxHash.slice(-8)}
                  </span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
