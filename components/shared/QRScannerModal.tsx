"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  X,
  Upload,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { getStoredBatches, getStoredPrescriptions } from "@/lib/mockData";
import { qrApi } from "@/lib/api/qr";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedValue: string) => void;
  title?: string;
  subtitle?: string;
  expectedType?: "batch" | "prescription" | "any";
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan QR Code",
  subtitle = "Align the physical packaging or digital prescription QR code within the frame",
  expectedType = "any",
}: QRScannerModalProps) {
  const [manualInput, setManualInput] = useState("");
  const [activeTab, setActiveTab] = useState<"camera" | "presets" | "manual">(
    "camera"
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const batches = getStoredBatches();
  const prescriptions = getStoredPrescriptions();

  // Handle live webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen && activeTab === "camera") {
      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
      ) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((mediaStream) => {
            stream = mediaStream;
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
              videoRef.current.play().catch(() => {});
              setIsCameraActive(true);
            }
          })
          .catch(() => {
            setIsCameraActive(false);
          });
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSelectValue = async (val: string) => {
    try {
      const decoded = await qrApi.decodeQr(val);
      const targetId = decoded.batchId || decoded.targetId || decoded.prescriptionId || val;
      onScanSuccess(targetId);
    } catch {
      onScanSuccess(val);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: COLORS.indigo }}
            >
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 p-1 rounded-2xl my-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "camera"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Camera size={14} />
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "presets"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Sparkles size={14} className="text-pink-500" />
            <span>Demo Presets</span>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Search size={14} />
            <span>Manual Input</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-[280px]">
          {activeTab === "camera" && (
            <div className="flex flex-col items-center justify-center">
              {/* Viewfinder box */}
              <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500 shadow-inner flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <Camera size={44} className="mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-xs">Camera feed simulator active</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      (Click below to simulate instant QR decode)
                    </p>
                  </div>
                )}

                {/* Laser scan line overlay */}
                <div className="mt-scanline" />

                {/* Corner reticles */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-pink-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-pink-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-pink-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-pink-500 rounded-br-lg" />
              </div>

              {/* Instant Test Scan Shortcut inside Camera tab */}
              <div className="mt-4 w-full text-center">
                <button
                  onClick={() =>
                    handleSelectValue(
                      expectedType === "prescription"
                        ? prescriptions[0].prescriptionHash
                        : batches[0].id
                    )
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-pink-500" />
                  <span>Simulate Instant Camera Read ({expectedType === "prescription" ? "Prescription QR" : "Sample Batch Box"})</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "presets" && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Select a registered on-chain target:
              </div>

              {(expectedType === "any" || expectedType === "batch") && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50/70 px-2 py-1 rounded">
                    Sample Pharmaceutical Batches:
                  </div>
                  {batches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectValue(b.id)}
                      className="w-full p-3 rounded-2xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-indigo-900">
                          {b.productName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{b.id}</span>
                          <span>•</span>
                          <span
                            className={
                              b.dispensingType === "OTC"
                                ? "text-emerald-600 font-bold"
                                : "text-purple-600 font-bold"
                            }
                          >
                            {b.dispensingType}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {(expectedType === "any" || expectedType === "prescription") && (
                <div className="space-y-2 mt-3">
                  <div className="text-[11px] font-bold text-purple-900 bg-purple-50/70 px-2 py-1 rounded">
                    Sample Doctor Prescriptions:
                  </div>
                  {prescriptions.map((rx) => (
                    <button
                      key={rx.id}
                      onClick={() => handleSelectValue(rx.prescriptionHash)}
                      className="w-full p-3 rounded-2xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50/30 text-left transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 group-hover:text-purple-900">
                          {rx.drugName} ({rx.patientIdentifier})
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{rx.id}</span>
                          <span>•</span>
                          <span>Status: {rx.status}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                        Select →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Enter Batch ID, QR Payload, or Prescription Hash:
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. BAT-2026-0089 or 0xe7f9a2b..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                disabled={!manualInput.trim()}
                onClick={() => handleSelectValue(manualInput.trim())}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: COLORS.indigo }}
              >
                Verify & Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
