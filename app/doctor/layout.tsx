import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";
import RoleGuard from "@/components/shared/RoleGuard";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="DOCTOR_ROLE">
      <InternalLayout>{children}</InternalLayout>
    </RoleGuard>
  );
}
