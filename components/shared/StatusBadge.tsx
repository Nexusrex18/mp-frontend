import React from "react";
import {
  ShieldCheck,
  AlertOctagon,
  XCircle,
  Clock,
  CheckCircle2,
  Truck,  
  AlertTriangle,
  ShieldAlert,
  PackageCheck,
} from "lucide-react";
import { BatchStatus } from "@/lib/types";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   StatusBadge — colored pill showing batch verification status.
   Used on /verify (patient) and internal batch detail pages.
   Patient-facing copy: "Authentic" not "Valid", "Suspicious" not "Counterfeit".
----------------------------------------------------------------*/

interface StatusBadgeProps {
  status: BatchStatus | string;
  /** Use patient-friendly labels (default: true) */
  patientFacing?: boolean;
}

const CONFIG: Record<
  string,
  { icon: React.ElementType; bg: string; color: string; label: string; patientLabel: string }
> = {
  Valid: {
    icon: ShieldCheck,
    bg: "rgba(185, 221, 223, 0.35)",
    color: "#0a5c5f",
    label: "Valid",
    patientLabel: "Authentic",
  },
  Counterfeit: {
    icon: AlertOctagon,
    bg: "rgba(246, 32, 136, 0.15)",
    color: COLORS.magenta,
    label: "Counterfeit",
    patientLabel: "Suspicious",
  },
  Recalled: {
    icon: AlertOctagon,
    bg: "rgba(246, 32, 136, 0.15)",
    color: COLORS.magenta,
    label: "Recalled",
    patientLabel: "Recalled",
  },
  Expired: {
    icon: XCircle,
    bg: "rgba(17, 17, 17, 0.08)",
    color: "rgba(17, 17, 17, 0.7)",
    label: "Expired",
    patientLabel: "Expired",
  },
  PendingAcceptance: {
    icon: Clock,
    bg: "rgba(62, 54, 176, 0.1)",
    color: COLORS.indigo,
    label: "Pending Acceptance",
    patientLabel: "Pending Registration",
  },
  Pending: {
    icon: Clock,
    bg: "rgba(62, 54, 176, 0.1)",
    color: COLORS.indigo,
    label: "Pending",
    patientLabel: "Pending",
  },
  InTransit: {
    icon: Truck,
    bg: "rgba(14, 165, 233, 0.12)",
    color: "#0369A1",
    label: "In Transit",
    patientLabel: "In Transit",
  },
  Dispensed: {
    icon: PackageCheck,
    bg: "rgba(99, 102, 241, 0.12)",
    color: "#4338CA",
    label: "Dispensed",
    patientLabel: "Dispensed to Patient",
  }
};

export default function StatusBadge({
  status,
  patientFacing = true,
}: StatusBadgeProps) {
  const cfg = CONFIG[status] || {
    icon: Clock,
    bg: "rgba(107, 114, 128, 0.12)",
    color: "#374151",
    label: status,
    patientLabel: status,
  };

  const Icon = cfg.icon;
  const displayLabel = patientFacing ? cfg.patientLabel : cfg.label;

  return (
    <div
      className="inline-flex items-center"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.color,
        padding: "6px 14px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 14,
        gap: 6,
      }}
    >
      <Icon size={16} />
      {displayLabel}
    </div>
  );
}
