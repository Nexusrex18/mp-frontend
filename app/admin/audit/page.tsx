"use client";

import { Download } from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";

/* ---------------------------------------------------------------
   Admin — Audit Log
   
   Purpose: Regulatory audit trail — immutable event log
   across all contract writes, with tx hash links, export CSV/PDF.
----------------------------------------------------------------*/

interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  target: string;
  txHash: string;
  block: number;
  [key: string]: unknown;
}

const MOCK_AUDIT: AuditEntry[] = [
  { timestamp: "2026-08-26 11:42", action: "createBatch", actor: "PharmaCorp India", role: "Manufacturer", target: "Batch #A19-0442", txHash: "0x8f4c…3e1a", block: 1492301 },
  { timestamp: "2026-08-26 10:15", action: "transferCustody", actor: "PharmaCorp India", role: "Manufacturer", target: "Batch #A19-0442 → MedLogistics", txHash: "0xa2b1…7d4f", block: 1492288 },
  { timestamp: "2026-08-25 16:30", action: "acceptCustody", actor: "MedLogistics Global", role: "Distributor", target: "Batch #A19-0442", txHash: "0x3c9e…1b2a", block: 1492200 },
  { timestamp: "2026-08-25 09:10", action: "transferCustody", actor: "MedLogistics Global", role: "Distributor", target: "Batch #A19-0442 → HealthFirst", txHash: "0xd5f2…8c3b", block: 1492150 },
  { timestamp: "2026-08-24 14:55", action: "acceptCustody", actor: "HealthFirst Pharmacy", role: "Pharmacy", target: "Batch #A19-0442", txHash: "0x7e1a…4d5c", block: 1492090 },
  { timestamp: "2026-08-24 11:20", action: "dispenseMedicine", actor: "HealthFirst Pharmacy", role: "Pharmacy", target: "Batch #A19-0442 (OTC)", txHash: "0x9b3f…6e7d", block: 1492070 },
  { timestamp: "2026-08-23 08:45", action: "grantRole", actor: "Admin", role: "Admin", target: "0x3c9e…1b2a → Pharmacy", txHash: "0x1c4a…9f8e", block: 1491980 },
  { timestamp: "2026-08-22 15:00", action: "createBatch", actor: "GenMed Labs", role: "Manufacturer", target: "Batch #B22-1187", txHash: "0x5d2b…0a1c", block: 1491900 },
];

const ACTION_COLORS: Record<string, string> = {
  createBatch: "#0a5c5f",
  transferCustody: COLORS.indigo,
  acceptCustody: COLORS.indigo,
  dispenseMedicine: "#0a5c5f",
  grantRole: COLORS.magenta,
  revokeRole: COLORS.magenta,
};

const columns: Column<AuditEntry>[] = [
  { key: "timestamp", label: "Time", sortable: true, width: "150px" },
  {
    key: "action",
    label: "Action",
    sortable: true,
    render: (row) => (
      <span
        className="mt-mono"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: ACTION_COLORS[row.action] || COLORS.ink,
          background: `${ACTION_COLORS[row.action] || COLORS.ink}15`,
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        {row.action}
      </span>
    ),
  },
  {
    key: "actor",
    label: "Actor",
    sortable: true,
    render: (row) => (
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{row.actor}</div>
        <div className="mt-text-muted" style={{ fontSize: 11 }}>{row.role}</div>
      </div>
    ),
  },
  { key: "target", label: "Target", sortable: true },
  {
    key: "txHash",
    label: "Tx Hash",
    render: (row) => (
      <a
        href="#"
        className="mt-mono mt-text-indigo"
        style={{
          fontSize: 12,
          fontWeight: 500,
          textDecoration: "underline",
        }}
      >
        {row.txHash}
      </a>
    ),
  },
  {
    key: "block",
    label: "Block",
    sortable: true,
    render: (row) => (
      <span className="mt-mono mt-text-muted" style={{ fontSize: 12 }}>
        {row.block}
      </span>
    ),
  },
];

export default function AdminAuditPage() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ gap: 12, marginBottom: 28 }}
      >
        <div>
          <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
            Audit Log
          </h1>
          <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
            Immutable record of all on-chain operations across the network.
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            className="mt-btn-secondary inline-flex items-center"
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              gap: 6,
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="mt-btn-secondary inline-flex items-center"
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              gap: 6,
            }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={MOCK_AUDIT}
        searchPlaceholder="Search by action, actor, or target…"
        searchKeys={["action", "actor", "target", "txHash"]}
        emptyTitle="No audit entries"
        emptyDescription="No on-chain events recorded yet."
      />
    </div>
  );
}
