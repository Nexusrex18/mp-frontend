"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Building2,
  FileCheck,
  Send,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { usersApi } from "@/lib/api/users";
import { OrgType } from "@/lib/api/types";
import { Role } from "@/lib/types";

export default function UnauthorizedPage() {
  const { address, connectWallet, isConnected } = useWallet();
  const { logout } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [roleRequested, setRoleRequested] = useState<OrgType>("PHARMACY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!address) {
      setErrorMessage("Please connect your wallet before submitting a registration request.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await usersApi.submitRegistrationRequest({
        walletAddress: address,
        organizationName: orgName.trim(),
        requestedRole: roleRequested,
      });
      setSubmittedRequestId(res.request?.id || null);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("[UnauthorizedPage] Registration submission failed:", err);
      setErrorMessage(err?.message || "Failed to submit registration request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
        <div className="flex items-center gap-3.5 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Stakeholder Role Not Authorized
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              The connected address has not been assigned an active organization role
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
            <div className="font-mono font-bold text-gray-900 mt-0.5 break-all">
              {address || "No wallet connected"}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isConnected ? (
              <button
                onClick={() => connectWallet()}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Requested Stakeholder Role:
              </label>
              <select
                value={roleRequested}
                onChange={(e) => setRoleRequested(e.target.value as OrgType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
              >
                <option value="MANUFACTURER">Manufacturer (Batch Registration)</option>
                <option value="DISTRIBUTOR">Distributor (Logistics & Custody)</option>
                <option value="PHARMACY">Pharmacy (Dispensing & Verification)</option>
                <option value="DOCTOR">Doctor (Prescription Issuance)</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || !isConnected}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Submit Authorization Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="font-bold text-emerald-900 text-sm">
              Application Submitted Successfully
            </h3>
            <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">
              Your request has been recorded. Once the Network Administrator reviews
              and grants your on-chain role, sign in via SIWE to access your dashboard.
            </p>
            {submittedRequestId && (
              <div className="mt-3 text-[11px] text-emerald-800 font-mono">
                Request ID: {submittedRequestId}
              </div>
            )}
            <div className="mt-5">
              <a
                href="/auth/connect"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
