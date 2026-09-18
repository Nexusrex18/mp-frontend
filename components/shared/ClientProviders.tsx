"use client";

import React, { ReactNode } from "react";
import { WalletProvider } from "@/context/WalletContext";
import { AuthProvider } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";
import { TxStateProvider } from "@/context/TxStateContext";
import TxStateBanner from "@/components/shared/TxStateBanner";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <AuthProvider>
        <RoleProvider>
          <TxStateProvider>
            {children}
            <TxStateBanner />
          </TxStateProvider>
        </RoleProvider>
      </AuthProvider>
    </WalletProvider>
  );
}
