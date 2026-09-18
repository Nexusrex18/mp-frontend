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

export interface GenerateQrDto {
  batchId?: string;
  prescriptionId?: string;
}

export interface GenerateQrResponseDto {
  qrId: string;
  type: 'BATCH' | 'PRESCRIPTION';
  targetId: string;
  batchId?: string;
  prescriptionId?: string;
  payload: string;
  createdAt: string;
}

// Product catalog DTO
export interface ProductDto {
  id: string;
  name: string;
  dosage: string;
  dispensingType: 'OTC' | 'PRESCRIPTION';
  regulatoryClassification: string;
  createdAt?: string;
}

// Batch prepare DTO
export interface PrepareBatchDto {
  productId: string;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  ipfsCid?: string;
}

// Batch detail & list DTOs
export interface BatchDetailDto {
  id: string;
  batchChainId?: string | null;
  productId: string;
  product: ProductDto;
  manufacturerId: string;
  manufacturer: OrganizationDto;
  quantity: number;
  manufacturingDate: string;
  expiryDate: string;
  ipfsCid?: string | null;
  currentCustodianId: string;
  currentCustodian: OrganizationDto;
  status: string;
  createdAt: string;
  updatedAt: string;
  ipfsDocuments?: Array<{
    id: string;
    cid: string;
    docType: string;
    uploadedAt: string;
  }>;
  custodyTransfers?: Array<any>;
  verificationRecords?: Array<any>;
  dispensingRecords?: Array<any>;
}

export interface BatchListResponseDto {
  data: BatchDetailDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// IPFS upload response
export interface IpfsUploadResponseDto {
  cid: string;
  ipfsUrl: string;
  filename: string;
  docType: string;
  size: number;
  mimeType: string;
  documentRecord?: any;
}

// Custody DTOs
export interface PrepareTransferDto {
  batchId: string;
  toWalletAddress?: string;
  toOrgId?: string;
}

export interface PrepareAcceptDto {
  batchId: string;
}

export interface IncomingTransferItemDto {
  transferId: string;
  status: string;
  txHash: string;
  blockNumber: string | null;
  initiatedAt: string;
  fromOrg: {
    id: string;
    name: string;
    type: string;
  };
  toOrg: {
    id: string;
    name: string;
    type: string;
  };
  batch: {
    id: string;
    batchChainId: string | null;
    quantity: number;
    manufacturingDate: string;
    expiryDate: string;
    status: string;
    ipfsCid: string | null;
    product: ProductDto;
    manufacturer: OrganizationDto;
    currentCustodian: OrganizationDto;
  };
}

export interface IncomingTransfersResponseDto {
  data: IncomingTransferItemDto[];
  incoming: IncomingTransferItemDto[];
  total: number;
  count: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface CustodyHistoryItemDto {
  id: string;
  status: string;
  fromOrg: {
    id: string;
    name: string;
    type: string;
  };
  toOrg: {
    id: string;
    name: string;
    type: string;
  };
  txHash: string;
  logIndex: number;
  blockNumber: string | null;
  timestamp: string;
}

export interface CustodyHistoryResponseDto {
  batch: {
    id: string;
    batchChainId: string | null;
    productId: string;
    productName: string;
    status: string;
    manufacturer: OrganizationDto;
    currentCustodian: OrganizationDto;
  };
  history: CustodyHistoryItemDto[];
}// Prescription DTOs
export interface CreatePrescriptionDto {
  patientRef: string;
  productId: string;
  dosage: string;
  quantity: number;
  expiry: string;
}

export interface PrescriptionDto {
  id: string;
  prescriptionChainId?: string | null;
  doctorId: string;
  patientRef: string;
  productId: string;
  product: ProductDto;
  dosage: string;
  quantity: number;
  issuedAt: string;
  expiry: string;
  status: 'PENDING' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  prescriptionHash: string;
  createdAt: string;
  doctor?: {
    id: string;
    walletAddress: string;
  };
  dispensingRecords?: Array<{
    id: string;
    quantity: number;
    txHash: string;
    createdAt: string;
    pharmacyOrg?: OrganizationDto;
    batch?: {
      id: string;
      batchNumber?: string;
    };
  }>;
}

export interface PrescriptionListResponseDto {
  data: PrescriptionDto[];
  prescriptions?: PrescriptionDto[];
  total: number;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ValidatePrescriptionDto {
  scannedBatchProductId: string;
  batchProductId?: string;
}

export interface ValidatePrescriptionResponseDto {
  valid: boolean;
  prescription: {
    id: string;
    prescriptionChainId?: string | null;
    prescriptionHash: string;
    status: string;
    expiry: string;
    quantity: number;
    productId: string;
    productName: string;
    dosage: string;
    doctorWallet?: string;
  };
  failures: string[];
}

export interface PreparedPrescriptionDto extends PreparedTransactionDto {
  prescription: {
    id: string;
    prescriptionHash: string;
    status: string;
    expiry: string;
    issuedAt: string;
    product: ProductDto;
    doctorWallet: string;
  };
}
