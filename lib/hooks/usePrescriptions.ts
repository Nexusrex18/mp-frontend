"use client";

import { useState, useCallback } from "react";
import { prescriptionsApi } from "@/lib/api/prescriptions";
import {
  CreatePrescriptionDto,
  PrescriptionDto,
  ValidatePrescriptionDto,
  ValidatePrescriptionResponseDto,
  PreparedPrescriptionDto,
} from "@/lib/api/types";

export interface PrescriptionErrorState {
  code: string | null;
  message: string;
}

export function parsePrescriptionError(err: any): PrescriptionErrorState {
  const code = err?.error || err?.code || (Array.isArray(err?.failures) && err.failures[0]) || null;
  let message = err?.message || "An unexpected error occurred with the prescription.";

  if (code === "PRESCRIPTION_ALREADY_FULFILLED") {
    message = "This prescription has already been dispensed.";
  } else if (code === "PRESCRIPTION_EXPIRED") {
    message = "This prescription has expired and cannot be dispensed.";
  } else if (code === "PRESCRIPTION_PRODUCT_MISMATCH") {
    message = "Prescription medication does not match the scanned batch product.";
  }

  return { code, message };
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDto[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<PrescriptionDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<PrescriptionErrorState | null>(null);

  const loadPrescriptions = useCallback(
    async (params?: { doctor?: string; status?: string; page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await prescriptionsApi.list(params);
        const items = res.data || res.prescriptions || [];
        setPrescriptions(items);
        setTotal(res.total || items.length);
        return items;
      } catch (err: any) {
        const parsed = parsePrescriptionError(err);
        setError(parsed);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadPrescription = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const rx = await prescriptionsApi.getById(id);
      setCurrentPrescription(rx);
      return rx;
    } catch (err: any) {
      const parsed = parsePrescriptionError(err);
      setError(parsed);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPrescription = useCallback(async (dto: CreatePrescriptionDto): Promise<PreparedPrescriptionDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const prep = await prescriptionsApi.create(dto);
      return prep;
    } catch (err: any) {
      const parsed = parsePrescriptionError(err);
      setError(parsed);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const validatePrescription = useCallback(
    async (id: string, dto: ValidatePrescriptionDto): Promise<ValidatePrescriptionResponseDto | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await prescriptionsApi.validate(id, dto);
        if (!result.valid && result.failures.length > 0) {
          setError({
            code: result.failures[0],
            message: parsePrescriptionError({ error: result.failures[0] }).message,
          });
        }
        return result;
      } catch (err: any) {
        const parsed = parsePrescriptionError(err);
        setError(parsed);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    prescriptions,
    currentPrescription,
    loading,
    total,
    error,
    loadPrescriptions,
    loadPrescription,
    createPrescription,
    validatePrescription,
    clearError: () => setError(null),
  };
}
