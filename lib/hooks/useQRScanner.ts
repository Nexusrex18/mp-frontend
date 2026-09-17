import { useState, useRef, useEffect, useCallback } from 'react';
import { qrApi } from '@/lib/api/qr';
import { QrDecodeResponseDto } from '@/lib/api/types';

export type CameraPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface UseQRScannerOptions {
  onScanSuccess?: (decodedValue: string, details?: QrDecodeResponseDto) => void;
  onError?: (error: string) => void;
}

export function useQRScanner(options: UseQRScannerOptions = {}) {
  const { onScanSuccess, onError } = options;

  const [permissionState, setPermissionState] = useState<CameraPermissionState>('prompt');
  const [isActive, setIsActive] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionState('unsupported');
      setError('Camera access is not supported on this device/browser.');
      return;
    }

    try {
      setPermissionState('prompt');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = mediaStream;
      setPermissionState('granted');
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setIsActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else {
        setPermissionState('unsupported');
        setError(`Unable to access camera: ${err.message || 'Unknown error'}`);
      }
      if (onError) onError(err.message);
    }
  }, [onError]);

  // Decode a raw string or payload through backend POST /qr/decode
  const decodePayload = useCallback(
    async (rawPayload: string): Promise<string> => {
      const trimmed = rawPayload.trim();
      if (!trimmed) return '';

      setIsDecoding(true);
      setError(null);

      try {
        const decoded = await qrApi.decodeQr(trimmed);
        const resolvedId = decoded.batchId || decoded.targetId || decoded.prescriptionId || trimmed;
        if (onScanSuccess) {
          onScanSuccess(resolvedId, decoded);
        }
        setIsDecoding(false);
        return resolvedId;
      } catch {
        // Fallback: If backend decode 404s, return the raw scanned payload directly
        // (allows patient verify to display the 404 "not registered" card properly)
        if (onScanSuccess) {
          onScanSuccess(trimmed);
        }
        setIsDecoding(false);
        return trimmed;
      }
    },
    [onScanSuccess],
  );

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isActive,
    isDecoding,
    permissionState,
    error,
    startCamera,
    stopCamera,
    decodePayload,
  };
}
