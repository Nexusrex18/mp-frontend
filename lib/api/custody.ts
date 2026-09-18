import { apiClient } from './client';
import {
  PrepareTransferDto,
  PrepareAcceptDto,
  PreparedTransactionDto,
  IncomingTransfersResponseDto,
  CustodyHistoryResponseDto,
} from './types';
import { CustodyEvent, RoleName } from '@/lib/types';

export const custodyApi = {
  /**
   * POST /custody/prepare-transfer
   * Returns PreparedTransactionDto for Custody.initiateTransfer client-side signing.
   */
  prepareTransfer: async (dto: PrepareTransferDto): Promise<PreparedTransactionDto> => {
    return apiClient.post<PreparedTransactionDto>('/custody/prepare-transfer', dto);
  },

  /**
   * POST /custody/prepare-accept
   * Returns PreparedTransactionDto for Custody.acceptTransfer client-side signing.
   */
  prepareAccept: async (dto: PrepareAcceptDto): Promise<PreparedTransactionDto> => {
    return apiClient.post<PreparedTransactionDto>('/custody/prepare-accept', dto);
  },

  /**
   * GET /custody/incoming?org=
   * Returns batches pending transfer for caller or specified organization.
   */
  getIncoming: async (org?: string): Promise<IncomingTransfersResponseDto> => {
    return apiClient.get<IncomingTransfersResponseDto>('/custody/incoming', {
      params: org ? { org } : undefined,
    });
  },

  /**
   * GET /custody/history/:batchId
   * Returns full indexed custody transfer records.
   */
  getCustodyHistory: async (batchId: string): Promise<CustodyHistoryResponseDto> => {
    return apiClient.get<CustodyHistoryResponseDto>(`/custody/history/${encodeURIComponent(batchId)}`);
  },
};

/**
 * Maps backend CustodyHistoryResponseDto into frontend CustodyEvent[]
 * for CustodyTimeline rendering in full mode.
 */
export function mapCustodyHistoryToEvents(
  data: CustodyHistoryResponseDto,
  manufacturingDate?: string,
): CustodyEvent[] {
  const events: CustodyEvent[] = [];

  // Root manufacturing event
  if (data.batch) {
    events.push({
      id: `mfg-${data.batch.id}`,
      timestamp: manufacturingDate || new Date().toISOString(),
      stage: 'Manufactured',
      actorRole: 'Manufacturer',
      actorName: data.batch.manufacturer?.name || 'Authorized Manufacturer',
      actorAddress: '',
      txHash: '',
      blockNumber: 0,
      location: 'Pharmaceutical Production Facility',
      notes: 'Initial production batch synthesized, batch quality tested and certified.',
      temperatureVerified: true,
    });
  }

  // Transferred / Accepted hops
  (data.history || []).forEach((hop, idx) => {
    const isInitiated = hop.status === 'INITIATED';
    const isAccepted = hop.status === 'ACCEPTED';
    const isDispensed = hop.status === 'DISPENSED';

    let stage: CustodyEvent['stage'] = 'TransferredToDistributor';
    let actorRole: RoleName = 'Manufacturer';
    let location = 'In Transit';

    const toType = hop.toOrg?.type;
    const fromType = hop.fromOrg?.type;

    if (isInitiated) {
      if (toType === 'PHARMACY') {
        stage = 'TransferredToPharmacy';
        actorRole = 'Distributor';
        location = 'En Route to Pharmacy Node';
      } else {
        stage = 'TransferredToDistributor';
        actorRole = fromType === 'MANUFACTURER' ? 'Manufacturer' : 'Distributor';
        location = 'En Route to Distribution Facility';
      }
    } else if (isAccepted) {
      if (toType === 'PHARMACY') {
        stage = 'ReceivedByPharmacy';
        actorRole = 'Pharmacy';
        location = hop.toOrg?.name || 'Licensed Pharmacy';
      } else {
        stage = 'ReceivedByDistributor';
        actorRole = 'Distributor';
        location = hop.toOrg?.name || 'Regional Logistics Hub';
      }
    } else if (isDispensed) {
      stage = 'Dispensed';
      actorRole = 'Pharmacy';
      location = 'Verified Patient Dispensation';
    }

    events.push({
      id: hop.id || `hop-${idx}`,
      timestamp: hop.timestamp,
      stage,
      actorRole,
      actorName: hop.fromOrg?.name || 'Authorized Node',
      actorAddress: '',
      toActorName: hop.toOrg?.name,
      toActorAddress: '',
      txHash: hop.txHash || '',
      blockNumber: hop.blockNumber ? parseInt(hop.blockNumber, 10) : 0,
      location,
      notes: isInitiated
        ? `Outbound shipment initiated to ${hop.toOrg?.name || 'recipient'}`
        : isAccepted
        ? `Custody accepted by ${hop.toOrg?.name || 'recipient'}`
        : undefined,
      temperatureVerified: true,
    });
  });

  return events;
}
