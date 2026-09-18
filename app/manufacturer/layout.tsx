import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";
import RoleGuard from "@/components/shared/RoleGuard";

export default function ManufacturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="MANUFACTURER_ROLE">
      <InternalLayout>{children}</InternalLayout>
    </RoleGuard>
  );
}
