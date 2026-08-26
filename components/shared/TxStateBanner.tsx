"use client";

import React from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  X,
  Layers,
} from "lucide-react";
import { useTxState } from "@/context/TxStateContext";
import { COLORS } from "@/lib/constants";

export default function TxStateBanner() {
  const { txState, resetTx } = useTxState();

  if (txState.status === "idle") {
    return null;
  }

  const isPending = txState.status === "pending";
  const isConfirmed = txState.status === "confirmed";
  const isError = txState.status === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Top Decorative accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            backgroundColor: isPending
              ? COLORS.indigo
              : isConfirmed
              ? "#10B981"
              : "#EF4444",
          }}
        />

        {/* Close button if finished */}
        {!isPending && (
          <button
            onClick={resetTx}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <div className="flex flex-col items-center text-center mt-2">
          {/* Animated Status Icon */}
          <div className="relative my-3">
            {isPending && (
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}

            {isConfirmed && (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 animate-in zoom-in-50 duration-300">
                <CheckCircle2 size={36} />
              </div>
            )}

            {isError && (
              <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-300 flex items-center justify-center text-rose-600">
                <XCircle size={36} />
              </div>
            )}
          </div>

          {/* Title & Stage */}
          <h3 className="font-bold text-lg text-gray-900 mt-1">
            {txState.title || "Processing Transaction"}
          </h3>
          <p className="text-xs text-gray-600 max-w-xs mt-1">
            {txState.description || "Submitting to Arbitrum Sepolia Rollup"}
          </p>

          {/* Sequence Tracker */}
          <div className="w-full bg-gray-50 rounded-2xl p-4 my-4 border border-gray-100 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <ShieldCheck size={14} className="text-indigo-600" />
                1. Cryptographic Signature
              </span>
              <span className="text-emerald-600 font-bold">✓ Signed</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <Layers size={14} className="text-indigo-600" />
                2. L2 Rollup Sequencer
              </span>
              {isPending ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Mining Block...
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">✓ Batched</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <CheckCircle2 size={14} className="text-indigo-600" />
                3. On-Chain State Finalized
              </span>
              {isPending ? (
                <span className="text-gray-400">Waiting...</span>
              ) : isConfirmed ? (
                <span className="text-emerald-600 font-bold">✓ Finalized</span>
              ) : (
                <span className="text-rose-600 font-bold">Failed</span>
              )}
            </div>
          </div>

          {/* On-Chain Hash Link */}
          {txState.txHash && (
            <div className="w-full bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex items-center justify-between text-xs font-mono mb-4">
              <span className="text-gray-500">Tx Hash:</span>
              <a
                href={`https://sepolia.arbiscan.io/tx/${txState.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold"
              >
                <span>
                  {txState.txHash.slice(0, 10)}...{txState.txHash.slice(-8)}
                </span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Action button */}
          {isConfirmed && (
            <button
              onClick={resetTx}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: COLORS.indigo }}
            >
              Continue to Dashboard
            </button>
          )}

          {isError && (
            <button
              onClick={resetTx}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              Close & Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
