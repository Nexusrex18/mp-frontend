"use client";

/* ---------------------------------------------------------------
   MedTrace — Issue New Prescription (/doctor/prescriptions/new)
   Doctor enters clinical Rx details -> generates off-chain SHA-256 hash
   -> registers pending Rx on Dispensing.sol -> outputs patient QR code.
----------------------------------------------------------------*/

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Stethoscope,
  Sparkles,
  QrCode,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Printer,
  Download,
} from "lucide-react";
import {
  getStoredPrescriptions,
  saveStoredPrescriptions,
  generatePrescriptionHash,
} from "@/lib/mockData";
import { PrescriptionRecord } from "@/lib/types";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

const DRUG_CATALOG = [
  {
    code: "0093-3109-01",
    name: "Amoxicillin 500mg",
    defaultDosage: "500mg Capsule, 1 capsule 3x daily with meals for 10 days",
    defaultQuantity: 30,
  },
  {
    code: "0169-4130-12",
    name: "Ozempic 2mg/3mL Pen",
    defaultDosage: "0.5mg injected subcutaneously once weekly",
    defaultQuantity: 1,
  },
  {
    code: "0071-0156-23",
    name: "Lipitor 20mg",
    defaultDosage: "20mg Tablet, 1 tablet once daily at bedtime",
    defaultQuantity: 30,
  },
];

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  const [patientId, setPatientId] = useState(
    `PT-${Math.floor(1000 + Math.random() * 9000)}-X`
  );
  const [patientAge, setPatientAge] = useState<number>(45);
  const [patientGender, setPatientGender] = useState("Female");
  const [selectedDrugIndex, setSelectedDrugIndex] = useState(0);
  const [dosage, setDosage] = useState(DRUG_CATALOG[0].defaultDosage);
  const [quantity, setQuantity] = useState<number>(DRUG_CATALOG[0].defaultQuantity);
  const [refillsAllowed, setRefillsAllowed] = useState<number>(0);
  const [instructions, setInstructions] = useState(
    "Take complete course as prescribed. Report any adverse reactions immediately."
  );
  const [issuedRx, setIssuedRx] = useState<PrescriptionRecord | null>(null);

  const selectedDrug = DRUG_CATALOG[selectedDrugIndex];

  const handleDrugChange = (idx: number) => {
    setSelectedDrugIndex(idx);
    setDosage(DRUG_CATALOG[idx].defaultDosage);
    setQuantity(DRUG_CATALOG[idx].defaultQuantity);
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();

    const rxId = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const rxHash = generatePrescriptionHash(
      patientId,
      selectedDrug.code,
      address || "0x14E...C309",
      now.toISOString()
    );

    const newPrescription: PrescriptionRecord = {
      id: rxId,
      prescriptionHash: rxHash,
      patientIdentifier: patientId,
      patientAge,
      patientGender,
      drugCode: selectedDrug.code,
      drugName: selectedDrug.name,
      dosage,
      quantity,
      refillsAllowed,
      refillsRemaining: refillsAllowed,
      issuedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      status: "Pending",
      doctorName: currentStakeholder?.name || "Dr. Evelyn Reed, MD",
      doctorAddress: address || "0x14E...C309",
      doctorLicense: currentStakeholder?.licenseNumber || "MED-NY-492019",
      instructions,
    };

    await executeTx({
      title: "Issue Cryptographic Prescription",
      description: `Registering prescription ${rxId} (${selectedDrug.name}) on Dispensing.sol...`,
      onCommit: () => {
        const existing = getStoredPrescriptions();
        saveStoredPrescriptions([newPrescription, ...existing]);
        setIssuedRx(newPrescription);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <Link
        href="/doctor/prescriptions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Prescription Registry</span>
      </Link>

      {!issuedRx ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: "#7C3AED" }}
              >
                <Stethoscope size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  Issue Digital Prescription (e-Rx)
                </h1>
                <p className="text-xs text-gray-500">
                  Creates an immutable cryptographic hash registered on `Dispensing.sol`
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleIssuePrescription} className="space-y-4">
            {/* Patient Anonymized Data */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Patient ID (Anonymized):
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Patient Age:
                </label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Gender:
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Prescribed Drug Catalog */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Select Prescribed Drug (matches NDC Registry):
              </label>
              <select
                value={selectedDrugIndex}
                onChange={(e) => handleDrugChange(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              >
                {DRUG_CATALOG.map((drug, idx) => (
                  <option key={drug.code} value={idx}>
                    {drug.name} (NDC: {drug.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Dosage & Administration Directions:
                </label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Units:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Clinical Notes / Warnings:
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
              }}
            >
              <Sparkles size={18} />
              <span>Sign & Register Prescription on L2</span>
            </button>
          </form>
        </div>
      ) : (
        /* SUCCESS SCREEN: Output Prescription QR */
        <div className="bg-white rounded-3xl p-8 border border-purple-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Prescription Issued & Registered!
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Prescription Hash: <strong className="text-purple-800">{issuedRx.id}</strong>
            </p>
          </div>

          {/* QR Code for patient */}
          <QRCodeDisplay
            value={issuedRx.prescriptionHash}
            title={`Prescription: ${issuedRx.drugName}`}
            subtitle={`Patient: ${issuedRx.patientIdentifier} • Valid 30 Days`}
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/doctor/prescriptions"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              View Prescription Registry
            </Link>

            <button
              onClick={() => {
                setIssuedRx(null);
                setPatientId(`PT-${Math.floor(1000 + Math.random() * 9000)}-X`);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105"
              style={{ backgroundColor: "#7C3AED" }}
            >
              + Issue Another Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
