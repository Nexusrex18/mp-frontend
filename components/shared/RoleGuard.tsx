"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";
import { Loader2, ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  role: Role | Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const router = useRouter();
  const { role: userRole, isAuthenticated, isLoading } = useAuth();

  const requiredRoles = Array.isArray(role) ? role : [role];
  const hasAccess = isAuthenticated && requiredRoles.includes(userRole);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/connect");
    } else if (!hasAccess) {
      router.push("/unauthorized");
    }
  }, [isLoading, isAuthenticated, hasAccess, router]);

  // Prevent flash redirect during session hydration
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-gray-500">Verifying authorized stakeholder session...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <ShieldAlert className="w-8 h-8 text-rose-500" />
        <p className="text-xs font-semibold text-gray-600">Access Restricted. Redirecting...</p>
      </div>
    );
  }

  return <>{children}</>;
}
