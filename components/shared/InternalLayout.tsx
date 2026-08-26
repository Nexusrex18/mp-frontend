"use client";

import React, { ReactNode } from "react";
import NavbarRoleAware from "./NavbarRoleAware";
import Footer from "./Footer";

interface InternalLayoutProps {
  children: ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <NavbarRoleAware />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
