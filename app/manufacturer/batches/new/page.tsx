"use client";

/* ---------------------------------------------------------------
   MedTrace — 4-Step Create Batch Wizard (/manufacturer/batches/new)
   Explicitly captures Dispensing Classification (OTC vs Rx),
   generates IPFS CID for lab docs, and mints batch to Arbitrum Sepolia L2.
----------------------------------------------------------------*/

import React, { useState } from "react";
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
} from "lucide-react";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import {
  getStoredBatches,
  saveStoredBatches,
  generateTxHash,
} from "@/lib/mockData";
import { BatchRecord, DispensingType, IPFSDocument } from "@/lib/types";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

export default function CreateBatchPage() {
  const router = useRouter();
  const { address, currentStakeholder } = useWallet();
  const { executeTx } = useTxState();

  const [step, setStep] = useState<number>(1);
  const [createdBatch, setCreatedBatch] = useState<BatchRecord | null>(null);

  // Form State
  const [productName, setProductName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [ndcCode, setNdcCode] = useState("");
  const [dosage, setDosage] = useState("");
  const [formulation, setFormulation] = useState("Oral Capsule");
  const [storageCondition, setStorageCondition] = useState(
    "Store at 20°C to 25°C (68°F to 77°F)"
  );

  // Step 2: Dispensing Classification
  const [dispensingType, setDispensingType] = useState<DispensingType>("Prescription");

  // Step 3: Production & IPFS Docs
  const [batchNumber, setBatchNumber] = useState(
    `BAT-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [quantity, setQuantity] = useState<number>(1000);
  const [unit, setUnit] = useState("Bottles (100ct)");
  const [mfgDate, setMfgDate] = useState("2026-02-26");
  const [expDate, setExpDate] = useState("2028-02-26");
  const [docName, setDocName] = useState("Certificate_of_Analysis_Batch.pdf");
  const [mockCid, setMockCid] = useState(
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
  );

  const handleSubmitBatch = async () => {
    const newBatchId = `BAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const mintTx = generateTxHash();

    const newBatch: BatchRecord = {
      id: newBatchId,
      batchNumber,
      productName,
      genericName: genericName || productName,
      ndcCode: ndcCode || "0093-3109-01",
      dosage: dosage || "500mg",
      formulation,
      dispensingType,
      quantity,
      initialQuantity: quantity,
      unit,
      mfgDate,
      expDate,
      storageCondition,
      status: "Valid",
      currentCustodianRole: "Manufacturer",
      currentCustodianName: currentStakeholder?.name || "Apex BioPharma Inc.",
      currentCustodianAddress: address || "0x71C...4F9a",
      manufacturerName: currentStakeholder?.name || "Apex BioPharma Inc.",
      manufacturerAddress: address || "0x71C...4F9a",
      l2ContractAddress: "0x4b71829eFa30d4C919d85449A5881062bA7b0F81",
      mintTxHash: mintTx,
      ipfsDocs: [
        {
          id: `doc-${Date.now()}`,
          name: docName,
          type: "CertificateOfAnalysis",
          cid: mockCid,
          size: "1.2 MB",
          uploadedAt: new Date().toISOString(),
          uploaderRole: "Manufacturer",
          verified: true,
        },
      ],
      custodyTimeline: [
        {
          id: `cust-${Date.now()}`,
          timestamp: new Date().toISOString(),
          stage: "Manufactured",
          actorRole: "Manufacturer",
          actorName: currentStakeholder?.name || "Apex BioPharma Inc.",
          actorAddress: address || "0x71C...4F9a",
          txHash: mintTx,
          blockNumber: 1995400,
          location: "Bridgewater Facility Vault 1",
          notes: "Batch synthesized, lab certified, and registered on L2.",
          temperatureVerified: true,
        },
      ],
      qrPayload: `MEDTRACE:${newBatchId}:${mockCid}`,
    };

    const success = await executeTx({
      title: "Mint Pharmaceutical Batch",
      description: `Writing batch ${newBatchId} (${productName}) to Arbitrum Sepolia L2...`,
      onCommit: () => {
        const existing = getStoredBatches();
        saveStoredBatches([newBatch, ...existing]);
        setCreatedBatch(newBatch);
      },
    });
  };

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

      {!createdBatch ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl">
          {/* 4-Step Progress Indicator */}
          <div className="grid grid-cols-4 gap-2 mb-8 border-b border-gray-100 pb-6">
            {[
              { num: 1, label: "Product Info" },
              { num: 2, label: "Classification" },
              { num: 3, label: "Production & IPFS" },
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
                  className={`text-[11px] font-bold truncate ${
                    step === st.num ? "text-indigo-900" : "text-gray-400"
                  }`}
                >
                  {st.label}
                </div>
              </div>
            ))}
          </div>

          {/* STEP 1: Product Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-gray-900">
                Step 1: Product Formulation & Identity
              </h2>
              <p className="text-xs text-gray-500">
                Specify pharmaceutical substance, National Drug Code (NDC), and form.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Trade / Brand Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg or Ozempic 2mg"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Generic / Active Substance:
                  </label>
                  <input
                    type="text"
                    value={genericName}
                    onChange={(e) => setGenericName(e.target.value)}
                    placeholder="e.g. Amoxicillin Trihydrate"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    National Drug Code (NDC):
                  </label>
                  <input
                    type="text"
                    value={ndcCode}
                    onChange={(e) => setNdcCode(e.target.value)}
                    placeholder="e.g. 0093-3109-01"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Dosage Strength:
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500mg, 2mg/3mL"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Formulation:
                  </label>
                  <select
                    value={formulation}
                    onChange={(e) => setFormulation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Oral Capsule">Oral Capsule</option>
                    <option value="Coated Tablet">Coated Tablet</option>
                    <option value="Subcutaneous Solution">Subcutaneous Solution / Pen</option>
                    <option value="Oral Suspension">Oral Suspension (Liquid)</option>
                    <option value="Injectable Vial">Injectable Vial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Storage Condition & Cold Chain:
                </label>
                <input
                  type="text"
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                  placeholder="e.g. Store at 20°C to 25°C or Refrigerate 2°C to 8°C"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!productName.trim()}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  <span>Next: Dispensing Classification</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Dispensing Classification (OTC vs Rx) */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Step 2: Dispensing Regulatory Classification
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  This on-chain attribute locks whether the pharmacy must require a doctor prescription hash or allows over-the-counter dispensing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prescription Option */}
                <div
                  onClick={() => setDispensingType("Prescription")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    dispensingType === "Prescription"
                      ? "border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
                      Prescription (Rx)
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        dispensingType === "Prescription"
                          ? "border-purple-600 bg-purple-600 text-white text-xs"
                          : "border-gray-300"
                      }`}
                    >
                      {dispensingType === "Prescription" && "✓"}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mt-3">
                    Prescription Required
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Pharmacists cannot dispense this batch without scanning or verifying a valid, unfulfilled Doctor Prescription Hash on `Dispensing.sol`.
                  </p>
                </div>

                {/* OTC Option */}
                <div
                  onClick={() => setDispensingType("OTC")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    dispensingType === "OTC"
                      ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-100"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      OTC (Over-The-Counter)
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        dispensingType === "OTC"
                          ? "border-emerald-600 bg-emerald-600 text-white text-xs"
                          : "border-gray-300"
                      }`}
                    >
                      {dispensingType === "OTC" && "✓"}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mt-3">
                    Direct OTC Dispensing
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    General access medication. Pharmacy dispense interface will auto-render the quantity selector with no doctor prescription prompt.
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Architecture Rule:</strong> This classification is permanently immutabilized on the Arbitrum Sepolia smart contract. The pharmacist UI never manually selects OTC vs Rx.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  <span>Next: Dates & IPFS Upload</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Production & IPFS Docs */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Step 3: Serialization & IPFS Documents
                </h2>
                <p className="text-xs text-gray-500">
                  Attach laboratory certificates, test results, and batch sizing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Batch / Lot Number:
                  </label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Batch Quantity:
                    </label>
                    <input
                      type="number"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Unit Measure:
                    </label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Manufacturing Date:
                  </label>
                  <input
                    type="date"
                    value={mfgDate}
                    onChange={(e) => setMfgDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Expiry Date:
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* IPFS Upload Box */}
              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-4 bg-indigo-50/20 text-center">
                <FileCheck size={28} className="text-indigo-600 mx-auto mb-2" />
                <div className="text-xs font-bold text-gray-900">
                  Certificate of Analysis (COA) / Sterility Lab Document
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Simulated Pinning to IPFS Gateway (Pinata/Infura)
                </div>
                <div className="mt-2 text-xs font-mono bg-white px-3 py-1.5 rounded-xl border border-gray-200 inline-block text-gray-700">
                  CID: {mockCid}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  <span>Next: Review & Mint</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & On-Chain Mint */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Step 4: Review Specification & Mint to L2
                </h2>
                <p className="text-xs text-gray-500">
                  Verify payload before initiating the smart contract transaction.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product Name:</span>
                  <span className="font-bold text-gray-900">{productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Classification:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      dispensingType === "OTC"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {dispensingType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Batch Number:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {batchNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity & Unit:</span>
                  <span className="font-bold text-gray-900">
                    {quantity} {unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="font-mono text-gray-900">{expDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IPFS CID:</span>
                  <span className="font-mono text-gray-600 truncate max-w-[200px]">
                    {mockCid}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBatch}
                  className="px-8 py-3 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  style={{
                    backgroundColor: COLORS.magenta,
                    boxShadow: "0 6px 20px rgba(246, 32, 136, 0.4)",
                  }}
                >
                  <Sparkles size={16} />
                  <span>Sign & Mint to Arbitrum Sepolia L2</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SUCCESS SCREEN: Generated QR Code + Quick Next Steps */
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Batch Successfully Minted!
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              On-Chain Identifier: <strong className="text-indigo-700">{createdBatch.id}</strong>
            </p>
          </div>

          {/* QR Code Display for physical box attachment */}
          <QRCodeDisplay
            value={createdBatch.qrPayload || createdBatch.id}
            title={`${createdBatch.productName} — ${createdBatch.id}`}
            subtitle="Attach to physical shipment crate or packaging"
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href={`/manufacturer/batches/${createdBatch.id}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              View Batch Detail
            </Link>

            <Link
              href={`/manufacturer/batches/${createdBatch.id}/transfer`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <span>Transfer Custody to Distributor →</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
