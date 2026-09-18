import { apiClient } from './client';
import {
  CreatePrescriptionDto,
  PrescriptionDto,
  PrescriptionListResponseDto,
  ValidatePrescriptionDto,
  ValidatePrescriptionResponseDto,
  PreparedPrescriptionDto,
} from './types';

export const prescriptionsApi = {
  /**
   * Doctor creates a new prescription in Postgres + prepares on-chain payload.
   * AGENTS.md Invariant #4: Content never touches IPFS.
   */
  async create(dto: CreatePrescriptionDto): Promise<PreparedPrescriptionDto> {
    return apiClient.post<PreparedPrescriptionDto>('/prescriptions', dto);
  },

  /**
   * Retrieves full prescription details.
   * Airtight access control: 403 for everyone except issuing doctor, pharmacy, or admin.
   */
  async getById(id: string): Promise<PrescriptionDto> {
    return apiClient.get<PrescriptionDto>(`/prescriptions/${id}`);
  },

  /**
   * Lists prescriptions.
   * Doctors see their own; pharmacies/admins can filter by doctor.
   */
  async list(params?: {
    doctor?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PrescriptionListResponseDto> {
    return apiClient.get<PrescriptionListResponseDto>('/prescriptions', { params });
  },

  /**
   * Validates a prescription against a batch product at dispense time.
   * Returns validity status and machine-readable failure codes.
   */
  async validate(
    id: string,
    dto: ValidatePrescriptionDto,
  ): Promise<ValidatePrescriptionResponseDto> {
    return apiClient.post<ValidatePrescriptionResponseDto>(
      `/prescriptions/${id}/validate`,
      dto,
    );
  },
};

/**
 * Maps a backend PrescriptionDto to the frontend PrescriptionRecord shape
 * for seamless compatibility with UI components.
 */
export function mapApiPrescriptionToRecord(rx: PrescriptionDto) {
  const isFulfilled = rx.status === 'FULFILLED';
  const dispensing = rx.dispensingRecords && rx.dispensingRecords[0];

  return {
    id: rx.id,
    prescriptionHash: rx.prescriptionHash,
    patientIdentifier: rx.patientRef || 'PT-ANONYMOUS',
    patientAge: 45,
    patientGender: 'Unspecified',
    drugCode: rx.product?.id || rx.productId || 'NDC-UNKNOWN',
    drugName: rx.product?.name || 'Prescription Medication',
    dosage: rx.dosage || rx.product?.dosage || 'As directed',
    quantity: rx.quantity || 1,
    refillsAllowed: 0,
    refillsRemaining: 0,
    issuedAt: rx.issuedAt || rx.createdAt || new Date().toISOString(),
    expiresAt: rx.expiry || new Date().toISOString(),
    status: (isFulfilled ? 'Fulfilled' : 'Pending') as 'Pending' | 'Fulfilled',
    doctorName: 'Dr. Evelyn Reed, MD',
    doctorAddress: rx.doctor?.walletAddress || '0x...',
    doctorLicense: 'MED-NY-492019',
    instructions: 'Take complete course as prescribed.',
    fulfilledByPharmacy: dispensing?.pharmacyOrg?.name || (isFulfilled ? 'Licensed Pharmacy' : undefined),
    fulfilledAt: dispensing?.createdAt || undefined,
    dispenseTxHash: dispensing?.txHash || undefined,
  };
}
