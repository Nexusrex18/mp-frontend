"use client";

/* ---------------------------------------------------------------
   MedTrace — Manufacturer Batch Inventory (/manufacturer/batches)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Package,
  ArrowRight,
  ExternalLink,
  QrCode,
  ArrowRightLeft,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function ManufacturerBatchesPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchesApi.listBatches();
        const apiBatches = (res.data || []).map(mapApiBatchToRecord);
        const stored = getStoredBatches();
        const ids = new Set(apiBatches.map((b) => b.id));
        const merged = [...apiBatches, ...stored.filter((b) => !ids.has(b.id))];
        setBatches(merged);
      } catch {
        setBatches(getStoredBatches());
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
    const handleUpdate = () => loadBatches();
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const columns: Column<BatchRecord>[] = [
    {
      header: "Batch Identification",
      sortable: true,
      accessorKey: "productName",
      cell: (batch) => (
        <div>
          <div className="font-bold text-gray-900">{batch.productName}</div>
          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-indigo-700">{batch.id}</span>
            <span>({batch.batchNumber})</span>
          </div>
        </div>
      ),
    },
    {
      header: "Classification",
      sortable: true,
      accessorKey: "dispensingType",
      cell: (batch) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
            batch.dispensingType === "OTC"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-purple-100 text-purple-800 border border-purple-200"
          }`}
        >
          {batch.dispensingType}
        </span>
      ),
    },
    {
      header: "Dosage & Form",
      cell: (batch) => (
        <div>
          <div className="text-gray-900 font-medium">{batch.dosage}</div>
          <div className="text-[11px] text-gray-500">{batch.formulation}</div>
        </div>
      ),
    },
    {
      header: "Quantity",
      sortable: true,
      accessorKey: "quantity",
      cell: (batch) => (
        <div>
          <span className="font-bold text-gray-900">{batch.quantity}</span>
          <span className="text-gray-500 text-[11px]"> / {batch.initialQuantity} {batch.unit}</span>
        </div>
      ),
    },
    {
      header: "Expiry Date",
      sortable: true,
      accessorKey: "expDate",
      cell: (batch) => (
        <span className="font-mono text-gray-700">{batch.expDate}</span>
      ),
    },
    {
      header: "Current Custodian",
      cell: (batch) => (
        <div>
          <div className="font-bold text-gray-900 text-[11px]">
            {batch.currentCustodianRole}
          </div>
          <div className="text-[10px] text-gray-500 truncate max-w-[130px]">
            {batch.currentCustodianName}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      sortable: true,
      accessorKey: "status",
      cell: (batch) => <StatusBadge status={batch.status} size="sm" />,
    },
    {
      header: "Actions",
      cell: (batch) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/manufacturer/batches/${batch.id}`}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-bold text-xs"
            title="View Details"
          >
            Details
          </Link>
          {batch.currentCustodianRole === "Manufacturer" && (
            <Link
              href={`/manufacturer/batches/${batch.id}/transfer`}
              className="p-1.5 rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors font-bold text-xs flex items-center gap-1"
              title="Transfer Custody"
            >
              <ArrowRightLeft size={12} />
              <span>Transfer</span>
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Production Batches Registry
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete cryptographic audit trail of all batches minted by Apex BioPharma
          </p>
        </div>

        <Link
          href="/manufacturer/batches/new"
          className="px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          style={{ backgroundColor: COLORS.magenta }}
        >
          <PlusCircle size={15} />
          <span>+ Mint New Batch</span>
        </Link>
      </div>

      {/* Batches Table */}
      <DataTable
        data={batches}
        columns={columns}
        searchPlaceholder="Search product, NDC, or Batch ID..."
        searchFields={["productName", "batchNumber", "id", "ndcCode"]}
        filterOptions={{
          label: "Classification",
          field: "dispensingType",
          values: ["OTC", "Prescription"],
        }}
        emptyTitle="No production batches found"
        emptyDescription="Get started by minting your first on-chain pharmaceutical batch."
        emptyActionLabel="+ Create First Batch"
        actionHref="/manufacturer/batches/new"
      />
    </div>
  );
}
