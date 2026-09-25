"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { useTx, TxFlowState } from "@/context/TxContext";
import { submitTx, WalletTransactionError } from "@/lib/web3/submitTx";
import { PreparedTransactionDto } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";

export interface TxFlowOptions<TPollData = any> {
  prepare: () => Promise<PreparedTransactionDto>;
  poll?: (txHash: string) => Promise<TPollData>;
  isIndexed?: (data: TPollData, txHash: string) => boolean;
  title?: string;
  description?: string;
  onSuccess?: (result: { txHash: string; data?: TPollData }) => void;
  onError?: (err: Error) => void;
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
}

export interface UseTxFlowReturn {
  state: TxFlowState;
  txHash: string | null;
  error: string | null;
  isProcessing: boolean;
  execute: () => Promise<{ success: boolean; txHash?: string }>;
  reset: () => void;
}

export function useTxFlow<TPollData = any>(
  options: TxFlowOptions<TPollData>,
): UseTxFlowReturn {
  const {
    prepare,
    poll,
    isIndexed,
    title = "Processing Transaction",
    description = "Executing on-chain transaction...",
    onSuccess,
    onError,
    pollIntervalMs = 2000,
    pollTimeoutMs = 30000,
  } = options;

  const { isConnected, connectWallet, getSigner, isWrongNetwork, switchNetwork } = useWallet();
  const { txInfo, setTxInfo, resetTx } = useTx();
  const [localError, setLocalError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<{ success: boolean; txHash?: string }> => {
    setLocalError(null);

    // 1. Wrong-network check BEFORE opening MetaMask
    if (isWrongNetwork) {
      try {
        await switchNetwork();
      } catch (err: any) {
        const errorMsg = "Please switch your wallet to the correct network to proceed.";
        setLocalError(errorMsg);
        setTxInfo({
          state: "error",
          title: "Wrong Network",
          description: errorMsg,
          error: errorMsg,
        });
        return { success: false };
      }
    }

    // 2. Ensure wallet connection and signer
    let activeSigner = await getSigner();
    if (!isConnected || !activeSigner) {
      const addr = await connectWallet();
      if (!addr) {
        return { success: false };
      }
      activeSigner = await getSigner();
      if (!activeSigner) {
        const errorMsg = "No signer available from wallet.";
        setLocalError(errorMsg);
        return { success: false };
      }
    }

    // 3. Step 1 — PREPARE
    setTxInfo({
      state: "awaiting_signature",
      title,
      description: "Please confirm and sign the transaction in your wallet...",
    });

    let prepared: PreparedTransactionDto;
    try {
      prepared = await prepare();
    } catch (err: any) {
      // 4xx from the backend are expected business-rule rejections (shown inline to the user).
      const isExpectedRejection = typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 500;
      if (isExpectedRejection) console.warn("[useTxFlow] Prepare rejected by backend:", err.message);
      else console.error("[useTxFlow] Prepare step failed:", err);
      const msg = err?.message || "Failed to prepare transaction with backend.";
      setLocalError(msg);
      setTxInfo({
        state: "error",
        title: `${title} Failed`,
        description: msg,
        error: msg,
      });
      if (onError) onError(err);
      return { success: false };
    }

    // 4. Step 2 — SIGN & SUBMIT ON-CHAIN
    let txHash: string;
    try {
      const submitResult = await submitTx(activeSigner, prepared, {
        onTxSubmitted: (hash) => {
          txHash = hash;
          setTxInfo({
            state: "pending_onchain",
            txHash: hash,
            title,
            description: "Transaction submitted. Waiting for on-chain block confirmation...",
          });
        },
      });
      txHash = submitResult.txHash;
    } catch (err: any) {
      console.warn("[useTxFlow] Submit step error:", err);
      let flowState: TxFlowState = "error";
      let displayMessage = err?.message || "Transaction submission failed.";

      if (err instanceof WalletTransactionError) {
        if (err.code === "rejected_by_user") {
          flowState = "rejected_by_user";
          displayMessage = "Transaction signature was rejected in your wallet.";
        } else if (err.code === "reverted") {
          flowState = "reverted";
          displayMessage = "Smart contract reverted transaction execution.";
        }
      }

      setLocalError(displayMessage);
      setTxInfo({
        state: flowState,
        title: `${title} - Action Cancelled`,
        description: displayMessage,
        error: displayMessage,
      });
      if (onError) onError(err);
      return { success: false };
    }

    // 5. Step 3 — CONFIRMING INDEX (poll until backend Postgres reflects event)
    setTxInfo({
      state: "confirming_index",
      txHash,
      title,
      description: "Block confirmed! Syncing record with blockchain indexer...",
    });

    const startTime = Date.now();
    let pollDataResult: any = null;
    let indexed = false;

    while (Date.now() - startTime < pollTimeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      try {
        if (poll) {
          const data = await poll(txHash);
          const check = isIndexed ? isIndexed(data, txHash) : !!data;
          if (check) {
            indexed = true;
            pollDataResult = data;
            break;
          }
        } else {
          // Default: poll indexer status endpoint
          const statusRes = await apiClient.get<{ indexed: boolean }>(`/indexer/status`, {
            params: { txHash },
          });
          if (statusRes && statusRes.indexed) {
            indexed = true;
            pollDataResult = statusRes;
            break;
          }
        }
      } catch (pollErr) {
        // Transient poll error, continue until timeout
        console.debug("[useTxFlow] Polling attempt:", pollErr);
      }
    }

    if (indexed) {
      setTxInfo({
        state: "confirmed",
        txHash,
        title: `${title} Confirmed`,
        description: "Transaction confirmed on-chain and verified in database.",
      });
      if (onSuccess) onSuccess({ txHash, data: pollDataResult });
      return { success: true, txHash };
    } else {
      // 6. INDEX TIMEOUT (NOT a failure! The tx confirmed on-chain!)
      setTxInfo({
        state: "index_timeout",
        txHash,
        title: "Transaction Submitted",
        description:
          "Your transaction succeeded on-chain and is being processed by the indexer. It will appear momentarily.",
      });
      if (onSuccess) onSuccess({ txHash });
      return { success: true, txHash };
    }
  }, [
    isWrongNetwork,
    switchNetwork,
    isConnected,
    getSigner,
    connectWallet,
    setTxInfo,
    title,
    prepare,
    onError,
    poll,
    isIndexed,
    pollTimeoutMs,
    pollIntervalMs,
    onSuccess,
  ]);

  return {
    state: txInfo.state,
    txHash: txInfo.txHash || null,
    error: localError || txInfo.error || null,
    isProcessing:
      txInfo.state === "awaiting_signature" ||
      txInfo.state === "pending_onchain" ||
      txInfo.state === "confirming_index",
    execute,
    reset: resetTx,
  };
}
