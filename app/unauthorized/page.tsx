"use client";

/* ---------------------------------------------------------------
   MedTrace — Unauthorized Access & Role Request (/unauthorized)
   Shown when a connected wallet does not hold an authorized role.
----------------------------------------------------------------*/

import React, { useState } from "react";
import {
  ShieldAlert,
  Building2,
  FileCheck,
  Send,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { COLORS } from "@/lib/constants";

export default function UnauthorizedPage() {
  const { address, disconnectWallet, switchPersona } = useWallet();
  const [orgName, setOrgName] = useState("");
  const [roleRequested, setRoleRequested] = useState("PHARMACY_ROLE");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
        <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Stakeholder Role Not Detected
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The connected address has not been granted an on-chain credential
              by the Health Authority.
            </p>
          </div>
        </div>

        {/* Address Info Box */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              Connected Wallet Address:
            </span>
            <div className="font-mono font-bold text-gray-900 mt-0.5">
              {address || "0x98A...00FF"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => switchPersona("MANUFACTURER_ROLE")}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Switch to Demo Role
            </button>
            <button
              onClick={() => disconnectWallet()}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Request Access Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
              <Building2 size={14} className="text-indigo-600" />
              <span>Apply for On-Chain Authorization</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization / Facility Legal Name:
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Apex BioPharma / Memorial Pharmacy"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Requested Role:
                </label>
                <select
                  value={roleRequested}
                  onChange={(e) => setRoleRequested(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="MANUFACTURER_ROLE">Manufacturer</option>
                  <option value="DISTRIBUTOR_ROLE">Distributor / Logistics</option>
                  <option value="PHARMACY_ROLE">Licensed Pharmacy</option>
                  <option value="DOCTOR_ROLE">Licensed Medical Doctor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Regulatory License ID / DEA:
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. FDA-9401 / NABP-5591"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Institutional Email:
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="regulatory@organization.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full py-3 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 hover:opacity-90"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <Send size={14} />
              <span>Submit Application to Health Authority</span>
            </button>
          </form>
        ) : (
          <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-sm text-emerald-900">
              Application Submitted to Admin Ledger
            </h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1">
              Your request for <strong>{roleRequested}</strong> has been routed
              to the Health Authority review queue (visible in Admin Alerts &
              Stakeholders).
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            >
              Submit Another Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
