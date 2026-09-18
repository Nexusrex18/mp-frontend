"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw, AlertCircle, Search, Filter } from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import { auditApi } from "@/lib/api/audit";
import { AuditLogEntryDto, OrgType } from "@/lib/api/types";

/* ---------------------------------------------------------------
   Admin — Audit Log (/admin/audit)
   
   Purpose: Regulatory audit trail — immutable event log
   across all contract writes and state-changing actions.
   Features: Real-time query, filters, and CSV export.
----------------------------------------------------------------*/

const ACTION_COLORS: Record<string, string> = {
  createBatch: "#0a5c5f",
  transferCustody: COLORS.indigo,
  acceptCustody: COLORS.indigo,
  dispenseMedicine: "#0a5c5f",
  grantRole: COLORS.magenta,
  revokeRole: COLORS.magenta,
  issuePrescription: COLORS.indigo,
  reportCounterfeit: COLORS.magenta,
};

export default function AdminAuditPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadLogs = useCallback(async () => {
    try {
      setError(null);
      const res = await auditApi.getLogs({
        actorRole: roleFilter ? (roleFilter as OrgType) : undefined,
        status: statusFilter ? (statusFilter as "SUCCESS" | "FAILURE") : undefined,
        limit: 100,
      });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      setError(err?.message || "Failed to load audit trail.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const blob = await auditApi.exportCsv({
        actorRole: roleFilter ? (roleFilter as OrgType) : undefined,
        status: statusFilter ? (statusFilter as "SUCCESS" | "FAILURE") : undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV failed:", err);
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<AuditLogEntryDto>[] = [
    {
      key: "createdAt",
      label: "Time",
      sortable: true,
      width: "160px",
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (row) => (
        <span
          className="mt-mono text-xs font-semibold px-2 py-0.5 rounded"
          style={{
            color: ACTION_COLORS[row.action] || COLORS.ink,
            background: `${ACTION_COLORS[row.action] || COLORS.ink}15`,
          }}
        >
          {row.action}
        </span>
      ),
    },
    {
      key: "actorAddress",
      label: "Actor & Role",
      sortable: true,
      render: (row) => (
        <div>
          <div className="mt-mono text-xs font-semibold text-slate-800">
            {row.actorAddress ? `${row.actorAddress.slice(0, 8)}…${row.actorAddress.slice(-4)}` : "System"}
          </div>
          <div className="text-xs text-slate-500 font-medium">{row.actorRole || "Public / Anonymous"}</div>
        </div>
      ),
    },
    {
      key: "targetResource",
      label: "Target",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-700">
          <span className="font-semibold">{row.targetResource}</span>
          {row.targetId && (
            <span className="mt-mono text-slate-500 ml-1">
              #{row.targetId.slice(0, 8)}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor:
              row.status === "SUCCESS" ? "rgba(185,221,223,0.4)" : "rgba(246,32,136,0.1)",
            color: row.status === "SUCCESS" ? "#0a5c5f" : COLORS.magenta,
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (row) => (
        <span className="mt-mono text-xs text-slate-400">
          {row.ipAddress || "—"}
        </span>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            Regulatory Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log of state-changing actions across the pharma network ({total} entries).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={exporting || logs.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>{exporting ? "Exporting…" : "Export CSV"}</span>
          </button>

          <button
            onClick={() => {
              setRefreshing(true);
              loadLogs();
            }}
            disabled={refreshing || loading}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center flex-wrap gap-4 mb-6 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter size={14} />
          Filters:
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANUFACTURER">MANUFACTURER</option>
          <option value="DISTRIBUTOR">DISTRIBUTOR</option>
          <option value="PHARMACY">PHARMACY</option>
          <option value="DOCTOR">DOCTOR</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
        </select>

        {(roleFilter || statusFilter) && (
          <button
            onClick={() => {
              setRoleFilter("");
              setStatusFilter("");
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading audit events...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchPlaceholder="Search audit events by action, actor, target…"
          searchKeys={["action", "actorAddress", "actorRole", "targetResource", "targetId"]}
          emptyTitle="No Audit Records"
          emptyDescription="No audit logs matched the specified query parameters."
        />
      )}
    </div>
  );
}
