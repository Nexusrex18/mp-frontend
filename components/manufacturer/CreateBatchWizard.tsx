"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Upload,
  QrCode,
  ShieldCheck,
  Pill,
  Sparkles,
  Info,
  ExternalLink,
  Printer,
  Download,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { productsApi } from "@/lib/api/products";
import { batchesApi } from "@/lib/api/batches";
import { ipfsApi } from "@/lib/api/ipfs";
import { qrApi } from "@/lib/api/qr";
import { ProductDto, BatchDetailDto } from "@/lib/api/types";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import TxStateBanner from "@/components/shared/TxStateBanner";
import { COLORS } from "@/lib/constants";

interface CreateBatchWizardProps {
  onSuccess?: (batch: any) => void;
}

export default function CreateBatchWizard({ onSuccess }: CreateBatchWizardProps) {
  const router = useRouter();
  const { address } = useWallet();

  const [step, setStep] = useState<number>(1);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Step 3 state: Dates, Qty, IPFS Docs
  const [quantity, setQuantity] = useState<number>(1000);
  const [unit, setUnit] = useState("Bottles (100ct)");
  const [mfgDate, setMfgDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDate, setExpDate] = useState(
    new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Success state
  const [registeredBatch, setRegisteredBatch] = useState<any | null>(null);
  const [qrPayload, setQrPayload] = useState<string>("");

  // Load products from backend catalog
  useEffect(() => {
    let mounted = true;
    productsApi
      .getProducts()
      .then((data) => {
        if (mounted) {
          setProducts(data || []);
          if (data && data.length > 0) {
            setSelectedProduct(data[0]);
          }
          setLoadingProducts(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingProducts(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle IPFS file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocFile(file);
    setUploadingDoc(true);
    setUploadError(null);

    try {
      const res = await ipfsApi.uploadDocument(file, "CERT");
      setIpfsCid(res.cid);
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload document to IPFS.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Transaction flow via useTxFlow hook
  const { state: txState, isProcessing, execute: executeBatchTx, error: txError } = useTxFlow({
    title: "Register Pharmaceutical Batch",
    description: `Minting batch for ${selectedProduct?.name || "Medicine"} on L2...`,
    prepare: async () => {
      if (!selectedProduct) {
        throw new Error("No product selected.");
      }
      return batchesApi.prepareBatch({
        productId: selectedProduct.id,
        quantity,
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        ipfsCid: ipfsCid || undefined,
      });
    },
    onSuccess: async ({ txHash, data }) => {
      // The QR must reference the indexed batch (never the tx hash). The indexer
      // status payload carries the on-chain batchId from BatchRegistered.
      let targetPayload = `MEDTRACE:TX:${txHash}`;
      const chainBatchId: string | undefined = data?.entity?.payload?.batchId;
      if (chainBatchId) {
        // The raw event can be visible a moment before the batches row is written.
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const qrRes = await qrApi.generateQr({ batchId: String(chainBatchId) });
            if (qrRes?.payload) {
              targetPayload = qrRes.payload;
              break;
            }
          } catch {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      const created = {
        id: `BATCH-${Date.now().toString().slice(-6)}`,
        txHash,
        productId: selectedProduct?.id,
        productName: selectedProduct?.name,
        dosage: selectedProduct?.dosage,
        dispensingType: selectedProduct?.dispensingType,
        quantity,
        mfgDate,
        expDate,
        ipfsCid,
        qrPayload: targetPayload,
      };

      setRegisteredBatch(created);
      setQrPayload(targetPayload);
      if (onSuccess) onSuccess(created);
    },
  });

  const handleNextStep = () => {
    if (step === 1 && !selectedProduct) return;
    if (step === 3) {
      if (!quantity || quantity <= 0) return;
      if (new Date(expDate) <= new Date(mfgDate)) return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // SUCCESS STEP (Registration Complete & Printable QR)
  if (registeredBatch) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Batch Successfully Registered on L2!
          </h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Your pharmaceutical batch is immutably indexed. Download or print the
            physical QR code to affix to product cartons.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center my-6">
          <QRCodeDisplay
            value={qrPayload}
            title={`${selectedProduct?.name} (${selectedProduct?.dosage})`}
            subtitle={`Batch Reference: ${registeredBatch.id}`}
            size={220}
          />
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
          <div className="font-bold text-indigo-950 flex items-center justify-between">
            <span>On-Chain Verification Parameters</span>
            <span className="font-mono text-[11px] text-indigo-600">{registeredBatch.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-gray-600">
            <div>Product: <strong className="text-gray-900">{registeredBatch.productName}</strong></div>
            <div>Classification: <strong className="text-gray-900">{registeredBatch.dispensingType}</strong></div>
            <div>Quantity: <strong className="text-gray-900">{registeredBatch.quantity} {unit}</strong></div>
            <div>Expires: <strong className="text-gray-900">{registeredBatch.expDate}</strong></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setRegisteredBatch(null);
              setStep(1);
            }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
          >
            Create Another Batch
          </button>

          <Link
            href="/manufacturer/batches"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
            style={{ backgroundColor: COLORS.indigo }}
          >
            Go to My Batches →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
      {/* 4-Step Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-6">
        {[
          { num: 1, label: "Product Selection" },
          { num: 2, label: "Classification" },
          { num: 3, label: "Dates & IPFS" },
          { num: 4, label: "Review & Mint" },
        ].map((st) => (
          <div key={st.num} className="text-center">
            <div
              className={`w-9 h-9 rounded-full mx-auto flex items-center justify-center font-extrabold text-xs mb-1.5 transition-all ${
                step === st.num
                  ? "bg-indigo-900 text-white ring-4 ring-indigo-100"
                  : step > st.num
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step > st.num ? "✓" : st.num}
            </div>
            <div
              className={`text-[11px] font-bold ${
                step === st.num ? "text-indigo-950" : "text-gray-400"
              }`}
            >
              {st.label}
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1: Product Selection from Catalog */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Select Pharmaceutical Product</h3>
            <p className="text-xs text-gray-500">
              Choose an approved formulation from your registered manufacturing catalog.
            </p>
          </div>

          {loadingProducts ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                        : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{p.name}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            p.dispensingType === "OTC"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {p.dispensingType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{p.dosage}</div>
                      <div className="text-[11px] text-gray-400 mt-1 font-mono">{p.regulatoryClassification}</div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-700">
                        <Check size={14} /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              disabled={!selectedProduct}
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white disabled:opacity-40 transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: COLORS.indigo }}
            >
              Continue to Classification →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Authoritative Dispensing Classification */}
      {step === 2 && selectedProduct && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Dispensing Classification</h3>
            <p className="text-xs text-gray-500">
              Authoritative regulatory tier derived from the product catalog. This rule is locked and enforces on-chain downstream dispensing constraints.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 text-white space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Authoritative Dispensing Tier
                </span>
                <h4 className="text-xl font-extrabold text-white mt-0.5">
                  {selectedProduct.dispensingType === "PRESCRIPTION"
                    ? "Prescription Only Medicine (Rx)"
                    : "Over-the-Counter (OTC)"}
                </h4>
              </div>

              <div
                className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs"
                style={{
                  backgroundColor:
                    selectedProduct.dispensingType === "PRESCRIPTION" ? "#7c3aed" : "#059669",
                  color: "#ffffff",
                }}
              >
                {selectedProduct.dispensingType}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Regulatory Schedule:</div>
              <div>{selectedProduct.regulatoryClassification}</div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-indigo-200 bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/40">
              <ShieldCheck size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Architectural Invariant #5:</strong> Dispensing classification is server-derived from the verified catalog. It cannot be altered during batch registration.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              ← Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: COLORS.indigo }}
            >
              Set Dates & Quality Docs →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Dates, Quantity & IPFS Upload */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Production Dates & Documents</h3>
            <p className="text-xs text-gray-500">
              Specify quantity, manufacturing & expiry timelines, and upload the Certificate of Analysis (CoA) to IPFS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Batch Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Packaging Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Manufacturing Date
              </label>
              <input
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* IPFS Upload Box */}
          <div className="p-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-indigo-600" />
                <span>Certificate of Analysis (IPFS Pin)</span>
              </span>
              {ipfsCid && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={12} /> Pinned
                </span>
              )}
            </div>

            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {uploadingDoc && (
              <div className="text-xs text-indigo-600 font-semibold animate-pulse">
                Uploading to IPFS via Pinata gateway...
              </div>
            )}

            {ipfsCid && (
              <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-[11px] font-mono text-gray-600 flex items-center justify-between">
                <span>CID: {ipfsCid}</span>
                <span className="text-emerald-600 font-bold">Ready</span>
              </div>
            )}

            {uploadError && (
              <div className="text-xs text-red-600 font-semibold">{uploadError}</div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
            >
              ← Back
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: COLORS.indigo }}
            >
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & On-Chain Mint */}
      {step === 4 && selectedProduct && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Review & Register on Chain</h3>
            <p className="text-xs text-gray-500">
              Confirm batch specifications. Submitting will prompt MetaMask to sign the transaction on Base Sepolia L2.
            </p>
          </div>

          <TxStateBanner />

          {txError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{txError}</span>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Selected Formulation:</span>
              <span className="font-bold text-gray-900">{selectedProduct.name} ({selectedProduct.dosage})</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Dispensing Classification:</span>
              <span className="font-bold text-indigo-700">{selectedProduct.dispensingType}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Batch Quantity:</span>
              <span className="font-bold text-gray-900">{quantity} {unit}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Manufacturing Date:</span>
              <span className="font-mono text-gray-900">{mfgDate}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Expiry Date:</span>
              <span className="font-mono text-gray-900">{expDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IPFS Quality Proof CID:</span>
              <span className="font-mono text-gray-900">{ipfsCid ? `${ipfsCid.slice(0, 16)}...` : "None attached"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handlePrevStep}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              ← Back
            </button>

            <button
              onClick={executeBatchTx}
              disabled={isProcessing}
              className="px-8 py-3 rounded-2xl font-extrabold text-xs text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: COLORS.magenta }}
            >
              <Sparkles size={15} />
              <span>{isProcessing ? "Processing Transaction…" : "Sign & Register on L2"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
