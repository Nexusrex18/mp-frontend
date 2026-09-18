"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Upload,
  MapPin,
  FileText,
  CheckCircle,
  ArrowLeft,
  Mail,
  Clock,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { verificationApi } from "@/lib/api/verification";
import { ApiClientError } from "@/lib/api/client";

/* ---------------------------------------------------------------
   Report Issue Page — /verify/report
   ❌ No wallet required
   ❌ No blockchain jargon
   
   Reached from the ❌/⚠️ result states on /verify.
   Submits off-chain to a moderation queue surfaced in Admin → Alerts.
----------------------------------------------------------------*/

type FormState = "filling" | "submitting" | "submitted";

function ReportIssueContent() {
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>("filling");
  const [batchNumber, setBatchNumber] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number | null>(null);

  useEffect(() => {
    const qBatch = searchParams.get("batchId");
    if (qBatch && !batchNumber) {
      setBatchNumber(qBatch);
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setFormState("submitting");
    setErrorMessage(null);
    setRateLimitWait(null);

    try {
      const response = await verificationApi.submitReport({
        batchId: batchNumber.trim() || undefined,
        description: description.trim(),
        location: location.trim() || undefined,
        contactInfo: contactInfo.trim() || undefined,
      });

      setSubmittedReportId(response.reportId);
      setFormState("submitted");
    } catch (err: any) {
      setFormState("filling");
      if (err instanceof ApiClientError && err.statusCode === 429) {
        const seconds = err.retryAfter ?? 30;
        setRateLimitWait(seconds);
        setErrorMessage(`Too many reports submitted. Please wait ${seconds} seconds before trying again.`);
      } else {
        setErrorMessage(err?.message || "Failed to submit report. Please check your connection and try again.");
      }
    }
  };

  /* ---------- Success State ---------- */
  if (formState === "submitted") {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(185,221,223,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <CheckCircle size={30} color="#0a5c5f" />
          </div>

          <h1
            className="mt-display"
            style={{ fontSize: 24, fontWeight: 600, marginBottom: 10 }}
          >
            Report submitted
          </h1>

          {submittedReportId && (
            <div className="text-xs font-mono text-gray-500 mb-3">
              Reference #{submittedReportId.slice(0, 8)}
            </div>
          )}

          <p
            className="mt-text-muted"
            style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}
          >
            Thank you for helping keep medicines safe. Our regulatory and safety
            team will review your report and take the necessary action. You do not
            need to create an account or follow up.
          </p>

          <div
            style={{ display: "flex", gap: 10, justifyContent: "center" }}
          >
            <a
              href="/verify"
              className="mt-btn-primary inline-flex items-center"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                gap: 6,
              }}
            >
              Verify Another Medicine
            </a>
            <a
              href="/"
              className="mt-btn-secondary inline-flex items-center"
              style={{
                padding: "12px 22px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Form State ---------- */
  return (
    <div style={{ minHeight: "80vh" }}>
      {/* Header */}
      <section
        style={{
          padding: "48px 24px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(600px 250px at 50% -20%, rgba(246,32,136,0.08) 0%, transparent 70%)`,
          }}
        />

        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          <a
            href="/verify"
            className="mt-text-indigo inline-flex items-center"
            style={{
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              gap: 4,
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={15} /> Back to verification
          </a>

          <div
            className="mt-mono mt-text-magenta"
            style={{
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Safety Report
          </div>

          <h1
            className="mt-display"
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
              fontWeight: 600,
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Report a suspicious medicine
          </h1>

          <p
            className="mt-text-muted"
            style={{ fontSize: 15, lineHeight: 1.6 }}
          >
            If a medicine failed verification, packaging looked altered, or you
            suspect a counterfeit, let us know. No account required.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: "0 24px 64px", maxWidth: 520, margin: "0 auto" }}>
        <form
          onSubmit={handleSubmit}
          className="mt-card"
          style={{ padding: "32px 28px" }}
        >
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl flex items-start gap-3 text-xs"
              style={{
                backgroundColor: rateLimitWait ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.1)",
                border: rateLimitWait ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(239, 68, 68, 0.3)",
                color: rateLimitWait ? "#78350f" : "#991b1b",
              }}
            >
              {rateLimitWait ? <Clock size={16} className="shrink-0 text-amber-600 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 text-red-600 mt-0.5" />}
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Batch number */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Batch Number{" "}
              <span className="mt-text-muted" style={{ fontWeight: 400 }}>
                (if available)
              </span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.white,
                border: "1.5px solid rgba(62,54,176,0.15)",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <FileText size={16} color="rgba(17,17,17,0.3)" />
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. A19-0442"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Where did you purchase this?{" "}
              <span className="mt-text-muted" style={{ fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.white,
                border: "1.5px solid rgba(62,54,176,0.15)",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <MapPin size={16} color="rgba(17,17,17,0.3)" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Pharmacy name, city, or address"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              What seems wrong?{" "}
              <span className="mt-text-magenta">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your concern — e.g. packaging looks different, tablet color is wrong, batch number not found…"
              rows={4}
              required
              style={{
                width: "100%",
                border: "1.5px solid rgba(62,54,176,0.15)",
                borderRadius: 12,
                padding: "12px 14px",
                fontSize: 14,
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
                background: COLORS.white,
              }}
            />
          </div>

          {/* Contact Info (optional) */}
          <div style={{ marginBottom: 22 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Contact info for follow-up{" "}
              <span className="mt-text-muted" style={{ fontWeight: 400 }}>
                (optional email or phone)
              </span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: COLORS.white,
                border: "1.5px solid rgba(62,54,176,0.15)",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <Mail size={16} color="rgba(17,17,17,0.3)" />
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="email@example.com or phone"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              Photo of packaging{" "}
              <span className="mt-text-muted" style={{ fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "20px",
                border: "1.5px dashed rgba(62,54,176,0.25)",
                borderRadius: 14,
                cursor: "pointer",
                background: "rgba(217,217,255,0.12)",
                transition: "background 0.15s",
              }}
            >
              <Upload size={18} color={COLORS.indigo} />
              <span
                className="mt-text-indigo"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                {fileName || "Click to upload a photo"}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={formState === "submitting" || !description.trim()}
            className="mt-btn-primary inline-flex items-center"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px 0",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor:
                formState === "submitting" ? "wait" : "pointer",
              opacity:
                formState === "submitting" || !description.trim()
                  ? 0.6
                  : 1,
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>
              {formState === "submitting"
                ? "Submitting report…"
                : "Submit Anonymous Report"}
            </span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="text-sm font-semibold text-gray-400">Loading…</div>
        </div>
      }
    >
      <ReportIssueContent />
    </Suspense>
  );
}
