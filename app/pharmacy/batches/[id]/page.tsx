"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Batch Detail (Internal Variant)
----------------------------------------------------------------*/

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Building2,
  ExternalLink,
  QrCode,
  Zap,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import { custodyApi, mapCustodyHistoryToEvents } from "@/lib/api/custody";
import StatusBadge from "@/components/shared/StatusBadge";
import CustodyTimeline from "@/components/shared/CustodyTimeline";
import IPFSDocPreview from "@/components/shared/IPFSDocPreview";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

export default function PharmacyBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<CustodyEvent[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadBatchAndHistory = async () => {
      let currentRecord: BatchRecord | null = null;
      try {
        const apiBatch = await batchesApi.getBatchById(resolvedParams.id);
        if (apiBatch && isMounted) {
          currentRecord = mapApiBatchToRecord(apiBatch);
          setBatch(currentRecord);
        }
      } catch {
        // Fallback
      }

      if (!currentRecord) {
        const batches = getStoredBatches();
        const found = batches.find((b) => b.id === resolvedParams.id);
        if (found && isMounted) {
          currentRecord = found;
          setBatch(found);
          setTimelineEvents(found.custodyTimeline);
        }
      }

      // Try fetching live custody history from backend
      try {
        const historyRes = await custodyApi.getCustodyHistory(resolvedParams.id);
        if (historyRes && isMounted) {
          const events = mapCustodyHistoryToEvents(historyRes, currentRecord?.mfgDate);
          if (events.length > 0) {
            setTimelineEvents(events);
          }
        }
      } catch {
        // Use timeline from batch
      }
    };

    loadBatchAndHistory();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  if (!batch) {
    return (
      <div className="py-12 text-center text-xs text-gray-500">
        Loading batch records from on-chain state...
      </div>
    );
  }

  const isHeldByPharmacy =
    batch.currentCustodianRole === "Pharmacy" && batch.status === "Valid";

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <Link
          href="/pharmacy/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Pharmacy Inventory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <QrCode size={13} />
            <span>{showQrModal ? "Hide QR" : "Shelf QR"}</span>
          </button>

          {isHeldByPharmacy && (
            <Link
              href={`/pharmacy/dispense?batchId=${batch.id}`}
              className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <Zap size={13} className="fill-white" />
              <span>Dispense from Batch</span>
            </Link>
          )}
        </div>
      </div>

      {showQrModal && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md animate-in slide-in-from-top-2">
          <QRCodeDisplay
            value={batch.qrPayload || batch.id}
            title={`${batch.productName} (${batch.id})`}
            subtitle="Shelf barcode and patient verification reference"
          />
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: "#059669" }}
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
                <span>Manufacturer: {batch.manufacturerName}</span>
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
            <div className="text-xs text-emerald-700 font-bold">
              Dispensary Storage
            </div>
          </div>
        </div>

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
              Pharmacy Stock
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block text-sm">
              {batch.quantity} {batch.unit}
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
          </div>
        </div>
      </div>

      {/* Custody Timeline & IPFS Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              End-to-End Custody Provenance
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {(timelineEvents.length > 0 ? timelineEvents : batch.custodyTimeline).length} Provenance Steps
            </span>
          </div>

          <CustodyTimeline
            events={timelineEvents.length > 0 ? timelineEvents : batch.custodyTimeline}
            mode="full"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <IPFSDocPreview
              documents={batch.ipfsDocs}
              title="Attached IPFS Certificates"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
