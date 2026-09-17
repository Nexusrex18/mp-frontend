// mirrors backend: prisma/schema.prisma (OrgType)
export type OrgType = 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'PHARMACY' | 'DOCTOR';

// mirrors backend: src/users/users.service.ts
export interface OrganizationDto {
  id: string;
  name: string;
  type: OrgType;
  createdAt: string;
}

// mirrors backend: src/users/users.service.ts getProfile response
export interface UserProfileDto {
  id: string;
  walletAddress: string;
  role: OrgType;
  organization?: OrganizationDto | null;
  createdAt: string;
}

// mirrors backend: src/auth/dto/verify-signature.dto.ts
export interface VerifySignatureDto {
  message: string;
  signature: string;
}

// mirrors backend: src/auth/auth.controller.ts getNonce response
export interface NonceResponseDto {
  nonce: string;
}

// mirrors backend: src/auth/auth.service.ts verifySignature response
export interface AuthVerifyResponseDto {
  authenticated: boolean;
  isRegistered: boolean;
  accessToken?: string;
  user?: UserProfileDto;
  walletAddress?: string;
  message?: string;
}

// mirrors backend: src/users/dto/register-request.dto.ts
export interface RegisterRequestDto {
  walletAddress: string;
  organizationName: string;
  requestedRole: OrgType;
}

// mirrors backend: src/users/users.service.ts submitRegistrationRequest response
export interface RegisterRequestResponseDto {
  message: string;
  request: {
    id: string;
    walletAddress: string;
    organizationName: string;
    requestedRole: OrgType;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
    createdAt: string;
    updatedAt: string;
  };
}

// mirrors backend: src/common/dto/prepared-transaction.dto.ts (Shared Contract #1)
export interface PreparedTransactionDto {
  contract: 'Batch' | 'Custody' | 'Prescription' | 'Dispensing' | 'Verification' | 'AccessControl';
  address: string;
  method: string;
  args: unknown[];
  value?: string;
  meta?: {
    batchId?: string;
    prescriptionId?: string;
    ipfsCid?: string;
  };
}

// mirrors backend standard error envelope
export interface ApiErrorResponse {
  statusCode: number;
  error?: string;
  message: string | string[];
  details?: unknown;
}

// mirrors backend: src/verification/verification.service.ts publicVerify response
export interface PublicVerifyResponseDto {
  identifier: string;
  id?: string;
  batchNumber?: string;
  referenceNumber?: string | null;
  status: string;
  currentStatus: string;
  isExpired: boolean;
  product?: string;
  dosage?: string;
  medicine: {
    name: string;
    dosage: string;
    classification?: string;
    requiresPrescription?: boolean;
  };
  manufacturingDate: string;
  expiryDate: string;
  mfgDate?: string;
  expDate?: string;
  manufacturer: string;
  currentHolder: string;
  supplyChain: Array<{
    from: string;
    to: string;
    accepted: boolean;
    date: string;
  }>;
  timeline?: Array<{
    id: string;
    stage: any;
    actorRole: string;
    actorName: string;
    timestamp: string;
    location?: string;
  }>;
  qualityDocuments?: string | null;
  _source?: 'cache' | 'database';
}

// mirrors backend: src/verification/dto/create-verification-report.dto.ts
export interface CreateVerificationReportDto {
  batchId?: string;
  description: string;
  location?: string;
  photo?: string;
  contactInfo?: string;
}

export interface CreateVerificationReportResponseDto {
  reportId: string;
  message: string;
}

// mirrors backend: src/qr/dto/decode-qr.dto.ts
export interface DecodeQrDto {
  payload: string;
}

export interface QrDecodeResponseDto {
  type: 'BATCH' | 'PRESCRIPTION';
  targetId: string;
  batchId?: string;
  prescriptionId?: string;
  productName?: string;
  dosage?: string;
  currentCustodian?: string;
  status?: string;
  [key: string]: any;
}

