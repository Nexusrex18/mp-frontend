"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  Layers,
  Truck,
  Building2,
  Stethoscope,
  UserX,
  ArrowRight,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useAuth, getDashboardPath } from "@/context/AuthContext";
import { COLORS } from "@/lib/constants";
import { Role } from "@/lib/types";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, address, connectWallet, getSigner, network, isWrongNetwork, switchNetwork } = useWallet();
  const { isAuthenticated, role, roleName, dashboardPath, loginWithSiwe, isLoading: isAuthLoading } = useAuth();

  const [signingState, setSigningState] = useState<"idle" | "signing" | "verifying" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setErrorMessage(null);
    try {
      let activeSigner = await getSigner();
      let activeAddress = address;

      if (!isConnected || !activeSigner || !activeAddress) {
        const connectedAddr = await connectWallet();
        if (!connectedAddr) return;
        activeAddress = connectedAddr;
        activeSigner = await getSigner();
        if (!activeSigner) throw new Error("Could not acquire signer from wallet");
      }

      if (isWrongNetwork) {
        await switchNetwork();
      }

      setSigningState("signing");
      const result = await loginWithSiwe(activeSigner, activeAddress);

      setSigningState("success");

      if (result.isRegistered && result.user) {
        const targetPath = getDashboardPath(
          result.user.role === "ADMIN"
            ? "ADMIN_ROLE"
            : result.user.role === "MANUFACTURER"
            ? "MANUFACTURER_ROLE"
            : result.user.role === "DISTRIBUTOR"
            ? "DISTRIBUTOR_ROLE"
            : result.user.role === "PHARMACY"
            ? "PHARMACY_ROLE"
            : "DOCTOR_ROLE"
        );
        router.push(targetPath);
      } else {
        // Unregistered wallet
        router.push("/unauthorized");
      }
    } catch (err: any) {
      console.error("[ConnectPage] SIWE login failed:", err);
      setSigningState("error");
      if (err?.code === "ACTION_REJECTED" || err?.message?.includes("rejected")) {
        setErrorMessage("Signature request was declined in MetaMask.");
      } else {
        setErrorMessage(err?.message || "Authentication failed. Please try again.");
      }
    }
  };

  const getRoleIcon = (r: Role) => {
    switch (r) {
      case "MANUFACTURER_ROLE":
        return Layers;
      case "DISTRIBUTOR_ROLE":
        return Truck;
      case "PHARMACY_ROLE":
        return Building2;
      case "DOCTOR_ROLE":
        return Stethoscope;
      case "ADMIN_ROLE":
        return ShieldCheck;
      default:
        return UserX;
    }
  };

  const ActiveRoleIcon = getRoleIcon(role);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="text-center max-w-md">
        <a
          href="/"
          className="inline-flex items-center gap-2.5 text-decoration-none group mb-4"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: COLORS.indigo }}
          >
            <ShieldCheck size={22} />
          </div>
          <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
            MedTrace
          </span>
        </a>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          Internal Stakeholder Portal
        </h2>
        <p className="mt-1.5 text-xs text-gray-500 max-w-sm mx-auto">
          Cryptographically sign in using your authorized Web3 key (SIWE)
          to access supply chain custody operations.
        </p>
      </div>

      {/* Main Connect Card */}
      <div className="mt-8 max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {isAuthenticated && role !== "UNREGISTERED" ? (
          <div className="space-y-6">
            <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: COLORS.indigo }}
              >
                <ActiveRoleIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                    Active Session
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-bold text-gray-900 text-base mt-0.5">
                  {roleName} Dashboard
                </div>
                <div className="text-xs font-mono text-gray-500 truncate">
                  {address}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(dashboardPath)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: COLORS.indigo,
                boxShadow: "0 6px 20px rgba(62, 54, 176, 0.3)",
              }}
            >
              <span>Continue to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : !isConnected ? (
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white mb-5 shadow-lg"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <Wallet size={30} />
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-1">
              Connect Your Ethereum Wallet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              Connect MetaMask or any compatible browser wallet to verify your on-chain authorization.
            </p>

            <button
              onClick={handleSignIn}
              disabled={isAuthLoading || signingState === "signing"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
              }}
            >
              <Wallet size={18} />
              <span>Connect & Sign In</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span>Connected Account</span>
                <span className="font-semibold text-indigo-600">{network.name}</span>
              </div>
              <div className="font-mono font-bold text-gray-900 break-all">
                {address}
              </div>
            </div>

            {isWrongNetwork && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>Wrong network detected. Please switch to {network.name}.</span>
                <button
                  onClick={switchNetwork}
                  className="font-bold text-amber-900 underline ml-2"
                >
                  Switch
                </button>
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={signingState === "signing" || signingState === "verifying"}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                backgroundColor: COLORS.indigo,
                boxShadow: "0 6px 20px rgba(62, 54, 176, 0.3)",
              }}
            >
              {signingState === "signing" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Check MetaMask to Sign Message...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Sign In with Ethereum (SIWE)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Security / Network Notice */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Lock size={13} className="text-gray-400" />
            <span>SIWE Nonce verification via {network.name}</span>
          </div>
          <span className="text-gray-400">MedTrace Protocol v1.0</span>
        </div>
      </div>
    </div>
  );
}
