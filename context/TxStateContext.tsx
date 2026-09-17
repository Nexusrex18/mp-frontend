"use client";

/* ---------------------------------------------------------------
   MedTrace — TxStateContext
   Provides application-wide state for on-chain mutating writes,
   guaranteeing explicit Review -> Pending (L2) -> Confirmed lifecycle.
----------------------------------------------------------------*/

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TxState } from "@/lib/types";
import { generateTxHash } from "@/lib/mockData";

interface ExecuteTxOptions {
  title: string;
  description: string;
  onCommit: () => Promise<any> | any;
  receiptData?: Record<string, any>;
}

interface TxStateContextType {
  txState: TxState;
  executeTx: (options: ExecuteTxOptions) => Promise<boolean>;
  resetTx: () => void;
  isProcessing: boolean;
}

const TxStateContext = createContext<TxStateContextType | undefined>(undefined);

export function TxStateProvider({ children }: { children: ReactNode }) {
  const [txState, setTxState] = useState<TxState>({ status: "idle" });

  const resetTx = () => {
    setTxState({ status: "idle" });
  };

  const executeTx = async (options: ExecuteTxOptions): Promise<boolean> => {
    const { title, description, onCommit, receiptData } = options;
    const generatedHash = generateTxHash();

    // Step 1: Set Pending state
    setTxState({
      status: "pending",
      title,
      description,
      txHash: generatedHash,
      receiptData,
    });

    try {
      // Simulate L2 Block Confirmation delay (2.0 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Execute client commit callback
      await onCommit();

      // Step 2: Set Confirmed state
      setTxState({
        status: "confirmed",
        title: `${title} Confirmed`,
        description: "Transaction successfully sealed on Arbitrum Sepolia L2.",
        txHash: generatedHash,
        receiptData,
      });

      return true;
    } catch (err: any) {
      setTxState({
        status: "error",
        title: `${title} Failed`,
        description: err?.message || "Transaction reverted on chain.",
        error: err?.message || "Execution error",
      });
      return false;
    }
  };

  return (
    <TxStateContext.Provider
      value={{
        txState,
        executeTx,
        resetTx,
        isProcessing: txState.status === "pending",
      }}
    >
      {children}
    </TxStateContext.Provider>
  );
}

export function useTxState() {
  const context = useContext(TxStateContext);
  if (!context) {
    throw new Error("useTxState must be used within a TxStateProvider");
  }
  return context;
}
