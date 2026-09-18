"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { Role, StakeholderProfile } from "@/lib/types";
import { DEMO_STAKEHOLDERS } from "@/lib/mockData";

export interface NetworkConfig {
  chainId: number;
  hexChainId: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532", 10);
const TARGET_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";
const TARGET_EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || "https://sepolia.basescan.org";

export const SUPPORTED_NETWORK: NetworkConfig = {
  chainId: TARGET_CHAIN_ID,
  hexChainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
  name: TARGET_CHAIN_ID === 84532 ? "Base Sepolia L2" : "Arbitrum Sepolia L2",
  rpcUrl: TARGET_RPC_URL,
  blockExplorer: TARGET_EXPLORER,
};

interface WalletContextType {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  currentStakeholder: StakeholderProfile | null;
  chainId: number | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  network: NetworkConfig;
  isWrongNetwork: boolean;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  getSigner: () => Promise<ethers.Signer | null>;
  // Event listener hook for external listeners (e.g. AuthContext)
  onAccountChanged?: (callback: (newAddress: string | null) => void) => () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const accountChangeListeners = new Set<(newAddress: string | null) => void>();

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false);

  const notifyAccountChanged = useCallback((newAddr: string | null) => {
    accountChangeListeners.forEach((listener) => {
      try {
        listener(newAddr);
      } catch (err) {
        console.error("Error in account change listener:", err);
      }
    });
  }, []);

  const initProviderAndSigner = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return null;
    }

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(browserProvider);

      const net = await browserProvider.getNetwork();
      const currentChainId = Number(net.chainId);
      setChainId(currentChainId);
      setIsWrongNetwork(currentChainId !== SUPPORTED_NETWORK.chainId);

      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        const currentSigner = await browserProvider.getSigner();
        const userAddr = (await currentSigner.getAddress()).toLowerCase();
        setSigner(currentSigner);
        setAddress(userAddr);
        setIsConnected(true);
        return { browserProvider, currentSigner, userAddr, currentChainId };
      }
    } catch (err) {
      console.warn("[WalletContext] Failed to initialize provider:", err);
    }
    return null;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initProviderAndSigner();
  }, [initProviderAndSigner]);

  // Handle Ethereum events (accountsChanged, chainChanged)
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setSigner(null);
        setIsConnected(false);
        notifyAccountChanged(null);
      } else {
        const newAddress = accounts[0].toLowerCase();
        setAddress(newAddress);
        setIsConnected(true);
        try {
          const browserProvider = new ethers.BrowserProvider(ethereum);
          const newSigner = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(newSigner);
        } catch (e) {
          console.error("Error updating signer on account switch:", e);
        }
        notifyAccountChanged(newAddress);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      setIsWrongNetwork(newChainId !== SUPPORTED_NETWORK.chainId);
      // Reload provider on chain change per MetaMask recommendation
      initProviderAndSigner();
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [initProviderAndSigner, notifyAccountChanged]);

  const connectWallet = async (): Promise<string | null> => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("No Ethereum wallet found. Please install MetaMask to connect.");
      return null;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const browserProvider = new ethers.BrowserProvider(ethereum);
      setProvider(browserProvider);

      await ethereum.request({ method: "eth_requestAccounts" });
      const currentSigner = await browserProvider.getSigner();
      const userAddr = (await currentSigner.getAddress()).toLowerCase();

      const net = await browserProvider.getNetwork();
      const currentChainId = Number(net.chainId);

      setSigner(currentSigner);
      setAddress(userAddr);
      setChainId(currentChainId);
      setIsConnected(true);
      setIsWrongNetwork(currentChainId !== SUPPORTED_NETWORK.chainId);

      return userAddr;
    } catch (err: any) {
      console.error("[WalletContext] Connection failed:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
    notifyAccountChanged(null);
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SUPPORTED_NETWORK.hexChainId }],
      });
      setIsWrongNetwork(false);
    } catch (switchError: any) {
      // Error 4902 indicates chain hasn't been added yet
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SUPPORTED_NETWORK.hexChainId,
                chainName: SUPPORTED_NETWORK.name,
                rpcUrls: [SUPPORTED_NETWORK.rpcUrl],
                blockExplorerUrls: [SUPPORTED_NETWORK.blockExplorer],
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
          setIsWrongNetwork(false);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    }
  };

  const getSigner = async (): Promise<ethers.Signer | null> => {
    if (signer) return signer;
    if (provider) {
      try {
        const s = await provider.getSigner();
        setSigner(s);
        return s;
      } catch {
        return null;
      }
    }
    return null;
  };

  const onAccountChanged = (callback: (newAddress: string | null) => void) => {
    accountChangeListeners.add(callback);
    return () => {
      accountChangeListeners.delete(callback);
    };
  };

  const currentStakeholder: StakeholderProfile | null = address
    ? DEMO_STAKEHOLDERS.find((s) => s.address.toLowerCase() === address.toLowerCase()) || {
        id: address,
        address: address,
        role: "UNREGISTERED",
        roleName: "Unregistered",
        name: "Stakeholder Account",
        organization: "Decentralized Entity",
        licenseNumber: "N/A",
        location: "Global",
        verified: false,
        avatarColor: "#6B7280",
      }
    : null;

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        address,
        currentStakeholder,
        chainId,
        signer,
        provider,
        network: SUPPORTED_NETWORK,
        isWrongNetwork,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        getSigner,
        onAccountChanged,
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
