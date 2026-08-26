"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useWallet, SUPPORTED_NETWORK } from "@/context/WalletContext";
import { COLORS } from "@/lib/constants";

export default function NetworkGuard() {
  const { isConnected, isWrongNetwork, switchNetwork } = useWallet();

  if (!isConnected || !isWrongNetwork) {
    return null;
  }

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-amber-950 border-b"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderColor: "rgba(245, 158, 11, 0.35)",
      }}
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Unsupported Chain:</strong> MedTrace smart contracts and custody proofs are deployed to{" "}
            <span className="font-bold underline">{SUPPORTED_NETWORK.name}</span>.
          </span>
        </div>

        <button
          onClick={() => switchNetwork()}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-white font-bold transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: COLORS.indigo }}
        >
          <RefreshCw size={12} />
          <span>Switch to L2</span>
        </button>
      </div>
    </div>
  );
}
