"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type TxFlowState =
  | "idle"
  | "awaiting_signature"
  | "pending_onchain"
  | "confirming_index"
  | "confirmed"
  | "rejected_by_user"
  | "reverted"
  | "index_timeout"
  | "error";

export interface TxInfo {
  state: TxFlowState;
  txHash?: string;
  title?: string;
  description?: string;
  error?: string;
  receipt?: any;
}

export interface TxContextType {
  txInfo: TxInfo;
  setTxInfo: React.Dispatch<React.SetStateAction<TxInfo>>;
  resetTx: () => void;
  isProcessing: boolean;
}

const TxContext = createContext<TxContextType | undefined>(undefined);

export function TxProvider({ children }: { children: ReactNode }) {
  const [txInfo, setTxInfo] = useState<TxInfo>({ state: "idle" });

  const resetTx = () => {
    setTxInfo({ state: "idle" });
  };

  const isProcessing =
    txInfo.state === "awaiting_signature" ||
    txInfo.state === "pending_onchain" ||
    txInfo.state === "confirming_index";

  return (
    <TxContext.Provider
      value={{
        txInfo,
        setTxInfo,
        resetTx,
        isProcessing,
      }}
    >
      {children}
    </TxContext.Provider>
  );
}

export function useTx() {
  const context = useContext(TxContext);
  if (!context) {
    throw new Error("useTx must be used within a TxProvider");
  }
  return context;
}
