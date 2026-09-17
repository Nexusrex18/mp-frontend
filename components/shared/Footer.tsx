"use client";

import { motion } from "framer-motion";
import {
  Globe,
  MessageCircle,
  Users,
  Mail,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   Footer — shared across all public routes.
   Rendered by app/(public)/layout.tsx.
   Uses Framer Motion for scroll-triggered entrance animations.
   ❌ No wallet UI — this is the public trust surface.
----------------------------------------------------------------*/

const footerLinks = {
  Platform: [
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Verify Medicine", href: "/verify" },
    { name: "Report an Issue", href: "/verify/report" },
    { name: "Stakeholder Login", href: "/auth/connect" },
  ],
  "Supply Chain": [
    { name: "Manufacturer Portal", href: "/auth/connect" },
    { name: "Distributor Portal", href: "/auth/connect" },
    { name: "Pharmacy Portal", href: "/auth/connect" },
    { name: "Admin Dashboard", href: "/auth/connect" },
  ],
  Resources: [
    { name: "Documentation", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "System Status", href: "#" },
    { name: "FAQs", href: "#" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Security", href: "#" },
    { name: "Compliance", href: "#" },
  ],
};

const socialLinks = [
  { icon: Globe, href: "#", label: "Website" },
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Users, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "mailto:hello@medtrace.io", label: "Email" },
];

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: COLORS.indigo,
        color: COLORS.white,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 120,
            height: 120,
            border: `2px dashed ${COLORS.indigo}`,
            borderRadius: 24,
            transform: "rotate(15deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 60,
            width: 80,
            height: 80,
            border: `2px dashed ${COLORS.magenta}`,
            borderRadius: "50%",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Main Footer Content */}
        <div style={{ padding: "64px 0 48px" }}>
          <div
            className="grid lg:grid-cols-6"
            style={{ gap: 32 }}
          >
            {/* Brand Section — spans 2 cols */}
            <div className="lg:col-span-2">
              <motion.div
                className="flex items-center"
                style={{ gap: 10, marginBottom: 16 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: COLORS.indigo,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldCheck size={20} color={COLORS.white} />
                </div>
                <span
                  className="mt-display"
                  style={{ fontSize: 22, fontWeight: 600 }}
                >
                  MedTrace
                </span>
              </motion.div>

              <motion.p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 24,
                  maxWidth: 300,
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                A tamper-proof registry tracking every medicine from
                manufacturer to patient. Powered by blockchain, designed
                for trust.
              </motion.p>

              {/* Decorative perforation */}
              <motion.div
                className="mt-perforation"
                style={{ marginBottom: 24, maxWidth: 100, opacity: 0.3 }}
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 0.3, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
              />

              {/* Social Links */}
              <motion.div
                className="flex"
                style={{ gap: 10 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    style={{
                      width: 40,
                      height: 40,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      transition: "background 0.2s, color 0.2s",
                    }}
                    whileHover={{
                      scale: 1.1,
                      y: -2,
                      backgroundColor: COLORS.indigo,
                      color: COLORS.white,
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.4 + index * 0.08,
                      duration: 0.4,
                    }}
                  >
                    <social.icon size={18} />
                  </motion.a>
                ))}
              </motion.div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(
              ([category, links], catIdx) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.2 + catIdx * 0.1,
                    duration: 0.6,
                  }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    {category}
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {links.map((link, linkIdx) => (
                      <motion.li
                        key={link.name}
                        style={{ marginBottom: 12 }}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay:
                            0.3 + catIdx * 0.1 + linkIdx * 0.05,
                          duration: 0.4,
                        }}
                      >
                        <a
                          href={link.href}
                          className="group flex items-center"
                          style={{
                            color: "rgba(255,255,255,0.45)",
                            fontSize: 14,
                            textDecoration: "none",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = COLORS.sky;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color =
                              "rgba(255,255,255,0.45)";
                          }}
                        >
                          <span>{link.name}</span>
                          <ExternalLink
                            size={11}
                            style={{
                              marginLeft: 4,
                              opacity: 0,
                              transition: "opacity 0.2s",
                            }}
                            className="group-hover:opacity-100"
                          />
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )
            )}
          </div>
        </div>

        {/* Network Status Banner */}
        <motion.div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 32,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div
            className="flex flex-col md:flex-row items-center justify-between"
            style={{ gap: 12 }}
          >
            <div
              className="flex items-center flex-wrap"
              style={{ gap: 16 }}
            >
              <div
                className="flex items-center"
                style={{ gap: 8 }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: COLORS.teal,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: COLORS.teal,
                      animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                    }}
                  />
                  <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  All Systems Operational
                </span>
              </div>
              <span
                className="mt-mono"
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                L2 Testnet · IPFS Gateway · Registry Contract
              </span>
            </div>

            {/* Chain badges */}
            <div className="flex items-center" style={{ gap: 12 }}>
              {[
                { label: "L2 Rollup", color: COLORS.indigo },
                { label: "IPFS", color: COLORS.sky },
                { label: "Verified", color: COLORS.teal },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center"
                  style={{ gap: 5 }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 6,
                      borderRadius: 3,
                      background: badge.color,
                    }}
                  />
                  <span
                    className="mt-mono"
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "24px 0",
          }}
        >
          <div
            className="flex flex-col md:flex-row items-center justify-between"
            style={{ gap: 12 }}
          >
            <motion.p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              © 2026 MedTrace. All rights reserved.
            </motion.p>

            <motion.p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
              }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Built with ❤️ for pharmaceutical safety
            </motion.p>
          </div>
        </div>
      </div>
    </footer>
  );
}
