"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { TxState } from "@/lib/types";
import { useTx, TxProvider as BaseTxProvider, TxFlowState } from "./TxContext";

export { BaseTxProvider as TxStateProvider };

// Adapter to provide backwards-compatible useTxState API
export function useTxState() {
  const { txInfo, setTxInfo, resetTx, isProcessing } = useTx();

  let status: "idle" | "reviewing" | "pending" | "confirmed" | "error" = "idle";
  if (
    txInfo.state === "awaiting_signature" ||
    txInfo.state === "pending_onchain" ||
    txInfo.state === "confirming_index"
  ) {
    status = "pending";
  } else if (txInfo.state === "confirmed") {
    status = "confirmed";
  } else if (
    txInfo.state === "rejected_by_user" ||
    txInfo.state === "reverted" ||
    txInfo.state === "error"
  ) {
    status = "error";
  } else if (txInfo.state === "index_timeout") {
    // Reassuring state
    status = "confirmed";
  }

  const txState: TxState = {
    status,
    txHash: txInfo.txHash,
    title: txInfo.title,
    description: txInfo.description,
    error: txInfo.error,
    receiptData: txInfo.receipt,
  };

  const executeTx = async (options: {
    title: string;
    description: string;
    onCommit: () => Promise<any> | any;
    receiptData?: Record<string, any>;
  }): Promise<boolean> => {
    setTxInfo({
      state: "pending_onchain",
      title: options.title,
      description: options.description,
    });
    try {
      await options.onCommit();
      setTxInfo({
        state: "confirmed",
        title: `${options.title} Confirmed`,
        description: "Transaction successfully committed.",
      });
      return true;
    } catch (err: any) {
      setTxInfo({
        state: "error",
        title: `${options.title} Failed`,
        description: err?.message || "Transaction failed.",
        error: err?.message,
      });
      return false;
    }
  };

  return {
    txState,
    executeTx,
    resetTx,
    isProcessing,
  };
}
