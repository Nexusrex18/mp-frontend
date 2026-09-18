import { apiClient } from './client';
import {
  PrepareDispenseResponseDto,
  PrepareOtcDispenseDto,
  PreparePrescriptionDispenseDto,
  PreparedTransactionDto,
  DispensingHistoryResponseDto,
} from './types';

export const dispensingApi = {
  /**
   * POST /dispensing/prepare
   * Scans a batch and returns server-derived dispensing classification (OTC vs PRESCRIPTION).
   * Invariant #5: dispensingType is NEVER sent in a request body.
   */
  async prepare(batchIdOrDto: string | { batchId: string }): Promise<PrepareDispenseResponseDto> {
    const batchId = typeof batchIdOrDto === 'string' ? batchIdOrDto : batchIdOrDto.batchId;
    return apiClient.post<PrepareDispenseResponseDto>('/dispensing/prepare', {
      batchId,
    });
  },

  /**
   * POST /dispensing/prepare-otc
   * Prepares calldata for OTC dispensing.
   * Invariant: No prescriptionId field at all (absent, not null), no dispensingType.
   */
  async prepareOtc(dto: { batchId: string; quantity: number }): Promise<PreparedTransactionDto> {
    const payload = {
      batchId: dto.batchId,
      quantity: dto.quantity,
    };
    return apiClient.post<PreparedTransactionDto>('/dispensing/prepare-otc', payload);
  },

  /**
   * POST /dispensing/prepare-prescription
   * Prepares calldata for prescription dispensing.
   * Invariant: No dispensingType in request body.
   */
  async preparePrescription(dto: {
    batchId: string;
    prescriptionId: string;
    quantity: number;
  }): Promise<PreparedTransactionDto> {
    const payload = {
      batchId: dto.batchId,
      prescriptionId: dto.prescriptionId,
      quantity: dto.quantity,
    };
    return apiClient.post<PreparedTransactionDto>('/dispensing/prepare-prescription', payload);
  },

  /**
   * GET /dispensing/history?org=
   * Reads from indexer-owned dispensing records.
   */
  async getHistory(params?: {
    org?: string;
    page?: number;
    limit?: number;
  }): Promise<DispensingHistoryResponseDto> {
    return apiClient.get<DispensingHistoryResponseDto>('/dispensing/history', {
      params,
    });
  },
};
