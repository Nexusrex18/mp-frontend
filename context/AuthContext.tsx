"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import { useWallet, SUPPORTED_NETWORK } from "./WalletContext";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { setOnUnauthorizedCallback } from "@/lib/api/client";
import { OrgType, UserProfileDto, AuthVerifyResponseDto } from "@/lib/api/types";
import { Role, RoleName } from "@/lib/types";

export interface AuthContextType {
  user: UserProfileDto | null;
  role: Role;
  roleName: RoleName;
  organization: { id: string; name: string; type: OrgType } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRegistered: boolean;
  dashboardPath: string;
  loginWithSiwe: (signer: ethers.Signer, walletAddress: string) => Promise<AuthVerifyResponseDto>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (requiredRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapOrgTypeToRole(orgType?: OrgType | null): Role {
  switch (orgType) {
    case "ADMIN":
      return "ADMIN_ROLE";
    case "MANUFACTURER":
      return "MANUFACTURER_ROLE";
    case "DISTRIBUTOR":
      return "DISTRIBUTOR_ROLE";
    case "PHARMACY":
      return "PHARMACY_ROLE";
    case "DOCTOR":
      return "DOCTOR_ROLE";
    default:
      return "UNREGISTERED";
  }
}

export function mapRoleToRoleName(role: Role): RoleName {
  switch (role) {
    case "ADMIN_ROLE":
      return "Admin";
    case "MANUFACTURER_ROLE":
      return "Manufacturer";
    case "DISTRIBUTOR_ROLE":
      return "Distributor";
    case "PHARMACY_ROLE":
      return "Pharmacy";
    case "DOCTOR_ROLE":
      return "Doctor";
    default:
      return "Unregistered";
  }
}

export function getDashboardPath(role: Role): string {
  switch (role) {
    case "MANUFACTURER_ROLE":
      return "/manufacturer";
    case "DISTRIBUTOR_ROLE":
      return "/distributor";
    case "PHARMACY_ROLE":
      return "/pharmacy";
    case "DOCTOR_ROLE":
      return "/doctor";
    case "ADMIN_ROLE":
      return "/admin";
    case "UNREGISTERED":
    default:
      return "/unauthorized";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { address, disconnectWallet, onAccountChanged } = useWallet();

  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [role, setRole] = useState<Role>("UNREGISTERED");
  const [roleName, setRoleName] = useState<RoleName>("Unregistered");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const applyUserProfile = (profile: UserProfileDto | null) => {
    if (profile) {
      setUser(profile);
      const r = mapOrgTypeToRole(profile.role);
      setRole(r);
      setRoleName(mapRoleToRoleName(r));
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setRole("UNREGISTERED");
      setRoleName("Unregistered");
      setIsAuthenticated(false);
    }
  };

  const clearSession = useCallback(async (redirect = true) => {
    applyUserProfile(null);
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    if (redirect && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/(public)") && path !== "/" && !path.startsWith("/verify") && path !== "/auth/connect") {
        router.push("/auth/connect");
      }
    }
  }, [router]);

  // Hook global 401 handler
  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      clearSession(true);
    });
    return () => {
      setOnUnauthorizedCallback(null);
    };
  }, [clearSession]);

  // Hydrate session via /users/me on mount
  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await usersApi.getMe();
      if (profile && profile.walletAddress) {
        applyUserProfile(profile);
      } else {
        applyUserProfile(null);
      }
    } catch (err: any) {
      // 401 or network error -> unauthenticated
      applyUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Enforce session / wallet alignment: if MetaMask account changes and does not match active session, invalidate
  useEffect(() => {
    if (!onAccountChanged) return;

    const cleanup = onAccountChanged((newAddress) => {
      if (!newAddress) {
        // Disconnected
        if (isAuthenticated) {
          clearSession(true);
        }
      } else if (user && user.walletAddress) {
        if (newAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
          console.warn("[AuthContext] Connected wallet changed from", user.walletAddress, "to", newAddress, "- invalidating session");
          clearSession(true);
        }
      }
    });

    return cleanup;
  }, [onAccountChanged, user, isAuthenticated, clearSession]);

  const loginWithSiwe = async (signer: ethers.Signer, walletAddress: string): Promise<AuthVerifyResponseDto> => {
    setIsLoading(true);
    try {
      const checksumAddress = ethers.getAddress(walletAddress);
      const nonce = await authApi.getNonce(checksumAddress);

      const domain = typeof window !== "undefined" ? window.location.host : "localhost";
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

      const siweMessage = new SiweMessage({
        domain,
        address: checksumAddress,
        statement: "Sign in with Ethereum to MedTrace Pharmaceutical Supply Chain.",
        uri: origin,
        version: "1",
        chainId: SUPPORTED_NETWORK.chainId,
        nonce,
      });

      const messageToSign = siweMessage.prepareMessage();
      const signature = await signer.signMessage(messageToSign);

      const verifyRes = await authApi.verifySignature(messageToSign, signature);

      if (verifyRes.authenticated && verifyRes.isRegistered && verifyRes.user) {
        applyUserProfile(verifyRes.user);
      } else {
        applyUserProfile(null);
      }

      return verifyRes;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    disconnectWallet();
    await clearSession(true);
  };

  const hasRole = (requiredRole: Role): boolean => {
    return role === requiredRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        roleName,
        organization: user?.organization || null,
        isAuthenticated,
        isLoading,
        isRegistered: role !== "UNREGISTERED",
        dashboardPath: getDashboardPath(role),
        loginWithSiwe,
        logout,
        refreshProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
