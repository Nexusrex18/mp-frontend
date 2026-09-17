"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Transfer Custody (/distributor/transfer)
   Dispatches warehouse batch to a licensed pharmacy on L2.
----------------------------------------------------------------*/

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Building2,
  Send,
  ThermometerSnowflake,
  ShieldCheck,
  CheckCircle2,
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

function DistributorTransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBatchId = searchParams.get("batchId") || "";

  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("stk-3");
  const [quantityToTransfer, setQuantityToTransfer] = useState<number>(100);
  const [carrierNotes, setCarrierNotes] = useState(
    "Local refrigerated medical courier van #NY-4402. Direct drop-off."
  );
  const [tempVerified, setTempVerified] = useState(true);

  useEffect(() => {
    const all = getStoredBatches();
    setBatches(all);
    if (!selectedBatchId && all.length > 0) {
      setSelectedBatchId(all[0].id);
    }
  }, [selectedBatchId]);

  const pharmacies = DEMO_STAKEHOLDERS.filter((s) => s.role === "PHARMACY_ROLE");
  const selectedPharmacy =
    pharmacies.find((p) => p.id === selectedPharmacyId) || pharmacies[0];
  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    const transferTx = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "TransferredToPharmacy",
      actorRole: "Distributor",
      actorName: currentStakeholder?.name || "SwiftLogistics Health",
      actorAddress: address || "0x3A2...98b1",
      toActorName: selectedPharmacy.name,
      toActorAddress: selectedPharmacy.address,
      txHash: transferTx,
      blockNumber: 1998100,
      location: "Newark Distribution Dock 3",
      notes: carrierNotes,
      temperatureVerified: tempVerified,
    };

    const updatedBatch: BatchRecord = {
      ...selectedBatch,
      status: "PendingAcceptance",
      currentCustodianRole: "Pharmacy",
      currentCustodianName: selectedPharmacy.name,
      currentCustodianAddress: selectedPharmacy.address,
      custodyTimeline: [...selectedBatch.custodyTimeline, newCustodyEvent],
    };

    await executeTx({
      title: "Dispatch to Licensed Pharmacy",
      description: `Transferring custody of ${selectedBatch.id} to ${selectedPharmacy.name} on L2...`,
      onCommit: () => {
        const updated = batches.map((b) =>
          b.id === selectedBatch.id ? updatedBatch : b
        );
        saveStoredBatches(updated);
        router.push(`/distributor/batches/${selectedBatch.id}`);
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <Link
        href="/distributor/inventory"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Warehouse Inventory</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: "#0284C7" }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Dispatch Batch to Licensed Pharmacy
              </h1>
              <p className="text-xs text-gray-500">
                Initiate outbound custody transfer to a verified pharmacy dispensatory on L2
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleConfirmTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Select Batch from Warehouse Stock:
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.productName} ({b.id}) — Stock: {b.quantity} {b.unit} [{b.dispensingType}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Destination Licensed Pharmacy:
            </label>
            <select
              value={selectedPharmacyId}
              onChange={(e) => setSelectedPharmacyId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location}) — License: {p.licenseNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Courier / Delivery Manifest:
            </label>
            <input
              type="text"
              required
              value={carrierNotes}
              onChange={(e) => setCarrierNotes(e.target.value)}
              placeholder="e.g. City Courier Van #12 — Direct Manhattan Delivery"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={tempVerified}
              onChange={(e) => setTempVerified(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-emerald-900 font-medium">
              I verify that outgoing transit vehicle temperature matches storage specification.
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
            <span>Sign & Dispatch to Pharmacy</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DistributorTransferPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-gray-500">Loading transfer form...</div>}>
      <DistributorTransferContent />
    </Suspense>
  );
}
