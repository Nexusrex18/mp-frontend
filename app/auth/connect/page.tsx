"use client";

/* ---------------------------------------------------------------
   MedTrace — Wallet Connect & Role Detection (/auth/connect)
   Internal stakeholders connect their Web3 keys, resolve on-chain
   roles via AccessControl.sol, and get redirected to their dashboard.
----------------------------------------------------------------*/

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
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useRole } from "@/context/RoleContext";
import { DEMO_STAKEHOLDERS } from "@/lib/mockData";
import { COLORS } from "@/lib/constants";
import { Role } from "@/lib/types";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, address, currentStakeholder, connectWallet, switchPersona } =
    useWallet();
  const { role, roleName, dashboardPath, isAuthorized } = useRole();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSelectRole = (targetRole: Role) => {
    switchPersona(targetRole);
  };

  const handleProceed = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      router.push(dashboardPath);
    }, 600);
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
          Cryptographically sign in using your authorized on-chain credential
          to access supply chain nodes and custody operations.
        </p>
      </div>

      {/* Main Connect Card */}
      <div className="mt-8 max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200/80">
        {!isConnected ? (
          <div className="text-center py-4">
            <div
              className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white mb-5 shadow-lg"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <Wallet size={30} />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              Connect Web3 Wallet
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Connect your MetaMask or injected Web3 provider to verify your
              decentralized organization license.
            </p>

            <button
              onClick={() => connectWallet()}
              className="mt-6 w-full max-w-sm py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center gap-2.5"
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 6px 20px rgba(246, 32, 136, 0.35)",
              }}
            >
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Connected Stakeholder Banner */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{
                    backgroundColor:
                      currentStakeholder?.avatarColor || COLORS.indigo,
                  }}
                >
                  {React.createElement(getRoleIcon(role), { size: 20 })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      {currentStakeholder?.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase"
                      style={{
                        backgroundColor: "rgba(62, 54, 176, 0.15)",
                        color: COLORS.indigo,
                      }}
                    >
                      {roleName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {address}
                  </div>
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={13} />
                Detected
              </span>
            </div>

            {/* Redirection summary */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                On-Chain Role Resolved:{" "}
                <strong className="text-gray-900">{role}</strong>
              </p>

              <button
                onClick={handleProceed}
                disabled={isRedirecting}
                className="mt-4 w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.indigo }}
              >
                <span>
                  {isRedirecting
                    ? "Redirecting..."
                    : `Enter ${roleName} Dashboard`}
                </span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Demo Persona Quick-Switch Panel */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles size={13} className="text-pink-500" />
              <span>Instant Test Personas (1-Click Switch)</span>
            </span>
            <span className="text-[11px] text-gray-400">
              Dev-Split Testing Suite
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEMO_STAKEHOLDERS.map((stk) => {
              const Icon = getRoleIcon(stk.role);
              const isSelected = currentStakeholder?.role === stk.role;

              return (
                <button
                  key={stk.id}
                  onClick={() => handleSelectRole(stk.role)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50/40 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: stk.avatarColor }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-gray-900 truncate">
                      {stk.name}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">
                      {stk.roleName}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Unregistered Persona */}
            <button
              onClick={() => handleSelectRole("UNREGISTERED")}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                currentStakeholder?.role === "UNREGISTERED"
                  ? "border-rose-400 bg-rose-50/40 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gray-500 flex items-center justify-center text-white shrink-0">
                <UserX size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-gray-900">
                  Unregistered Wallet
                </div>
                <div className="text-[10px] text-gray-500">
                  Test /unauthorized gate
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        Looking for medicine verification?{" "}
        <a
          href="/verify"
          className="text-indigo-600 font-bold hover:underline"
        >
          Go to Patient QR Scanner (No wallet required)
        </a>
      </div>
    </div>
  );
}
