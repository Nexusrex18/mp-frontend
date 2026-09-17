import { ShieldCheck, Menu } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   PublicNavbar — shared across all public routes (/, /verify, /verify/report)
   Rendered by app/(public)/layout.tsx — never by individual pages.
   ❌ No WalletConnectButton — this is the public trust surface.
----------------------------------------------------------------*/

export default function PublicNavbar() {
  return (
    <header
      className="mt-bg-white"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: "1px solid rgba(17,17,17,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ maxWidth: 1180, margin: "0 auto", padding: "18px 24px" }}
      >
        {/* Logo */}
        <a
          href="/"
          className="flex items-center"
          style={{ gap: 10, textDecoration: "none" }}
        >
          <div
            className="mt-bg-indigo"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={17} color={COLORS.white} />
          </div>
          <span
            className="mt-display mt-text-ink"
            style={{ fontSize: 20, fontWeight: 600 }}
          >
            MedTrace
          </span>
        </a>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center" style={{ gap: 32 }}>
          <a
            href="/"
            className="mt-text-ink"
            style={{
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              opacity: 0.75,
            }}
          >
            Home
          </a>
          <a
            href="/#how-it-works"
            className="mt-text-ink"
            style={{
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              opacity: 0.75,
            }}
          >
            How It Works
          </a>
          <a
            href="/verify"
            className="mt-text-ink"
            style={{
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              opacity: 0.75,
            }}
          >
            Verify Medicine
          </a>
        </nav>

        {/* CTA + mobile menu */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <a
            href="/auth/connect"
            className="mt-btn-secondary hidden md:inline-flex items-center"
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Stakeholder Login
          </a>
          <button
            className="md:hidden"
            aria-label="Open menu"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Menu size={22} color={COLORS.ink} />
          </button>
        </div>
      </div>
    </header>
  );
}
