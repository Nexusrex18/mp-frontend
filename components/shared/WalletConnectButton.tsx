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
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/lib/constants";
import { Role } from "@/lib/types";

export default function WalletConnectButton() {
  const {
    isConnected,
    address,
    connectWallet,
    network,
    isWrongNetwork,
    switchNetwork,
  } = useWallet();
  const { role, roleName, user, organization, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        return UserCheck;
    }
  };

  const RoleIcon = getRoleIcon(role);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border bg-white shadow-sm hover:border-gray-300 transition-all text-xs font-semibold"
        style={{ borderColor: "rgba(62,54,176,0.25)" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
          style={{
            backgroundColor: COLORS.indigo,
          }}
        >
          <RoleIcon size={13} />
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded"
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
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Connected Profile
            </div>
            <div className="font-bold text-sm text-gray-900 mt-0.5">
              {organization?.name || "Independent Stakeholder"}
            </div>
            <div className="text-xs text-gray-500 font-mono truncate">
              {address}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{network.name}</span>
              </div>
              {isWrongNetwork && (
                <button
                  onClick={() => switchNetwork()}
                  className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 hover:bg-amber-100"
                >
                  Switch Network
                </button>
              )}
            </div>

            <div className="mt-2 text-[11px] text-gray-500">
              Auth Status:{" "}
              <span className={isAuthenticated ? "font-bold text-emerald-600" : "text-amber-600"}>
                {isAuthenticated ? "Session Active" : "Unauthenticated"}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={async () => {
                setDropdownOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={14} />
              <span>Disconnect & Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
