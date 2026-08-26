import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,  
  AlertTriangle,
  XCircle,
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

export type BatchStatus =
  | "Valid"
  | "Expired"
  | "Recalled"
  | "Pending"
  | "Counterfeit";

interface StatusBadgeProps {
  status: BatchStatus;
  /** Use patient-friendly labels (default: true) */
  patientFacing?: boolean;
}

const CONFIG: Record<
  BatchStatus,
  { icon: typeof ShieldCheck; bg: string; color: string; label: string; patientLabel: string }
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
  Pending: {
    icon: Clock,
    bg: "rgba(62, 54, 176, 0.1)",
    color: COLORS.indigo,
    label: "Pending",
    patientLabel: "Pending Registration",
  },
};

export default function StatusBadge({
  status,
  patientFacing = true,
}: StatusBadgeProps) {
  const cfg = CONFIG[status];
  if (!cfg) return null;

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
