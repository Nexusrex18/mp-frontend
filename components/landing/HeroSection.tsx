import { ShieldCheck, QrCode, ArrowRight } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   HeroSection — landing page hero with headline, CTAs, and
   the animated verification seal card.
----------------------------------------------------------------*/

export default function HeroSection() {
  return (
    <section
      id="home"
      className="mt-bg-white"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background gradients */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(1100px 480px at 82% -10%, ${COLORS.lavender} 0%, transparent 60%), radial-gradient(700px 380px at -5% 10%, ${COLORS.sky}55 0%, transparent 60%)`,
        }}
      />

      <div
        className="grid md:grid-cols-2 items-center"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "72px 24px 88px",
          gap: 48,
          position: "relative",
        }}
      >
        {/* Left: copy + CTAs */}
        <div>
          <div
            className="mt-mono mt-text-indigo"
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 18,
              display: "inline-block",
              padding: "6px 12px",
              border: "1.5px dashed rgba(62,54,176,0.4)",
              borderRadius: 999,
            }}
          >
            REG. NO. VERIFIED-2026
          </div>

          <h1
            className="mt-display"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              lineHeight: 1.05,
              fontWeight: 600,
              letterSpacing: -0.5,
              marginBottom: 20,
            }}
          >
            Know your medicine
            <br />
            is{" "}
            <span className="mt-text-magenta" style={{ fontStyle: "italic" }}>
              real
            </span>
            .
          </h1>

          <p
            className="mt-text-muted"
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              maxWidth: 460,
              marginBottom: 32,
            }}
          >
            Every medicine tracked from manufacturer to your hands, secured by a
            tamper-proof digital registry. No app, no account — just a scan.
          </p>

          <div className="flex flex-wrap" style={{ gap: 14 }}>
            <a
              href="/verify"
              className="mt-btn-primary inline-flex items-center"
              style={{
                padding: "15px 28px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                gap: 8,
              }}
            >
              Verify a Medicine <ArrowRight size={17} />
            </a>
            <a
              href="/auth/connect"
              className="mt-btn-secondary inline-flex items-center"
              style={{
                padding: "15px 28px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              I&apos;m a Stakeholder
            </a>
          </div>
        </div>

        {/* Right: animated seal card */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            className="mt-seal-card"
            style={{ width: "100%", maxWidth: 340, padding: 28 }}
          >
            <div className="mt-scanline" />

            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 22, position: "relative" }}
            >
              <span
                className="mt-mono"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: "rgba(17,17,17,0.5)",
                }}
              >
                BATCH #A19-0442
              </span>
              <QrCode size={22} color={COLORS.indigo} />
            </div>

            <div style={{ position: "relative", marginBottom: 22 }}>
              <div
                className="mt-text-muted"
                style={{ fontSize: 12, marginBottom: 4 }}
              >
                Product
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                Amoxicillin 500mg
              </div>
            </div>

            <div className="mt-perforation" style={{ marginBottom: 20 }} />

            <div
              className="grid grid-cols-2"
              style={{ gap: 14, marginBottom: 22, position: "relative" }}
            >
              <div>
                <div className="mt-text-muted" style={{ fontSize: 11 }}>
                  Manufactured
                </div>
                <div
                  className="mt-mono"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  04 Feb 2026
                </div>
              </div>
              <div>
                <div className="mt-text-muted" style={{ fontSize: 11 }}>
                  Custody hops
                </div>
                <div
                  className="mt-mono"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  3 of 3
                </div>
              </div>
            </div>

            <div
              className="mt-stamp-pop flex items-center justify-center"
              style={{
                background: COLORS.indigo,
                color: COLORS.white,
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                fontSize: 14,
                gap: 8,
                position: "relative",
              }}
            >
              <ShieldCheck size={18} /> Authenticity Confirmed
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
