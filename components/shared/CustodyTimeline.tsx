import React from "react";
import {
  Factory,
  Truck,
  Building2,
  PackageCheck,
  CheckCircle,
  ExternalLink,
  ThermometerSnowflake,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { CustodyEvent } from "@/lib/types";
import { COLORS } from "@/lib/constants";

interface CustodyTimelineProps {
  events: CustodyEvent[];
  mode?: "full" | "simplified";
  highlightLatest?: boolean;
}

export default function CustodyTimeline({
  events,
  mode = "full",
  highlightLatest = true,
}: CustodyTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        No custody events recorded for this batch.
      </div>
    );
  }

  const getStageMeta = (stage: CustodyEvent["stage"], actorRole: string) => {
    switch (stage) {
      case "Manufactured":
        return {
          icon: Factory,
          title: "Synthesized & Registered",
          subtitle: "Quality tests passed and batch registered",
          color: COLORS.indigo,
        };
      case "TransferredToDistributor":
        return {
          icon: Truck,
          title: "Dispatched to Wholesale Logistics",
          subtitle: "Cold-chain transport transit initiated",
          color: "#0284C7",
        };
      case "ReceivedByDistributor":
        return {
          icon: Building2,
          title: "Received at Distribution Hub",
          subtitle: "Physical intake verified and inspected",
          color: "#0284C7",
        };
      case "TransferredToPharmacy":
        return {
          icon: Truck,
          title: "Dispatched to Licensed Pharmacy",
          subtitle: "Outbound shipment underway",
          color: "#059669",
        };
      case "ReceivedByPharmacy":
        return {
          icon: Building2,
          title: "Received by Licensed Pharmacy",
          subtitle: "Stocked in pharmacy inventory",
          color: "#059669",
        };
      case "Dispensed":
        return {
          icon: PackageCheck,
          title: "Dispensed to Patient",
          subtitle: "Verification complete and delivered",
          color: COLORS.magenta,
        };
      default:
        return {
          icon: ShieldCheck,
          title: stage,
          subtitle: actorRole,
          color: COLORS.indigo,
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  if (mode === "simplified") {
    return (
      <div className="py-4">
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-2">
          {events.map((event, idx) => {
            const meta = getStageMeta(event.stage, event.actorRole);
            const Icon = meta.icon;
            const dt = formatDate(event.timestamp);
            const isLast = idx === events.length - 1;

            return (
              <div
                key={event.id || idx}
                className="flex-1 flex md:flex-col items-center text-left md:text-center gap-4 md:gap-2 relative w-full"
              >
                {/* Visual Step Node */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 shadow-sm shrink-0"
                  style={{
                    backgroundColor: isLast ? meta.color : "#FFFFFF",
                    borderColor: meta.color,
                    color: isLast ? "#FFFFFF" : meta.color,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {event.actorRole}
                  </div>
                  <div className="text-sm font-bold text-gray-900 leading-tight">
                    {event.actorName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dt.date} • {dt.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full Internal Render Mode
  return (
    <div className="space-y-4">
      {events.map((event, idx) => {
        const meta = getStageMeta(event.stage, event.actorRole);
        const Icon = meta.icon;
        const dt = formatDate(event.timestamp);
        const isLatest = idx === events.length - 1 && highlightLatest;

        return (
          <div
            key={event.id || idx}
            className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all ${
              isLatest
                ? "bg-indigo-50/40 border-indigo-200 shadow-sm"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Stage Icon */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: isLatest
                  ? meta.color
                  : "rgba(62, 54, 176, 0.08)",
                borderColor: meta.color,
                color: isLatest ? "#FFFFFF" : meta.color,
              }}
            >
              <Icon size={20} />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span
                    className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mr-2"
                    style={{
                      backgroundColor: "rgba(62, 54, 176, 0.1)",
                      color: COLORS.indigo,
                    }}
                  >
                    {event.actorRole}
                  </span>
                  <h4 className="inline text-sm font-bold text-gray-900">
                    {meta.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                  <Clock size={12} />
                  <span>
                    {dt.date} {dt.time}
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-800 mt-1">
                {event.actorName}
                {event.toActorName && (
                  <span className="text-gray-500 font-normal">
                    {" → "}
                    <span className="font-semibold text-gray-800">
                      {event.toActorName}
                    </span>
                  </span>
                )}
              </div>

              {event.notes && (
                <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                  "{event.notes}"
                </p>
              )}

              {/* On-Chain Metadata bar */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    {event.location}
                  </span>
                  {event.temperatureVerified && (
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                      <ThermometerSnowflake size={12} />
                      Cold-Chain OK
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-gray-500">
                    Block #{event.blockNumber}
                  </span>
                  {event.txHash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${event.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-300 underline-offset-2"
                      title="View L2 block verification"
                    >
                      <span>
                        Tx: {event.txHash.slice(0, 8)}...
                        {event.txHash.slice(-6)}
                      </span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
