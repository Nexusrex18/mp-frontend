"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Package, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import StatusBadge, { type BatchStatus } from "@/components/shared/StatusBadge";
import { batchesApi } from "@/lib/api/batches";
import { BatchDetailDto } from "@/lib/api/types";

/* ---------------------------------------------------------------
   Admin — Batch Registry (/admin/batches)
   
   Purpose: Global read-only view of every batch registered on-chain.
   Connected to: GET /batches with live metadata & custody states.
----------------------------------------------------------------*/

interface BatchRow {
  id: string;
  batchNumber: string;
  product: string;
  dosage: string;
  manufacturer: string;
  status: BatchStatus;
  dispensingType: string;
  custodian: string;
  created: string;
  expiry: string;
  [key: string]: unknown;
}

export default function AdminBatchesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      setError(null);
      const res = await batchesApi.listBatches({ limit: 100 });
      const rawList = res?.data || [];
      
      const rows: BatchRow[] = rawList.map((b: BatchDetailDto) => {
        const isExpired = new Date(b.expiryDate) < new Date();
        let status: BatchStatus = "Valid";
        if (isExpired) {
          status = "Expired";
        } else if (b.status === "CREATED" || b.status === "DELIVERED") {
          status = "Valid";
        } else if (b.status === "IN_TRANSIT") {
          status = "InTransit";
        } else if (b.status === "DISPENSED") {
          status = "Dispensed";
        } else if (b.status === "RECALLED") {
          status = "Recalled";
        }

        return {
          id: b.id,
          batchNumber: b.batchChainId ? `#${b.batchChainId}` : b.id.slice(0, 8),
          product: b.product?.name || "Unknown Product",
          dosage: b.product?.dosage || "Standard",
          manufacturer: b.manufacturer?.name || "Manufacturer",
          status,
          dispensingType: b.product?.dispensingType === "OTC" ? "OTC" : "Prescription",
          custodian:
            b.currentCustodian?.name ||
            b.manufacturer?.name ||
            "Authorized Custodian",
          created: new Date(b.createdAt || b.manufacturingDate).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          expiry: new Date(b.expiryDate).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      });

      setBatches(rows);
      setTotalCount(res?.total || rows.length);
    } catch (err: any) {
      console.error("Failed to load batches:", err);
      setError(err?.message || "Failed to load batches from network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const columns: Column<BatchRow>[] = [
    {
      key: "batchNumber",
      label: "Batch ID",
      sortable: true,
      render: (row) => (
        <span className="mt-mono font-bold text-slate-900 text-sm">
          {row.batchNumber}
        </span>
      ),
    },
    {
      key: "product",
      label: "Product & Dosage",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">{row.product}</div>
          <div className="text-xs text-slate-500">{row.dosage}</div>
        </div>
      ),
    },
    {
      key: "manufacturer",
      label: "Manufacturer",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-700 font-medium">
          {row.manufacturer}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} patientFacing={false} />,
    },
    {
      key: "dispensingType",
      label: "Type",
      sortable: true,
      render: (row) => (
        <span
          className="mt-mono text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            color: row.dispensingType === "Prescription" ? COLORS.indigo : "#0a5c5f",
            backgroundColor:
              row.dispensingType === "Prescription"
                ? "rgba(62,54,176,0.08)"
                : "rgba(185,221,223,0.3)",
          }}
        >
          {row.dispensingType}
        </span>
      ),
    },
    {
      key: "custodian",
      label: "Current Custodian",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-700">{row.custodian}</span>
      ),
    },
    {
      key: "created",
      label: "Registered",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">{row.created}</span>
      ),
    },
    {
      key: "actions",
      label: "Public View",
      render: (row) => (
        <Link
          href={`/verify/${encodeURIComponent(row.id)}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Verify <ExternalLink size={12} />
        </Link>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            Batch Registry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global read-only view of every batch registered on the blockchain network ({totalCount} total).
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadBatches();
          }}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading batches from blockchain...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={batches}
          searchPlaceholder="Search by batch ID, product, manufacturer, or custodian…"
          searchKeys={["batchNumber", "product", "manufacturer", "custodian", "dispensingType"]}
          emptyTitle="No Batches Found"
          emptyDescription="No batches have been registered on the blockchain yet."
        />
      )}
    </div>
  );
}
