"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Batch Detail (Internal Variant)
----------------------------------------------------------------*/

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  Building2,
  ExternalLink,
  ArrowRightLeft,
  QrCode,
  CheckCircle2,
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
import CustodyTimeline from "@/components/shared/CustodyTimeline";
import IPFSDocPreview from "@/components/shared/IPFSDocPreview";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

export default function DistributorBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

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
        Loading batch records from on-chain state...
      </div>
    );
  }

  const isPendingDistributor =
    batch.currentCustodianRole === "Distributor" &&
    batch.status === "PendingAcceptance";
  const isHeldByDistributor =
    batch.currentCustodianRole === "Distributor" && batch.status === "Valid";

  const handleAcceptCustody = async () => {
    const acceptTx = generateTxHash();

    const newCustodyEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stage: "ReceivedByDistributor",
      actorRole: "Distributor",
      actorName: currentStakeholder?.name || "SwiftLogistics Health",
      actorAddress: address || "0x3A2...98b1",
      txHash: acceptTx,
      blockNumber: 1998500,
      location: "Newark Logistics Hub Intake Bay",
      notes: "Physical inspection complete. Custody accepted.",
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
      title: "Accept Custody",
      description: `Sealing on-chain receipt for batch ${batch.id}...`,
      onCommit: () => {
        const all = getStoredBatches();
        const updated = all.map((b) => (b.id === batch.id ? updatedBatch : b));
        saveStoredBatches(updated);
        setBatch(updatedBatch);
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <Link
          href="/distributor/inventory"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Warehouse Inventory</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(!showQrModal)}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <QrCode size={13} />
            <span>{showQrModal ? "Hide QR" : "Show QR"}</span>
          </button>

          {isPendingDistributor && (
            <button
              onClick={handleAcceptCustody}
              className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
              style={{ backgroundColor: "#0284C7" }}
            >
              <CheckCircle2 size={13} />
              <span>Accept Custody</span>
            </button>
          )}

          {isHeldByDistributor && (
            <Link
              href={`/distributor/transfer?batchId=${batch.id}`}
              className="px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <ArrowRightLeft size={13} />
              <span>Transfer to Pharmacy</span>
            </Link>
          )}
        </div>
      </div>

      {showQrModal && (
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-md animate-in slide-in-from-top-2">
          <QRCodeDisplay
            value={batch.qrPayload || batch.id}
            title={`${batch.productName} (${batch.id})`}
            subtitle="Scannable packaging QR label"
          />
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: "#0284C7" }}
            >
              <Package size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  {batch.productName}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    batch.dispensingType === "OTC"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {batch.dispensingType} Classification
                </span>
                <StatusBadge status={batch.status} size="sm" />
              </div>
              <div className="text-xs text-gray-500 font-mono flex flex-wrap items-center gap-3 mt-1.5">
                <span>Batch ID: <strong>{batch.id}</strong></span>
                <span>•</span>
                <span>Manufacturer: {batch.manufacturerName}</span>
                <span>•</span>
                <span>NDC: {batch.ndcCode}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Custodian
            </div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {batch.currentCustodianName}
            </div>
            <div className="text-xs text-sky-700 font-bold">
              {batch.currentCustodianRole} Node
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Dosage & Form
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block">
              {batch.dosage}
            </span>
            <span className="text-gray-500">{batch.formulation}</span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Warehouse Stock
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block text-sm">
              {batch.quantity} {batch.unit}
            </span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Lifecycle Dates
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block font-mono">
              Exp: {batch.expDate}
            </span>
            <span className="text-gray-500 font-mono text-[10px]">
              Mfg: {batch.mfgDate}
            </span>
          </div>

          <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
            <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
              Storage Condition
            </span>
            <span className="font-bold text-gray-900 mt-0.5 block truncate">
              {batch.storageCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Custody Timeline & IPFS Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">
              Custody Provenance (Internal Trail)
            </h2>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              {batch.custodyTimeline.length} Transfers
            </span>
          </div>

          <CustodyTimeline events={batch.custodyTimeline} mode="full" />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <IPFSDocPreview
              documents={batch.ipfsDocs}
              title="Verified IPFS Certificates"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
