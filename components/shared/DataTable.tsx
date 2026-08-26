"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { COLORS } from "@/lib/constants";
import EmptyState from "@/components/shared/EmptyState";

/* ---------------------------------------------------------------
   DataTable — paginated, sortable, searchable table.
   Used by: My Batches, Inventory (x2), Dispensing History,
   Stakeholders, Batch Registry, Audit Log, Prescription History.
   
   States: empty, loading, paginated, filtered.
----------------------------------------------------------------*/

export interface Column<T> {
  /** Unique key matching a field in T */
  key: string;
  /** Column header label */
  label: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom render function for the cell */
  render?: (row: T) => React.ReactNode;
  /** Width hint (CSS value) */
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Number of rows per page (default: 10) */
  pageSize?: number;
  /** Show the search bar (default: true) */
  searchable?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Keys to search across when filtering */
  searchKeys?: string[];
  /** Show loading skeleton */
  loading?: boolean;
  /** Empty state config */
  emptyTitle?: string;
  emptyDescription?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  searchable = true,
  searchPlaceholder = "Search…",
  searchKeys,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return data.filter((row) =>
      keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, search, searchKeys, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div style={{ borderRadius: 14, border: "1px solid rgba(17,17,17,0.08)", overflow: "hidden" }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 48,
              background: i % 2 === 0 ? "rgba(217,217,255,0.1)" : "transparent",
              borderBottom: "1px solid rgba(17,17,17,0.04)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      {searchable && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            background: COLORS.white,
            border: "1.5px solid rgba(62,54,176,0.12)",
            borderRadius: 12,
            padding: "10px 14px",
            maxWidth: 340,
          }}
        >
          <Search size={16} color="rgba(17,17,17,0.3)" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
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
      )}

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <div
            style={{
              borderRadius: 14,
              border: "1px solid rgba(17,17,17,0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(217,217,255,0.18)" }}>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: "rgba(17,17,17,0.55)",
                          cursor: col.sortable ? "pointer" : "default",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                          width: col.width,
                        }}
                      >
                        <span className="inline-flex items-center" style={{ gap: 4 }}>
                          {col.label}
                          {col.sortable && (
                            <ChevronsUpDown
                              size={13}
                              color={
                                sortKey === col.key
                                  ? COLORS.indigo
                                  : "rgba(17,17,17,0.25)"
                              }
                            />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => (
                    <tr
                      key={i}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      style={{
                        borderTop: "1px solid rgba(17,17,17,0.05)",
                        cursor: onRowClick ? "pointer" : "default",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (onRowClick) e.currentTarget.style.background = "rgba(217,217,255,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "12px 16px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {col.render
                            ? col.render(row)
                            : String(row[col.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between"
              style={{ marginTop: 14, fontSize: 13 }}
            >
              <span className="mt-text-muted">
                Showing {page * pageSize + 1}–
                {Math.min((page + 1) * pageSize, sorted.length)} of{" "}
                {sorted.length}
              </span>
              <div className="flex items-center" style={{ gap: 6 }}>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(17,17,17,0.1)",
                    background: COLORS.white,
                    cursor: page === 0 ? "not-allowed" : "pointer",
                    opacity: page === 0 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="mt-mono" style={{ fontSize: 12, padding: "0 8px" }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(17,17,17,0.1)",
                    background: COLORS.white,
                    cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                    opacity: page >= totalPages - 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
