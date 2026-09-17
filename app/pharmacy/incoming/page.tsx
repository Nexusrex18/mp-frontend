"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Incoming Shipments (/pharmacy/incoming)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  CheckCircle2,
  Package,
  Building2,
  ArrowRight,
  Truck,
} from "lucide-react";
import {
  getStoredBatches,
  saveStoredBatches,
} from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { useWallet } from "@/context/WalletContext";
import { useTx } from "@/context/TxContext";
import { custodyApi } from "@/lib/api/custody";
import { mapApiBatchToRecord } from "@/lib/api/batches";
import { parseCustodyError } from "@/lib/hooks/useCustody";
import { submitTx } from "@/lib/web3/submitTx";
import { apiClient } from "@/lib/api/client";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { COLORS } from "@/lib/constants";

export default function PharmacyIncomingPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBatchId, setProcessingBatchId] = useState<string | null>(null);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string | null>>({});

  const { address, currentStakeholder, getSigner } = useWallet();
  const { setTxInfo } = useTx();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await custodyApi.getIncoming();
      const items = res.data || res.incoming || [];
      const apiIncoming = items.map((item) => ({
        ...mapApiBatchToRecord(item.batch as any),
        status: "PendingAcceptance" as const,
        currentCustodianRole: "Pharmacy" as const,
        currentCustodianName: item.toOrg?.name || "CityCare Central Pharmacy",
      }));

      const stored = getStoredBatches().filter(
        (b) => b.currentCustodianRole === "Pharmacy" && b.status === "PendingAcceptance"
      );
      const ids = new Set(apiIncoming.map((b) => b.id));
      setBatches([...apiIncoming, ...stored.filter((b) => !ids.has(b.id))]);
    } catch {
      const stored = getStoredBatches().filter(
        (b) => b.currentCustodianRole === "Pharmacy" && b.status === "PendingAcceptance"
      );
      setBatches(stored);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const handleAcceptBatch = async (batch: BatchRecord) => {
    setInlineErrors((prev) => ({ ...prev, [batch.id]: null }));
    setProcessingBatchId(batch.id);

    try {
      setTxInfo({
        state: "awaiting_signature",
        title: "Accept Delivery into Pharmacy Stock",
        description: `Please sign acceptance of batch ${batch.id} in your wallet...`,
      });

      const prepared = await custodyApi.prepareAccept({ batchId: batch.id });

      const signer = await getSigner();
      if (!signer) {
        throw new Error("Wallet not connected. Please connect your pharmacy wallet.");
      }

      const { txHash } = await submitTx(signer, prepared, {
        onTxSubmitted: (hash) => {
          setTxInfo({
            state: "pending_onchain",
            txHash: hash,
            title: "Accepting Delivery",
            description: "Custody acceptance submitted to Arbitrum Sepolia...",
          });
        },
      });

      setTxInfo({
        state: "confirming_index",
        txHash,
        title: "Indexing Transfer",
        description: "Waiting for pharmacy intake to be indexed...",
      });

      // Poll indexer
      let attempts = 0;
      while (attempts < 15) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const statusRes = await apiClient.get<any>(`/indexer/status?txHash=${txHash}`);
          if (statusRes?.indexed) break;
        } catch {}
        attempts++;
      }

      setTxInfo({
        state: "confirmed",
        txHash,
        title: "Intake Accepted",
        description: `Batch ${batch.id} successfully stocked into active pharmacy inventory!`,
      });

      const newCustodyEvent: CustodyEvent = {
        id: `cust-${Date.now()}`,
        timestamp: new Date().toISOString(),
        stage: "ReceivedByPharmacy",
        actorRole: "Pharmacy",
        actorName: currentStakeholder?.name || "CityCare Central Pharmacy",
        actorAddress: address || "0x89D...71c4",
        txHash,
        blockNumber: 0,
        location: "Manhattan Pharmacy Dispensary Shelf",
        notes: "Received and verified intact. Stocked into inventory.",
        temperatureVerified: true,
      };

      const updatedBatch: BatchRecord = {
        ...batch,
        status: "Valid",
        currentCustodianRole: "Pharmacy",
        currentCustodianName: currentStakeholder?.name || "CityCare Central Pharmacy",
        currentCustodianAddress: address || "0x89D...71c4",
        custodyTimeline: [...batch.custodyTimeline, newCustodyEvent],
      };

      const all = getStoredBatches();
      const updated = all.map((b) => (b.id === batch.id ? updatedBatch : b));
      saveStoredBatches(updated);
      window.dispatchEvent(new Event("medtrace_data_updated"));

      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
    } catch (err: any) {
      const parsed = parseCustodyError(err);
      setInlineErrors((prev) => ({ ...prev, [batch.id]: parsed.message }));
      setTxInfo({
        state: "error",
        title: "Intake Acceptance Blocked",
        description: parsed.message,
        error: parsed.message,
      });
    } finally {
      setProcessingBatchId(null);
    }
  };

  const incomingBatches = batches;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Incoming Distributor Shipments
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Shipments dispatched by wholesale distributors awaiting physical receipt and inventory stocking
        </p>
      </div>

      {incomingBatches.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incoming shipments awaiting intake"
          description="All received batches are stocked in active inventory and available for dispensing."
          actionLabel="View Pharmacy Inventory"
          actionHref="/pharmacy/inventory"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomingBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4 hover:border-amber-400 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-gray-900">
                      {batch.productName}
                    </h3>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        batch.dispensingType === "OTC"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {batch.dispensingType}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    Batch ID: <strong>{batch.id}</strong> ({batch.batchNumber})
                  </div>
                </div>

                <StatusBadge status={batch.status} size="sm" />
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl text-xs space-y-1.5 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sender / Distributor:</span>
                  <span className="font-bold text-gray-900">
                    SwiftLogistics Health
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-bold text-gray-900">
                    {batch.quantity} {batch.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dosage:</span>
                  <span className="font-medium text-gray-900">{batch.dosage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="font-mono text-gray-900">{batch.expDate}</span>
                </div>
              </div>

              {inlineErrors[batch.id] && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-800">
                  <span className="font-bold">Intake Blocked: </span>
                  <span>{inlineErrors[batch.id]}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <Link
                  href={`/pharmacy/batches/${batch.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Details
                </Link>

                <button
                  onClick={() => handleAcceptBatch(batch)}
                  disabled={processingBatchId === batch.id}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 ${
                    processingBatchId === batch.id
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-105 active:scale-95"
                  }`}
                  style={{ backgroundColor: "#059669" }}
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {processingBatchId === batch.id
                      ? "Accepting on L2..."
                      : "Accept into Stock"}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
