"use client";

/* ---------------------------------------------------------------
   MedTrace — Doctor Dashboard (/doctor)
   Conditional actor portal for issuing and monitoring cryptographic prescriptions.
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  PlusCircle,
  History,
  CheckCircle2,
  Clock,
  QrCode,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import { getStoredPrescriptions } from "@/lib/mockData";
import { PrescriptionRecord } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function DoctorDashboard() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

  useEffect(() => {
    setPrescriptions(getStoredPrescriptions());
    const handleUpdate = () => setPrescriptions(getStoredPrescriptions());
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const pending = prescriptions.filter((p) => p.status === "Pending");
  const fulfilled = prescriptions.filter((p) => p.status === "Fulfilled");

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-purple-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3 border border-white/20">
              <Sparkles size={13} className="text-purple-300" />
              <span>Prescription Issuance & Verification Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dr. Evelyn Reed, MD — Clinical Portal
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-purple-200 leading-relaxed">
              Issue cryptographic, tamper-proof e-prescriptions registered to `Dispensing.sol`. Patients present the generated QR at licensed pharmacies to unlock prescription medicine dispensing.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              href="/doctor/prescriptions/new"
              className="px-6 py-3.5 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
              }}
            >
              <PlusCircle size={18} />
              <span>+ Issue New Prescription</span>
            </Link>

            <Link
              href="/doctor/prescriptions"
              className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-2"
            >
              <History size={16} />
              <span>Prescription Registry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Stethoscope size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {prescriptions.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Total Prescriptions Issued
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {pending.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Awaiting Patient Fulfillment
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">
              {fulfilled.length}
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              Fulfilled by Pharmacies
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-gray-900">100%</div>
            <div className="text-xs text-gray-500 font-semibold">
              Smart Contract Guarded
            </div>
          </div>
        </div>
      </div>

      {/* Recent Prescriptions List */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Recent Clinical Prescriptions
            </h2>
            <p className="text-xs text-gray-500">
              Cryptographically hashed e-prescriptions with verified physician signatures
            </p>
          </div>

          <Link
            href="/doctor/prescriptions"
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>All Prescriptions</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 rounded-xl px-2 transition-colors text-xs"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                  style={{
                    backgroundColor:
                      rx.status === "Fulfilled" ? "#059669" : "#7C3AED",
                  }}
                >
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-gray-900">
                      {rx.drugName}
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Patient: {rx.patientIdentifier}
                    </span>
                  </div>
                  <div className="text-gray-500 font-mono text-[11px] mt-0.5">
                    Ref: {rx.id} • Issued: {new Date(rx.issuedAt).toLocaleDateString()} • Expires: {new Date(rx.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    rx.status === "Fulfilled"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {rx.status === "Fulfilled" ? "✓ Fulfilled" : "Pending Fulfillment"}
                </span>

                <Link
                  href={`/doctor/prescriptions/${rx.id}`}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  View QR →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
