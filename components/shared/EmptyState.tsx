import React from "react";
import { PackageOpen, LucideIcon } from "lucide-react";
import { COLORS } from "@/lib/constants";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export default function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="py-12 px-6 rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-indigo-700"
        style={{ backgroundColor: "rgba(62, 54, 176, 0.1)" }}
      >
        <Icon size={32} />
      </div>

      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>

      {(actionLabel && onAction) && (
        <button
          onClick={onAction}
          className="mt-5 px-5 py-2.5 rounded-full font-bold text-xs text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: COLORS.indigo }}
        >
          {actionLabel}
        </button>
      )}

      {(actionLabel && actionHref) && (
        <a
          href={actionHref}
          className="mt-5 px-5 py-2.5 rounded-full font-bold text-xs text-white shadow-sm transition-transform hover:scale-105 active:scale-95 inline-block"
          style={{ backgroundColor: COLORS.indigo, textDecoration: "none" }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
