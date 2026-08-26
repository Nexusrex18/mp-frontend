"use client";

import { Save, Shield, Sliders } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   Admin — Settings
   
   Purpose: Dispensing rule defaults per product category,
   role permission matrix.
----------------------------------------------------------------*/

const DISPENSING_RULES = [
  { category: "Antibiotics", default: "Prescription", editable: true },
  { category: "Analgesics (Mild)", default: "OTC", editable: true },
  { category: "Analgesics (Strong)", default: "Prescription", editable: true },
  { category: "Antihistamines", default: "OTC", editable: true },
  { category: "Antidiabetics", default: "Prescription", editable: false },
  { category: "Cardiovascular", default: "Prescription", editable: false },
];

const ROLES = ["Admin", "Manufacturer", "Distributor", "Pharmacy", "Doctor"];
const PERMISSIONS = [
  { action: "Create Batch", Admin: true, Manufacturer: true, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "Transfer Custody", Admin: false, Manufacturer: true, Distributor: true, Pharmacy: false, Doctor: false },
  { action: "Accept Custody", Admin: false, Manufacturer: false, Distributor: true, Pharmacy: true, Doctor: false },
  { action: "Dispense Medicine", Admin: false, Manufacturer: false, Distributor: false, Pharmacy: true, Doctor: false },
  { action: "Issue Prescription", Admin: false, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: true },
  { action: "Approve Roles", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "View Audit Log", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "View Global Registry", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
];

export default function AdminSettingsPage() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="mt-display" style={{ fontSize: 24, fontWeight: 600 }}>
          Settings
        </h1>
        <p className="mt-text-muted" style={{ fontSize: 14, marginTop: 4 }}>
          Dispensing classification defaults and role permission matrix.
        </p>
      </div>

      {/* Dispensing Rules */}
      <div style={{ marginBottom: 40 }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 18 }}>
          <Sliders size={18} color={COLORS.indigo} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            Dispensing Classification Defaults
          </h2>
        </div>

        <div
          style={{
            border: "1px solid rgba(17,17,17,0.08)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "rgba(217,217,255,0.18)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(17,17,17,0.55)" }}>
                  Product Category
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(17,17,17,0.55)" }}>
                  Default Type
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(17,17,17,0.55)" }}>
                  Editable
                </th>
              </tr>
            </thead>
            <tbody>
              {DISPENSING_RULES.map((rule) => (
                <tr
                  key={rule.category}
                  style={{ borderTop: "1px solid rgba(17,17,17,0.05)" }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    {rule.category}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      className="mt-mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: rule.default === "Prescription" ? COLORS.indigo : "#0a5c5f",
                        background: rule.default === "Prescription" ? "rgba(62,54,176,0.08)" : "rgba(185,221,223,0.3)",
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {rule.default}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="mt-text-muted" style={{ fontSize: 13 }}>
                      {rule.editable ? "Yes" : "Locked by regulation"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 18 }}>
          <Shield size={18} color={COLORS.indigo} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            Role Permission Matrix
          </h2>
        </div>

        <div
          style={{
            border: "1px solid rgba(17,17,17,0.08)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "rgba(217,217,255,0.18)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(17,17,17,0.55)" }}>
                    Action
                  </th>
                  {ROLES.map((role) => (
                    <th
                      key={role}
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        color: "rgba(17,17,17,0.55)",
                      }}
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr
                    key={perm.action}
                    style={{ borderTop: "1px solid rgba(17,17,17,0.05)" }}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                      {perm.action}
                    </td>
                    {ROLES.map((role) => (
                      <td
                        key={role}
                        style={{ padding: "12px 16px", textAlign: "center" }}
                      >
                        {perm[role as keyof typeof perm] === true ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              background: COLORS.indigo,
                              color: COLORS.white,
                              fontSize: 13,
                              fontWeight: 700,
                              lineHeight: "20px",
                            }}
                          >
                            ✓
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-block",
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              background: "rgba(17,17,17,0.04)",
                              color: "rgba(17,17,17,0.2)",
                              fontSize: 13,
                              fontWeight: 700,
                              lineHeight: "20px",
                            }}
                          >
                            –
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
