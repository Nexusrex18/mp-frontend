import React from "react";
import InternalLayout from "@/components/shared/InternalLayout";

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InternalLayout>{children}</InternalLayout>;
}
