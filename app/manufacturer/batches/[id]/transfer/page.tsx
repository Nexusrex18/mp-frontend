"use client";

/* ---------------------------------------------------------------
   MedTrace — Manufacturer Transfer Custody (/manufacturer/batches/[id]/transfer)
   Initiates on-chain custody handoff to a verified distributor.
----------------------------------------------------------------*/

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Building2,
  ShieldCheck,
  ThermometerSnowflake,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  getStoredBatches,
  saveStoredBatches,
  DEMO_STAKEHOLDERS,
  generateTxHash,
} from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import { COLORS } from "@/lib/constants";

export default function ManufacturerTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState("stk-2");
  const [carrierRef, setCarrierRef] = useState("DHL ColdChain Express #TL-882");
  const [notes, setNotes] = useState(
    "Dispatched in temperature-controlled crate (4.2°C). Seal #SL-9941."
  );
  const [tempChecked, setTempChecked] = useState(true);

  const distributors = DEMO_STAKEHOLDERS.filter(
    (s) => s.role === "DISTRIBUTOR_ROLE"
  );

  useEffect(() => {
    const batches = getStoredBatches();
    const found = batches.find((b) => b.id === resolvedParams.id);
    if (found) {
      setBatch(found);
    }
  }, [resolvedParams.id]);

  if (!batch) {
    return (
      <div className="py-12 text-center text-xs text-gray-500">
        Loading batch transfer details...
      </div>
    );
  }

  const selectedDistributor =
    distributors.find((d) => d.id === selectedDistributorId) || distributors[0];

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const transferTx = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "TransferredToDistributor",
      actorRole: "Manufacturer",
      actorName: currentStakeholder?.name || "Apex BioPharma Inc.",
      actorAddress: address || "0x71C...4F9a",
      toActorName: selectedDistributor.name,
      toActorAddress: selectedDistributor.address,
      txHash: transferTx,
      blockNumber: 1996200,
      location: "Bridgewater Shipping Bay 2",
      notes: `${carrierRef} — ${notes}`,
      temperatureVerified: tempChecked,
    };

    const updatedBatch: BatchRecord = {
      ...batch,
      status: "PendingAcceptance",
      currentCustodianRole: "Distributor",
      currentCustodianName: selectedDistributor.name,
      currentCustodianAddress: selectedDistributor.address,
      custodyTimeline: [...batch.custodyTimeline, newCustodyEvent],
    };

    const success = await executeTx({
      title: "Initiate Custody Transfer",
      description: `Transferring custody of ${batch.id} to ${selectedDistributor.name} on L2...`,
      onCommit: () => {
        const batches = getStoredBatches();
        const updated = batches.map((b) =>
          b.id === batch.id ? updatedBatch : b
        );
        saveStoredBatches(updated);
        router.push(`/manufacturer/batches/${batch.id}`);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Back Link */}
      <Link
        href={`/manufacturer/batches/${batch.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Cancel & Return to Batch Detail</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Transfer Custody to Distributor
              </h1>
              <p className="text-xs text-gray-500">
                Initiates a cryptographically pending handoff on Arbitrum Sepolia L2
              </p>
            </div>
          </div>
        </div>

        {/* Target Batch Summary Card */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Product / Batch:</span>
            <span className="font-bold text-gray-900">
              {batch.productName} ({batch.id})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Quantity:</span>
            <span className="font-bold text-gray-900">
              {batch.quantity} {batch.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Classification:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                batch.dispensingType === "OTC"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {batch.dispensingType}
            </span>
          </div>
        </div>

        {/* Transfer Form */}
        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Authorized Distributor Hub:
            </label>
            <select
              value={selectedDistributorId}
              onChange={(e) => setSelectedDistributorId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              {distributors.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.name} ({dist.location}) — {dist.licenseNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Logistics Carrier & Tracking ID:
            </label>
            <input
              type="text"
              required
              value={carrierRef}
              onChange={(e) => setCarrierRef(e.target.value)}
              placeholder="e.g. FedEx Cold-Chain #FDX-9902"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Dispatch Verification & Seal Notes:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={tempChecked}
              onChange={(e) => setTempChecked(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-emerald-900 font-medium">
              I verify that cold-chain data loggers are activated within required
              temperature thresholds ({batch.storageCondition}).
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.magenta,
              boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
            }}
          >
            <Send size={16} />
            <span>Sign & Dispatch Custody on L2</span>
          </button>
        </form>
      </div>
    </div>
  );
}
