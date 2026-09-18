"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Scan & Accept (/distributor/scan)
   Scan QR on physical box -> inspect batch -> sign acceptance on L2.
----------------------------------------------------------------*/

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldCheck,
  ThermometerSnowflake,
  Send,
  Sparkles,
} from "lucide-react";
import {
  getStoredBatches,
  saveStoredBatches,
} from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { custodyApi } from "@/lib/api/custody";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import { qrApi } from "@/lib/api/qr";
import { parseCustodyError } from "@/lib/hooks/useCustody";
import QRScannerModal from "@/components/shared/QRScannerModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function DistributorScanAcceptPage() {
  const router = useRouter();
  const { address, currentStakeholder } = useWallet();

  const [isScannerOpen, setIsScannerOpen] = useState(true);
  const [scannedBatchId, setScannedBatchId] = useState<string>("");
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Inspection Checklist
  const [sealIntact, setSealIntact] = useState(true);
  const [tempCompliant, setTempCompliant] = useState(true);
  const [notes, setNotes] = useState("Received at Newark Hub Dock 2. Package inspected.");

  const handleScanSuccess = async (val: string) => {
    setInlineError(null);
    let extractedId = val;
    if (val.startsWith("MEDTRACE:")) {
      const parts = val.split(":");
      extractedId = parts[1];
    }

    try {
      const decoded = await qrApi.decodeQr(val);
      if (decoded?.batchId || decoded?.targetId) {
        extractedId = decoded.batchId || decoded.targetId;
      }
    } catch {
      // Use raw extractedId
    }

    setScannedBatchId(extractedId);

    try {
      const apiBatch = await batchesApi.getBatchById(extractedId);
      if (apiBatch) {
        setBatch(mapApiBatchToRecord(apiBatch));
        return;
      }
    } catch {
      // Fallback
    }

    const batches = getStoredBatches();
    const found = batches.find(
      (b) =>
        b.id.toLowerCase() === extractedId.toLowerCase() ||
        b.batchNumber.toLowerCase() === extractedId.toLowerCase()
    );

    if (found) {
      setBatch(found);
    } else {
      setBatch(batches[0]);
    }
  };

  const txFlow = useTxFlow({
    prepare: async () => {
      setInlineError(null);
      if (!batch) throw new Error("No batch selected");
      try {
        return await custodyApi.prepareAccept({ batchId: batch.id });
      } catch (err: any) {
        const parsed = parseCustodyError(err);
        setInlineError(parsed.message);
        throw err;
      }
    },
    title: "Confirm Physical Custody Acceptance",
    description: `Writing custody receipt for ${batch?.id} to Arbitrum Sepolia L2...`,
    onSuccess: ({ txHash }) => {
      if (!batch) return;
      const newCustodyEvent: CustodyEvent = {
        id: `cust-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: "ReceivedByDistributor",
        actorRole: "Distributor",
        actorName: currentStakeholder?.name || "SwiftLogistics Health",
        actorAddress: address || "0x3A2...98b1",
        txHash,
        blockNumber: 0,
        location: "Newark Logistics Hub Intake Bay",
        notes: `${notes} (Physical seal intact: ${sealIntact ? "YES" : "NO"})`,
        temperatureVerified: tempCompliant,
      };

      const updatedBatch: BatchRecord = {
        ...batch,
        status: "Valid",
        currentCustodianRole: "Distributor",
        currentCustodianName: currentStakeholder?.name || "SwiftLogistics Health",
        currentCustodianAddress: address || "0x3A2...98b1",
        custodyTimeline: [...batch.custodyTimeline, newCustodyEvent],
      };

      const all = getStoredBatches();
      const updated = all.map((b) => (b.id === batch.id ? updatedBatch : b));
      saveStoredBatches(updated);
      window.dispatchEvent(new Event("medtrace_data_updated"));

      router.push(`/distributor/batches/${batch.id}`);
    },
    onError: (err: any) => {
      const parsed = parseCustodyError(err);
      setInlineError(parsed.message);
    },
  });

  const handleConfirmAccept = async () => {
    await txFlow.execute();
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Top Breadcrumb */}
      <Link
        href="/distributor"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Distributor Dashboard</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Scan & Accept Incoming Shipment
              </h1>
              <p className="text-xs text-gray-500">
                Scan pharmaceutical box QR to verify provenance and execute custody intake on L2
              </p>
            </div>
          </div>
        </div>

        {!batch ? (
          /* Scanner Trigger View */
          <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50/50 space-y-4">
            <div
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: COLORS.magenta }}
              onClick={() => setIsScannerOpen(true)}
            >
              <QrCode size={30} />
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Ready to Scan Packaging QR
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Point your scanner or camera at the box QR code, or use our quick test demo presets.
              </p>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <QrCode size={14} />
              <span>Launch QR Scanner / Presets</span>
            </button>
          </div>
        ) : (
          /* Scanned Batch Verification & Acceptance Screen */
          <div className="space-y-5 animate-in fade-in">
            {/* Batch Card */}
            <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900">
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
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    Batch ID: <strong>{batch.id}</strong> ({batch.batchNumber})
                  </div>
                </div>

                <StatusBadge status={batch.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-indigo-100 font-medium">
                <div>
                  <span className="text-gray-500 block text-[10px]">Manufacturer:</span>
                  <span className="text-gray-900 font-bold truncate block">
                    {batch.manufacturerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Quantity:</span>
                  <span className="text-gray-900 font-bold">
                    {batch.quantity} {batch.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">Expiry:</span>
                  <span className="text-gray-900 font-mono">{batch.expDate}</span>
                </div>
              </div>
            </div>

            {/* Physical Receiving Checklist */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                Physical Receiving & Quality Inspection
              </span>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealIntact}
                  onChange={(e) => setSealIntact(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    Physical Tamper-Evident Seal Intact
                  </div>
                  <div className="text-[11px] text-gray-500">
                    No physical packaging damage or unauthorized box breach detected.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempCompliant}
                  onChange={(e) => setTempCompliant(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <ThermometerSnowflake size={12} />
                    <span>Cold-Chain Temperature Validated</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Thermal sensor logs confirm stability at: {batch.storageCondition}
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Intake Notes & Warehouse Bay:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {inlineError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                  <span className="font-bold">Intake Blocked: </span>
                  <span>{inlineError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setBatch(null);
                  setIsScannerOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Scan Another Box
              </button>

              <button
                onClick={handleConfirmAccept}
                disabled={txFlow.isProcessing}
                className={`px-6 py-3 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all flex items-center gap-2 ${
                  txFlow.isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  backgroundColor: COLORS.magenta,
                  boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
                }}
              >
                <CheckCircle2 size={16} />
                <span>
                  {txFlow.isProcessing
                    ? "Confirming on L2..."
                    : "Accept Custody on Arbitrum L2"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Distributor QR Receiving Scanner"
        subtitle="Align the pharmaceutical box QR code or choose a sample test batch"
        expectedType="batch"
      />
    </div>
  );
}
