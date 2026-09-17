"use client";

import { useState } from "react";
import {
  Search,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import StatusBadge from "@/components/shared/StatusBadge";
import { type BatchStatus, type CustodyEvent } from "@/lib/types";
import CustodyTimeline from "@/components/shared/CustodyTimeline";
import { getStoredBatches } from "@/lib/mockData";
import QRScannerModal from "@/components/shared/QRScannerModal";

/* ---------------------------------------------------------------
   Patient Verification Page — /verify
   ❌ No wallet, no gas, no tx hash, no "smart contract"
   ❌ No blockchain jargon anywhere in the copy
   
   Flow: Scan QR / enter Batch ID → read-only query →
         Found? → check status → show result card
----------------------------------------------------------------*/

/* ---------- Mock data (will be replaced by chain reads) ---------- */

interface MockBatch {
  id: string;
  product: string;
  dosage: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  status: BatchStatus;
  timeline: CustodyEvent[];
}

const MOCK_BATCHES: Record<string, MockBatch> = {
  "A19-0442": {
    id: "A19-0442",
    product: "Amoxicillin",
    dosage: "500mg",
    manufacturer: "PharmaCorp India Pvt. Ltd.",
    mfgDate: "04 Feb 2026",
    expDate: "03 Feb 2028",
    status: "Valid",
    timeline: [
      {
        id: "ev1",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "PharmaCorp India Pvt. Ltd.",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 100,
        location: "Mumbai, India",
        timestamp: "2026-02-04T10:00:00Z",
      },
      {
        id: "ev2",
        stage: "ReceivedByDistributor",
        actorRole: "Distributor",
        actorName: "MedLogistics Global",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 101,
        location: "Delhi, India",
        timestamp: "2026-02-12T14:30:00Z",
      },
      {
        id: "ev3",
        stage: "ReceivedByPharmacy",
        actorRole: "Pharmacy",
        actorName: "HealthFirst Pharmacy",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 102,
        location: "Bangalore, India",
        timestamp: "2026-02-18T09:15:00Z",
      },
    ],
  },
  "B22-1187": {
    id: "B22-1187",
    product: "Paracetamol",
    dosage: "650mg",
    manufacturer: "GenMed Labs",
    mfgDate: "15 Jan 2024",
    expDate: "14 Jan 2026",
    status: "Expired",
    timeline: [
      {
        id: "ev4",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "GenMed Labs",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 200,
        location: "Hyderabad, India",
        timestamp: "2024-01-15T08:00:00Z",
      },
      {
        id: "ev5",
        stage: "ReceivedByDistributor",
        actorRole: "Distributor",
        actorName: "FastPharma Distributors",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 201,
        location: "Chennai, India",
        timestamp: "2024-01-22T11:20:00Z",
      },
      {
        id: "ev6",
        stage: "ReceivedByPharmacy",
        actorRole: "Pharmacy",
        actorName: "CityMed Pharmacy",
        actorAddress: "0x...",
        txHash: "0x...",
        blockNumber: 202,
        location: "Pune, India",
        timestamp: "2024-02-01T16:45:00Z",
      },
    ],
  },
  "C05-FAKE": {
    id: "C05-FAKE",
    product: "Ciprofloxacin",
    dosage: "250mg",
    manufacturer: "Unknown",
    mfgDate: "Unknown",
    expDate: "Unknown",
    status: "Counterfeit",
    timeline: [],
  },
};

/* ---------- Page component ---------- */

type VerifyState = "idle" | "loading" | "found" | "not-found";

export default function VerifyPage() {
  const [batchInput, setBatchInput] = useState("");
  const [state, setState] = useState<VerifyState>("idle");
  const [result, setResult] = useState<MockBatch | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const executeLookup = (searchTerm: string) => {
    const trimmed = searchTerm.trim().toUpperCase();
    if (!trimmed) return;

    setState("loading");

    setTimeout(() => {
      // 1. Check dynamic stored batches (created by manufacturer or updated across supply chain)
      const stored = getStoredBatches();
      const foundStored = stored.find(
        (b) =>
          b.id.toUpperCase() === trimmed ||
          b.batchNumber.toUpperCase() === trimmed ||
          (b.qrPayload && b.qrPayload.toUpperCase().includes(trimmed))
      );

      if (foundStored) {
        setResult({
          id: foundStored.id,
          product: foundStored.productName,
          dosage: foundStored.dosage,
          manufacturer: foundStored.manufacturerName,
          mfgDate: foundStored.mfgDate,
          expDate: foundStored.expDate,
          status: foundStored.status,
          timeline: foundStored.custodyTimeline,
        });
        setState("found");
        return;
      }

      // 2. Fallback to preset mock batches
      const foundMock = MOCK_BATCHES[trimmed];
      if (foundMock) {
        setResult(foundMock);
        setState("found");
        return;
      }

      // 3. Not found
      setResult(null);
      setState("not-found");
    }, 800);
  };

  const handleVerify = () => {
    executeLookup(batchInput);
  };

  const handleScanSuccess = (decodedVal: string) => {
    let cleanId = decodedVal.trim();
    if (cleanId.startsWith("MEDTRACE:")) {
      const parts = cleanId.split(":");
      cleanId = parts[1] || cleanId;
    }
    setBatchInput(cleanId);
    executeLookup(cleanId);
  };

  const handleReset = () => {
    setBatchInput("");
    setState("idle");
    setResult(null);
  };

  return (
    <div style={{ minHeight: "80vh" }}>
      {/* Hero / Input Section */}
      <section
        style={{
          padding: "64px 24px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(800px 300px at 50% -20%, ${COLORS.lavender}66 0%, transparent 70%)`,
          }}
        />

        <div
          style={{
            maxWidth: 560,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            className="mt-mono mt-text-indigo"
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Medicine Verification
          </div>

          <h1
            className="mt-display"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Check if your medicine is{" "}
            <span className="mt-text-magenta" style={{ fontStyle: "italic" }}>
              genuine
            </span>
          </h1>

          <p
            className="mt-text-muted"
            style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}
          >
            Scan the QR code on your medicine packaging, or type the batch
            number printed on the box. No app or account required.
          </p>

          {/* Input bar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.white,
                border: "1.5px solid rgba(62,54,176,0.2)",
                borderRadius: 14,
                padding: "12px 16px",
                transition: "border-color 0.15s",
              }}
            >
              <Search size={18} color="rgba(17,17,17,0.35)" />
              <input
                type="text"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Enter batch number (e.g. A19-0442)"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 15,
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={state === "loading"}
              className="mt-btn-primary"
              style={{
                padding: "12px 22px",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: state === "loading" ? "wait" : "pointer",
                opacity: state === "loading" ? 0.7 : 1,
              }}
            >
              Verify
            </button>
          </div>

          {/* QR scan button */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="mt-text-indigo"
              style={{
                background: "none",
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              <QrCode size={16} />
              <span>Scan medicine packaging QR code with camera</span>
            </button>
          </div>

          {/* Demo hint */}
          <div
            className="mt-mono"
            style={{
              fontSize: 11,
              marginTop: 20,
              color: "rgba(17,17,17,0.35)",
            }}
          >
            Try: A19-0442 (authentic) · B22-1187 (expired) · C05-FAKE
            (suspicious)
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section style={{ padding: "0 24px 64px", maxWidth: 640, margin: "0 auto" }}>
        {/* Loading */}
        {state === "loading" && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: `3px solid ${COLORS.lavender}`,
                borderTopColor: COLORS.indigo,
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p className="mt-text-muted" style={{ fontSize: 15 }}>
              Checking the registry…
            </p>
          </div>
        )}

        {/* Not Found */}
        {state === "not-found" && (
          <div
            style={{
              background: "rgba(246,32,136,0.06)",
              border: "1.5px dashed rgba(246,32,136,0.3)",
              borderRadius: 20,
              padding: "36px 28px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "rgba(246,32,136,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <XCircle size={24} color={COLORS.magenta} />
            </div>
            <h2
              className="mt-display"
              style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}
            >
              Medicine not found
            </h2>
            <p
              className="mt-text-muted"
              style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}
            >
              The batch number &quot;{batchInput.trim().toUpperCase()}&quot; is not
              registered in our system. This could mean the medicine was not
              produced by a verified manufacturer.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <a
                href="/verify/report"
                className="mt-btn-primary inline-flex items-center"
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  gap: 6,
                }}
              >
                <AlertTriangle size={15} /> Report This
              </a>
              <button
                onClick={handleReset}
                className="mt-btn-secondary"
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Try Another
              </button>
            </div>
          </div>
        )}

        {/* Found — Result Card */}
        {state === "found" && result && (
          <div
            className="mt-seal-card"
            style={{
              padding: 0,
              overflow: "hidden",
            }}
          >
            {/* Status Header */}
            <div
              style={{
                padding: "24px 28px 20px",
                background:
                  result.status === "Valid"
                    ? "rgba(185,221,223,0.15)"
                    : result.status === "Expired"
                      ? "rgba(17,17,17,0.03)"
                      : "rgba(246,32,136,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  className="mt-mono mt-text-muted"
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  BATCH #{result.id}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {result.product} {result.dosage}
                </h2>
              </div>
              <StatusBadge status={result.status} patientFacing={true} />
            </div>

            <div className="mt-perforation" />

            {/* Details Grid */}
            <div style={{ padding: "20px 28px" }}>
              <div
                className="grid grid-cols-2"
                style={{ gap: 16, marginBottom: 24 }}
              >
                <div>
                  <div
                    className="mt-text-muted"
                    style={{ fontSize: 11, marginBottom: 2 }}
                  >
                    Manufacturer
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {result.manufacturer}
                  </div>
                </div>
                <div>
                  <div
                    className="mt-text-muted"
                    style={{ fontSize: 11, marginBottom: 2 }}
                  >
                    Manufactured
                  </div>
                  <div className="mt-mono" style={{ fontSize: 13, fontWeight: 500 }}>
                    {result.mfgDate}
                  </div>
                </div>
                <div>
                  <div
                    className="mt-text-muted"
                    style={{ fontSize: 11, marginBottom: 2 }}
                  >
                    Expires
                  </div>
                  <div className="mt-mono" style={{ fontSize: 13, fontWeight: 500 }}>
                    {result.expDate}
                  </div>
                </div>
                <div>
                  <div
                    className="mt-text-muted"
                    style={{ fontSize: 11, marginBottom: 2 }}
                  >
                    Custody Transfers
                  </div>
                  <div className="mt-mono" style={{ fontSize: 13, fontWeight: 500 }}>
                    {result.timeline.length} of {result.timeline.length}
                  </div>
                </div>
              </div>

              {/* Custody Timeline (simplified — no tx hashes, no jargon) */}
              {result.timeline.length > 0 && (
                <>
                  <div className="mt-perforation" style={{ marginBottom: 20 }} />
                  <div
                    className="mt-mono mt-text-muted"
                    style={{
                      fontSize: 11,
                      letterSpacing: 1,
                      marginBottom: 16,
                      textTransform: "uppercase",
                    }}
                  >
                    Supply Chain Journey
                  </div>
                  <CustodyTimeline
                    events={result.timeline}
                    mode="simplified"
                  />
                </>
              )}

              {/* Verification result banner */}
              <div style={{ marginTop: 24 }}>
                {result.status === "Valid" && (
                  <div
                    className="flex items-center justify-center"
                    style={{
                      background: COLORS.indigo,
                      color: COLORS.white,
                      borderRadius: 12,
                      padding: "14px 0",
                      fontWeight: 700,
                      fontSize: 14,
                      gap: 8,
                    }}
                  >
                    <ShieldCheck size={18} /> This medicine is verified and
                    authentic
                  </div>
                )}

                {(result.status === "Expired" ||
                  result.status === "Recalled" ||
                  result.status === "Counterfeit") && (
                  <div style={{ textAlign: "center" }}>
                    <a
                      href="/verify/report"
                      className="mt-btn-primary inline-flex items-center"
                      style={{
                        padding: "12px 24px",
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: "none",
                        gap: 6,
                      }}
                    >
                      <AlertTriangle size={15} /> Report an Issue
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: try another */}
            <div
              style={{
                borderTop: "1px solid rgba(17,17,17,0.06)",
                padding: "14px 28px",
                textAlign: "center",
              }}
            >
              <button
                onClick={handleReset}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.indigo,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Verify another medicine
              </button>
            </div>
          </div>
        )}
      </section>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Scan Medicine Box"
        subtitle="Align the QR code on the packaging within the viewfinder"
        expectedType="batch"
      />
    </div>
  );
}
