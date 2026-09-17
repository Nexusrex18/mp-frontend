import { apiClient } from './client';
import { DecodeQrDto, QrDecodeResponseDto } from './types';

export const qrApi = {
  /**
   * POST /qr/decode
   * Resolves a scanned QR string, UUID, or URL to its batch or prescription summary.
   * Publicly accessible, no auth required.
   */
  decodeQr: async (payload: string): Promise<QrDecodeResponseDto> => {
    return apiClient.post<QrDecodeResponseDto>('/qr/decode', { payload } as DecodeQrDto);
  },

  /**
   * POST /qr/generate
   * Generates a QR code for a batch or prescription (authenticated).
   */
  generateQr: async (data: { type: 'BATCH' | 'PRESCRIPTION'; targetId: string }) => {
    return apiClient.post('/qr/generate', data);
  },

  /**
   * GET /qr/batch/:batchId
   * Retrieves or generates the QR code payload for a batch.
   */
  getQrByBatchId: async (batchId: string) => {
    return apiClient.get(`/qr/batch/${encodeURIComponent(batchId)}`);
  },

  /**
   * GET /qr/prescription/:prescriptionId
   * Retrieves the QR code payload for a prescription.
   */
  getQrByPrescriptionId: async (prescriptionId: string) => {
    return apiClient.get(`/qr/prescription/${encodeURIComponent(prescriptionId)}`);
  },
};
