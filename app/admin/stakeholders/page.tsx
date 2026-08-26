"use client";

import { useState } from "react";
import { UserCheck, UserX, Clock, Shield } from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

/* ---------------------------------------------------------------
   Admin — Stakeholder Management
   
   Purpose: Approve/revoke roles.
   Data in: pending "Request Access" submissions + active stakeholders.
   Data out: grantRole() / revoke calls.
   Goes to: approvals here unblock /auth/connect redirects.
----------------------------------------------------------------*/

interface Stakeholder {
  address: string;
  name: string;
  role: string;
  status: "Active" | "Pending" | "Revoked";
  requestDate: string;
  [key: string]: unknown;
}

const MOCK_STAKEHOLDERS: Stakeholder[] = [
  { address: "0x8f4c…3e1a", name: "PharmaCorp India Pvt. Ltd.", role: "Manufacturer", status: "Active", requestDate: "01 Jan 2026" },
  { address: "0xa2b1…7d4f", name: "MedLogistics Global", role: "Distributor", status: "Active", requestDate: "05 Jan 2026" },
  { address: "0x3c9e…1b2a", name: "HealthFirst Pharmacy", role: "Pharmacy", status: "Active", requestDate: "10 Jan 2026" },
  { address: "0xd5f2…8c3b", name: "Dr. Priya Sharma", role: "Doctor", status: "Active", requestDate: "15 Jan 2026" },
  { address: "0x7e1a…4d5c", name: "CityMed Pharmacy", role: "Pharmacy", status: "Pending", requestDate: "20 Aug 2026" },
  { address: "0x9b3f…6e7d", name: "QuickDist Logistics", role: "Distributor", status: "Pending", requestDate: "22 Aug 2026" },
  { address: "0x1c4a…9f8e", name: "Former Labs Inc.", role: "Manufacturer", status: "Revoked", requestDate: "01 Mar 2026" },
];

const columns: Column<Stakeholder>[] = [
  {
    key: "name",
    label: "Organization",
    sortable: true,
    render: (row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.name}</div>
        <div className="mt-mono mt-text-muted" style={{ fontSize: 11 }}>
          {row.address}
        </div>
      </div>
    ),
  },
  {
    key: "role",
    label: "Role",
    sortable: true,
    render: (row) => (
      <span
        className="mt-mono"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.indigo,
          background: "rgba(62,54,176,0.08)",
          padding: "4px 10px",
          borderRadius: 999,
        }}
      >
        {row.role}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => {
      const colors: Record<string, { bg: string; color: string }> = {
        Active: { bg: "rgba(185,221,223,0.3)", color: "#0a5c5f" },
        Pending: { bg: "rgba(62,54,176,0.1)", color: COLORS.indigo },
        Revoked: { bg: "rgba(17,17,17,0.06)", color: "rgba(17,17,17,0.5)" },
      };
      const c = colors[row.status] || colors.Active;
      return (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: c.color,
            background: c.bg,
            padding: "4px 10px",
            borderRadius: 999,
          }}
        >
          {row.status}
        </span>
      );
    },
  },
  { key: "requestDate", label: "Joined", sortable: true },
  {
    key: "actions",
    label: "Actions",
    render: (row) => {
      if (row.status === "Pending") {
        return (
          <div className="flex items-center" style={{ gap: 6 }}>
            <button
              className="mt-btn-primary"
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Approve
            </button>
            <button
              style={{
                padding: "5px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                border: "1px solid rgba(17,17,17,0.15)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Reject
            </button>
          </div>
        );
      }
      if (row.status === "Active") {
        return (
          <button
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.magenta,
              border: `1px solid ${COLORS.magenta}`,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Revoke
          </button>
        );
      }
      return <span className="mt-text-muted" style={{ fontSize: 12 }}>—</span>;
    },
  },
];

export default function AdminStakeholdersPage() {
  const pendingCount = MOCK_STAKEHOLDERS.filter((s) => s.status === "Pending").length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 12, marginBottom: 28 }}>
        <div>
          <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
            Stakeholder Management
          </h1>
          <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
            Approve, manage, and revoke supply chain participant roles.
          </p>
        </div>
        {pendingCount > 0 && (
          <div
            className="mt-mono inline-flex items-center"
            style={{
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.indigo,
              background: "rgba(62,54,176,0.08)",
              padding: "8px 14px",
              borderRadius: 999,
            }}
          >
            <Clock size={14} /> {pendingCount} pending
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={MOCK_STAKEHOLDERS}
        searchPlaceholder="Search by name, address, or role…"
        searchKeys={["name", "address", "role", "status"]}
        emptyTitle="No stakeholders"
        emptyDescription="No registered supply chain participants yet."
      />
    </div>
  );
}
