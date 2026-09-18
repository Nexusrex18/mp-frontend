import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";
import RoleGuard from "@/components/shared/RoleGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="ADMIN_ROLE">
      <InternalLayout>{children}</InternalLayout>
    </RoleGuard>
  );
}
