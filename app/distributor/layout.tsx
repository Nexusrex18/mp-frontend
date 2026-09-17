import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";
import RoleGuard from "@/components/shared/RoleGuard";

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="DISTRIBUTOR_ROLE">
      <InternalLayout>{children}</InternalLayout>
    </RoleGuard>
  );
}
