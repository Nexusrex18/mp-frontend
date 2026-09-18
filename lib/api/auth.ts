import { apiClient } from './client';
import { AuthVerifyResponseDto, NonceResponseDto, UserProfileDto } from './types';

export const authApi = {
  getNonce: async (address?: string): Promise<string> => {
    const res = await apiClient.get<NonceResponseDto>('/auth/nonce', {
      params: address ? { address } : undefined,
    });
    return res.nonce;
  },

  verifySignature: async (message: string, signature: string): Promise<AuthVerifyResponseDto> => {
    return apiClient.post<AuthVerifyResponseDto>('/auth/verify', {
      message,
      signature,
    });
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>('/auth/logout');
  },

  getMe: async (): Promise<UserProfileDto> => {
    return apiClient.get<UserProfileDto>('/users/me');
  },
};
