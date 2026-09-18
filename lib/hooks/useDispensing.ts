"use client";

import { useState, useCallback } from "react";
import { dispensingApi } from "@/lib/api/dispensing";
import {
  PrepareDispenseResponseDto,
  DispensingHistoryItemDto,
  PreparedTransactionDto,
} from "@/lib/api/types";

export interface DispensingErrorState {
  code: string | null;
  message: string;
}

export function parseDispensingError(err: any): DispensingErrorState {
  const code = err?.error || err?.code || (Array.isArray(err?.blockers) && err.blockers[0]) || null;
  let message = err?.message || "An unexpected error occurred during dispensing preparation.";

  if (code === "NOT_CURRENT_CUSTODIAN") {
    message = "Your pharmacy is not the current custodian of this batch.";
  } else if (code === "BATCH_EXPIRED") {
    message = "This pharmaceutical batch has expired and cannot be dispensed.";
  } else if (code === "PRESCRIPTION_ALREADY_FULFILLED") {
    message = "This prescription has already been dispensed.";
  } else if (code === "PRESCRIPTION_EXPIRED") {
    message = "This prescription has expired and cannot be dispensed.";
  } else if (code === "PRESCRIPTION_PRODUCT_MISMATCH") {
    message = "Prescription medication does not match the scanned batch product.";
  } else if (code === "BATCH_DEPLETED") {
    message = "This batch has zero available units remaining.";
  } else if (code === "BATCH_RECALLED") {
    message = "This batch has been recalled by regulatory authorities and cannot be dispensed.";
  }

  return { code, message };
}

export function useDispensing() {
  const [preparedBatch, setPreparedBatch] = useState<PrepareDispenseResponseDto | null>(null);
  const [history, setHistory] = useState<DispensingHistoryItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalHistory, setTotalHistory] = useState(0);
  const [error, setError] = useState<DispensingErrorState | null>(null);

  const prepareBatch = useCallback(async (batchId: string): Promise<PrepareDispenseResponseDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await dispensingApi.prepare(batchId);
      setPreparedBatch(res);
      if (res.blockers && res.blockers.length > 0) {
        setError(parseDispensingError({ error: res.blockers[0] }));
      }
      return res;
    } catch (err: any) {
      const parsed = parseDispensingError(err);
      setError(parsed);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const prepareOtc = useCallback(
    async (batchId: string, quantity: number): Promise<PreparedTransactionDto | null> => {
      setLoading(true);
      setError(null);
      try {
        const prep = await dispensingApi.prepareOtc({ batchId, quantity });
        return prep;
      } catch (err: any) {
        const parsed = parseDispensingError(err);
        setError(parsed);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const preparePrescription = useCallback(
    async (
      batchId: string,
      prescriptionId: string,
      quantity: number,
    ): Promise<PreparedTransactionDto | null> => {
      setLoading(true);
      setError(null);
      try {
        const prep = await dispensingApi.preparePrescription({
          batchId,
          prescriptionId,
          quantity,
        });
        return prep;
      } catch (err: any) {
        const parsed = parseDispensingError(err);
        setError(parsed);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadHistory = useCallback(
    async (params?: { org?: string; page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await dispensingApi.getHistory(params);
        const items = res.data || res.history || [];
        setHistory(items);
        setTotalHistory(res.total || items.length);
        return items;
      } catch (err: any) {
        const parsed = parseDispensingError(err);
        setError(parsed);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    preparedBatch,
    history,
    loading,
    totalHistory,
    error,
    prepareBatch,
    prepareOtc,
    preparePrescription,
    loadHistory,
    resetPreparedBatch: () => setPreparedBatch(null),
    clearError: () => setError(null),
  };
}
