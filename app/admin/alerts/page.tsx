"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Flag,
  Eye,
  MessageSquare,
  MapPin,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  X,
  User,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import { verificationApi } from "@/lib/api/verification";
import { VerificationReportItemDto } from "@/lib/api/types";

/* ---------------------------------------------------------------
   Admin — Safety & Counterfeit Alerts (/admin/alerts)
   
   Purpose: Consumer counterfeit & incident reports submitted
   via /verify/report (Stage 3) for health authority review.
----------------------------------------------------------------*/

export default function AdminAlertsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<VerificationReportItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<VerificationReportItemDto | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setError(null);
      const res = await verificationApi.getReports({ limit: 100 });
      setReports(res.reports || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load verification reports:", err);
      setError(err?.message || "Failed to load reports from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const columns: Column<VerificationReportItemDto>[] = [
    {
      key: "status",
      label: "Severity",
      width: "60px",
      render: (row) => (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "rgba(246,32,136,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ShieldAlert size={18} color={COLORS.magenta} />
        </div>
      ),
    },
    {
      key: "description",
      label: "Incident Report",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm line-clamp-1">
            {row.description}
          </div>
          <div className="mt-mono text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>
              Batch: {row.batchId ? `#${row.batchId}` : "Unspecified"}
            </span>
            {row.batchId && (
              <Link
                href={`/verify/${encodeURIComponent(row.batchId)}`}
                target="_blank"
                className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 text-xs font-medium"
              >
                verify <ExternalLink size={10} />
              </Link>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
          <MapPin size={12} className="text-slate-400" />
          {row.location || "Location not specified"}
        </span>
      ),
    },
    {
      key: "contactInfo",
      label: "Reporter",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.contactInfo || "Anonymous Patient"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Reported At",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const badgeStyles: Record<string, { bg: string; color: string }> = {
          PENDING: { bg: "rgba(246,32,136,0.1)", color: COLORS.magenta },
          INVESTIGATING: { bg: "rgba(62,54,176,0.1)", color: COLORS.indigo },
          RESOLVED: { bg: "rgba(185,221,223,0.4)", color: "#0a5c5f" },
          DISMISSED: { bg: "rgba(17,17,17,0.06)", color: "rgba(17,17,17,0.5)" },
        };
        const s = badgeStyles[row.status] || badgeStyles.PENDING;
        return (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: s.bg, color: s.color }}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Details",
      render: (row) => (
        <button
          onClick={() => setSelectedReport(row)}
          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            Safety & Counterfeit Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consumer reports submitted through the public verification portal ({totalCount} reports).
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadReports();
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
            <span className="text-sm font-medium">Loading reports...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          searchPlaceholder="Search by description, batch ID, or location…"
          searchKeys={["description", "batchId", "location", "contactInfo", "status"]}
          emptyTitle="No Incident Reports"
          emptyDescription="No counterfeit or quality incident reports have been submitted by patients."
        />
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Report #{selectedReport.id.slice(0, 8)}
                </h3>
                <span className="text-xs text-slate-500">
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl mb-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Description
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedReport.description}
                </p>
              </div>

              {selectedReport.batchId && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Referenced Batch
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="mt-mono text-slate-900 font-bold">
                      {selectedReport.batchId}
                    </span>
                    <Link
                      href={`/verify/${encodeURIComponent(selectedReport.batchId)}`}
                      target="_blank"
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                    >
                      Open Verification Portal <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Location
                  </span>
                  <span className="text-slate-800">
                    {selectedReport.location || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Contact Info
                  </span>
                  <span className="text-slate-800">
                    {selectedReport.contactInfo || "Anonymous"}
                  </span>
                </div>
              </div>

              {selectedReport.photoUrl && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Evidence Photo
                  </span>
                  <img
                    src={selectedReport.photoUrl}
                    alt="Report evidence"
                    className="max-h-48 rounded-xl object-contain bg-slate-200 border border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
