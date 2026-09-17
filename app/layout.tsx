import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "@/components/shared/ClientProviders";

export const metadata: Metadata = {
  title: "MedTrace — Blockchain-Enabled Pharmaceutical Supply Chain",
  description:
    "End-to-end pharmaceutical traceability, decentralized custody verification, and tamper-proof dispensing on Ethereum L2.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
