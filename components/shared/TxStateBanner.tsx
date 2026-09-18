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
  Clock,
  Database,
} from "lucide-react";
import { useTx } from "@/context/TxContext";
import { getExplorerTxUrl } from "@/lib/web3/explorer";
import { COLORS } from "@/lib/constants";

export default function TxStateBanner() {
  const { txInfo, resetTx } = useTx();

  if (txInfo.state === "idle") {
    return null;
  }

  const isAwaitingSig = txInfo.state === "awaiting_signature";
  const isPendingOnChain = txInfo.state === "pending_onchain";
  const isConfirmingIndex = txInfo.state === "confirming_index";
  const isConfirmed = txInfo.state === "confirmed";
  const isTimeout = txInfo.state === "index_timeout";
  const isRejected = txInfo.state === "rejected_by_user";
  const isReverted = txInfo.state === "reverted";
  const isGeneralError = txInfo.state === "error";

  const isProcessing = isAwaitingSig || isPendingOnChain || isConfirmingIndex;
  const isSuccessful = isConfirmed || isTimeout;
  const isError = isRejected || isReverted || isGeneralError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Top Decorative accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            backgroundColor: isProcessing
              ? COLORS.indigo
              : isSuccessful
              ? "#10B981"
              : "#EF4444",
          }}
        />

        {/* Close button if not waiting on signature */}
        {!isProcessing && (
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
            {isProcessing && (
              <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}

            {isConfirmed && (
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 animate-in zoom-in-50 duration-300">
                <CheckCircle2 size={36} />
              </div>
            )}

            {isTimeout && (
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-amber-600 animate-in zoom-in-50 duration-300">
                <Clock size={36} />
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
            {isRejected
              ? "Signature Declined"
              : isReverted
              ? "Transaction Reverted"
              : isTimeout
              ? "Transaction Submitted"
              : txInfo.title || "Processing Transaction"}
          </h3>
          <p className="text-xs text-gray-600 max-w-xs mt-1">
            {isRejected
              ? "You rejected the signature request in MetaMask."
              : isReverted
              ? "Transaction was reverted on-chain by smart contract rules."
              : isTimeout
              ? "Your transaction succeeded on-chain and is being indexed. It will appear momentarily."
              : txInfo.description || "Submitting to Ethereum L2 Rollup"}
          </p>

          {/* Sequence Tracker */}
          <div className="w-full bg-gray-50 rounded-2xl p-4 my-4 border border-gray-100 text-left text-xs space-y-2.5">
            {/* Step 1: Signature */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <ShieldCheck size={14} className="text-indigo-600" />
                1. Wallet Signature
              </span>
              {isAwaitingSig ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Sign in Wallet...
                </span>
              ) : isRejected ? (
                <span className="text-rose-600 font-bold">✗ Declined</span>
              ) : (
                <span className="text-emerald-600 font-bold">✓ Signed</span>
              )}
            </div>

            {/* Step 2: L2 Transaction */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <Layers size={14} className="text-indigo-600" />
                2. On-Chain L2 Confirmation
              </span>
              {isAwaitingSig ? (
                <span className="text-gray-400">Waiting...</span>
              ) : isPendingOnChain ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Mining Block...
                </span>
              ) : isReverted ? (
                <span className="text-rose-600 font-bold">✗ Reverted</span>
              ) : (
                <span className="text-emerald-600 font-bold">✓ Confirmed</span>
              )}
            </div>

            {/* Step 3: Indexer Sync */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-gray-700 font-medium">
                <Database size={14} className="text-indigo-600" />
                3. Database Event Indexer
              </span>
              {isAwaitingSig || isPendingOnChain ? (
                <span className="text-gray-400">Waiting...</span>
              ) : isConfirmingIndex ? (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Syncing Event...
                </span>
              ) : isConfirmed ? (
                <span className="text-emerald-600 font-bold">✓ Synced</span>
              ) : isTimeout ? (
                <span className="text-amber-600 font-bold">Processing...</span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </div>
          </div>

          {/* On-Chain Hash Link */}
          {txInfo.txHash && (
            <div className="w-full bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex items-center justify-between text-xs font-mono mb-4">
              <span className="text-gray-500">Explorer:</span>
              <a
                href={getExplorerTxUrl(txInfo.txHash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-bold"
              >
                <span>
                  {txInfo.txHash.slice(0, 10)}...{txInfo.txHash.slice(-8)}
                </span>
                <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Action button */}
          {isSuccessful && (
            <button
              onClick={resetTx}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:opacity-90 active:scale-[0.99]"
              style={{ backgroundColor: COLORS.indigo }}
            >
              Done
            </button>
          )}

          {isError && (
            <button
              onClick={resetTx}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
