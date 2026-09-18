"use client";

/* ---------------------------------------------------------------
   MedTrace — Prescription Dispense Form Component
   Rendered ONLY for Prescription-classified pharmaceuticals.
   Enforces on-chain validation of Doctor Prescription on Dispensing.sol.
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Search,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  PackageCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { PrescriptionRecord } from "@/lib/types";
import { getStoredPrescriptions } from "@/lib/mockData";
import { prescriptionsApi, mapApiPrescriptionToRecord } from "@/lib/api/prescriptions";
import { qrApi } from "@/lib/api/qr";
import { PrescriptionDto, ValidatePrescriptionResponseDto } from "@/lib/api/types";
import QRScannerModal from "@/components/shared/QRScannerModal";
import { COLORS } from "@/lib/constants";

interface PrescriptionDispenseFormProps {
  batch: {
    id?: string;
    batchId?: string;
    batchNumber?: string;
    productName?: string;
    productId?: string;
    product?: { id: string; name: string; dosage?: string };
    ndcCode?: string;
    quantity?: number;
    availableQuantity?: number;
    unit?: string;
    dosage?: string;
    expDate?: string;
    expiryDate?: string;
  };
  onConfirm: (prescriptionId: string, quantity: number, prescription?: any) => void;
  isProcessing: boolean;
  inlineError?: string | null;
}

const FAILURE_MESSAGES: Record<string, string> = {
  PRESCRIPTION_NOT_FOUND: "Prescription not found in registry.",
  PRESCRIPTION_ALREADY_FULFILLED: "This prescription has already been fulfilled on-chain and cannot be reused (0 refills remaining).",
  PRESCRIPTION_EXPIRED: "This prescription has expired. A new doctor prescription is required.",
  PRESCRIPTION_PRODUCT_MISMATCH: "Drug Mismatch: This prescription is issued for a different medicine than the scanned batch.",
  NOT_CURRENT_CUSTODIAN: "Your pharmacy is not the verified current custodian of this batch.",
  BATCH_EXPIRED: "This medicine batch has expired and cannot be dispensed.",
  BATCH_DEPLETED: "This batch has 0 remaining units in stock.",
  BATCH_RECALLED: "This batch has been flagged for recall and cannot be dispensed.",
};

export default function PrescriptionDispenseForm({
  batch,
  onConfirm,
  isProcessing,
  inlineError,
}: PrescriptionDispenseFormProps) {
  const [prescriptionsList, setPrescriptionsList] = useState<PrescriptionRecord[]>([]);
  const [prescriptionInput, setPrescriptionInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [matchedPrescription, setMatchedPrescription] = useState<any | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRxScannerOpen, setIsRxScannerOpen] = useState(false);
  const [pharmacistVerified, setPharmacistVerified] = useState(true);

  const batchProductId = batch.product?.id || batch.productId || batch.ndcCode || "";
  const batchProductName = batch.product?.name || batch.productName || "Prescription Medicine";
  const availableQty = batch.availableQuantity ?? batch.quantity ?? 0;
  const unit = batch.unit || "units";

  // Load available prescriptions for quick testing
  useEffect(() => {
    let isMounted = true;
    async function loadPrescriptions() {
      try {
        const res = await prescriptionsApi.list({ limit: 20 });
        if (isMounted && res?.data && res.data.length > 0) {
          const records = res.data.map(mapApiPrescriptionToRecord);
          setPrescriptionsList(records);
          return;
        }
      } catch {
        // Fallback to mock data if backend not reachable
      }
      if (isMounted) {
        setPrescriptionsList(getStoredPrescriptions());
      }
    }
    loadPrescriptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleValidatePrescription = async (hashOrId: string) => {
    const cleanInput = hashOrId.trim();
    if (!cleanInput) return;

    setValidationError(null);
    setMatchedPrescription(null);
    setIsValidating(true);

    let targetRxId = cleanInput;
    let targetRx: any = null;

    try {
      // 1. Try to fetch directly by ID
      try {
        const rx = await prescriptionsApi.getById(cleanInput);
        if (rx) {
          targetRxId = rx.id;
          targetRx = rx;
        }
      } catch {
        // Not a direct UUID, check if it's a hash in the list
        const res = await prescriptionsApi.list({ limit: 50 });
        const found = res.data?.find(
          (r) =>
            r.prescriptionHash?.toLowerCase() === cleanInput.toLowerCase() ||
            r.id.toLowerCase() === cleanInput.toLowerCase()
        );
        if (found) {
          targetRxId = found.id;
          targetRx = found;
        }
      }

      // If still not found from API, check local mock data
      if (!targetRx) {
        const localFound = prescriptionsList.find(
          (r) =>
            r.prescriptionHash?.toLowerCase() === cleanInput.toLowerCase() ||
            r.id.toLowerCase() === cleanInput.toLowerCase()
        );
        if (localFound) {
          targetRxId = localFound.id;
          targetRx = localFound;
        }
      }

      if (!targetRx && !targetRxId) {
        setValidationError("Prescription not found in on-chain or off-chain registry.");
        setIsValidating(false);
        return;
      }

      // 2. Call backend validation endpoint: POST /prescriptions/:id/validate
      // Scanned batch product ID is compared with prescription product ID
      try {
        const validation = await prescriptionsApi.validate(targetRxId, {
          scannedBatchProductId: batchProductId,
        });

        if (!validation.valid || validation.failures.length > 0) {
          const primaryFailure = validation.failures[0];
          const humanMessage =
            FAILURE_MESSAGES[primaryFailure] ||
            `Prescription validation failed: ${validation.failures.join(", ")}`;
          setValidationError(humanMessage);
          setMatchedPrescription(null);
          setIsValidating(false);
          return;
        }

        // Validation passed!
        setMatchedPrescription({
          id: validation.prescription.id,
          prescriptionHash: validation.prescription.prescriptionHash,
          patientIdentifier:
            targetRx?.patientRef || targetRx?.patientIdentifier || "PT-VERIFIED",
          drugName: validation.prescription.productName || batchProductName,
          dosage: validation.prescription.dosage || batch.dosage || "Standard",
          quantity: validation.prescription.quantity || 1,
          doctorName: targetRx?.doctor?.user?.name || targetRx?.doctorName || "Licensed Physician",
          doctorAddress: validation.prescription.doctorWallet || targetRx?.doctorAddress || "0x...",
          doctorLicense: targetRx?.doctor?.licenseNumber || targetRx?.doctorLicense || "STATE-RX-ACTIVE",
          instructions: targetRx?.notes || targetRx?.instructions || "Take complete course as prescribed by physician.",
          expiry: validation.prescription.expiry,
        });
        setPrescriptionInput(validation.prescription.prescriptionHash || validation.prescription.id);
      } catch (valErr: any) {
        // If validate API returned an error (e.g. 404/409)
        const errorData = valErr?.response?.data || valErr;
        const msg =
          errorData?.message ||
          errorData?.error ||
          "Verification rejected by server.";
        setValidationError(typeof msg === "string" ? msg : JSON.stringify(msg));
        setMatchedPrescription(null);
      }
    } catch (err: any) {
      setValidationError("Failed to communicate with prescription validation service.");
      setMatchedPrescription(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanSuccess = async (decoded: string) => {
    let extractedId = decoded;
    try {
      const qrRes = await qrApi.decodeQr(decoded);
      if (qrRes?.prescriptionId) {
        extractedId = qrRes.prescriptionId;
      } else if (qrRes?.targetId) {
        extractedId = qrRes.targetId;
      }
    } catch {
      // Use raw input
    }
    setPrescriptionInput(extractedId);
    handleValidatePrescription(extractedId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedPrescription || !pharmacistVerified || isProcessing || isValidating) return;
    onConfirm(matchedPrescription.id, matchedPrescription.quantity || 1, matchedPrescription);
  };

  const displayedError = validationError || inlineError;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
      {/* Classification Header */}
      <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
            Rx
          </div>
          <div>
            <div className="font-extrabold text-sm text-purple-950">
              Prescription-Mandated Dispensing
            </div>
            <div className="text-[11px] text-purple-700">
              Auto-locked by batch classification. Requires validated doctor prescription on `Dispensing.sol`.
            </div>
          </div>
        </div>

        <span className="text-xs font-bold text-purple-800 bg-white px-2.5 py-1 rounded-full border border-purple-300">
          Available: {availableQty} {unit}
        </span>
      </div>

      {/* Prescription Entry / Scan Box */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            Doctor Prescription QR / Reference Hash:
          </label>

          <button
            type="button"
            onClick={() => setIsRxScannerOpen(true)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5 border border-purple-200"
          >
            <QrCode size={13} />
            <span>Scan Patient's Prescription QR</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={prescriptionInput}
            onChange={(e) => setPrescriptionInput(e.target.value)}
            placeholder="Scan QR or paste hash e.g. 0xe7f9a2b... or ID"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
          />
          <button
            type="button"
            disabled={isValidating || !prescriptionInput.trim()}
            onClick={() => handleValidatePrescription(prescriptionInput)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            style={{ backgroundColor: COLORS.indigo }}
          >
            {isValidating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Checking...</span>
              </>
            ) : (
              <span>Verify On-Chain</span>
            )}
          </button>
        </div>

        {/* Quick Prescription Presets for Instant Testing */}
        {prescriptionsList.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              Available Test Prescriptions:
            </span>
            <div className="flex flex-wrap gap-2">
              {prescriptionsList
                .filter((rx) => rx.status === "Pending")
                .slice(0, 4)
                .map((rx) => (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => {
                      setPrescriptionInput(rx.prescriptionHash || rx.id);
                      handleValidatePrescription(rx.prescriptionHash || rx.id);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 transition-colors flex items-center gap-1"
                  >
                    <Sparkles size={11} className="text-pink-500" />
                    <span>
                      {rx.patientIdentifier} ({rx.drugName} - {rx.id.slice(0, 8)}...)
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Banner - Blocks Proceeding */}
      {displayedError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in slide-in-from-top-1">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Dispensing Blocked by Policy:</strong>
            <span>{displayedError}</span>
          </div>
        </div>
      )}

      {/* Validated Prescription Information Card */}
      {matchedPrescription && (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span className="font-extrabold text-sm text-emerald-950">
                Prescription Verified on Dispensing.sol
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
              {matchedPrescription.id.slice(0, 10)}...
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Patient ID:
              </span>
              <span className="font-bold text-gray-900">
                {matchedPrescription.patientIdentifier}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Prescribed Drug:
              </span>
              <span className="font-bold text-gray-900">
                {matchedPrescription.drugName}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Quantity to Dispense:
              </span>
              <span className="font-bold text-emerald-800 text-sm">
                {matchedPrescription.quantity} units
              </span>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Doctor Instructions:
              </span>
              <span className="text-gray-800 italic">
                "{matchedPrescription.instructions}"
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Issuing Physician:
              </span>
              <span className="font-bold text-gray-900">
                {matchedPrescription.doctorName}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">
                Doctor License & Address:
              </span>
              <span className="font-mono text-gray-600 text-[11px] truncate block">
                {matchedPrescription.doctorLicense} ({matchedPrescription.doctorAddress})
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={pharmacistVerified}
              onChange={(e) => setPharmacistVerified(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-emerald-950 font-medium">
              I certify that patient identity ({matchedPrescription.patientIdentifier}) matches prescription and drug interactions were evaluated.
            </span>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !matchedPrescription || !pharmacistVerified || !!displayedError}
        className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
        style={{
          backgroundColor: COLORS.magenta,
          boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
        }}
      >
        <PackageCheck size={18} />
        <span>
          {isProcessing ? "Signing & Sealing on L2..." : "Fulfill Prescription & Dispense on L2"}
        </span>
      </button>

      {/* QR Scanner Modal for Prescription QR */}
      <QRScannerModal
        isOpen={isRxScannerOpen}
        onClose={() => setIsRxScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Doctor Prescription QR"
        subtitle="Align the patient's digital or printed prescription QR code"
        expectedType="prescription"
      />
    </form>
  );
}
