import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";
import RoleGuard from "@/components/shared/RoleGuard";

export default function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="PHARMACY_ROLE">
      <InternalLayout>{children}</InternalLayout>
    </RoleGuard>
  );
}
