"use client";

/* ---------------------------------------------------------------
   MedTrace — Pharmacy Dispensing History (/pharmacy/history)
   Cryptographic audit log of all patient dispenses sealed on L2.
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Download,
  ExternalLink,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { getStoredDispensings } from "@/lib/mockData";
import { DispensingRecord } from "@/lib/types";
import { dispensingApi } from "@/lib/api/dispensing";
import { DispensingHistoryItemDto } from "@/lib/api/types";
import { useWallet } from "@/context/WalletContext";
import DataTable, { Column } from "@/components/shared/DataTable";
import { COLORS } from "@/lib/constants";

function mapApiDispenseItemToRecord(item: DispensingHistoryItemDto): DispensingRecord {
  return {
    id: item.id,
    timestamp: item.createdAt,
    batchId: item.batchId,
    batchNumber: item.batch?.batchChainId ? `LOT-${item.batch.batchChainId}` : item.batch?.id || item.batchId.slice(0, 10),
    productName: item.batch?.product?.name || "Pharmaceutical Product",
    dispensingType: item.dispensingType === "OTC" ? "OTC" : "Prescription",
    quantityDispensed: item.quantity,
    pharmacyName: item.pharmacyOrg?.name || "Licensed Pharmacy",
    pharmacyAddress: item.pharmacyOrgId || "0x...",
    pharmacistName: "Staff Pharmacist",
    txHash: item.txHash,
    status: "Confirmed",
    prescriptionHash: item.prescription?.prescriptionHash,
    patientIdentifier: item.prescription?.patientRef || (item.dispensingType === "PRESCRIPTION" ? "PT-VERIFIED" : undefined),
  };
}

export default function PharmacyHistoryPage() {
  const { address, currentStakeholder } = useWallet();
  const [dispensings, setDispensings] = useState<DispensingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      try {
        const orgId = currentStakeholder?.organization || address || undefined;
        const res = await dispensingApi.getHistory({ org: orgId, limit: 100 });
        if (isMounted && res?.data && res.data.length > 0) {
          const records = res.data.map(mapApiDispenseItemToRecord);
          setDispensings(records);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback to local storage
      }

      if (isMounted) {
        setDispensings(getStoredDispensings());
        setIsLoading(false);
      }
    }

    loadHistory();

    const handleUpdate = () => loadHistory();
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("medtrace_data_updated", handleUpdate);
    };
  }, [currentStakeholder, address]);

  const handleExportCSV = () => {
    if (dispensings.length === 0) return;
    const headers = [
      "Receipt ID",
      "Timestamp",
      "Batch ID",
      "Batch Number",
      "Product Name",
      "Classification",
      "Quantity",
      "Patient Identifier",
      "Prescription Hash",
      "Pharmacist",
      "L2 Tx Hash",
    ];

    const rows = dispensings.map((d) => [
      d.id,
      d.timestamp,
      d.batchId,
      d.batchNumber,
      `"${d.productName}"`,
      d.dispensingType,
      d.quantityDispensed,
      d.patientIdentifier || "N/A (OTC)",
      d.prescriptionHash || "N/A",
      `"${d.pharmacistName}"`,
      d.txHash,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MedTrace_Dispense_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<DispensingRecord>[] = [
    {
      header: "Dispense Record / Date",
      sortable: true,
      accessorKey: "timestamp",
      cell: (row) => (
        <div>
          <div className="font-bold text-gray-900">{row.productName}</div>
          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
            <span>{row.id.slice(0, 14)}</span>
            <span>•</span>
            <span>{new Date(row.timestamp).toLocaleDateString()}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Classification",
      sortable: true,
      accessorKey: "dispensingType",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
            row.dispensingType === "OTC"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-purple-100 text-purple-800 border border-purple-200"
          }`}
        >
          {row.dispensingType}
        </span>
      ),
    },
    {
      header: "Quantity",
      sortable: true,
      accessorKey: "quantityDispensed",
      cell: (row) => (
        <span className="font-bold text-gray-900">
          {row.quantityDispensed} units
        </span>
      ),
    },
    {
      header: "Patient / Prescription",
      cell: (row) => (
        <div>
          {row.patientIdentifier ? (
            <div>
              <div className="font-bold text-gray-900 text-[11px]">
                {row.patientIdentifier}
              </div>
              {row.prescriptionHash && (
                <div className="text-[10px] font-mono text-gray-500 truncate max-w-[140px]">
                  Rx: {row.prescriptionHash.slice(0, 10)}...
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 italic text-[11px]">
              Direct OTC Purchase
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Pharmacist / Org",
      accessorKey: "pharmacistName",
      cell: (row) => (
        <div>
          <div className="text-gray-900 text-xs font-semibold">{row.pharmacistName}</div>
          <div className="text-gray-500 text-[10px]">{row.pharmacyName}</div>
        </div>
      ),
    },
    {
      header: "L2 Proof",
      cell: (row) => (
        <a
          href={`https://sepolia.arbiscan.io/tx/${row.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-mono text-[11px] font-bold underline"
        >
          <span>{row.txHash.slice(0, 8)}...</span>
          <ExternalLink size={10} />
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Pharmacy Dispensing Audit Log
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete cryptographic record of all patient dispenses sealed on Arbitrum Sepolia
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={dispensings.length === 0}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV Audit</span>
          </button>

          <Link
            href="/pharmacy/dispense"
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ backgroundColor: COLORS.magenta }}
          >
            <Zap size={14} className="fill-white" />
            <span>+ Dispense Medicine</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-3xl border border-gray-200">
          <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
          <div className="text-xs font-semibold text-gray-500">
            Loading cryptographic dispensing records from indexer...
          </div>
        </div>
      ) : (
        <DataTable
          data={dispensings}
          columns={columns}
          searchPlaceholder="Search product, patient ID, receipt ID..."
          searchFields={["productName", "id", "patientIdentifier", "batchId"]}
          filterOptions={{
            label: "Classification",
            field: "dispensingType",
            values: ["OTC", "Prescription"],
          }}
          emptyTitle="No dispensing events recorded yet"
          emptyDescription="Start dispensing medicines to patients to build the immutable regulatory log."
          emptyActionLabel="Dispense First Medicine"
          actionHref="/pharmacy/dispense"
        />
      )}
    </div>
  );
}
