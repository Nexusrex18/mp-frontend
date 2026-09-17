"use client";

import { useState } from "react";
import { AlertTriangle, Flag, Eye, MessageSquare, MapPin } from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";

/* ---------------------------------------------------------------
   Admin — Alerts
   
   Purpose: Counterfeit/anomaly flags AND incoming Report Issue
   submissions from /verify/report (Phase 2).
   Data in: flagged batches + patient-reported issues.
----------------------------------------------------------------*/

type AlertType = "report" | "anomaly" | "expiry";

interface AlertRow {
  id: number;
  type: AlertType;
  severity: "High" | "Medium" | "Low";
  title: string;
  batchId: string;
  source: string;
  location: string;
  date: string;
  status: "Open" | "Investigating" | "Resolved";
  [key: string]: unknown;
}

const MOCK_ALERTS: AlertRow[] = [
  { id: 1, type: "report", severity: "High", title: "Patient reported suspected counterfeit", batchId: "C05-FAKE", source: "Patient Report", location: "Mumbai, India", date: "26 Aug 2026", status: "Open" },
  { id: 2, type: "anomaly", severity: "High", title: "Batch verification failed — unregistered", batchId: "X99-0000", source: "Verify System", location: "—", date: "25 Aug 2026", status: "Investigating" },
  { id: 3, type: "report", severity: "Medium", title: "Packaging looks different from usual", batchId: "A19-0442", source: "Patient Report", location: "Bangalore, India", date: "24 Aug 2026", status: "Investigating" },
  { id: 4, type: "expiry", severity: "Low", title: "Expired batch scanned by patient", batchId: "B22-1187", source: "Verify System", location: "Pune, India", date: "23 Aug 2026", status: "Resolved" },
  { id: 5, type: "report", severity: "Medium", title: "Tablet color seems wrong", batchId: "D31-7789", source: "Patient Report", location: "Delhi, India", date: "22 Aug 2026", status: "Open" },
  { id: 6, type: "anomaly", severity: "High", title: "Batch recalled but still being dispensed", batchId: "G78-5512", source: "Audit System", location: "Chennai, India", date: "21 Aug 2026", status: "Open" },
];

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  High: { bg: "rgba(246,32,136,0.12)", color: COLORS.magenta },
  Medium: { bg: "rgba(62,54,176,0.1)", color: COLORS.indigo },
  Low: { bg: "rgba(17,17,17,0.06)", color: "rgba(17,17,17,0.55)" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Open: { bg: "rgba(246,32,136,0.1)", color: COLORS.magenta },
  Investigating: { bg: "rgba(62,54,176,0.1)", color: COLORS.indigo },
  Resolved: { bg: "rgba(185,221,223,0.3)", color: "#0a5c5f" },
};

const TYPE_ICONS: Record<AlertType, typeof AlertTriangle> = {
  report: MessageSquare,
  anomaly: AlertTriangle,
  expiry: Flag,
};

const columns: Column<AlertRow>[] = [
  {
    key: "severity",
    label: "",
    width: "40px",
    render: (row) => {
      const Icon = TYPE_ICONS[row.type];
      const s = SEVERITY_STYLES[row.severity];
      return (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: s.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={15} color={s.color} />
        </div>
      );
    },
  },
  {
    key: "title",
    label: "Alert",
    sortable: true,
    render: (row) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{row.title}</div>
        <div className="mt-mono mt-text-muted" style={{ fontSize: 11, marginTop: 2 }}>
          Batch: {row.batchId} · {row.source}
        </div>
      </div>
    ),
  },
  {
    key: "location",
    label: "Location",
    render: (row) => (
      <span className="inline-flex items-center mt-text-muted" style={{ gap: 4, fontSize: 13 }}>
        <MapPin size={12} /> {row.location}
      </span>
    ),
  },
  {
    key: "severity",
    label: "Severity",
    sortable: true,
    render: (row) => {
      const s = SEVERITY_STYLES[row.severity];
      return (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: s.color,
            background: s.bg,
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {row.severity}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (row) => {
      const s = STATUS_STYLES[row.status];
      return (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: s.color,
            background: s.bg,
            padding: "3px 10px",
            borderRadius: 999,
          }}
        >
          {row.status}
        </span>
      );
    },
  },
  { key: "date", label: "Reported", sortable: true },
  {
    key: "actions",
    label: "",
    render: (row) =>
      row.status !== "Resolved" ? (
        <button
          className="mt-btn-secondary"
          style={{
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Eye size={13} /> View
        </button>
      ) : null,
  },
];

export default function AdminAlertsPage() {
  const openCount = MOCK_ALERTS.filter((a) => a.status === "Open").length;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 12, marginBottom: 28 }}>
        <div>
          <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
            Alerts
          </h1>
          <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
            Flagged batches, anomalies, and patient-reported issues.
          </p>
        </div>
        {openCount > 0 && (
          <div
            className="mt-mono inline-flex items-center"
            style={{
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.magenta,
              background: "rgba(246,32,136,0.08)",
              padding: "8px 14px",
              borderRadius: 999,
            }}
          >
            <AlertTriangle size={14} /> {openCount} open
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={MOCK_ALERTS}
        searchPlaceholder="Search alerts…"
        searchKeys={["title", "batchId", "source", "location", "severity", "status"]}
        emptyTitle="No alerts"
        emptyDescription="No flagged issues or anomalies to review."
      />
    </div>
  );
}
