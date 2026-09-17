"use client";

/* ---------------------------------------------------------------
   MedTrace — Distributor Warehouse Inventory (/distributor/inventory)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ArrowRightLeft,
  QrCode,
  Truck,
} from "lucide-react";
import { getStoredBatches } from "@/lib/mockData";
import { BatchRecord } from "@/lib/types";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { COLORS } from "@/lib/constants";

export default function DistributorInventoryPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);

  useEffect(() => {
    setBatches(getStoredBatches());
    const handleUpdate = () => setBatches(getStoredBatches());
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const warehouseBatches = batches.filter(
    (b) => b.currentCustodianRole === "Distributor"
  );

  const columns: Column<BatchRecord>[] = [
    {
      header: "Product / Batch",
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
              ? "bg-emerald-100 text-emerald-800"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {batch.dispensingType}
        </span>
      ),
    },
    {
      header: "Quantity on Hand",
      sortable: true,
      accessorKey: "quantity",
      cell: (batch) => (
        <div>
          <span className="font-bold text-gray-900">{batch.quantity}</span>{" "}
          <span className="text-gray-500 text-[11px]">{batch.unit}</span>
        </div>
      ),
    },
    {
      header: "Storage Condition",
      cell: (batch) => (
        <span className="text-gray-600 text-[11px]">{batch.storageCondition}</span>
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
            href={`/distributor/batches/${batch.id}`}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-bold text-xs"
          >
            Details
          </Link>
          {batch.status === "Valid" && (
            <Link
              href={`/distributor/transfer?batchId=${batch.id}`}
              className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors font-bold text-xs flex items-center gap-1"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Warehouse Inventory & Cold-Storage
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Pharmaceutical batches currently held under SwiftLogistics custody
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/distributor/scan"
            className="px-4 py-2 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <QrCode size={14} />
            <span>Scan Intake</span>
          </Link>
          <Link
            href="/distributor/transfer"
            className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ backgroundColor: COLORS.indigo }}
          >
            <ArrowRightLeft size={14} />
            <span>Dispatch to Pharmacy</span>
          </Link>
        </div>
      </div>

      <DataTable
        data={warehouseBatches}
        columns={columns}
        searchPlaceholder="Search product, batch ID, NDC..."
        searchFields={["productName", "id", "batchNumber"]}
        filterOptions={{
          label: "Classification",
          field: "dispensingType",
          values: ["OTC", "Prescription"],
        }}
        emptyTitle="No warehouse stock currently held"
        emptyDescription="Accept incoming batches from manufacturers to populate your warehouse inventory."
        emptyActionLabel="Scan Incoming Batches"
        actionHref="/distributor/scan"
      />
    </div>
  );
}
