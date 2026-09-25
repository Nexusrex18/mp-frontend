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
} from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { custodyApi } from "@/lib/api/custody";
import type { StakeholderItemDto } from "@/lib/api/types";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import { parseCustodyError } from "@/lib/hooks/useCustody";
import { COLORS } from "@/lib/constants";

export default function ManufacturerTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { address, currentStakeholder } = useWallet();

  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [distributors, setDistributors] = useState<StakeholderItemDto[]>([]);
  const [distributorsLoading, setDistributorsLoading] = useState(true);
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [customWallet, setCustomWallet] = useState("");
  const [carrierRef, setCarrierRef] = useState("DHL ColdChain Express #TL-882");
  const [notes, setNotes] = useState(
    "Dispatched in temperature-controlled crate (4.2°C). Seal #SL-9941."
  );
  const [tempChecked, setTempChecked] = useState(true);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    custodyApi
      .eligibleRecipients('DISTRIBUTOR')
      .then((res) => {
        if (!isMounted) return;
        setDistributors(res.data);
        if (res.data.length > 0) {
          setSelectedDistributorId(res.data[0].id);
          setCustomWallet(res.data[0].walletAddress);
        }
      })
      .catch((err: any) => {
        if (isMounted) setInlineError(err?.message || "Failed to load distributors.");
      })
      .finally(() => {
        if (isMounted) setDistributorsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadBatch = async () => {
      try {
        const apiBatch = await batchesApi.getBatchById(resolvedParams.id);
        if (apiBatch && isMounted) {
          setBatch(mapApiBatchToRecord(apiBatch));
          return;
        }
      } catch {
        // Fallback
      }

      const batches = getStoredBatches();
      const found = batches.find((b) => b.id === resolvedParams.id);
      if (found && isMounted) {
        setBatch(found);
      }
    };

    loadBatch();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const selectedDistributor = distributors.find((d) => d.id === selectedDistributorId);
  const distributorName = selectedDistributor?.organization?.name || "Distributor";

  const txFlow = useTxFlow({
    prepare: async () => {
      setInlineError(null);
      if (!batch) throw new Error("Batch not loaded");
      const targetAddress = customWallet.trim();
      try {
        return await custodyApi.prepareTransfer({
          batchId: batch.id,
          toWalletAddress: targetAddress,
        });
      } catch (err: any) {
        const parsed = parseCustodyError(err);
        setInlineError(parsed.message);
        throw err;
      }
    },
    title: "Initiate Custody Transfer",
    description: `Transferring custody of ${batch?.id || 'batch'} to ${distributorName} on L2...`,
    onSuccess: ({ txHash }) => {
      if (!batch) return;
      const targetAddress = customWallet.trim();
      const newCustodyEvent: CustodyEvent = {
        id: `cust-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: "TransferredToDistributor",
        actorRole: "Manufacturer",
        actorName: currentStakeholder?.name || "Apex BioPharma Inc.",
        actorAddress: address || "0x71C...4F9a",
        toActorName: distributorName,
        toActorAddress: targetAddress,
        txHash,
        blockNumber: 0,
        location: "Bridgewater Shipping Bay 2",
        notes: `${carrierRef} — ${notes}`,
        temperatureVerified: tempChecked,
      };

      const updatedBatch: BatchRecord = {
        ...batch,
        status: "InTransit",
        currentCustodianRole: "Distributor",
        currentCustodianName: distributorName,
        currentCustodianAddress: targetAddress,
        custodyTimeline: [...batch.custodyTimeline, newCustodyEvent],
      };

      const batches = getStoredBatches();
      const updated = batches.map((b) => (b.id === batch.id ? updatedBatch : b));
      saveStoredBatches(updated);
      window.dispatchEvent(new Event("medtrace_data_updated"));

      router.push(`/manufacturer/batches/${batch.id}`);
    },
    onError: (err: any) => {
      const parsed = parseCustodyError(err);
      setInlineError(parsed.message);
    },
  });

  if (!batch) {
    return (
      <div className="py-12 text-center text-xs text-gray-500">
        Loading batch transfer details...
      </div>
    );
  }

  // Mirror the backend rules so the user isn't sent through a doomed signing flow.
  const transferBlockedReason =
    batch.status === "InTransit"
      ? "This batch is already in transit. Wait for the distributor to accept it before starting another transfer."
      : batch.currentCustodianRole !== "Manufacturer"
      ? `Custody has already moved to the ${batch.currentCustodianRole.toLowerCase()}. Only the current custodian can transfer this batch.`
      : batch.status !== "Valid"
      ? `A batch with status "${batch.status}" cannot be transferred.`
      : null;

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    await txFlow.execute();
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
              disabled={distributorsLoading}
              onChange={(e) => {
                setSelectedDistributorId(e.target.value);
                const d = distributors.find((x) => x.id === e.target.value);
                if (d) setCustomWallet(d.walletAddress);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              {distributorsLoading && <option value="">Loading distributors...</option>}
              {!distributorsLoading && distributors.length === 0 && (
                <option value="">No registered distributors</option>
              )}
              {distributors.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.organization?.name || "Unnamed distributor"} — {dist.walletAddress.slice(0, 6)}…{dist.walletAddress.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Distributor Node Wallet Address (Arbitrum Sepolia):
            </label>
            <input
              type="text"
              required
              value={customWallet}
              onChange={(e) => setCustomWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Must be registered with DISTRIBUTOR_ROLE on AccessControl smart contract.
            </p>
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

          {transferBlockedReason && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
              <span className="font-bold">Transfer unavailable: </span>
              <span>{transferBlockedReason}</span>
            </div>
          )}

          {inlineError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
              <span className="font-bold">Transfer Blocked:</span>
              <span>{inlineError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={txFlow.isProcessing || !!transferBlockedReason}
            className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              txFlow.isProcessing || transferBlockedReason ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            }`}
            style={{
              backgroundColor: COLORS.magenta,
              boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
            }}
          >
            <Send size={16} />
            <span>
              {txFlow.isProcessing
                ? "Signing & Confirming on L2..."
                : "Sign & Dispatch Custody on L2"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
