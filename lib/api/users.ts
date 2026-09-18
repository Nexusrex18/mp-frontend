import { apiClient } from './client';
import {
  OrgType,
  RegisterRequestDto,
  RegisterRequestResponseDto,
  UserProfileDto,
  StakeholdersResponseDto,
  RegistrationRequestItemDto,
  PreparedTransactionDto,
} from './types';

export interface ListStakeholdersParams {
  [key: string]: string | number | boolean | undefined;
  role?: OrgType;
  search?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  getMe: async (): Promise<UserProfileDto> => {
    return apiClient.get<UserProfileDto>('/users/me');
  },

  submitRegistrationRequest: async (
    dto: RegisterRequestDto,
  ): Promise<RegisterRequestResponseDto> => {
    return apiClient.post<RegisterRequestResponseDto>('/users/register-request', dto);
  },

  /**
   * GET /admin/stakeholders
   * Retrieves paginated list of stakeholders with search and role filters.
   */
  listStakeholders: async (
    params?: ListStakeholdersParams,
  ): Promise<StakeholdersResponseDto> => {
    return apiClient.get<StakeholdersResponseDto>('/admin/stakeholders', { params });
  },

  /**
   * GET /admin/stakeholders/requests
   * Retrieves registration requests, optionally filtered by status (e.g. PENDING).
   */
  listRegistrationRequests: async (
    status?: string,
  ): Promise<RegistrationRequestItemDto[]> => {
    return apiClient.get<RegistrationRequestItemDto[]>('/admin/stakeholders/requests', {
      params: status ? { status } : undefined,
    });
  },

  /**
   * POST /admin/stakeholders/:id/approve
   * Returns PreparedTransactionDto for AccessControl.grantRole client-side signing.
   */
  approveStakeholder: async (
    id: string,
    dto?: { status?: string },
  ): Promise<PreparedTransactionDto> => {
    return apiClient.post<PreparedTransactionDto>(`/admin/stakeholders/${encodeURIComponent(id)}/approve`, dto || {});
  },

  /**
   * POST /admin/stakeholders/:idOrWallet/revoke
   * Returns PreparedTransactionDto for AccessControl.revokeRole client-side signing.
   */
  revokeStakeholder: async (
    idOrWallet: string,
  ): Promise<PreparedTransactionDto> => {
    return apiClient.post<PreparedTransactionDto>(`/admin/stakeholders/${encodeURIComponent(idOrWallet)}/revoke`);
  },
};
