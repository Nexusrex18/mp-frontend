"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Dispense Flow (/pharmacy/dispense)
   Core operational page: auto-branches into OTC vs Prescription
   based strictly on on-chain batch metadata returned by backend.
----------------------------------------------------------------*/

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  QrCode,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldCheck,
  Zap,
  Printer,
  Sparkles,
  ExternalLink,
  Receipt,
  FileCheck2,
  Loader2,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord, DispensingRecord } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { qrApi } from "@/lib/api/qr";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import { dispensingApi } from "@/lib/api/dispensing";
import { parseDispensingError } from "@/lib/hooks/useDispensing";
import { PrepareDispenseResponseDto } from "@/lib/api/types";
import QRScannerModal from "@/components/shared/QRScannerModal";
import StatusBadge from "@/components/shared/StatusBadge";
import OTCDispenseForm from "@/components/pharmacy/OTCDispenseForm";
import PrescriptionDispenseForm from "@/components/pharmacy/PrescriptionDispenseForm";
import { COLORS } from "@/lib/constants";

function PharmacyDispenseContent() {
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";

  const { address, currentStakeholder } = useWallet();

  const [availableBatches, setAvailableBatches] = useState<BatchRecord[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPreparingBatch, setIsPreparingBatch] = useState(false);
  const [prepareData, setPrepareData] = useState<PrepareDispenseResponseDto | null>(null);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<BatchRecord | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [dispenseReceipt, setDispenseReceipt] = useState<DispensingRecord | null>(null);

  // Store action intent for useTxFlow
  const [pendingDispense, setPendingDispense] = useState<{
    type: "OTC" | "PRESCRIPTION";
    quantity: number;
    prescriptionId?: string;
    prescriptionData?: any;
    notes?: string;
  } | null>(null);

  const pendingDispenseRef = useRef(pendingDispense);
  pendingDispenseRef.current = pendingDispense;

  const prepareDataRef = useRef(prepareData);
  prepareDataRef.current = prepareData;

  // Load pharmacy's inventory batches
  useEffect(() => {
    let isMounted = true;
    async function loadBatches() {
      try {
        const orgId = currentStakeholder?.organization || address || undefined;
        const res = await batchesApi.listBatches({ custodian: orgId, limit: 20 });
        if (isMounted && res?.data && res.data.length > 0) {
          setAvailableBatches(res.data.map(mapApiBatchToRecord));
          return;
        }
      } catch {
        // Fallback to mock data
      }
      if (isMounted) {
        setAvailableBatches(getStoredBatches());
      }
    }
    loadBatches();
    return () => {
      isMounted = false;
    };
  }, [currentStakeholder, address]);

  // Handle batch selection & call POST /dispensing/prepare
  const handleSelectBatch = async (batchId: string) => {
    setInlineError(null);
    setDispenseReceipt(null);
    setIsPreparingBatch(true);

    try {
      // 1. Fetch batch details for rich UI display if possible
      try {
        const b = await batchesApi.getBatchById(batchId);
        if (b) setSelectedBatchDetails(mapApiBatchToRecord(b));
      } catch {
        // Fallback
        const local = availableBatches.find(
          (b) =>
            b.id.toLowerCase() === batchId.toLowerCase() ||
            b.batchNumber?.toLowerCase() === batchId.toLowerCase()
        );
        if (local) setSelectedBatchDetails(local);
      }

      // 2. Call backend /dispensing/prepare (Server-derived classification)
      // Hard Rule #5: dispensingType is NEVER sent in this request body
      const res = await dispensingApi.prepare({ batchId });
      setPrepareData(res);

      // Check blockers
      if (!res.custodianOk) {
        setInlineError(
          "Your pharmacy is not the current custodian of this batch. Please accept transfer custody first."
        );
      } else if (res.blockers && res.blockers.length > 0) {
        const b = res.blockers[0];
        if (b === "BATCH_EXPIRED") {
          setInlineError("This medicine batch has expired and cannot be dispensed.");
        } else if (b === "BATCH_DEPLETED") {
          setInlineError("This medicine batch has 0 remaining units in stock.");
        } else if (b === "BATCH_RECALLED") {
          setInlineError("This medicine batch has been recalled by regulatory authorities.");
        } else {
          setInlineError(`Dispensing blocked: ${res.blockers.join(", ")}`);
        }
      }
    } catch (err: any) {
      const parsed = parseDispensingError(err);
      setInlineError(parsed.message);
      setPrepareData(null);
    } finally {
      setIsPreparingBatch(false);
    }
  };

  useEffect(() => {
    if (initialBatchId) {
      handleSelectBatch(initialBatchId);
    }
  }, [initialBatchId]);

  const handleScanSuccess = async (val: string) => {
    let extractedId = val.trim();
    try {
      const decoded = await qrApi.decodeQr(val);
      if (decoded?.batchId) {
        extractedId = decoded.batchId;
      } else if (decoded?.targetId) {
        extractedId = decoded.targetId;
      }
    } catch {
      if (val.startsWith("MEDTRACE:")) {
        const parts = val.split(":");
        extractedId = parts[1];
      }
    }
    await handleSelectBatch(extractedId);
  };

  // Transaction Flow for recording dispensing on L2
  const txFlow = useTxFlow({
    prepare: async () => {
      setInlineError(null);
      const action = pendingDispenseRef.current;
      const prep = prepareDataRef.current;

      if (!prep || !action) {
        throw new Error("No active batch or dispensing parameters specified.");
      }

      try {
        if (action.type === "OTC") {
          // Rule #1 & #5: No prescriptionId, no dispensingType
          return await dispensingApi.prepareOtc({
            batchId: prep.batchId,
            quantity: action.quantity,
          });
        } else {
          // Rule #5: No dispensingType
          if (!action.prescriptionId) {
            throw new Error("Prescription ID is required for prescription dispensing.");
          }
          return await dispensingApi.preparePrescription({
            batchId: prep.batchId,
            prescriptionId: action.prescriptionId,
            quantity: action.quantity,
          });
        }
      } catch (err: any) {
        const parsed = parseDispensingError(err);
        setInlineError(parsed.message);
        throw err;
      }
    },
    title: "Dispense Medicine on L2",
    description: "Recording cryptographic dispensing event on Arbitrum Sepolia...",
    onSuccess: ({ txHash }) => {
      const action = pendingDispenseRef.current;
      const prep = prepareDataRef.current;
      if (!prep || !action) return;

      const newReceipt: DispensingRecord = {
        id: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        batchId: prep.batchId,
        batchNumber: selectedBatchDetails?.batchNumber || `LOT-${prep.batch.batchChainId || prep.batchId.slice(0, 8)}`,
        productName: prep.product.name,
        dispensingType: prep.dispensingType === "OTC" ? "OTC" : "Prescription",
        quantityDispensed: action.quantity,
        pharmacyName: currentStakeholder?.name || "Licensed Central Pharmacy",
        pharmacyAddress: address || "0x89D...71c4",
        pharmacistName: "Marcus Vance, PharmD",
        txHash,
        status: "Confirmed",
        prescriptionHash: action.prescriptionData?.prescriptionHash,
        patientIdentifier: action.prescriptionData?.patientIdentifier,
      };

      setDispenseReceipt(newReceipt);
    },
  });

  // OTC Dispense Submit Handler
  const handleConfirmOTC = async (qty: number, notes: string) => {
    const action = { type: "OTC" as const, quantity: qty, notes };
    pendingDispenseRef.current = action;
    setPendingDispense(action);
    await txFlow.execute();
  };

  // Prescription Dispense Submit Handler
  const handleConfirmPrescription = async (
    rxId: string,
    qty: number,
    rxData?: any
  ) => {
    const action = {
      type: "PRESCRIPTION" as const,
      quantity: qty,
      prescriptionId: rxId,
      prescriptionData: rxData,
    };
    pendingDispenseRef.current = action;
    setPendingDispense(action);
    await txFlow.execute();
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/pharmacy"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Pharmacy Dashboard</span>
        </Link>

        <button
          onClick={() => {
            setDispenseReceipt(null);
            setIsScannerOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
          style={{ backgroundColor: COLORS.indigo }}
        >
          <QrCode size={14} />
          <span>Scan Another Medicine QR</span>
        </button>
      </div>

      {!dispenseReceipt ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: COLORS.magenta }}
              >
                <Zap size={20} className="fill-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  Medicine Dispensing Terminal
                </h1>
                <p className="text-xs text-gray-500">
                  On-chain auto-branching based on registered batch classification
                </p>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isPreparingBatch && (
            <div className="p-8 text-center space-y-3 bg-gray-50 rounded-2xl border border-gray-200">
              <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
              <div className="text-xs font-bold text-gray-700">
                Evaluating batch custody & classification on server...
              </div>
            </div>
          )}

          {/* Step 1: Batch Identification Bar (when no batch is selected) */}
          {!prepareData && !isPreparingBatch && (
            <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center bg-gray-50/50 space-y-4">
              <div
                className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: COLORS.indigo }}
                onClick={() => setIsScannerOpen(true)}
              >
                <QrCode size={30} />
              </div>

              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Scan Medicine Box QR Code
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Position the medicine box under the camera or select from inventory presets.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105"
                  style={{ backgroundColor: COLORS.magenta }}
                >
                  Launch Camera Scanner
                </button>
              </div>

              {/* Quick Select Presets from Pharmacy Inventory */}
              {availableBatches.length > 0 && (
                <div className="pt-4 border-t border-gray-200/80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Or Select In-Stock Batch:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableBatches.slice(0, 5).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBatch(b.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-800 hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Package size={12} className="text-purple-600" />
                        <span>{b.productName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ({b.batchNumber})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Batch Loaded - Branch into OTC or Prescription */}
          {prepareData && !isPreparingBatch && (
            <div className="space-y-6">
              {/* Scanned Batch Identity Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base text-gray-900">
                      {prepareData.product.name}
                    </h2>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        prepareData.dispensingType === "OTC"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-purple-100 text-purple-800 border border-purple-200"
                      }`}
                    >
                      {prepareData.dispensingType} Classification
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    Batch: {prepareData.batchId} • Dosage: {prepareData.product.dosage} • Exp:{" "}
                    {prepareData.batch.expiryDate}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPrepareData(null);
                    setInlineError(null);
                    setIsScannerOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 self-start sm:self-auto"
                >
                  Change Batch
                </button>
              </div>

              {/* Blocker Alert Banner */}
              {inlineError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in slide-in-from-top-1">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Dispensing Blocked:</strong>
                    <span>{inlineError}</span>
                  </div>
                </div>
              )}

              {/* AUTO-BRANCHING SUB-SCREENS (Strictly Hard Rule #1 & Invariant #5 compliant) */}
              {prepareData.dispensingType === "OTC" ? (
                /* OTC Sub-Screen: Zero prescription UI or fields */
                <OTCDispenseForm
                  batch={{
                    id: prepareData.batchId,
                    batchId: prepareData.batchId,
                    productName: prepareData.product.name,
                    product: prepareData.product,
                    quantity: prepareData.availableQuantity,
                    availableQuantity: prepareData.availableQuantity,
                    unit: "units",
                    dosage: prepareData.product.dosage,
                    expDate: prepareData.batch.expiryDate,
                  }}
                  onConfirm={handleConfirmOTC}
                  isProcessing={txFlow.isProcessing}
                  inlineError={inlineError}
                />
              ) : (
                /* Prescription Sub-Screen: Requires validated doctor prescription */
                <PrescriptionDispenseForm
                  batch={{
                    id: prepareData.batchId,
                    batchId: prepareData.batchId,
                    productName: prepareData.product.name,
                    productId: prepareData.product.id,
                    product: prepareData.product,
                    quantity: prepareData.availableQuantity,
                    availableQuantity: prepareData.availableQuantity,
                    unit: "units",
                    dosage: prepareData.product.dosage,
                    expDate: prepareData.batch.expiryDate,
                  }}
                  onConfirm={handleConfirmPrescription}
                  isProcessing={txFlow.isProcessing}
                  inlineError={inlineError}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        /* DISPENSING RECEIPT VIEW */
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Dispensing Confirmed & Recorded
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              Arbitrum Sepolia L2 Tx Hash:{" "}
              <a
                href={`https://sepolia.arbiscan.io/tx/${dispenseReceipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-700 underline font-bold"
              >
                {dispenseReceipt.txHash.slice(0, 14)}...{dispenseReceipt.txHash.slice(-8)}
              </a>
            </p>
          </div>

          {/* Printable Patient Receipt Slip */}
          <div
            id="dispense-receipt-slip"
            className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-300 text-xs space-y-3 font-mono"
          >
            <div className="text-center pb-3 border-b border-gray-200">
              <div className="font-bold text-sm text-gray-900">
                {dispenseReceipt.pharmacyName}
              </div>
              <div className="text-gray-500 text-[11px]">
                Licensed Dispensary • {dispenseReceipt.pharmacyAddress}
              </div>
              <div className="text-gray-400 text-[10px] mt-1">
                Receipt Ref: {dispenseReceipt.id}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Medicine:</span>
                <span className="font-bold text-gray-900">
                  {dispenseReceipt.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Batch Number:</span>
                <span className="text-gray-900">{dispenseReceipt.batchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Classification:</span>
                <span className="font-bold text-indigo-700">
                  {dispenseReceipt.dispensingType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity Dispensed:</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {dispenseReceipt.quantityDispensed} units
                </span>
              </div>
              {dispenseReceipt.patientIdentifier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient Identifier:</span>
                  <span className="font-bold text-gray-900">
                    {dispenseReceipt.patientIdentifier}
                  </span>
                </div>
              )}
              {dispenseReceipt.prescriptionHash && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Prescription Hash:</span>
                  <span className="text-gray-700 truncate max-w-[200px]">
                    {dispenseReceipt.prescriptionHash}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Dispensing Pharmacist:</span>
                <span className="text-gray-900">{dispenseReceipt.pharmacistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-gray-700">
                  {new Date(dispenseReceipt.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print Patient Slip</span>
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href="/pharmacy/history"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-center"
              >
                View Dispensing History
              </Link>
              <button
                onClick={() => {
                  setDispenseReceipt(null);
                  setPrepareData(null);
                  setInlineError(null);
                  setIsScannerOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105"
                style={{ backgroundColor: COLORS.indigo }}
              >
                + Dispense Next Medicine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal for scanning Medicine Box */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Medicine Box Packaging"
        subtitle="Align the physical box QR code to detect batch rules and custody"
        expectedType="batch"
      />
    </div>
  );
}

export default function PharmacyDispensePage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-gray-500">
          Loading dispense terminal...
        </div>
      }
    >
      <PharmacyDispenseContent />
    </Suspense>
  );
}
