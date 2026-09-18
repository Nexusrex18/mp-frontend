import { apiClient } from './client';
import {
  AuditLogEntryDto,
  AuditLogQueryDto,
  AuditLogsResponseDto,
  AuditStatsDto,
} from './types';

export const auditApi = {
  /**
   * GET /audit/log
   * Query filtered immutable audit log entries.
   */
  getLogs: async (params?: AuditLogQueryDto): Promise<AuditLogsResponseDto> => {
    return apiClient.get<AuditLogsResponseDto>('/audit/log', { params });
  },

  /**
   * GET /audit/stats
   * Get high-level audit and supply-chain stats.
   */
  getStats: async (): Promise<AuditStatsDto> => {
    return apiClient.get<AuditStatsDto>('/audit/stats');
  },

  /**
   * GET /audit/blockchain/events
   * Query indexed blockchain events.
   */
  getBlockchainEvents: async (params?: {
    contract?: string;
    eventName?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      contract: string;
      eventName: string;
      blockNumber: number;
      txHash: string;
      logIndex: number;
      payload: Record<string, unknown>;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    return apiClient.get('/audit/blockchain/events', { params });
  },

  /**
   * GET /audit/blockchain/transactions
   * Query recorded blockchain transactions.
   */
  getBlockchainTransactions: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get('/audit/blockchain/transactions', { params });
  },

  /**
   * GET /audit/log/:id
   * Get single audit log record.
   */
  getLogById: async (id: string): Promise<AuditLogEntryDto> => {
    return apiClient.get<AuditLogEntryDto>(`/audit/log/${encodeURIComponent(id)}`);
  },

  /**
   * Export audit log CSV
   */
  exportCsv: async (params?: AuditLogQueryDto): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    searchParams.set('format', 'csv');
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const res = await fetch(`${baseUrl}/audit/log?${searchParams.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`CSV export failed: ${res.statusText}`);
    }
    return res.blob();
  },
};
