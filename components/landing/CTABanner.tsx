import { ArrowRight } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   CTABanner — final call-to-action section near the bottom
   of the landing page. Reinforces the two user paths:
   patients → /verify, stakeholders → /auth/connect.
----------------------------------------------------------------*/

export default function CTABanner() {
  return (
    <section style={{ padding: "24px" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          borderRadius: 28,
          padding: "56px 40px",
          background: `linear-gradient(120deg, ${COLORS.indigo} 0%, #5b4fd6 60%, ${COLORS.magenta} 130%)`,
          textAlign: "center",
        }}
      >
        <h2
          className="mt-display mt-text-white"
          style={{
            fontSize: "clamp(1.7rem, 3.5vw, 2.3rem)",
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Ready to verify your medicine?
        </h2>

        <a
          href="/verify"
          className="mt-btn-primary inline-flex items-center"
          style={{
            padding: "15px 30px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            gap: 8,
            marginBottom: 18,
          }}
        >
          Verify Now <ArrowRight size={17} />
        </a>

        <div>
          <a
            href="/auth/connect"
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Are you a manufacturer, distributor, or pharmacy? Access your
            dashboard →
          </a>
        </div>
      </div>
    </section>
  );
}
