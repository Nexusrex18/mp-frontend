"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  ChevronDown,
  LogOut,
  UserCheck,
  Building2,
  Stethoscope,
  ShieldCheck,
  Truck,
  Layers,
  Sparkles,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useRole } from "@/context/RoleContext";
import { DEMO_STAKEHOLDERS } from "@/lib/mockData";
import { COLORS } from "@/lib/constants";
import { Role } from "@/lib/types";

export default function WalletConnectButton() {
  const {
    isConnected,
    address,
    currentStakeholder,
    connectWallet,
    disconnectWallet,
    switchPersona,
    network,
  } = useWallet();
  const { roleName } = useRole();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isConnected || !address) {
    return (
      <button
        onClick={() => connectWallet()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          backgroundColor: COLORS.magenta,
          boxShadow: "0 4px 14px rgba(246, 32, 136, 0.3)",
        }}
      >
        <Wallet size={16} />
        <span>Connect Stakeholder Wallet</span>
      </button>
    );
  }

  const getRoleIcon = (role: Role) => {
    switch (role) {
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
        return UserCheck;
    }
  };

  const RoleIcon = currentStakeholder
    ? getRoleIcon(currentStakeholder.role)
    : UserCheck;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border bg-white shadow-sm hover:border-gray-300 transition-all text-xs font-semibold"
        style={{ borderColor: "rgba(62,54,176,0.25)" }}
      >
        {/* Stakeholder Avatar / Dot */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
          style={{
            backgroundColor: currentStakeholder?.avatarColor || COLORS.indigo,
          }}
        >
          <RoleIcon size={13} />
        </div>

        {/* Role & Address info */}
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded"
              style={{
                backgroundColor: "rgba(62,54,176,0.1)",
                color: COLORS.indigo,
              }}
            >
              {roleName}
            </span>
            <span className="font-mono text-gray-700">
              {address.length > 12
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : address}
            </span>
          </div>
        </div>

        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Info */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Connected Profile
            </div>
            <div className="font-bold text-sm text-gray-900 mt-0.5">
              {currentStakeholder?.name || "Anonymous Actor"}
            </div>
            <div className="text-xs text-gray-500">
              {currentStakeholder?.organization || "Decentralized Key"}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Network: {network.name}</span>
            </div>
          </div>

          {/* Quick Demo Persona Switcher */}
          <div className="py-2">
            <div className="px-3 py-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <span>Switch Demo Persona</span>
              <Sparkles size={11} className="text-pink-500" />
            </div>

            <div className="space-y-1 mt-1">
              {DEMO_STAKEHOLDERS.map((stk) => {
                const ItemIcon = getRoleIcon(stk.role);
                const isCurrent = currentStakeholder?.role === stk.role;

                return (
                  <button
                    key={stk.id}
                    onClick={() => {
                      switchPersona(stk.role);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      isCurrent
                        ? "bg-indigo-50 text-indigo-900 font-bold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: stk.avatarColor }}
                    >
                      <ItemIcon size={12} />
                    </div>
                    <div className="flex-1 truncate">
                      <div className="truncate">{stk.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        {stk.roleName}
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  switchPersona("UNREGISTERED");
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-md bg-gray-400 flex items-center justify-center text-white shrink-0">
                  <UserCheck size={12} />
                </div>
                <div className="flex-1">
                  <div>Unregistered Wallet</div>
                  <div className="text-[10px] text-gray-400">Tests /unauthorized</div>
                </div>
              </button>
            </div>
          </div>

          {/* Disconnect Action */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                disconnectWallet();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={14} />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
