"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./AuthContext";
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
  const { role, roleName, isRegistered, dashboardPath, hasRole } = useAuth();

  return (
    <RoleContext.Provider
      value={{
        role,
        roleName,
        isAuthorized: isRegistered,
        dashboardPath,
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
