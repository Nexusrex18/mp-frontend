"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Incoming Shipments (/distributor/incoming)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  QrCode,
  CheckCircle2,
  Truck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  getStoredBatches,
  saveStoredBatches,
  generateTxHash,
} from "@/lib/mockData";
import { BatchRecord, CustodyEvent } from "@/lib/types";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { COLORS } from "@/lib/constants";

export default function DistributorIncomingPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  useEffect(() => {
    setBatches(getStoredBatches());
    const handleUpdate = () => setBatches(getStoredBatches());
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const incomingBatches = batches.filter(
    (b) =>
      b.currentCustodianRole === "Distributor" &&
      b.status === "PendingAcceptance"
  );

  const handleAcceptCustody = async (batch: BatchRecord) => {
    const acceptTx = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "ReceivedByDistributor",
      actorRole: "Distributor",
      actorName: currentStakeholder?.name || "SwiftLogistics Health",
      actorAddress: address || "0x3A2...98b1",
      txHash: acceptTx,
      blockNumber: 1997100,
      location: "Newark Logistics Hub Intake Bay",
      notes: "Physical seal verified intact. Cold chain temperature within compliant range.",
      temperatureVerified: true,
    };

    const updatedBatch: BatchRecord = {
      ...batch,
      status: "Valid",
      currentCustodianRole: "Distributor",
      currentCustodianName: currentStakeholder?.name || "SwiftLogistics Health",
      currentCustodianAddress: address || "0x3A2...98b1",
      custodyTimeline: [...batch.custodyTimeline, newCustodyEvent],
    };

    await executeTx({
      title: "Accept Custody of Shipment",
      description: `Sealing on-chain receipt for batch ${batch.id} on Arbitrum Sepolia...`,
      onCommit: () => {
        const all = getStoredBatches();
        const updated = all.map((b) => (b.id === batch.id ? updatedBatch : b));
        saveStoredBatches(updated);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Incoming Shipments Awaiting Custody Acceptance
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pharmaceutical batches dispatched by manufacturers awaiting physical verification and cryptographic receipt
          </p>
        </div>

        <Link
          href="/distributor/scan"
          className="px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          style={{ backgroundColor: COLORS.indigo }}
        >
          <QrCode size={16} />
          <span>Open QR Scanner</span>
        </Link>
      </div>

      {incomingBatches.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No pending incoming shipments"
          description="All transferred batches have been physically received and accepted onto the distributor ledger."
          actionLabel="Check Warehouse Inventory"
          actionHref="/distributor/inventory"
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
                  <span className="text-gray-500">Dispatched By:</span>
                  <span className="font-bold text-gray-900">
                    {batch.manufacturerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-bold text-gray-900">
                    {batch.quantity} {batch.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Storage Req:</span>
                  <span className="font-medium text-gray-900">
                    {batch.storageCondition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="font-mono text-gray-900">{batch.expDate}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Link
                  href={`/distributor/batches/${batch.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  View Details
                </Link>

                <button
                  onClick={() => handleAcceptCustody(batch)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: "#0284C7" }}
                >
                  <CheckCircle2 size={14} />
                  <span>Verify & Accept Custody</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
