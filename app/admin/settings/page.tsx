"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  Shield,
  Sliders,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import { productsApi } from "@/lib/api/products";
import { ProductDto, UpdateProductDto } from "@/lib/api/types";

/* ---------------------------------------------------------------
   Admin — Settings (/admin/settings)
   
   Purpose: Product regulatory classification rules & permissions matrix.
   Connected to: GET /products and PATCH /products/:id (Stage 8).
----------------------------------------------------------------*/

const ROLES = ["Admin", "Manufacturer", "Distributor", "Pharmacy", "Doctor"];
const PERMISSIONS = [
  { action: "Create Batch", Admin: true, Manufacturer: true, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "Transfer Custody", Admin: false, Manufacturer: true, Distributor: true, Pharmacy: false, Doctor: false },
  { action: "Accept Custody", Admin: false, Manufacturer: false, Distributor: true, Pharmacy: true, Doctor: false },
  { action: "Dispense Medicine", Admin: false, Manufacturer: false, Distributor: false, Pharmacy: true, Doctor: false },
  { action: "Issue Prescription", Admin: false, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: true },
  { action: "Approve / Revoke Roles", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "View Audit Log", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
  { action: "View Global Registry", Admin: true, Manufacturer: false, Distributor: false, Pharmacy: false, Doctor: false },
];

export default function AdminSettingsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editing product modal / inline state
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [editForm, setEditForm] = useState<{
    dispensingType: "OTC" | "PRESCRIPTION";
    regulatoryClassification: string;
  }>({
    dispensingType: "OTC",
    regulatoryClassification: "",
  });

  const loadProducts = useCallback(async () => {
    try {
      setError(null);
      const data = await productsApi.getProducts();
      setProducts(data || []);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err?.message || "Failed to load pharmaceutical catalog.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenEdit = (product: ProductDto) => {
    setEditingProduct(product);
    setEditForm({
      dispensingType: product.dispensingType,
      regulatoryClassification: product.regulatoryClassification || "",
    });
    setSuccessMessage(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await productsApi.updateProduct(editingProduct.id, {
        dispensingType: editForm.dispensingType,
        regulatoryClassification: editForm.regulatoryClassification.trim(),
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setSuccessMessage(`Updated classification rules for ${updated.name}.`);
      setEditingProduct(null);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setError(err?.message || "Failed to save classification changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            System & Regulatory Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure dispensing classification rules and inspect network role access matrices.
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            loadProducts();
          }}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-sm text-teal-800">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Product Regulatory Classification Rules */}
      <div style={{ marginBottom: 44 }}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <Sliders size={20} color={COLORS.indigo} />
            <h2 className="text-lg font-bold text-slate-900">
              Product Classification & Dispensing Rules
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Governs whether batches are auto-routed to OTC or Prescription flow
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
              Loading product catalog...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Dosage</th>
                    <th className="py-3 px-4">Dispensing Type</th>
                    <th className="py-3 px-4">Regulatory Classification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {prod.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {prod.dosage}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="mt-mono text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            color:
                              prod.dispensingType === "PRESCRIPTION"
                                ? COLORS.indigo
                                : "#0a5c5f",
                            backgroundColor:
                              prod.dispensingType === "PRESCRIPTION"
                                ? "rgba(62,54,176,0.08)"
                                : "rgba(185,221,223,0.3)",
                          }}
                        >
                          {prod.dispensingType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                        {prod.regulatoryClassification || "Standard (Unclassified)"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={12} /> Edit Rule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Permission Matrix */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <Shield size={20} color={COLORS.indigo} />
          <h2 className="text-lg font-bold text-slate-900">
            Role Permission Matrix
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Network Action</th>
                  {ROLES.map((role) => (
                    <th key={role} className="py-3 px-4 text-center">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.action} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {perm.action}
                    </td>
                    {ROLES.map((role) => {
                      const allowed = (perm as any)[role];
                      return (
                        <td key={role} className="py-3.5 px-4 text-center">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{
                              background: allowed
                                ? "rgba(185,221,223,0.3)"
                                : "rgba(17,17,17,0.05)",
                              color: allowed ? "#0a5c5f" : "rgba(17,17,17,0.3)",
                            }}
                          >
                            {allowed ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="font-bold text-slate-900 text-lg mb-1">
              Edit Product Classification
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Update dispensing requirement for {editingProduct.name} ({editingProduct.dosage}).
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dispensing Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, dispensingType: "OTC" }))
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editForm.dispensingType === "OTC"
                        ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    OTC (Over-The-Counter)
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({
                        ...prev,
                        dispensingType: "PRESCRIPTION",
                      }))
                    }
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editForm.dispensingType === "PRESCRIPTION"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Prescription Required
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Regulatory Classification / NDC
                </label>
                <input
                  type="text"
                  value={editForm.regulatoryClassification}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      regulatoryClassification: e.target.value,
                    }))
                  }
                  placeholder="e.g. Schedule H, OTC Monograph, Schedule IV"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? "Saving…" : "Save Classification"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
