"use client";

/* ---------------------------------------------------------------
   MedTrace — Role Context & On-Chain Role Resolution
   Simulates AccessControl.sol getRole(address) lookup and routes
   internal users dynamically to their authorized dashboards.
----------------------------------------------------------------*/

import React, { createContext, useContext, ReactNode } from "react";
import { useWallet } from "./WalletContext";
import { Role, RoleName } from "@/lib/types";

interface RoleContextType {
  role: Role;
  roleName: RoleName;
  isAuthorized: boolean;
  dashboardPath: string;
  hasRole: (requiredRole: Role) => boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isConnected, currentStakeholder } = useWallet();

  const role: Role = isConnected && currentStakeholder ? currentStakeholder.role : "UNREGISTERED";
  const roleName: RoleName = isConnected && currentStakeholder ? currentStakeholder.roleName : "Unregistered";
  const isAuthorized = role !== "UNREGISTERED";

  const getDashboardPath = (userRole: Role): string => {
    switch (userRole) {
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
  };

  const hasRole = (requiredRole: Role): boolean => {
    return role === requiredRole;
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        roleName,
        isAuthorized,
        dashboardPath: getDashboardPath(role),
        hasRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
