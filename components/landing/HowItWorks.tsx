import { Factory, Truck, Store, QrCode } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   HowItWorks — the 4-step supply chain flow strip.
   Horizontal on desktop, vertical on mobile.
   Core narrative: Manufacturer → Distributor → Pharmacy → Patient
----------------------------------------------------------------*/

const STEPS = [
  {
    icon: Factory,
    title: "Created",
    copy: "Manufacturer registers each batch with quality certificates on a secure registry.",
  },
  {
    icon: Truck,
    title: "Transported",
    copy: "Distributor scans and accepts custody, creating a verified chain of possession.",
  },
  {
    icon: Store,
    title: "Dispensed",
    copy: "Pharmacy receives, verifies, and dispenses the medicine to patients.",
  },
  {
    icon: QrCode,
    title: "Verified",
    copy: "Patient scans the QR code on the box to instantly confirm authenticity.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mt-bg-white"
      style={{ padding: "88px 24px" }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            className="mt-mono mt-text-magenta"
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Chain of custody
          </div>
          <h2
            className="mt-display"
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              fontWeight: 600,
            }}
          >
            Manufacturer&nbsp;→&nbsp;Distributor&nbsp;→&nbsp;Pharmacy&nbsp;→&nbsp;Patient
          </h2>
        </div>

        {/* Desktop: horizontal chain */}
        <div
          className="hidden md:flex items-start"
          style={{ position: "relative" }}
        >
          <div
            className="mt-chain-line"
            style={{
              position: "absolute",
              top: 28,
              left: "12%",
              right: "12%",
            }}
          />
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{
                flex: 1,
                padding: "0 12px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div className="mt-node mt-bg-white">
                <s.icon size={22} color={COLORS.indigo} />
              </div>
              <div
                className="mt-mono mt-text-muted"
                style={{ fontSize: 11, margin: "14px 0 4px" }}
              >
                STEP {i + 1}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {s.title}
              </div>
              <p
                className="mt-text-muted"
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  textAlign: "center",
                }}
              >
                {s.copy}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical chain */}
        <div className="md:hidden">
          {STEPS.map((s, i) => (
            <div key={i} className="flex" style={{ gap: 18 }}>
              <div className="flex flex-col items-center">
                <div className="mt-node">
                  <s.icon size={20} color={COLORS.indigo} />
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="mt-chain-line-v"
                    style={{ flex: 1, minHeight: 40 }}
                  />
                )}
              </div>
              <div style={{ paddingBottom: 32 }}>
                <div
                  className="mt-mono mt-text-muted"
                  style={{ fontSize: 11, marginBottom: 4 }}
                >
                  STEP {i + 1}
                </div>
                <div
                  style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}
                >
                  {s.title}
                </div>
                <p
                  className="mt-text-muted"
                  style={{ fontSize: 13.5, lineHeight: 1.55 }}
                >
                  {s.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
