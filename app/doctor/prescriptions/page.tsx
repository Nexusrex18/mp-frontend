"use client";

/* ---------------------------------------------------------------
   MedTrace — Doctor Prescription Registry (/doctor/prescriptions)
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  PlusCircle,
  QrCode,
  CheckCircle2,
  Clock,
  FileCheck2,
} from "lucide-react";
import { getStoredPrescriptions } from "@/lib/mockData";
import { PrescriptionRecord } from "@/lib/types";
import DataTable, { Column } from "@/components/shared/DataTable";
import { COLORS } from "@/lib/constants";

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

  useEffect(() => {
    setPrescriptions(getStoredPrescriptions());
    const handleUpdate = () => setPrescriptions(getStoredPrescriptions());
    window.addEventListener("medtrace_data_updated", handleUpdate);
    return () => window.removeEventListener("medtrace_data_updated", handleUpdate);
  }, []);

  const columns: Column<PrescriptionRecord>[] = [
    {
      header: "Prescription / Drug",
      sortable: true,
      accessorKey: "drugName",
      cell: (row) => (
        <div>
          <div className="font-bold text-gray-900">{row.drugName}</div>
          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
            <span className="font-semibold text-purple-800">{row.id}</span>
            <span>(NDC: {row.drugCode})</span>
          </div>
        </div>
      ),
    },
    {
      header: "Patient Identifier",
      sortable: true,
      accessorKey: "patientIdentifier",
      cell: (row) => (
        <span className="font-mono font-bold text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded">
          {row.patientIdentifier}
        </span>
      ),
    },
    {
      header: "Prescribed Dosage",
      cell: (row) => (
        <div>
          <div className="text-gray-900 font-medium">{row.dosage}</div>
          <div className="text-[11px] text-gray-500">
            Qty: {row.quantity} units • Refills: {row.refillsRemaining}
          </div>
        </div>
      ),
    },
    {
      header: "Issued / Exp Date",
      sortable: true,
      accessorKey: "issuedAt",
      cell: (row) => (
        <div className="font-mono text-[11px]">
          <div className="text-gray-900">
            {new Date(row.issuedAt).toLocaleDateString()}
          </div>
          <div className="text-gray-400">
            Exp: {new Date(row.expiresAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      sortable: true,
      accessorKey: "status",
      cell: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            row.status === "Fulfilled"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {row.status === "Fulfilled" ? "✓ Fulfilled" : "Pending Fulfillment"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <Link
          href={`/doctor/prescriptions/${row.id}`}
          className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-bold text-xs flex items-center gap-1 w-max"
        >
          <QrCode size={12} />
          <span>View QR</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Prescription Registry
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Clinical e-prescriptions hashed and registered to the Ethereum L2 smart contract
          </p>
        </div>

        <Link
          href="/doctor/prescriptions/new"
          className="px-5 py-2.5 rounded-2xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 self-start sm:self-auto"
          style={{ backgroundColor: COLORS.magenta }}
        >
          <PlusCircle size={15} />
          <span>+ Issue New Prescription</span>
        </Link>
      </div>

      <DataTable
        data={prescriptions}
        columns={columns}
        searchPlaceholder="Search drug name, patient ID, or Rx Ref..."
        searchFields={["drugName", "patientIdentifier", "id", "drugCode"]}
        filterOptions={{
          label: "Status",
          field: "status",
          values: ["Pending", "Fulfilled"],
        }}
        emptyTitle="No prescriptions recorded"
        emptyDescription="Issue your first cryptographic prescription to provide a valid QR for patients."
        emptyActionLabel="Issue First Prescription"
        actionHref="/doctor/prescriptions/new"
      />
    </div>
  );
}
