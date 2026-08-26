"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Layers,
  Truck,
  Building2,
  Stethoscope,
  PlusCircle,
  QrCode,
  Package,
  History,
  Inbox,
  ArrowRightLeft,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { useWallet } from "@/context/WalletContext";
import WalletConnectButton from "./WalletConnectButton";
import NetworkGuard from "./NetworkGuard";
import { COLORS } from "@/lib/constants";
import { Role } from "@/lib/types";

export default function NavbarRoleAware() {
  const pathname = usePathname();
  const { role, roleName } = useRole();
  const { isConnected, currentStakeholder } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Define nav links for each role
  const getNavLinks = (userRole: Role) => {
    switch (userRole) {
      case "MANUFACTURER_ROLE":
        return [
          { href: "/manufacturer", label: "Dashboard", icon: Layers },
          {
            href: "/manufacturer/batches/new",
            label: "+ Create Batch",
            icon: PlusCircle,
            highlight: true,
          },
          { href: "/manufacturer/batches", label: "My Batches", icon: Package },
        ];
      case "DISTRIBUTOR_ROLE":
        return [
          { href: "/distributor", label: "Dashboard", icon: Truck },
          { href: "/distributor/incoming", label: "Incoming", icon: Inbox },
          {
            href: "/distributor/scan",
            label: "Scan & Accept",
            icon: QrCode,
            highlight: true,
          },
          { href: "/distributor/inventory", label: "Inventory", icon: Package },
          {
            href: "/distributor/transfer",
            label: "Transfer",
            icon: ArrowRightLeft,
          },
        ];
      case "PHARMACY_ROLE":
        return [
          { href: "/pharmacy", label: "Dashboard", icon: Building2 },
          {
            href: "/pharmacy/dispense",
            label: "⚡ Dispense Medicine",
            icon: QrCode,
            highlight: true,
          },
          { href: "/pharmacy/incoming", label: "Incoming", icon: Inbox },
          { href: "/pharmacy/inventory", label: "Inventory", icon: Package },
          { href: "/pharmacy/history", label: "History", icon: History },
        ];
      case "DOCTOR_ROLE":
        return [
          { href: "/doctor", label: "Dashboard", icon: Stethoscope },
          {
            href: "/doctor/prescriptions/new",
            label: "+ Issue Prescription",
            icon: PlusCircle,
            highlight: true,
          },
          {
            href: "/doctor/prescriptions",
            label: "Prescription Registry",
            icon: History,
          },
        ];
      case "ADMIN_ROLE":
        return [
          { href: "/admin", label: "Dashboard", icon: ShieldCheck },
          { href: "/admin/stakeholders", label: "Stakeholders", icon: Building2 },
          { href: "/admin/batches", label: "Global Batches", icon: Package },
          { href: "/admin/audit", label: "Audit Trail", icon: History },
        ];
      default:
        return [
          { href: "/auth/connect", label: "Connect Wallet", icon: ShieldCheck },
        ];
    }
  };

  const navLinks = getNavLinks(role);

  return (
    <>
      <NetworkGuard />
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Internal Role Badge */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-decoration-none group"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-gray-900 tracking-tight text-base group-hover:text-indigo-700 transition-colors">
                    MedTrace
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 -mt-1 tracking-widest uppercase">
                    Supply Chain L2
                  </span>
                </div>
              </Link>

              {/* Connected Role Tag */}
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
                <span
                  className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(62, 54, 176, 0.1)",
                    color: COLORS.indigo,
                  }}
                >
                  {roleName} Workspace
                </span>
                {currentStakeholder && (
                  <span className="text-xs text-gray-500 font-medium truncate max-w-[180px]">
                    {currentStakeholder.organization}
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      link.highlight
                        ? isActive
                          ? "bg-pink-700 text-white shadow-md"
                          : "bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200"
                        : isActive
                        ? "bg-indigo-900 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Wallet Connect & Mobile Hamburger */}
            <div className="flex items-center gap-3">
              <WalletConnectButton />

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              Navigation Menu
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    link.highlight
                      ? "bg-pink-50 text-pink-700 border border-pink-200"
                      : isActive
                      ? "bg-indigo-900 text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
