"use client";

/* ---------------------------------------------------------------
   MedTrace — Issue New Prescription (/doctor/prescriptions/new)
   Doctor enters clinical Rx details -> stores private data in Postgres
   (NEVER IPFS — Invariant #4) -> registers hash on Prescription.sol
   -> outputs patient QR code.
----------------------------------------------------------------*/

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getStoredPrescriptions,
  saveStoredPrescriptions,
  generatePrescriptionHash,
} from "@/lib/mockData";
import { PrescriptionRecord } from "@/lib/types";
import { useTxState } from "@/context/TxStateContext";
import { useWallet } from "@/context/WalletContext";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { prescriptionsApi } from "@/lib/api/prescriptions";
import { parsePrescriptionError } from "@/lib/hooks/usePrescriptions";
import { productsApi } from "@/lib/api/products";
import { qrApi } from "@/lib/api/qr";
import { ProductDto, PreparedPrescriptionDto } from "@/lib/api/types";
import QRCodeDisplay from "@/components/shared/QRCodeDisplay";
import { COLORS } from "@/lib/constants";

interface SelectableProduct {
  id: string;
  name: string;
  dosage: string;
  code: string;
}

const DEFAULT_PRODUCTS: SelectableProduct[] = [
  {
    id: "0093-3109-01",
    name: "Amoxicillin 500mg",
    dosage: "500mg Capsule, 1 capsule 3x daily with meals for 10 days",
    code: "0093-3109-01",
  },
  {
    id: "0169-4130-12",
    name: "Ozempic 2mg/3mL Pen",
    dosage: "0.5mg injected subcutaneously once weekly",
    code: "0169-4130-12",
  },
  {
    id: "0071-0156-23",
    name: "Lipitor 20mg",
    dosage: "20mg Tablet, 1 tablet once daily at bedtime",
    code: "0071-0156-23",
  },
];

export default function NewPrescriptionPage() {
  const router = useRouter();
  const { address, currentStakeholder, isConnected } = useWallet();
  const { executeTx } = useTxState();

  const [products, setProducts] = useState<SelectableProduct[]>(DEFAULT_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>(DEFAULT_PRODUCTS[0].id);
  const [patientId, setPatientId] = useState(
    `PT-${Math.floor(1000 + Math.random() * 9000)}-X`
  );
  const [patientAge, setPatientAge] = useState<number>(45);
  const [patientGender, setPatientGender] = useState("Female");
  const [dosage, setDosage] = useState(DEFAULT_PRODUCTS[0].dosage);
  const [quantity, setQuantity] = useState<number>(30);
  const [refillsAllowed, setRefillsAllowed] = useState<number>(0);
  const [instructions, setInstructions] = useState(
    "Take complete course as prescribed. Report any adverse reactions immediately."
  );
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [issuedRx, setIssuedRx] = useState<PrescriptionRecord | null>(null);
  const [qrValue, setQrValue] = useState<string>("");
  const [createdPrep, setCreatedPrep] = useState<PreparedPrescriptionDto | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const apiProducts = await productsApi.getProducts();
        if (apiProducts && apiProducts.length > 0) {
          const mapped: SelectableProduct[] = apiProducts.map((p) => ({
            id: p.id,
            name: p.name,
            dosage: p.dosage || "As directed",
            code: p.regulatoryClassification || p.id.slice(0, 8),
          }));
          setProducts(mapped);
          setSelectedProductId(mapped[0].id);
          setDosage(mapped[0].dosage);
        }
      } catch {
        // Keep DEFAULT_PRODUCTS
      }
    }
    loadCatalog();
  }, []);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setDosage(prod.dosage);
    }
  };

  const txFlow = useTxFlow({
    prepare: async () => {
      setInlineError(null);
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      try {
        const prep = await prescriptionsApi.create({
          patientRef: patientId,
          productId: selectedProduct.id,
          dosage,
          quantity,
          expiry: expiry.toISOString(),
        });
        setCreatedPrep(prep);
        return prep;
      } catch (err: any) {
        const parsed = parsePrescriptionError(err);
        setInlineError(parsed.message);
        throw err;
      }
    },
    title: "Issue Cryptographic Prescription",
    description: `Registering prescription for ${selectedProduct.name} on Prescription.sol...`,
    onSuccess: async ({ txHash }) => {
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const rxId =
        createdPrep?.prescription?.id ||
        `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const rxHash =
        createdPrep?.prescription?.prescriptionHash ||
        generatePrescriptionHash(
          patientId,
          selectedProduct.code,
          address || "0x14E...C309",
          now.toISOString()
        );

      let finalQr = rxHash;
      if (createdPrep?.prescription?.id) {
        try {
          const qrRes = await qrApi.generateQr({
            prescriptionId: createdPrep.prescription.id,
          });
          if (qrRes?.payload) {
            finalQr = qrRes.payload;
          }
        } catch {
          // Fallback to rxHash
        }
      }

      const newRx: PrescriptionRecord = {
        id: rxId,
        prescriptionHash: rxHash,
        patientIdentifier: patientId,
        patientAge,
        patientGender,
        drugCode: selectedProduct.code,
        drugName: selectedProduct.name,
        dosage,
        quantity,
        refillsAllowed,
        refillsRemaining: refillsAllowed,
        issuedAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
        status: "Pending",
        doctorName: currentStakeholder?.name || "Dr. Evelyn Reed, MD",
        doctorAddress: address || createdPrep?.prescription?.doctorWallet || "0x14E...C309",
        doctorLicense: currentStakeholder?.licenseNumber || "MED-NY-492019",
        instructions,
      };

      const existing = getStoredPrescriptions();
      saveStoredPrescriptions([newRx, ...existing]);
      window.dispatchEvent(new Event("medtrace_data_updated"));

      setIssuedRx(newRx);
      setQrValue(finalQr);
    },
    onError: (err) => {
      const parsed = parsePrescriptionError(err);
      setInlineError(parsed.message);
    },
  });

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (isConnected) {
      await txFlow.execute();
    } else {
      // Mock / Offline execution
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const fallbackRxId = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const rxHash = generatePrescriptionHash(
        patientId,
        selectedProduct.code,
        address || "0x14E...C309",
        now.toISOString()
      );

      const newRx: PrescriptionRecord = {
        id: fallbackRxId,
        prescriptionHash: rxHash,
        patientIdentifier: patientId,
        patientAge,
        patientGender,
        drugCode: selectedProduct.code,
        drugName: selectedProduct.name,
        dosage,
        quantity,
        refillsAllowed,
        refillsRemaining: refillsAllowed,
        issuedAt: now.toISOString(),
        expiresAt: expiry.toISOString(),
        status: "Pending",
        doctorName: currentStakeholder?.name || "Dr. Evelyn Reed, MD",
        doctorAddress: address || "0x14E...C309",
        doctorLicense: currentStakeholder?.licenseNumber || "MED-NY-492019",
        instructions,
      };

      await executeTx({
        title: "Issue Cryptographic Prescription",
        description: `Registering prescription ${fallbackRxId} (${selectedProduct.name}) on Prescription.sol...`,
        onCommit: () => {
          const existing = getStoredPrescriptions();
          saveStoredPrescriptions([newRx, ...existing]);
          window.dispatchEvent(new Event("medtrace_data_updated"));
          setIssuedRx(newRx);
          setQrValue(rxHash);
        },
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <Link
        href="/doctor/prescriptions"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Prescription Registry</span>
      </Link>

      {!issuedRx ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: "#7C3AED" }}
              >
                <Stethoscope size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  Issue Digital Prescription (e-Rx)
                </h1>
                <p className="text-xs text-gray-500">
                  Stores private data in Postgres (Invariant #4) and registers hash on Prescription.sol
                </p>
              </div>
            </div>
          </div>

          {inlineError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">Prescription Error: </span>
                <span>{inlineError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleIssuePrescription} className="space-y-4">
            {/* Patient Anonymized Data */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Patient ID (Anonymized):
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Patient Age:
                </label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Gender:
                </label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Prescribed Drug Catalog */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Select Prescribed Medication:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
              >
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({prod.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Dosage & Administration Directions:
                </label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Units:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Clinical Notes / Warnings:
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={txFlow.isProcessing}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 ${
                txFlow.isProcessing
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:scale-105 active:scale-95"
              }`}
              style={{
                backgroundColor: COLORS.magenta,
                boxShadow: "0 8px 25px rgba(246, 32, 136, 0.4)",
              }}
            >
              <Sparkles size={18} />
              <span>
                {txFlow.isProcessing
                  ? "Signing & Registering on Arbitrum L2..."
                  : "Sign & Register Prescription on L2"}
              </span>
            </button>
          </form>
        </div>
      ) : (
        /* SUCCESS SCREEN: Output Prescription QR */
        <div className="bg-white rounded-3xl p-8 border border-purple-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Prescription Issued & Registered!
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Prescription Ref: <strong className="text-purple-800">{issuedRx.id}</strong>
            </p>
          </div>

          {/* QR Code for patient */}
          <QRCodeDisplay
            value={qrValue || issuedRx.prescriptionHash}
            title={`Prescription: ${issuedRx.drugName}`}
            subtitle={`Patient: ${issuedRx.patientIdentifier} • Valid 30 Days`}
          />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/doctor/prescriptions"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              View Prescription Registry
            </Link>

            <button
              onClick={() => {
                setIssuedRx(null);
                setPatientId(`PT-${Math.floor(1000 + Math.random() * 9000)}-X`);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:scale-105"
              style={{ backgroundColor: "#7C3AED" }}
            >
              + Issue Another Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
