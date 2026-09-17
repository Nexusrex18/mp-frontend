import { apiClient } from './client';
import {
  PublicVerifyResponseDto,
  CreateVerificationReportDto,
  CreateVerificationReportResponseDto,
} from './types';

export const verificationApi = {
  /**
   * GET /verify/:batchId
   * Public batch verification (read-only, no auth, no wallet, cached).
   */
  publicVerify: async (batchId: string): Promise<PublicVerifyResponseDto> => {
    return apiClient.get<PublicVerifyResponseDto>(`/verify/${encodeURIComponent(batchId)}`);
  },

  /**
   * POST /verify/report
   * Public report submission for suspicious or counterfeit medicines (no auth).
   */
  submitReport: async (
    data: CreateVerificationReportDto,
  ): Promise<CreateVerificationReportResponseDto> => {
    return apiClient.post<CreateVerificationReportResponseDto>('/verify/report', data);
  },

  /**
   * POST /verification/record
   * Authenticated checkpoint creation for supply chain stakeholders (returns calldata).
   */
  recordVerification: async (data: { batchId: string; result: 'VALID' | 'INVALID' | 'EXPIRED' }) => {
    return apiClient.post('/verification/record', data);
  },
};
