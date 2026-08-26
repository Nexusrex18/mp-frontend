import { ShieldCheck } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   Footer — shared across all public routes (/, /verify, /verify/report)
   Rendered by app/(public)/layout.tsx — never by individual pages.
----------------------------------------------------------------*/

export default function Footer() {
  return (
    <footer
      className="mt-bg-white"
      style={{
        borderTop: "1px solid rgba(17,17,17,0.08)",
        padding: "48px 24px 28px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Top row: brand + links */}
        <div
          className="flex flex-col md:flex-row md:justify-between"
          style={{ gap: 28, marginBottom: 28 }}
        >
          <div style={{ maxWidth: 280 }}>
            <div
              className="flex items-center"
              style={{ gap: 10, marginBottom: 10 }}
            >
              <div
                className="mt-bg-indigo"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShieldCheck size={14} color={COLORS.white} />
              </div>
              <span
                className="mt-display"
                style={{ fontSize: 17, fontWeight: 600 }}
              >
                MedTrace
              </span>
            </div>
            <p
              className="mt-text-muted"
              style={{ fontSize: 13, lineHeight: 1.6 }}
            >
              A tamper-proof registry tracking medicine from manufacturer to
              patient.
            </p>
          </div>

          <div
            className="flex flex-wrap"
            style={{ gap: "12px 28px", fontSize: 13.5 }}
          >
            {[
              { label: "About", href: "#" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Verify Medicine", href: "/verify" },
              { label: "Stakeholder Login", href: "/auth/connect" },
              { label: "Report an Issue", href: "/verify/report" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="mt-text-ink"
                style={{ opacity: 0.7, textDecoration: "none", fontWeight: 600 }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Perforation divider */}
        <div className="mt-perforation" style={{ marginBottom: 20 }} />

        {/* Bottom row: copyright + legal */}
        <div
          className="flex flex-col sm:flex-row sm:justify-between"
          style={{
            gap: 10,
            fontSize: 12.5,
            color: "rgba(17,17,17,0.5)",
          }}
        >
          <span>© 2026 MedTrace. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
              Privacy Policy
            </a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
