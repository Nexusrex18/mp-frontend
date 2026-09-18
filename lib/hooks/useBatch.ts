import { useState, useCallback } from 'react';
import { batchesApi, ListBatchesParams } from '@/lib/api/batches';
import { BatchDetailDto, BatchListResponseDto, PrepareBatchDto, PreparedTransactionDto } from '@/lib/api/types';

export function useBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<BatchDetailDto | null>(null);
  const [batchList, setBatchList] = useState<BatchDetailDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBatch = useCallback(async (id: string): Promise<BatchDetailDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const batch = await batchesApi.getBatchById(id);
      setCurrentBatch(batch);
      return batch;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch batch details.');
      setCurrentBatch(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = useCallback(async (params?: ListBatchesParams): Promise<BatchListResponseDto | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await batchesApi.listBatches(params);
      setBatchList(response.data || []);
      setTotalCount(response.total || 0);
      return response;
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch batches.');
      setBatchList([]);
      setTotalCount(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const prepareBatch = useCallback(async (dto: PrepareBatchDto): Promise<PreparedTransactionDto> => {
    setLoading(true);
    setError(null);
    try {
      return await batchesApi.prepareBatch(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to prepare batch transaction.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const pollUntilIndexed = useCallback(async (identifier: string, maxAttempts = 20, intervalMs = 2000): Promise<BatchDetailDto | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const batch = await batchesApi.getBatchById(identifier);
        if (batch) {
          setCurrentBatch(batch);
          return batch;
        }
      } catch {
        // Still indexing, wait and retry
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return null;
  }, []);

  return {
    loading,
    error,
    currentBatch,
    batchList,
    totalCount,
    fetchBatch,
    fetchBatches,
    prepareBatch,
    pollUntilIndexed,
    setCurrentBatch,
  };
}
