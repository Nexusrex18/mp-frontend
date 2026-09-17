/* ---------------------------------------------------------------
   MedTrace — Core Domain Types
   Shared TypeScript definitions across the entire frontend.
----------------------------------------------------------------*/

export type Role =
  | "ADMIN_ROLE"
  | "MANUFACTURER_ROLE"
  | "DISTRIBUTOR_ROLE"
  | "PHARMACY_ROLE"
  | "DOCTOR_ROLE"
  | "UNREGISTERED";

export type RoleName =
  | "Admin"
  | "Manufacturer"
  | "Distributor"
  | "Pharmacy"
  | "Doctor"
  | "Unregistered";

export type DispensingType = "OTC" | "Prescription";

export type BatchStatus =
  | "Valid"
  | "InTransit"
  | "Pending"
  | "PendingAcceptance"
  | "Dispensed"
  | "Expired"
  | "Recalled"
  | "Counterfeit";

export interface IPFSDocument {
  id: string;
  name: string;
  type: "CertificateOfAnalysis" | "GMPCertificate" | "LabTestReport" | "PackagingSpec";
  cid: string;
  size: string;
  uploadedAt: string;
  uploaderRole: string;
  verified: boolean;
}

export interface CustodyEvent {
  id: string;
  timestamp: string;
  stage: "Manufactured" | "TransferredToDistributor" | "ReceivedByDistributor" | "TransferredToPharmacy" | "ReceivedByPharmacy" | "Dispensed";
  actorRole: RoleName;
  actorName: string;
  actorAddress: string;
  toActorName?: string;
  toActorAddress?: string;
  txHash: string;
  blockNumber: number;
  location: string;
  notes?: string;
  temperatureVerified?: boolean;
}

export interface BatchRecord {
  id: string; // e.g. "BAT-2026-0089"
  batchNumber: string; // e.g. "AMX-500-26"
  productName: string;
  genericName: string;
  ndcCode: string; // National Drug Code
  dosage: string;
  formulation: string; // "Capsule" | "Tablet" | "Liquid" | "Injectable"
  dispensingType: DispensingType; // OTC vs Prescription (read from chain)
  quantity: number;
  initialQuantity: number;
  unit: string;
  mfgDate: string;
  expDate: string;
  storageCondition: string; // e.g. "Store below 25°C, Dry place"
  status: BatchStatus;
  currentCustodianRole: RoleName;
  currentCustodianName: string;
  currentCustodianAddress: string;
  manufacturerName: string;
  manufacturerAddress: string;
  l2ContractAddress: string;
  mintTxHash: string;
  ipfsDocs: IPFSDocument[];
  custodyTimeline: CustodyEvent[];
  qrPayload?: string;
}

export interface PrescriptionRecord {
  id: string; // e.g. "RX-8849-B"
  prescriptionHash: string; // SHA-256 hash
  patientIdentifier: string; // Anonymized e.g. "PT-9482-X"
  patientAge?: number;
  patientGender?: string;
  drugCode: string;
  drugName: string;
  dosage: string;
  quantity: number;
  refillsAllowed: number;
  refillsRemaining: number;
  issuedAt: string;
  expiresAt: string;
  status: "Pending" | "Fulfilled" | "Expired" | "Cancelled";
  doctorName: string;
  doctorAddress: string;
  doctorLicense: string;
  instructions: string;
  fulfilledAt?: string;
  fulfilledByPharmacy?: string;
  fulfilledPharmacyAddress?: string;
  dispenseTxHash?: string;
  matchedBatchId?: string;
}

export interface DispensingRecord {
  id: string;
  timestamp: string;
  batchId: string;
  batchNumber: string;
  productName: string;
  dispensingType: DispensingType;
  quantityDispensed: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacistName: string;
  prescriptionHash?: string;
  patientIdentifier?: string;
  txHash: string;
  status: "Confirmed" | "Flagged";
}

export interface StakeholderProfile {
  id: string;
  address: string;
  role: Role;
  roleName: RoleName;
  name: string;
  organization: string;
  licenseNumber: string;
  location: string;
  verified: boolean;
  avatarColor: string;
}

export interface TxState {
  status: "idle" | "reviewing" | "pending" | "confirmed" | "error";
  txHash?: string;
  title?: string;
  description?: string;
  error?: string;
  receiptData?: Record<string, any>;
}
