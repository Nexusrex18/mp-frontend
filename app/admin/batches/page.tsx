"use client";

import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import StatusBadge, { type BatchStatus } from "@/components/shared/StatusBadge";

/* ---------------------------------------------------------------
   Admin — Batch Registry
   
   Purpose: Global read-only view of every batch in the system.
   Built from: DataTable, click-through to internal Batch Detail.
----------------------------------------------------------------*/

interface BatchRow {
  id: string;
  product: string;
  manufacturer: string;
  status: BatchStatus;
  dispensingType: string;
  custodian: string;
  created: string;
  [key: string]: unknown;
}

const MOCK_BATCHES: BatchRow[] = [
  { id: "A19-0442", product: "Amoxicillin 500mg", manufacturer: "PharmaCorp India", status: "Valid", dispensingType: "OTC", custodian: "HealthFirst Pharmacy", created: "04 Feb 2026" },
  { id: "B22-1187", product: "Paracetamol 650mg", manufacturer: "GenMed Labs", status: "Expired", dispensingType: "OTC", custodian: "CityMed Pharmacy", created: "15 Jan 2024" },
  { id: "C05-FAKE", product: "Ciprofloxacin 250mg", manufacturer: "Unknown", status: "Counterfeit", dispensingType: "—", custodian: "—", created: "Unknown" },
  { id: "D31-7789", product: "Metformin 850mg", manufacturer: "PharmaCorp India", status: "Valid", dispensingType: "Prescription", custodian: "MedLogistics Global", created: "10 Aug 2026" },
  { id: "E44-2301", product: "Ibuprofen 400mg", manufacturer: "GenMed Labs", status: "Valid", dispensingType: "OTC", custodian: "PharmaCorp India", created: "18 Aug 2026" },
  { id: "F12-9943", product: "Azithromycin 500mg", manufacturer: "PharmaCorp India", status: "Pending", dispensingType: "Prescription", custodian: "PharmaCorp India", created: "24 Aug 2026" },
  { id: "G78-5512", product: "Omeprazole 20mg", manufacturer: "GenMed Labs", status: "Recalled", dispensingType: "OTC", custodian: "FastPharma Distributors", created: "01 Jul 2026" },
];

const columns: Column<BatchRow>[] = [
  {
    key: "id",
    label: "Batch ID",
    sortable: true,
    render: (row) => (
      <span className="mt-mono" style={{ fontSize: 13, fontWeight: 600 }}>
        {row.id}
      </span>
    ),
  },
  { key: "product", label: "Product", sortable: true },
  { key: "manufacturer", label: "Manufacturer", sortable: true },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => (
      <StatusBadge status={row.status} patientFacing={false} />
    ),
  },
  {
    key: "dispensingType",
    label: "Type",
    sortable: true,
    render: (row) => (
      <span
        className="mt-mono"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: row.dispensingType === "Prescription" ? COLORS.indigo : "rgba(17,17,17,0.5)",
        }}
      >
        {row.dispensingType}
      </span>
    ),
  },
  { key: "custodian", label: "Current Custodian", sortable: true },
  { key: "created", label: "Created", sortable: true },
];

export default function AdminBatchesPage() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
          Batch Registry
        </h1>
        <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
          Global read-only view of every batch registered on the network.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={MOCK_BATCHES}
        searchPlaceholder="Search by batch ID, product, or manufacturer…"
        searchKeys={["id", "product", "manufacturer", "custodian", "status"]}
        emptyTitle="No batches registered"
        emptyDescription="No medicine batches have been created yet."
      />
    </div>
  );
}
