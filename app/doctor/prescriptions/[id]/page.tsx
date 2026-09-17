"use client";

/* ---------------------------------------------------------------
   MedTrace — Doctor Prescription Detail (/doctor/prescriptions/[id])
----------------------------------------------------------------*/

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Stethoscope,
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Printer,
  Copy,
  Check,
} from "lucide-react";
import { getStoredPrescriptions } from "@/lib/mockData";
import { PrescriptionRecord } from "@/lib/types";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

export default function DoctorPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [prescription, setPrescription] = useState<PrescriptionRecord | null>(
    null
  );
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const all = getStoredPrescriptions();
    const found = all.find((p) => p.id === resolvedParams.id);
    if (found) {
      setPrescription(found);
    }
  }, [resolvedParams.id]);

  if (!prescription) {
    return (
      <div className="py-12 text-center text-xs text-gray-500">
        Loading prescription details from on-chain registry...
      </div>
    );
  }

  const handleCopyHash = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(prescription.prescriptionHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <Link
        href="/doctor/prescriptions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Prescription Registry</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prescription Details */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-3 pb-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                style={{ backgroundColor: "#7C3AED" }}
              >
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  {prescription.drugName}
                </h1>
                <div className="text-xs text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                  <span>Ref: {prescription.id}</span>
                  <span>•</span>
                  <span>NDC: {prescription.drugCode}</span>
                </div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                prescription.status === "Fulfilled"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {prescription.status === "Fulfilled" ? "✓ Fulfilled" : "Pending Fulfillment"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                Patient Identifier
              </span>
              <span className="font-mono font-bold text-gray-900 text-sm mt-0.5 block">
                {prescription.patientIdentifier}
              </span>
              <span className="text-gray-500 text-[11px]">
                Age: {prescription.patientAge} • {prescription.patientGender}
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                Prescribed Quantity
              </span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                {prescription.quantity} units
              </span>
              <span className="text-gray-500 text-[11px]">
                Refills Allowed: {prescription.refillsAllowed}
              </span>
            </div>

            <div className="col-span-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                Dosage & Clinical Directions
              </span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {prescription.dosage}
              </span>
              <p className="text-gray-600 mt-1 italic">
                "{prescription.instructions}"
              </p>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                Issuing Physician
              </span>
              <span className="font-bold text-gray-900 mt-0.5 block">
                {prescription.doctorName}
              </span>
              <span className="text-gray-500 font-mono text-[10px]">
                {prescription.doctorLicense}
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                Validity Window
              </span>
              <span className="font-mono text-gray-900 mt-0.5 block">
                Issued: {new Date(prescription.issuedAt).toLocaleDateString()}
              </span>
              <span className="font-mono text-amber-700 text-[11px]">
                Expires: {new Date(prescription.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Cryptographic Hash Details */}
          <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-700" />
                <span>On-Chain Cryptographic Reference</span>
              </span>
              <button
                onClick={handleCopyHash}
                className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1"
              >
                {copiedHash ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedHash ? "Copied" : "Copy Hash"}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-purple-200 text-purple-900 break-all">
              {prescription.prescriptionHash}
            </div>
          </div>

          {/* Fulfillment Status Banner */}
          {prescription.status === "Fulfilled" && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-950">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Fulfilled by {prescription.fulfilledByPharmacy}</span>
              </div>
              <div className="text-emerald-800 font-mono text-[11px]">
                Dispensed on {new Date(prescription.fulfilledAt || "").toLocaleString()}
              </div>
              {prescription.dispenseTxHash && (
                <a
                  href={`https://sepolia.arbiscan.io/tx/${prescription.dispenseTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-900 font-bold underline mt-1"
                >
                  <span>View Dispensing Tx on Arbiscan</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Generated QR Code for Patient */}
        <div>
          <QRCodeDisplay
            value={prescription.prescriptionHash}
            title={`${prescription.drugName}`}
            subtitle={`Patient: ${prescription.patientIdentifier} • Ref: ${prescription.id}`}
          />
        </div>
      </div>
    </div>
  );
}
