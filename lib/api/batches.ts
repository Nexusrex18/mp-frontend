import { apiClient } from './client';
import {
  PrepareBatchDto,
  PreparedTransactionDto,
  BatchDetailDto,
  BatchListResponseDto,
} from './types';

export interface ListBatchesParams {
  [key: string]: string | number | boolean | undefined;
  owner?: string;
  custodian?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const batchesApi = {
  /**
   * POST /batches/prepare
   * Returns PreparedTransactionDto for Batch.registerBatch client-side signing.
   * Auto-derives dispensingType on the server.
   */
  prepareBatch: async (dto: PrepareBatchDto): Promise<PreparedTransactionDto> => {
    return apiClient.post<PreparedTransactionDto>('/batches/prepare', dto);
  },

  /**
   * GET /batches/:id
   * Retrieves batch details by UUID or on-chain batchChainId.
   */
  getBatchById: async (id: string): Promise<BatchDetailDto> => {
    return apiClient.get<BatchDetailDto>(`/batches/${encodeURIComponent(id)}`);
  },

  /**
   * GET /batches
   * Retrieves a paginated list of batches filtered by owner, custodian, or status.
   */
  listBatches: async (params?: ListBatchesParams): Promise<BatchListResponseDto> => {
    return apiClient.get<BatchListResponseDto>('/batches', { params });
  },
};

import { BatchRecord, BatchStatus, DispensingType } from '@/lib/types';

export function mapApiBatchToRecord(b: BatchDetailDto): BatchRecord {
  const isExpired = new Date(b.expiryDate) < new Date();
  let status: BatchStatus = 'Valid';
  if (isExpired) {
    status = 'Expired';
  } else if (b.status === 'CREATED' || b.status === 'DELIVERED') {
    status = 'Valid';
  } else if (b.status === 'IN_TRANSIT') {
    status = 'InTransit';
  } else if (b.status === 'DISPENSED') {
    status = 'Dispensed';
  } else if (b.status === 'RECALLED') {
    status = 'Recalled';
  }

  const mfg = b.manufacturingDate
    ? new Date(b.manufacturingDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const exp = b.expiryDate
    ? new Date(b.expiryDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  return {
    id: b.id,
    batchNumber: b.batchChainId ? `#${b.batchChainId}` : b.id.slice(0, 8),
    productName: b.product?.name || 'Pharmaceutical Formulation',
    genericName: b.product?.name || '',
    ndcCode: b.product?.regulatoryClassification || 'Standard',
    dosage: b.product?.dosage || 'Standard',
    formulation: 'Standard Formulation',
    dispensingType: (b.product?.dispensingType === 'OTC' ? 'OTC' : 'Prescription') as DispensingType,
    quantity: b.quantity,
    initialQuantity: b.quantity,
    unit: 'Units',
    mfgDate: mfg,
    expDate: exp,
    storageCondition: 'Store at controlled temperature',
    status,
    currentCustodianRole: (b.currentCustodian?.type === 'DISTRIBUTOR' ? 'Distributor' : b.currentCustodian?.type === 'PHARMACY' ? 'Pharmacy' : 'Manufacturer'),
    currentCustodianName: b.currentCustodian?.name || b.manufacturer?.name || 'Authorized Custodian',
    currentCustodianAddress: '',
    manufacturerName: b.manufacturer?.name || 'Verified Manufacturer',
    manufacturerAddress: '',
    l2ContractAddress: '',
    mintTxHash: '',
    ipfsDocs: (b.ipfsDocuments || []).map((d) => ({
      id: d.id,
      name: `Certificate-${d.docType}`,
      type: 'CertificateOfAnalysis',
      cid: d.cid,
      size: '1.2 MB',
      uploadedAt: d.uploadedAt,
      uploaderRole: 'Manufacturer',
      verified: true,
    })),
    custodyTimeline: [
      {
        id: `mfg-${b.id}`,
        stage: 'Manufactured',
        actorRole: 'Manufacturer',
        actorName: b.manufacturer?.name || 'Manufacturer',
        actorAddress: '',
        txHash: '',
        blockNumber: 0,
        timestamp: b.manufacturingDate,
        location: 'Manufacturing Plant',
      },
      ...(b.custodyTransfers || []).map((t: any) => ({
        id: t.id,
        stage: (t.status === 'ACCEPTED' ? 'ReceivedByDistributor' : 'TransferredToDistributor') as any,
        actorRole: 'Distributor' as const,
        actorName: t.toOrg?.name || 'Distributor',
        actorAddress: '',
        txHash: t.txHash || '',
        blockNumber: Number(t.blockNumber) || 0,
        timestamp: t.createdAt,
        location: 'Logistics Center',
      })),
    ],
    qrPayload: `MEDTRACE:${b.id}:${b.ipfsCid || ''}`,
  };
}

