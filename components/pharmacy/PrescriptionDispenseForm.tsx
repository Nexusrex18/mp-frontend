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
} from "lucide-react";
import { BatchRecord, PrescriptionRecord } from "@/lib/types";
import { getStoredPrescriptions } from "@/lib/mockData";
import QRScannerModal from "@/components/shared/QRScannerModal";
import { COLORS } from "@/lib/constants";

interface PrescriptionDispenseFormProps {
  batch: BatchRecord;
  onConfirm: (prescription: PrescriptionRecord, quantity: number) => void;
  isProcessing: boolean;
}

export default function PrescriptionDispenseForm({
  batch,
  onConfirm,
  isProcessing,
}: PrescriptionDispenseFormProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [prescriptionInput, setPrescriptionInput] = useState("");
  const [matchedPrescription, setMatchedPrescription] =
    useState<PrescriptionRecord | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRxScannerOpen, setIsRxScannerOpen] = useState(false);
  const [pharmacistVerified, setPharmacistVerified] = useState(true);

  useEffect(() => {
    setPrescriptions(getStoredPrescriptions());
  }, []);

  const handleValidatePrescription = (hashOrId: string) => {
    setValidationError(null);
    setMatchedPrescription(null);

    const cleanInput = hashOrId.trim();
    if (!cleanInput) return;

    const allPrescriptions = getStoredPrescriptions();
    const found = allPrescriptions.find(
      (rx) =>
        rx.prescriptionHash.toLowerCase() === cleanInput.toLowerCase() ||
        rx.id.toLowerCase() === cleanInput.toLowerCase()
    );

    if (!found) {
      setValidationError(
        "Prescription hash not found in Dispensing.sol on-chain registry."
      );
      return;
    }

    if (found.status === "Fulfilled") {
      setValidationError(
        `Prescription ${found.id} has already been fulfilled on-chain at ${found.fulfilledByPharmacy || "another dispensary"}. Refills remaining: 0.`
      );
      return;
    }

    if (found.status === "Expired") {
      setValidationError(
        `Prescription ${found.id} expired on ${found.expiresAt}. A new doctor prescription is required.`
      );
      return;
    }

    // Verify Drug NDC Code match
    if (found.drugCode !== batch.ndcCode) {
      setValidationError(
        `Drug Mismatch Error: Prescription is issued for ${found.drugName} (NDC: ${found.drugCode}), but current batch is ${batch.productName} (NDC: ${batch.ndcCode}).`
      );
      return;
    }

    // Successfully validated
    setMatchedPrescription(found);
    setPrescriptionInput(found.prescriptionHash);
  };

  const handleScanSuccess = (decoded: string) => {
    setPrescriptionInput(decoded);
    handleValidatePrescription(decoded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedPrescription || !pharmacistVerified) return;
    onConfirm(matchedPrescription, matchedPrescription.quantity || 1);
  };

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
          Available: {batch.quantity} {batch.unit}
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
            placeholder="Scan QR or paste hash e.g. 0xe7f9a2b..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
          />
          <button
            type="button"
            onClick={() => handleValidatePrescription(prescriptionInput)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: COLORS.indigo }}
          >
            Verify On-Chain
          </button>
        </div>

        {/* Quick Prescription Presets for Instant Testing */}
        <div className="pt-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Quick Test Prescriptions (matching {batch.productName}):
          </span>
          <div className="flex flex-wrap gap-2">
            {prescriptions
              .filter((rx) => rx.drugCode === batch.ndcCode && rx.status === "Pending")
              .map((rx) => (
                <button
                  key={rx.id}
                  type="button"
                  onClick={() => handleValidatePrescription(rx.prescriptionHash)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-purple-200 text-purple-900 hover:bg-purple-50 transition-colors flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-pink-500" />
                  <span>
                    {rx.patientIdentifier} ({rx.id})
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 animate-in slide-in-from-top-1">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Verification Blocked:</strong>
            <span>{validationError}</span>
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
              {matchedPrescription.id}
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
              <span className="font-mono text-gray-600 text-[11px]">
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
        disabled={isProcessing || !matchedPrescription || !pharmacistVerified}
        className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
        style={{
          backgroundColor: COLORS.magenta,
          boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
        }}
      >
        <PackageCheck size={18} />
        <span>Fulfill Prescription & Dispense on L2</span>
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
