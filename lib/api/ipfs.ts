import { apiClient } from './client';
import { IpfsUploadResponseDto } from './types';

export const ipfsApi = {
  /**
   * POST /ipfs/upload
   * Pins quality documents, lab analysis, or certificates to IPFS and returns the CID.
   * Note: Invariant #4: Prescriptions MUST NEVER be uploaded to IPFS.
   */
  uploadDocument: async (
    file: File,
    docType: 'CERT' | 'LAB_REPORT' | 'OTHER' = 'CERT',
    batchId?: string,
  ): Promise<IpfsUploadResponseDto> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    if (batchId) {
      formData.append('batchId', batchId);
    }

    return apiClient.post<IpfsUploadResponseDto>('/ipfs/upload', formData);
  },
};
