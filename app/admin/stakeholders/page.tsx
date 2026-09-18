"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  Shield,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Wallet,
} from "lucide-react";
import { COLORS } from "@/lib/constants";
import DataTable, { type Column } from "@/components/shared/DataTable";
import { usersApi } from "@/lib/api/users";
import {
  StakeholderItemDto,
  RegistrationRequestItemDto,
  OrgType,
  PreparedTransactionDto,
} from "@/lib/api/types";
import { useTxFlow } from "@/lib/hooks/useTxFlow";
import { useWallet } from "@/context/WalletContext";

/* ---------------------------------------------------------------
   Admin — Stakeholder Management (/admin/stakeholders)
   
   Purpose: Approve access requests & manage supply chain roles.
   Hard Rule #1: Admin signs grantRole/revokeRole with their own wallet.
   Hard Rule #2: Role updates persist through blockchain event indexing.
----------------------------------------------------------------*/

type ActiveTab = "requests" | "stakeholders";

export default function AdminStakeholdersPage() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<ActiveTab>("requests");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<RegistrationRequestItemDto[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Target item for transaction flow
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "revoke";
    targetId: string;
    walletAddress: string;
    role: OrgType;
    orgName: string;
  } | null>(null);

  // Load data from backend
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [reqList, stList] = await Promise.all([
        usersApi.listRegistrationRequests(),
        usersApi.listStakeholders({ limit: 100 }),
      ]);
      setRequests(reqList || []);
      setStakeholders(stList?.data || []);
    } catch (err: any) {
      console.error("Failed to fetch stakeholder data:", err);
      setError(err?.message || "Failed to load stakeholder data from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Transaction flow hook
  const { execute, isProcessing } = useTxFlow({
    prepare: async (): Promise<PreparedTransactionDto> => {
      if (!pendingAction) {
        throw new Error("No pending stakeholder action selected.");
      }
      if (pendingAction.type === "approve") {
        return await usersApi.approveStakeholder(pendingAction.targetId);
      } else {
        return await usersApi.revokeStakeholder(pendingAction.walletAddress);
      }
    },
    title:
      pendingAction?.type === "approve"
        ? `Granting ${pendingAction.role} Role`
        : `Revoking ${pendingAction?.role} Role`,
    description:
      pendingAction?.type === "approve"
        ? `Granting ${pendingAction.role} on-chain role to ${pendingAction.walletAddress}`
        : `Revoking ${pendingAction?.role} role on-chain for ${pendingAction?.walletAddress}`,
    poll: async () => {
      // Poll until backend mirrors the state change from indexed events
      if (pendingAction?.type === "approve") {
        const updatedReqs = await usersApi.listRegistrationRequests();
        const target = updatedReqs.find((r) => r.id === pendingAction.targetId);
        return { isUpdated: target?.status === "APPROVED", list: updatedReqs };
      } else {
        const updatedSt = await usersApi.listStakeholders({ limit: 100 });
        const target = updatedSt.data.find(
          (s) => s.walletAddress.toLowerCase() === pendingAction?.walletAddress.toLowerCase()
        );
        return { isUpdated: !target || target.role !== pendingAction?.role, list: updatedSt.data };
      }
    },
    isIndexed: (result) => Boolean(result?.isUpdated),
    pollIntervalMs: 2000,
    pollTimeoutMs: 30000,
    onSuccess: () => {
      setPendingAction(null);
      loadData();
    },
    onError: (err) => {
      console.error("Stakeholder transaction failed:", err);
      setPendingAction(null);
    },
  });

  // Execute approval flow
  const handleApprove = (req: RegistrationRequestItemDto) => {
    setPendingAction({
      type: "approve",
      targetId: req.id,
      walletAddress: req.walletAddress,
      role: req.requestedRole,
      orgName: req.organizationName,
    });
  };

  // Execute revoke flow
  const handleRevoke = (st: StakeholderItemDto) => {
    setPendingAction({
      type: "revoke",
      targetId: st.id,
      walletAddress: st.walletAddress,
      role: st.role,
      orgName: st.organization?.name || "Organization",
    });
  };

  // Trigger tx when pendingAction changes and not currently processing
  useEffect(() => {
    if (pendingAction && !isProcessing) {
      execute();
    }
  }, [pendingAction, isProcessing, execute]);

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  // Requests Table Columns
  const requestColumns: Column<RegistrationRequestItemDto>[] = [
    {
      key: "organizationName",
      label: "Organization & Wallet",
      sortable: true,
      render: (row) => (
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Building2 size={16} className="text-slate-400" />
            {row.organizationName}
          </div>
          <div className="mt-mono text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Wallet size={12} />
            {row.walletAddress}
          </div>
        </div>
      ),
    },
    {
      key: "requestedRole",
      label: "Requested Role",
      sortable: true,
      render: (row) => (
        <span
          className="mt-mono text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            color: COLORS.indigo,
            backgroundColor: "rgba(62,54,176,0.08)",
          }}
        >
          {row.requestedRole}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => {
        const badgeStyles: Record<string, { bg: string; color: string }> = {
          PENDING: { bg: "rgba(62,54,176,0.1)", color: COLORS.indigo },
          APPROVED: { bg: "rgba(185,221,223,0.4)", color: "#0a5c5f" },
          REJECTED: { bg: "rgba(246,32,136,0.1)", color: COLORS.magenta },
          REVOKED: { bg: "rgba(17,17,17,0.06)", color: "rgba(17,17,17,0.5)" },
        };
        const s = badgeStyles[row.status] || badgeStyles.PENDING;
        return (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: s.bg, color: s.color }}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Submitted",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => {
        if (row.status === "PENDING") {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(row)}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
              >
                Approve & Grant
              </button>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">—</span>;
      },
    },
  ];

  // Stakeholders Table Columns
  const stakeholderColumns: Column<StakeholderItemDto>[] = [
    {
      key: "walletAddress",
      label: "Organization & Wallet",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            {row.organization?.name || "Independent Stakeholder"}
          </div>
          <div className="mt-mono text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <Wallet size={12} />
            {row.walletAddress}
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Active Role",
      sortable: true,
      render: (row) => (
        <span
          className="mt-mono text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            color: COLORS.indigo,
            backgroundColor: "rgba(62,54,176,0.08)",
          }}
        >
          {row.role}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Registered",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => {
        if (row.role === "ADMIN") {
          return <span className="text-xs text-slate-400 font-medium">Root Admin</span>;
        }
        return (
          <button
            onClick={() => handleRevoke(row)}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Revoke Role
          </button>
        );
      },
    },
  ];

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="mt-display text-2xl font-bold text-slate-900">
            Stakeholder Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review onboarding requests, sign role grants on-chain, and revoke stakeholder access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingRequests.length > 0 && (
            <div className="mt-mono inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-full">
              <Clock size={14} /> {pendingRequests.length} pending approval
            </div>
          )}

          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            disabled={refreshing || isProcessing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "requests"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Registration Requests ({requests.length})
          {activeTab === "requests" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("stakeholders")}
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === "stakeholders"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Stakeholders ({stakeholders.length})
          {activeTab === "stakeholders" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Active Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Loading network participants...</span>
          </div>
        </div>
      ) : activeTab === "requests" ? (
        <DataTable
          columns={requestColumns}
          data={requests}
          searchPlaceholder="Search requests by organization, wallet, or role…"
          searchKeys={["organizationName", "walletAddress", "requestedRole", "status"]}
          emptyTitle="No Registration Requests"
          emptyDescription="There are currently no access requests pending review."
        />
      ) : (
        <DataTable
          columns={stakeholderColumns}
          data={stakeholders}
          searchPlaceholder="Search stakeholders by wallet or role…"
          searchKeys={["walletAddress", "role"]}
          emptyTitle="No Active Stakeholders"
          emptyDescription="No registered supply chain participants found on the network."
        />
      )}
    </div>
  );
}
