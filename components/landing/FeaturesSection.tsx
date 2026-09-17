import { ShieldCheck, Zap, Eye, Flag } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   FeaturesSection — trust / feature cards grid.
   Patient-friendly language only — no blockchain jargon.
----------------------------------------------------------------*/

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Tamper-Proof Tracking",
    copy: "Every custody handoff is permanently recorded and cannot be altered or deleted.",
    bg: COLORS.lavender,
  },
  {
    icon: Zap,
    title: "Instant Verification",
    copy: "Patients can verify any medicine in seconds — no app download, no account needed.",
    bg: COLORS.teal,
  },
  {
    icon: Eye,
    title: "End-to-End Visibility",
    copy: "Track a medicine's complete journey from manufacturing to dispensing.",
    bg: COLORS.sky,
  },
  {
    icon: Flag,
    title: "Counterfeit Protection",
    copy: "Suspicious medicines can be flagged immediately, alerting health authorities.",
    bg: COLORS.lavender,
  },
];

export default function FeaturesSection() {
  return (
    <section className="mt-bg-white" style={{ padding: "24px 24px 88px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div className="mt-perforation" style={{ marginBottom: 56 }} />
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: 20 }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                backgroundColor: f.bg,
                borderRadius: 18,
                padding: 26,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: "rgba(255,255,255,0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <f.icon size={20} color={COLORS.indigo} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {f.title}
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "rgba(17,17,17,0.7)",
                }}
              >
                {f.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
