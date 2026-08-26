"use client";

/* ---------------------------------------------------------------
   MedTrace — Wallet Context & Web3 State
   Manages wallet connection, address state, network status,
   and demo persona switching for instantaneous testing.
----------------------------------------------------------------*/

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_STAKEHOLDERS } from "@/lib/mockData";
import { StakeholderProfile, Role } from "@/lib/types";

export interface NetworkConfig {
  chainId: string;
  name: string;
  isSupported: boolean;
  rpcUrl: string;
  blockExplorer: string;
}

export const SUPPORTED_NETWORK: NetworkConfig = {
  chainId: "0x66eee", // 421614 = Arbitrum Sepolia
  name: "Arbitrum Sepolia L2",
  isSupported: true,
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  blockExplorer: "https://sepolia.arbiscan.io",
};

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  currentStakeholder: StakeholderProfile | null;
  network: NetworkConfig;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchPersona: (role: Role) => void;
  switchNetwork: () => Promise<void>;
  isWrongNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [currentStakeholder, setCurrentStakeholder] = useState<StakeholderProfile | null>(null);
  const [network, setNetwork] = useState<NetworkConfig>(SUPPORTED_NETWORK);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedConnected = localStorage.getItem("medtrace_connected");
      const savedRoleId = localStorage.getItem("medtrace_active_role_id");
      if (savedConnected === "true" && savedRoleId) {
        const found = DEMO_STAKEHOLDERS.find((s) => s.id === savedRoleId);
        if (found) {
          setIsConnected(true);
          setAddress(found.address);
          setCurrentStakeholder(found);
        }
      }
    } catch {
      // ignore SSR
    }
  }, []);

  const connectWallet = async () => {
    // If window.ethereum is present, we could request accounts, or fallback to default Manufacturer persona
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts[0]) {
          const userAddr = accounts[0];
          setAddress(userAddr);
          setIsConnected(true);
          // Match address to a stakeholder or set as unregistered
          const matched = DEMO_STAKEHOLDERS.find(
            (s) => s.address.toLowerCase() === userAddr.toLowerCase()
          );
          if (matched) {
            setCurrentStakeholder(matched);
            localStorage.setItem("medtrace_active_role_id", matched.id);
          } else {
            const unregistered: StakeholderProfile = {
              id: "unreg-1",
              address: userAddr,
              role: "UNREGISTERED",
              roleName: "Unregistered",
              name: "External Account",
              organization: "Unknown Stakeholder",
              licenseNumber: "N/A",
              location: "Unknown",
              verified: false,
              avatarColor: "#6B7280",
            };
            setCurrentStakeholder(unregistered);
            localStorage.setItem("medtrace_active_role_id", unregistered.id);
          }
          localStorage.setItem("medtrace_connected", "true");
          return;
        }
      } catch (err) {
        console.warn("MetaMask request rejected or failed, falling back to simulated persona.", err);
      }
    }

    // Default simulation fallback: Manufacturer
    const defaultPersona = DEMO_STAKEHOLDERS[0];
    setIsConnected(true);
    setAddress(defaultPersona.address);
    setCurrentStakeholder(defaultPersona);
    localStorage.setItem("medtrace_connected", "true");
    localStorage.setItem("medtrace_active_role_id", defaultPersona.id);
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setCurrentStakeholder(null);
    localStorage.removeItem("medtrace_connected");
    localStorage.removeItem("medtrace_active_role_id");
  };

  const switchPersona = (role: Role) => {
    if (role === "UNREGISTERED") {
      const unregistered: StakeholderProfile = {
        id: "unreg-mock",
        address: "0x98A...00FF",
        role: "UNREGISTERED",
        roleName: "Unregistered",
        name: "Unverified Entity",
        organization: "Pending Registration",
        licenseNumber: "N/A",
        location: "Unverified",
        verified: false,
        avatarColor: "#6B7280",
      };
      setIsConnected(true);
      setAddress(unregistered.address);
      setCurrentStakeholder(unregistered);
      localStorage.setItem("medtrace_connected", "true");
      localStorage.setItem("medtrace_active_role_id", unregistered.id);
      return;
    }

    const matched = DEMO_STAKEHOLDERS.find((s) => s.role === role);
    if (matched) {
      setIsConnected(true);
      setAddress(matched.address);
      setCurrentStakeholder(matched);
      localStorage.setItem("medtrace_connected", "true");
      localStorage.setItem("medtrace_active_role_id", matched.id);
    }
  };

  const switchNetwork = async () => {
    setIsWrongNetwork(false);
    setNetwork(SUPPORTED_NETWORK);
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        currentStakeholder,
        network,
        connectWallet,
        disconnectWallet,
        switchPersona,
        switchNetwork,
        isWrongNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
