import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InternalLayout>{children}</InternalLayout>;
}
