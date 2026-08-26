"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Dispense Flow (/pharmacy/dispense)
   Core operational page: auto-branches into OTC vs Prescription
   based strictly on on-chain batch metadata.
----------------------------------------------------------------*/

import React, { useState, useEffect, Suspense } from "react";
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
} from "lucide-react";
import {
  getStoredBatches,
  saveStoredBatches,
  getStoredPrescriptions,
  saveStoredPrescriptions,
  getStoredDispensings,
  saveStoredDispensings,
  generateTxHash,
} from "@/lib/mockData";
import {
  BatchRecord,
  CustodyEvent,
  PrescriptionRecord,
  DispensingRecord,
} from "@/lib/types";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import QRScannerModal from "@/components/shared/QRScannerModal";
import StatusBadge from "@/components/shared/StatusBadge";
import OTCDispenseForm from "@/components/pharmacy/OTCDispenseForm";
import PrescriptionDispenseForm from "@/components/pharmacy/PrescriptionDispenseForm";
import { COLORS } from "@/lib/constants";

function PharmacyDispenseContent() {
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";

  const { address, currentStakeholder } = useWallet();
  const { executeTx, isProcessing } = useTxState();

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [dispenseReceipt, setDispenseReceipt] = useState<DispensingRecord | null>(
    null
  );

  useEffect(() => {
    const all = getStoredBatches();
    setBatches(all);
    if (initialBatchId) {
      const found = all.find(
        (b) =>
          b.id.toLowerCase() === initialBatchId.toLowerCase() ||
          b.batchNumber.toLowerCase() === initialBatchId.toLowerCase()
      );
      if (found) setSelectedBatch(found);
    }
  }, [initialBatchId]);

  const handleScanSuccess = (val: string) => {
    let extractedId = val;
    if (val.startsWith("MEDTRACE:")) {
      const parts = val.split(":");
      extractedId = parts[1];
    }

    const all = getStoredBatches();
    const found = all.find(
      (b) =>
        b.id.toLowerCase() === extractedId.toLowerCase() ||
        b.batchNumber.toLowerCase() === extractedId.toLowerCase()
    );

    if (found) {
      setSelectedBatch(found);
    } else {
      setSelectedBatch(all[0]);
    }
    setDispenseReceipt(null);
  };

  // Handler for OTC Dispensing
  const handleConfirmOTC = async (qty: number, notes: string) => {
    if (!selectedBatch) return;
    const txHash = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "Dispensed",
      actorRole: "Pharmacy",
      actorName: currentStakeholder?.name || "CityCare Central Pharmacy",
      actorAddress: address || "0x89D...71c4",
      txHash,
      blockNumber: 1999800,
      location: "CityCare Dispensary Counter 1",
      notes: `OTC Dispense of ${qty} ${selectedBatch.unit}. ${notes}`,
      temperatureVerified: true,
    };

    const updatedBatch: BatchRecord = {
      ...selectedBatch,
      quantity: Math.max(0, selectedBatch.quantity - qty),
      custodyTimeline: [...selectedBatch.custodyTimeline, newCustodyEvent],
    };

    const newDispensing: DispensingRecord = {
      id: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      productName: selectedBatch.productName,
      dispensingType: "OTC",
      quantityDispensed: qty,
      pharmacyName: currentStakeholder?.name || "CityCare Central Pharmacy",
      pharmacyAddress: address || "0x89D...71c4",
      pharmacistName: "Marcus Vance, PharmD",
      txHash,
      status: "Confirmed",
    };

    await executeTx({
      title: "Dispense OTC Medicine",
      description: `Sealing OTC dispensing event for batch ${selectedBatch.id} on L2...`,
      onCommit: () => {
        const allBatches = getStoredBatches();
        saveStoredBatches(
          allBatches.map((b) => (b.id === selectedBatch.id ? updatedBatch : b))
        );

        const allDispensings = getStoredDispensings();
        saveStoredDispensings([newDispensing, ...allDispensings]);

        setSelectedBatch(updatedBatch);
        setDispenseReceipt(newDispensing);
      },
    });
  };

  // Handler for Prescription Dispensing
  const handleConfirmPrescription = async (
    rx: PrescriptionRecord,
    qty: number
  ) => {
    if (!selectedBatch) return;
    const txHash = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "Dispensed",
      actorRole: "Pharmacy",
      actorName: currentStakeholder?.name || "CityCare Central Pharmacy",
      actorAddress: address || "0x89D...71c4",
      txHash,
      blockNumber: 1999900,
      location: "CityCare Rx Dispensary",
      notes: `Prescription ${rx.id} fulfilled for patient ${rx.patientIdentifier}. Tx: ${txHash}`,
      temperatureVerified: true,
    };

    const updatedBatch: BatchRecord = {
      ...selectedBatch,
      quantity: Math.max(0, selectedBatch.quantity - qty),
      custodyTimeline: [...selectedBatch.custodyTimeline, newCustodyEvent],
    };

    const updatedPrescription: PrescriptionRecord = {
      ...rx,
      status: "Fulfilled",
      fulfilledAt: new Date().toISOString(),
      fulfilledByPharmacy: currentStakeholder?.name || "CityCare Central Pharmacy",
      fulfilledPharmacyAddress: address || "0x89D...71c4",
      dispenseTxHash: txHash,
      matchedBatchId: selectedBatch.id,
    };

    const newDispensing: DispensingRecord = {
      id: `DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      batchId: selectedBatch.id,
      batchNumber: selectedBatch.batchNumber,
      productName: selectedBatch.productName,
      dispensingType: "Prescription",
      quantityDispensed: qty,
      pharmacyName: currentStakeholder?.name || "CityCare Central Pharmacy",
      pharmacyAddress: address || "0x89D...71c4",
      pharmacistName: "Marcus Vance, PharmD",
      prescriptionHash: rx.prescriptionHash,
      patientIdentifier: rx.patientIdentifier,
      txHash,
      status: "Confirmed",
    };

    await executeTx({
      title: "Fulfill Prescription & Dispense",
      description: `Fulfilling Rx ${rx.id} on Dispensing.sol and updating L2 custody...`,
      onCommit: () => {
        // 1. Update Batches
        const allBatches = getStoredBatches();
        saveStoredBatches(
          allBatches.map((b) => (b.id === selectedBatch.id ? updatedBatch : b))
        );

        // 2. Update Prescriptions
        const allPrescriptions = getStoredPrescriptions();
        saveStoredPrescriptions(
          allPrescriptions.map((p) => (p.id === rx.id ? updatedPrescription : p))
        );

        // 3. Save Dispensing Event
        const allDispensings = getStoredDispensings();
        saveStoredDispensings([newDispensing, ...allDispensings]);

        setSelectedBatch(updatedBatch);
        setDispenseReceipt(newDispensing);
      },
    });
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

          {/* Step 1: Batch Identification Bar */}
          {!selectedBatch ? (
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
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scanned Batch Identity Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base text-gray-900">
                      {selectedBatch.productName}
                    </h2>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        selectedBatch.dispensingType === "OTC"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-purple-100 text-purple-800 border border-purple-200"
                      }`}
                    >
                      {selectedBatch.dispensingType} Classification
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    Batch: {selectedBatch.id} • Lot: {selectedBatch.batchNumber} • Exp: {selectedBatch.expDate}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBatch(null);
                    setIsScannerOpen(true);
                  }}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 self-start sm:self-auto"
                >
                  Change Batch
                </button>
              </div>

              {/* AUTO-BRANCHING SUB-SCREENS (Strictly Hard Rule #1 compliant) */}
              {selectedBatch.dispensingType === "OTC" ? (
                /* OTC Sub-Screen: No prescription UI rendered at all */
                <OTCDispenseForm
                  batch={selectedBatch}
                  onConfirm={handleConfirmOTC}
                  isProcessing={isProcessing}
                />
              ) : (
                /* Prescription Sub-Screen: Requires validated doctor prescription */
                <PrescriptionDispenseForm
                  batch={selectedBatch}
                  onConfirm={handleConfirmPrescription}
                  isProcessing={isProcessing}
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
                NABP Verified Dispensary • {dispenseReceipt.pharmacyAddress}
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
                  setSelectedBatch(null);
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
    <Suspense fallback={<div className="py-12 text-center text-xs text-gray-500">Loading dispense terminal...</div>}>
      <PharmacyDispenseContent />
    </Suspense>
  );
}
