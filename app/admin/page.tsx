"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Users,
  AlertTriangle,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Brain,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { batchesApi } from "@/lib/api/batches";
import { usersApi } from "@/lib/api/users";
import { verificationApi } from "@/lib/api/verification";
import { auditApi } from "@/lib/api/audit";
import { AuditLogEntryDto, AuditStatsDto } from "@/lib/api/types";
import { isFeatureEnabled } from "@/lib/config/features";

/* ---------------------------------------------------------------
   Admin Dashboard — /admin
   Bird's-eye view of the entire supply chain network.
   Connected to live backend APIs: batches, stakeholders, verification, audit.
----------------------------------------------------------------*/

const QUICK_LINKS = [
  { label: "Stakeholder Management", href: "/admin/stakeholders", icon: Users },
  { label: "Batch Registry", href: "/admin/batches", icon: Package },
  { label: "Audit Log", href: "/admin/audit", icon: ShieldCheck },
  { label: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [totalBatches, setTotalBatches] = useState<number>(0);
  const [totalStakeholders, setTotalStakeholders] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [flaggedAlerts, setFlaggedAlerts] = useState<number>(0);
  const [auditStats, setAuditStats] = useState<AuditStatsDto | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntryDto[]>([]);

  useEffect(() => {
    setAiEnabled(isFeatureEnabled("ENABLE_AI_MODULE"));
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [batchesRes, stakeholdersRes, requestsRes, reportsRes, statsRes, logsRes] =
        await Promise.allSettled([
          batchesApi.listBatches({ limit: 1 }),
          usersApi.listStakeholders({ limit: 1 }),
          usersApi.listRegistrationRequests("PENDING"),
          verificationApi.getReports({ limit: 1 }),
          auditApi.getStats(),
          auditApi.getLogs({ limit: 6 }),
        ]);

      if (batchesRes.status === "fulfilled") {
        setTotalBatches(batchesRes.value?.total || 0);
      }
      if (stakeholdersRes.status === "fulfilled") {
        setTotalStakeholders(stakeholdersRes.value?.total || 0);
      }
      if (requestsRes.status === "fulfilled") {
        setPendingRequests(requestsRes.value?.length || 0);
      }
      if (reportsRes.status === "fulfilled") {
        setFlaggedAlerts(reportsRes.value?.total || 0);
      }
      if (statsRes.status === "fulfilled") {
        setAuditStats(statsRes.value);
      }
      if (logsRes.status === "fulfilled") {
        setRecentLogs(logsRes.value?.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = [
    {
      label: "Total Batches",
      value: loading ? "…" : totalBatches.toLocaleString(),
      trend: "Live",
      trendUp: true,
      icon: Package,
      bg: COLORS.lavender,
    },
    {
      label: "Active Stakeholders",
      value: loading ? "…" : totalStakeholders.toLocaleString(),
      trend: pendingRequests > 0 ? `${pendingRequests} pending` : "Verified",
      trendUp: true,
      icon: Users,
      bg: COLORS.teal,
    },
    {
      label: "Patient / Safety Alerts",
      value: loading ? "…" : flaggedAlerts.toLocaleString(),
      trend: flaggedAlerts > 0 ? `${flaggedAlerts} open` : "All clear",
      trendUp: flaggedAlerts === 0,
      icon: AlertTriangle,
      bg: "rgba(246,32,136,0.1)",
    },
    {
      label: "Audit Events Today",
      value: loading ? "…" : (auditStats?.todayEvents || 0).toLocaleString(),
      trend: `${auditStats?.totalEvents || 0} total`,
      trendUp: true,
      icon: Activity,
      bg: COLORS.sky,
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div
            className="mt-mono mt-text-indigo"
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Health Authority & Network Administration
          </div>
          <h1 className="mt-display" style={{ fontSize: 28, fontWeight: 600 }}>
            Admin Dashboard
          </h1>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat cards */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 16, marginBottom: 32 }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              borderRadius: 16,
              padding: "22px 20px",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 14 }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <stat.icon size={18} color={COLORS.indigo} />
              </div>
              <div
                className="mt-mono inline-flex items-center"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: stat.trendUp ? "#0a5c5f" : COLORS.magenta,
                  gap: 2,
                }}
              >
                {stat.trendUp ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                {stat.trend}
              </div>
            </div>
            <div
              className="mt-mono"
              style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}
            >
              {stat.value}
            </div>
            <div
              className="mt-text-muted"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3" style={{ gap: 20 }}>
        {/* Activity feed — 2/3 width */}
        <div
          className="lg:col-span-2"
          style={{
            border: "1px solid rgba(17,17,17,0.08)",
            borderRadius: 16,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid rgba(17,17,17,0.06)",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Recent Audit & State Activity
            </span>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View Full Log →
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {loading ? "Loading recent events..." : "No recent activity recorded yet."}
            </div>
          ) : (
            recentLogs.map((item) => (
              <div
                key={item.id}
                className="flex items-start"
                style={{
                  padding: "14px 20px",
                  gap: 12,
                  borderBottom: "1px solid rgba(17,17,17,0.04)",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    marginTop: 6,
                    flexShrink: 0,
                    background:
                      item.status === "FAILURE"
                        ? COLORS.magenta
                        : item.action.includes("grant") || item.action.includes("revoke")
                        ? COLORS.indigo
                        : "#0a5c5f",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">
                      {item.action}
                    </span>
                    <span className="mt-mono text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Actor:{" "}
                    <span className="mt-mono">
                      {item.actorAddress && item.actorAddress.length > 10
                        ? `${item.actorAddress.slice(0, 8)}…${item.actorAddress.slice(-4)}`
                        : item.actorAddress || "System"}
                    </span>
                    {item.actorRole && ` (${item.actorRole})`} • Resource:{" "}
                    {item.targetResource || (item as any).targetType || "System"}
                    {item.targetId && item.targetId !== "N/A"
                      ? ` #${item.targetId.slice(0, 8)}`
                      : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick links — 1/3 width */}
        <div>
          <div
            style={{
              border: "1px solid rgba(17,17,17,0.08)",
              borderRadius: 16,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid rgba(17,17,17,0.06)",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Quick Access
            </div>
            {[
              ...QUICK_LINKS,
              ...(aiEnabled
                ? [
                    {
                      label: "Demand Intelligence (AI)",
                      href: "/admin/intelligence",
                      icon: Brain,
                    },
                  ]
                : []),
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center justify-between"
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid rgba(17,17,17,0.04)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 0.1s",
                }}
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <link.icon size={16} color={COLORS.indigo} />
                  {link.label}
                </span>
                <ArrowRight size={14} color="rgba(17,17,17,0.3)" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
