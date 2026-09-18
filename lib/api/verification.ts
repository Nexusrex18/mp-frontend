import { apiClient } from './client';
import {
  PublicVerifyResponseDto,
  CreateVerificationReportDto,
  CreateVerificationReportResponseDto,
  VerificationReportsResponseDto,
} from './types';

export interface GetReportsParams {
  [key: string]: string | number | boolean | undefined;
  status?: string;
  batchId?: string;
  page?: number;
  limit?: number;
}

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
   * GET /verify/reports
   * Admin only: Retrieves consumer and safety incident reports.
   */
  getReports: async (
    params?: GetReportsParams,
  ): Promise<VerificationReportsResponseDto> => {
    return apiClient.get<VerificationReportsResponseDto>('/verify/reports', { params });
  },

  /**
   * POST /verification/record
   * Authenticated checkpoint creation for supply chain stakeholders (returns calldata).
   */
  recordVerification: async (data: { batchId: string; result: 'VALID' | 'INVALID' | 'EXPIRED' }) => {
    return apiClient.post('/verification/record', data);
  },
};
