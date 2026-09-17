"use client";

/* ---------------------------------------------------------------
   MedTrace — OTC Dispense Form Component
   Rendered ONLY for OTC-classified pharmaceuticals.
   Hard Rule #1: Zero prescription UI or inputs rendered here.
----------------------------------------------------------------*/

import React, { useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Pill,
} from "lucide-react";
import { BatchRecord } from "@/lib/types";
import { COLORS } from "@/lib/constants";

interface OTCDispenseFormProps {
  batch: BatchRecord;
  onConfirm: (quantity: number, notes: string) => void;
  isProcessing: boolean;
}

export default function OTCDispenseForm({
  batch,
  onConfirm,
  isProcessing,
}: OTCDispenseFormProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [pharmacistVerified, setPharmacistVerified] = useState(true);
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [notes, setNotes] = useState("Direct OTC patient purchase.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacistVerified || !packagingIntact) return;
    onConfirm(quantity, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
      {/* OTC Classification Header */}
      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            OTC
          </div>
          <div>
            <div className="font-extrabold text-sm text-emerald-950">
              Over-The-Counter Dispensing
            </div>
            <div className="text-[11px] text-emerald-700">
              Auto-detected from on-chain metadata. No doctor prescription required.
            </div>
          </div>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-300">
          Available: {batch.quantity} {batch.unit}
        </span>
      </div>

      {/* Quantity Selector */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Dispense Quantity:
        </label>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={Math.min(10, batch.quantity)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-28 px-4 py-3 rounded-xl border border-gray-300 text-center font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          />
          <span className="text-xs font-medium text-gray-600">
            {batch.unit} ({batch.dosage})
          </span>
        </div>
      </div>

      {/* Pharmacist Safety Checklist */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
          Pharmacist Safety Check
        </span>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
          <input
            type="checkbox"
            checked={packagingIntact}
            onChange={(e) => setPackagingIntact(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-800 font-medium">
            Physical packaging intact with tamper-evident seal and legible expiration date ({batch.expDate}).
          </span>
        </label>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
          <input
            type="checkbox"
            checked={pharmacistVerified}
            onChange={(e) => setPharmacistVerified(e.target.checked)}
            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-800 font-medium">
            Patient dosage counseling completed and age appropriateness verified.
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !pharmacistVerified || !packagingIntact}
        className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          backgroundColor: COLORS.magenta,
          boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
        }}
      >
        <PackageCheck size={18} />
        <span>Confirm OTC Dispensing on L2</span>
      </button>
    </form>
  );
}
