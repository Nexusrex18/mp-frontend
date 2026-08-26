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

interface StatusBadgeProps {
  status: BatchStatus | "Pending" | "Fulfilled" | "Confirmed" | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "Valid":
      case "Fulfilled":
      case "Confirmed":
        return {
          bg: "rgba(16, 185, 129, 0.12)",
          text: "#065F46",
          border: "rgba(16, 185, 129, 0.35)",
          icon: CheckCircle2,
          label: status === "Valid" ? "Valid & Verified" : status,
          dotColor: "#10B981",
        };
      case "InTransit":
      case "Transferred":
        return {
          bg: "rgba(14, 165, 233, 0.12)",
          text: "#0369A1",
          border: "rgba(14, 165, 233, 0.35)",
          icon: Truck,
          label: "In Transit",
          dotColor: "#0EA5E9",
        };
      case "Pending":
      case "PendingAcceptance":
        return {
          bg: "rgba(245, 158, 11, 0.12)",
          text: "#92400E",
          border: "rgba(245, 158, 11, 0.35)",
          icon: Clock,
          label: status === "PendingAcceptance" ? "Awaiting Acceptance" : "Pending",
          dotColor: "#F59E0B",
        };
      case "Dispensed":
        return {
          bg: "rgba(99, 102, 241, 0.12)",
          text: "#4338CA",
          border: "rgba(99, 102, 241, 0.35)",
          icon: PackageCheck,
          label: "Dispensed to Patient",
          dotColor: "#6366F1",
        };
      case "Expired":
        return {
          bg: "rgba(239, 68, 68, 0.12)",
          text: "#991B1B",
          border: "rgba(239, 68, 68, 0.35)",
          icon: AlertTriangle,
          label: "Expired Batch",
          dotColor: "#EF4444",
        };
      case "Recalled":
        return {
          bg: "rgba(220, 38, 38, 0.15)",
          text: "#7F1D1D",
          border: "rgba(220, 38, 38, 0.45)",
          icon: XCircle,
          label: "Regulatory Recall",
          dotColor: "#DC2626",
        };
      case "Counterfeit":
        return {
          bg: "rgba(246, 32, 136, 0.15)",
          text: "#831843",
          border: "rgba(246, 32, 136, 0.4)",
          icon: ShieldAlert,
          label: "Counterfeit Detected",
          dotColor: "#F62088",
        };
      default:
        return {
          bg: "rgba(107, 114, 128, 0.12)",
          text: "#374151",
          border: "rgba(107, 114, 128, 0.3)",
          icon: Clock,
          label: status,
          dotColor: "#6B7280",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeStyles = {
    sm: { padding: "3px 8px", fontSize: 11, iconSize: 12, gap: 5 },
    md: { padding: "5px 12px", fontSize: 12, iconSize: 14, gap: 6 },
    lg: { padding: "7px 16px", fontSize: 14, iconSize: 16, gap: 8 },
  }[size];

  return (
    <span
      className="inline-flex items-center font-medium rounded-full"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        gap: sizeStyles.gap,
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          display: "inline-block",
        }}
      />
      {showIcon && <Icon size={sizeStyles.iconSize} />}
      <span className="font-semibold">{config.label}</span>
    </span>
  );
}
