"use client";

import React, { useState } from "react";
import { Download, Printer, Copy, Check, QrCode } from "lucide-react";
import { COLORS } from "@/lib/constants";

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  showActions?: boolean;
}

export default function QRCodeDisplay({
  value,
  title = "Authentication QR Code",
  subtitle = "Scan to verify batch authenticity on L2",
  size = 200,
  showActions = true,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Generate SVG QR Matrix pattern dynamically based on value hash
  const generateQRMatrix = (str: string) => {
    const grid = 21; // 21x21 QR version 1 matrix
    const matrix: boolean[][] = Array(grid)
      .fill(false)
      .map(() => Array(grid).fill(false));

    // Finder patterns (top-left, top-right, bottom-left)
    const addFinder = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 ||
            i === 6 ||
            j === 0 ||
            j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            matrix[r + i][c + j] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, 14);
    addFinder(14, 0);

    // Timing patterns
    for (let i = 8; i < 13; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Pseudo-random data fill seeded by string
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
      seed = (seed * 31 + str.charCodeAt(i)) & 0xffffffff;
    }

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        // Skip finder areas
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c > 12) ||
          (r > 12 && c < 8) ||
          r === 6 ||
          c === 6
        ) {
          continue;
        }
        seed = (seed * 1664525 + 1013904223) & 0xffffffff;
        matrix[r][c] = (seed & 1) === 1;
      }
    }

    return matrix;
  };

  const matrix = generateQRMatrix(value || "MEDTRACE-DEFAULT");
  const cellSize = size / 21;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownload = () => {
    // Generate data URI from SVG and trigger download
    const svgElement = document.getElementById(`qr-svg-${value.slice(0, 6)}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `MedTrace-QR-${value.slice(0, 8)}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center max-w-xs mx-auto">
      {/* Visual Seal Container */}
      <div
        className="p-4 rounded-2xl bg-white border-2 border-indigo-100 shadow-inner inline-block"
        style={{
          background:
            "radial-gradient(circle at center, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      >
        <svg
          id={`qr-svg-${value.slice(0, 6)}`}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto rounded-lg"
        >
          <rect width={size} height={size} fill="#FFFFFF" />
          {matrix.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={COLORS.ink}
                  rx={cellSize * 0.15}
                />
              ) : null
            )
          )}
        </svg>
      </div>

      <div className="mt-3">
        <h4 className="font-bold text-sm text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        <div className="mt-2 font-mono text-[11px] bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200 max-w-[240px] truncate">
          {value}
        </div>
      </div>

      {showActions && (
        <div className="mt-4 flex items-center justify-center gap-2 w-full pt-3 border-t border-gray-100">
          <button
            onClick={handleCopy}
            title="Copy QR Value"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            {copied ? (
              <Check size={13} className="text-emerald-600" />
            ) : (
              <Copy size={13} />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download QR SVG"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <Download size={13} />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            title="Print Physical Label"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      )}
    </div>
  );
}
