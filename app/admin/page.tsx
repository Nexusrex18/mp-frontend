"use client";

import {
  Package,
  Users,
  AlertTriangle,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   Admin Dashboard — /admin
   Bird's-eye view of the entire supply chain network.
   
   Data in: network-wide stats (total batches, active custodians,
            flagged alerts, dispensing errors this week)
   Comes from: /auth/connect redirect
   Goes to: every other /admin/* page
----------------------------------------------------------------*/

/* ---------- Mock data ---------- */

const STATS = [
  {
    label: "Total Batches",
    value: "2,847",
    trend: "+12%",
    trendUp: true,
    icon: Package,
    bg: COLORS.lavender,
  },
  {
    label: "Active Custodians",
    value: "156",
    trend: "+3",
    trendUp: true,
    icon: Users,
    bg: COLORS.teal,
  },
  {
    label: "Flagged Alerts",
    value: "7",
    trend: "+2",
    trendUp: false,
    icon: AlertTriangle,
    bg: "rgba(246,32,136,0.1)",
  },
  {
    label: "Dispensing Errors",
    value: "3",
    trend: "-1",
    trendUp: true,
    icon: Activity,
    bg: COLORS.sky,
  },
];

const ACTIVITY_FEED = [
  {
    id: 1,
    type: "batch" as const,
    text: "PharmaCorp India registered batch #A19-0442",
    time: "12 min ago",
  },
  {
    id: 2,
    type: "transfer" as const,
    text: "MedLogistics accepted custody of 3 batches",
    time: "28 min ago",
  },
  {
    id: 3,
    type: "alert" as const,
    text: "Patient reported issue for batch #C05-FAKE",
    time: "1 hr ago",
  },
  {
    id: 4,
    type: "role" as const,
    text: "New stakeholder request from 0x8f4c…3e1a",
    time: "2 hrs ago",
  },
  {
    id: 5,
    type: "dispense" as const,
    text: "HealthFirst Pharmacy dispensed Amoxicillin 500mg (OTC)",
    time: "3 hrs ago",
  },
  {
    id: 6,
    type: "batch" as const,
    text: "GenMed Labs registered batch #B22-1187",
    time: "5 hrs ago",
  },
];

const QUICK_LINKS = [
  { label: "Stakeholder Management", href: "/admin/stakeholders", icon: Users },
  { label: "Batch Registry", href: "/admin/batches", icon: Package },
  { label: "Audit Log", href: "/admin/audit", icon: ShieldCheck },
  { label: "Alerts", href: "/admin/alerts", icon: AlertTriangle },
];

export default function AdminDashboard() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
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
          Health Authority
        </div>
        <h1
          className="mt-display"
          style={{ fontSize: 28, fontWeight: 600 }}
        >
          Admin Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div
        className="grid sm:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 16, marginBottom: 32 }}
      >
        {STATS.map((stat) => (
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
            Recent Activity
          </div>
          {ACTIVITY_FEED.map((item) => (
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
                    item.type === "alert"
                      ? COLORS.magenta
                      : item.type === "role"
                        ? COLORS.indigo
                        : "#0a5c5f",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                  {item.text}
                </div>
                <div
                  className="mt-mono mt-text-muted"
                  style={{ fontSize: 11, marginTop: 2 }}
                >
                  {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick links — 1/3 width */}
        <div>
          <div
            style={{
              border: "1px solid rgba(17,17,17,0.08)",
              borderRadius: 16,
              overflow: "hidden",
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
            {QUICK_LINKS.map((link) => (
              <a
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(217,217,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span className="flex items-center" style={{ gap: 10, fontSize: 14, fontWeight: 600 }}>
                  <link.icon size={16} color={COLORS.indigo} />
                  {link.label}
                </span>
                <ArrowRight size={14} color="rgba(17,17,17,0.3)" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
