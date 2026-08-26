import { Factory, Truck, Store, CheckCircle, Package } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   CustodyTimeline — single component, two modes (hard rule #3).
   
   mode="simplified" → patient-facing: names + dates only,
                         no tx hashes, no addresses, no jargon.
   mode="full"       → internal: includes tx hashes, block numbers,
                         wallet addresses.
----------------------------------------------------------------*/

export interface TimelineEvent {
  role: "Manufacturer" | "Distributor" | "Pharmacy";
  name: string;
  location: string;
  date: string;
  status: "Completed" | "Pending";
  /** Only shown in full mode */
  txHash?: string;
  /** Only shown in full mode */
  blockNumber?: number;
}

interface CustodyTimelineProps {
  events: TimelineEvent[];
  mode: "full" | "simplified";
}

const ROLE_ICONS: Record<string, typeof Factory> = {
  Manufacturer: Factory,
  Distributor: Truck,
  Pharmacy: Store,
};

export default function CustodyTimeline({
  events,
  mode,
}: CustodyTimelineProps) {
  return (
    <div style={{ position: "relative", paddingLeft: 20 }}>
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: 17,
          top: 18,
          bottom: 18,
          width: 2,
          background:
            "repeating-linear-gradient(180deg, rgba(62,54,176,0.25) 0 6px, transparent 6px 10px)",
        }}
      />

      {events.map((event, index) => {
        const Icon = ROLE_ICONS[event.role] || Package;
        const isCompleted = event.status === "Completed";

        return (
          <div
            key={index}
            style={{
              display: "flex",
              gap: 16,
              marginBottom: index < events.length - 1 ? 28 : 0,
              position: "relative",
            }}
          >
            {/* Node circle */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: `2px solid ${isCompleted ? COLORS.indigo : "rgba(17,17,17,0.2)"}`,
                background: COLORS.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                zIndex: 1,
              }}
            >
              <Icon
                size={16}
                color={isCompleted ? COLORS.indigo : "rgba(17,17,17,0.35)"}
              />
            </div>

            {/* Content */}
            <div style={{ paddingTop: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {event.name}
                </span>
                {isCompleted && <CheckCircle size={14} color="#0a5c5f" />}
              </div>

              {/* Simplified mode: role + location */}
              <div
                className="mt-text-muted"
                style={{ fontSize: 13, marginBottom: 4 }}
              >
                {event.role} · {event.location}
              </div>

              {/* Full mode only: tx hash + block */}
              {mode === "full" && event.txHash && (
                <div
                  className="mt-mono"
                  style={{
                    fontSize: 11,
                    color: "rgba(17,17,17,0.5)",
                    background: "rgba(17,17,17,0.03)",
                    padding: "4px 8px",
                    borderRadius: 6,
                    marginBottom: 4,
                    border: "1px solid rgba(17,17,17,0.06)",
                  }}
                >
                  Tx: {event.txHash}
                  {event.blockNumber && ` · Block: ${event.blockNumber}`}
                </div>
              )}

              <div
                className="mt-mono"
                style={{
                  fontSize: 12,
                  color: "rgba(17,17,17,0.45)",
                  fontWeight: 500,
                }}
              >
                {event.date}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
