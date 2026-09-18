"use client";

import { useState, useCallback } from "react";
import { custodyApi, mapCustodyHistoryToEvents } from "@/lib/api/custody";
import {
  PrepareTransferDto,
  PrepareAcceptDto,
  IncomingTransferItemDto,
  CustodyHistoryResponseDto,
} from "@/lib/api/types";
import { CustodyEvent } from "@/lib/types";
import { useTxFlow, UseTxFlowReturn } from "./useTxFlow";
import { apiClient } from "@/lib/api/client";

export interface CustodyErrorState {
  code: string | null;
  message: string;
}

export function parseCustodyError(err: any): CustodyErrorState {
  const code = err?.error || err?.code || null;
  let message = err?.message || "An unexpected error occurred during custody operation.";

  if (code === "NOT_CURRENT_CUSTODIAN") {
    message = "You are not the current custodian or manufacturer of this batch.";
  } else if (code === "BATCH_ALREADY_ACCEPTED") {
    message = "This custody transfer has already been accepted.";
  } else if (code === "NO_PENDING_TRANSFER") {
    message = "No pending custody transfer found for this batch.";
  } else if (code === "NOT_DESIGNATED_RECIPIENT") {
    message = "This batch is not assigned to your organization.";
  }

  return { code, message };
}

export function useCustody() {
  const [incoming, setIncoming] = useState<IncomingTransferItemDto[]>([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [history, setHistory] = useState<CustodyHistoryResponseDto | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<CustodyEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<CustodyErrorState | null>(null);

  const loadIncoming = useCallback(async (org?: string) => {
    setLoadingIncoming(true);
    setError(null);
    try {
      const res = await custodyApi.getIncoming(org);
      const items = res.data || res.incoming || [];
      setIncoming(items);
      return items;
    } catch (err: any) {
      const parsed = parseCustodyError(err);
      setError(parsed);
      return [];
    } finally {
      setLoadingIncoming(false);
    }
  }, []);

  const loadHistory = useCallback(async (batchId: string, mfgDate?: string) => {
    setLoadingHistory(true);
    setError(null);
    try {
      const res = await custodyApi.getCustodyHistory(batchId);
      setHistory(res);
      const events = mapCustodyHistoryToEvents(res, mfgDate);
      setTimelineEvents(events);
      return events;
    } catch (err: any) {
      const parsed = parseCustodyError(err);
      setError(parsed);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  return {
    incoming,
    loadingIncoming,
    loadIncoming,
    history,
    timelineEvents,
    loadingHistory,
    loadHistory,
    error,
    clearError: () => setError(null),
  };
}
