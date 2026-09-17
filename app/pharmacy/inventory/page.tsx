"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Inventory (/pharmacy/inventory)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Zap,
  QrCode,
  ArrowRight,
  Pill,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import { batchesApi, mapApiBatchToRecord } from "@/lib/api/batches";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function PharmacyInventoryPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const res = await batchesApi.listBatches();
        const apiBatches = (res.data || [])
          .map(mapApiBatchToRecord)
          .filter((b) => b.currentCustodianRole === "Pharmacy");
        const stored = getStoredBatches().filter(
          (b) => b.currentCustodianRole === "Pharmacy"
        );
        const ids = new Set(apiBatches.map((b) => b.id));
        setBatches([...apiBatches, ...stored.filter((b) => !ids.has(b.id))]);
      } catch {
        setBatches(
          getStoredBatches().filter((b) => b.currentCustodianRole === "Pharmacy")
        );
      }
    };

    loadBatches();
    const handleUpdate = () => loadBatches();
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const pharmacyBatches = batches;

  const columns: Column<BatchRecord>[] = [
    {
      header: "Product / Substance",
      sortable: true,
      accessorKey: "productName",
      cell: (batch) => (
        <div>
          <div className="font-bold text-gray-900">{batch.productName}</div>
          <div className="text-[11px] font-mono text-gray-500">
            {batch.id} ({batch.batchNumber})
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
      header: "Strength / Form",
      cell: (batch) => (
        <div>
          <div className="font-medium text-gray-900">{batch.dosage}</div>
          <div className="text-[11px] text-gray-500">{batch.formulation}</div>
        </div>
      ),
    },
    {
      header: "Units in Stock",
      sortable: true,
      accessorKey: "quantity",
      cell: (batch) => (
        <div>
          <span
            className={`font-extrabold text-sm ${
              batch.quantity < 200 ? "text-rose-600" : "text-gray-900"
            }`}
          >
            {batch.quantity}
          </span>{" "}
          <span className="text-gray-500 text-[11px]">{batch.unit}</span>
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
            href={`/pharmacy/batches/${batch.id}`}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-bold text-xs"
          >
            Details
          </Link>
          {batch.status === "Valid" && (
            <Link
              href={`/pharmacy/dispense?batchId=${batch.id}`}
              className="p-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <Zap size={11} className="fill-white" />
              <span>Dispense</span>
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Pharmacy Stock on Hand
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Active pharmaceutical batches verified on-chain and shelved in CityCare Dispensary
          </p>
        </div>

        <Link
          href="/pharmacy/dispense"
          className="px-6 py-3 rounded-2xl font-extrabold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          style={{
            backgroundColor: COLORS.magenta,
            boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
          }}
        >
          <Zap size={15} className="fill-white" />
          <span>⚡ Scan & Dispense Medicine</span>
        </Link>
      </div>

      <DataTable
        data={pharmacyBatches}
        columns={columns}
        searchPlaceholder="Search medicine name, batch ID, NDC..."
        searchFields={["productName", "id", "batchNumber", "ndcCode"]}
        filterOptions={{
          label: "Classification",
          field: "dispensingType",
          values: ["OTC", "Prescription"],
        }}
        emptyTitle="No dispensary stock available"
        emptyDescription="Accept incoming shipments from distributors to populate active stock."
        emptyActionLabel="Check Incoming Shipments"
        actionHref="/pharmacy/incoming"
      />
    </div>
  );
}
