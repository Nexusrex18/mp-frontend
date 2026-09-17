import { useState, useCallback } from 'react';
import { verificationApi } from '@/lib/api/verification';
import { PublicVerifyResponseDto } from '@/lib/api/types';
import { ApiClientError } from '@/lib/api/client';

export type VerifyState = 'idle' | 'loading' | 'found' | 'not_found' | 'rate_limited' | 'error';

export interface UseVerifyReturn {
  state: VerifyState;
  data: PublicVerifyResponseDto | null;
  errorMessage: string | null;
  retryAfter: number | null;
  verifyBatch: (batchId: string) => Promise<PublicVerifyResponseDto | null>;
  reset: () => void;
}

export function useVerify(): UseVerifyReturn {
  const [state, setState] = useState<VerifyState>('idle');
  const [data, setData] = useState<PublicVerifyResponseDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setErrorMessage(null);
    setRetryAfter(null);
  }, []);

  const verifyBatch = useCallback(async (batchId: string): Promise<PublicVerifyResponseDto | null> => {
    const trimmed = batchId.trim();
    if (!trimmed) {
      return null;
    }

    setState('loading');
    setErrorMessage(null);
    setRetryAfter(null);

    try {
      const response = await verificationApi.publicVerify(trimmed);
      setData(response);
      setState('found');
      return response;
    } catch (err: any) {
      setData(null);

      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setState('not_found');
          setErrorMessage(`No registered medicine found for batch code "${trimmed}".`);
          return null;
        }

        if (err.statusCode === 429) {
          const seconds = err.retryAfter ?? 30;
          setState('rate_limited');
          setRetryAfter(seconds);
          setErrorMessage(`Too many verification checks. Please wait ${seconds} seconds before trying again.`);
          return null;
        }

        setState('error');
        setErrorMessage(err.message || 'Verification failed. Please check your network and try again.');
        return null;
      }

      setState('error');
      setErrorMessage(err?.message || 'Verification service temporarily unavailable.');
      return null;
    }
  }, []);

  return {
    state,
    data,
    errorMessage,
    retryAfter,
    verifyBatch,
    reset,
  };
}
