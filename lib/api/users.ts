import { apiClient } from './client';
import { RegisterRequestDto, RegisterRequestResponseDto, UserProfileDto } from './types';

export const usersApi = {
  getMe: async (): Promise<UserProfileDto> => {
    return apiClient.get<UserProfileDto>('/users/me');
  },

  submitRegistrationRequest: async (
    dto: RegisterRequestDto,
  ): Promise<RegisterRequestResponseDto> => {
    return apiClient.post<RegisterRequestResponseDto>('/users/register-request', dto);
  },
};
