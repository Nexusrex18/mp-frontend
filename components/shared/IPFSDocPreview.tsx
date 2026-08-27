"use client";

import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileCheck2,
} from "lucide-react";
import { IPFSDocument } from "@/lib/types";
import { COLORS } from "@/lib/constants";

interface IPFSDocPreviewProps {
  documents: IPFSDocument[];
  title?: string;
}

export default function IPFSDocPreview({
  documents,
  title = "Decentralized IPFS Documents & Lab Certificates",
}: IPFSDocPreviewProps) {
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  const handleCopy = (cid: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(cid);
      setCopiedCid(cid);
      setTimeout(() => setCopiedCid(null), 2000);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="p-5 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-gray-200">
        No cryptographic laboratory documents attached to this batch.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
            <FileCheck2 size={14} className="text-indigo-600" />
            <span>{title}</span>
          </h4>
          <span className="text-[11px] text-gray-400 font-mono">
            IPFS Pinned • Immutably Sealed
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {documents.map((doc) => (
          <div
            key={doc.id || doc.cid}
            className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-indigo-300 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-700 shrink-0"
                    style={{ backgroundColor: "rgba(62, 54, 176, 0.08)" }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-gray-900 truncate">
                      {doc.name}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.type}</span>
                    </div>
                  </div>
                </div>

                {doc.verified && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 shrink-0"
                    title="Cryptographically signed by manufacturer"
                  >
                    <ShieldCheck size={11} />
                    Verified
                  </span>
                )}
              </div>

              {/* IPFS CID */}
              <div className="mt-3 bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-between gap-2 text-[11px] font-mono text-gray-600 overflow-hidden">
                <span className="truncate flex-1 min-w-0">ipfs://{doc.cid}</span>
                <button
                  onClick={() => handleCopy(doc.cid)}
                  className="text-gray-400 hover:text-gray-700 p-1 transition-colors shrink-0"
                  title="Copy IPFS CID"
                >
                  {copiedCid === doc.cid ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-400">
                By {doc.uploaderRole}
              </span>
              <a
                href={`https://ipfs.io/ipfs/${doc.cid}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
              >
                <span>View IPFS Gateway</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
