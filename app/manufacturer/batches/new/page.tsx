"use client";

/* ---------------------------------------------------------------
   MedTrace — 4-Step Create Batch Wizard (/manufacturer/batches/new)
   Authoritative Dispensing Classification from catalog (OTC vs Rx),
   pins CoA quality documents to IPFS, and mints batch to Base Sepolia L2.
----------------------------------------------------------------*/

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CreateBatchWizard from "@/components/manufacturer/CreateBatchWizard";

export default function CreateBatchPage() {
  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/manufacturer/batches"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to My Batches</span>
        </Link>

        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Batch Registration Wizard
        </span>
      </div>

      <CreateBatchWizard />
    </div>
  );
}
