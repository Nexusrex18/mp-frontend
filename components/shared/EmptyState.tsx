import { Inbox } from "lucide-react";
import { COLORS } from "@/lib/constants";

/* ---------------------------------------------------------------
   EmptyState — reusable "no data yet" placeholder for any list/table.
   Drop into any page that might have zero rows.
----------------------------------------------------------------*/

interface EmptyStateProps {
  /** Main message, e.g. "No batches yet" */
  title: string;
  /** Supporting copy, e.g. "Create your first batch to get started." */
  description?: string;
  /** Optional icon override (defaults to Inbox) */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: COLORS.lavender,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
      >
        {icon || <Inbox size={24} color={COLORS.indigo} />}
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
        {title}
      </h3>

      {description && (
        <p
          className="mt-text-muted"
          style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 320 }}
        >
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
