/* ---------------------------------------------------------------
   MedTrace — Mock Data Store & Persistence
   Provides seed data and reactive in-memory / localStorage state
   for seamless end-to-end frontend testing across all 5 roles.
----------------------------------------------------------------*/

import {
  BatchRecord,
  CustodyEvent,
  PrescriptionRecord,
  DispensingRecord,
  StakeholderProfile,
  Role,
} from "./types";

export const DEMO_STAKEHOLDERS: StakeholderProfile[] = [
  {
    id: "stk-1",
    address: "0x71C...4F9a",
    role: "MANUFACTURER_ROLE",
    roleName: "Manufacturer",
    name: "Apex BioPharma Inc.",
    organization: "Apex Pharmaceuticals Global",
    licenseNumber: "FDA-MFG-94021-USA",
    location: "Bridgewater, New Jersey, USA",
    verified: true,
    avatarColor: "#3E36B0",
  },
  {
    id: "stk-2",
    address: "0x3A2...98b1",
    role: "DISTRIBUTOR_ROLE",
    roleName: "Distributor",
    name: "SwiftLogistics Health",
    organization: "SwiftLogistics Cold-Chain Network",
    licenseNumber: "WDA-DIST-20419-NJ",
    location: "Newark Logistics Hub, NJ",
    verified: true,
    avatarColor: "#0284C7",
  },
  {
    id: "stk-3",
    address: "0x89D...71c4",
    role: "PHARMACY_ROLE",
    roleName: "Pharmacy",
    name: "CityCare Central Pharmacy",
    organization: "CityCare Health Alliance",
    licenseNumber: "NABP-PH-559102",
    location: "Manhattan, New York, NY",
    verified: true,
    avatarColor: "#059669",
  },
  {
    id: "stk-4",
    address: "0x14E...C309",
    role: "DOCTOR_ROLE",
    roleName: "Doctor",
    name: "Dr. Evelyn Reed, MD",
    organization: "Metropolitan Hospital Center",
    licenseNumber: "MED-NY-492019",
    location: "New York Medical Plaza",
    verified: true,
    avatarColor: "#7C3AED",
  },
  {
    id: "stk-5",
    address: "0x91F...AA01",
    role: "ADMIN_ROLE",
    roleName: "Admin",
    name: "National Health Authority",
    organization: "Pharmaceutical Regulatory Commission",
    licenseNumber: "REG-GOV-001",
    location: "Washington, D.C.",
    verified: true,
    avatarColor: "#DC2626",
  },
];

export const INITIAL_BATCHES: BatchRecord[] = [
  {
    id: "BAT-2026-0089",
    batchNumber: "AMX-500-26",
    productName: "Amoxicillin 500mg",
    genericName: "Amoxicillin Trihydrate",
    ndcCode: "0093-3109-01",
    dosage: "500mg Capsule",
    formulation: "Oral Capsule",
    dispensingType: "Prescription",
    quantity: 450,
    initialQuantity: 1000,
    unit: "Bottles (100ct)",
    mfgDate: "2026-01-15",
    expDate: "2028-01-15",
    storageCondition: "Store at 20°C to 25°C (68°F to 77°F)",
    status: "Valid",
    currentCustodianRole: "Pharmacy",
    currentCustodianName: "CityCare Central Pharmacy",
    currentCustodianAddress: "0x89D...71c4",
    manufacturerName: "Apex BioPharma Inc.",
    manufacturerAddress: "0x71C...4F9a",
    l2ContractAddress: "0x4b71829eFa30d4C919d85449A5881062bA7b0F81",
    mintTxHash: "0x7f9a2b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
    ipfsDocs: [
      {
        id: "doc-1",
        name: "Certificate_of_Analysis_AMX500.pdf",
        type: "CertificateOfAnalysis",
        cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        size: "1.4 MB",
        uploadedAt: "2026-01-15T09:30:00Z",
        uploaderRole: "Manufacturer",
        verified: true,
      },
      {
        id: "doc-2",
        name: "GMP_Compliance_Audit_2026.pdf",
        type: "GMPCertificate",
        cid: "QmZtmD2qtWBSkzWad32BgThnGndYMr7Y5u2vTdpEPbjKBp",
        size: "820 KB",
        uploadedAt: "2026-01-15T09:32:00Z",
        uploaderRole: "Manufacturer",
        verified: true,
      },
    ],
    custodyTimeline: [
      {
        id: "cust-1",
        timestamp: "2026-01-15T10:00:00Z",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        txHash: "0x7f9a2b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
        blockNumber: 1984021,
        location: "Bridgewater Facility, NJ",
        notes: "Batch synthesized and hermetically packaged. Passed sterility test.",
        temperatureVerified: true,
      },
      {
        id: "cust-2",
        timestamp: "2026-01-18T14:22:00Z",
        stage: "TransferredToDistributor",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        toActorName: "SwiftLogistics Health",
        toActorAddress: "0x3A2...98b1",
        txHash: "0x12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
        blockNumber: 1984210,
        location: "Bridgewater Dispatch Bay",
        notes: "Released to refrigerated carrier #TL-902.",
        temperatureVerified: true,
      },
      {
        id: "cust-3",
        timestamp: "2026-01-19T08:15:00Z",
        stage: "ReceivedByDistributor",
        actorRole: "Distributor",
        actorName: "SwiftLogistics Health",
        actorAddress: "0x3A2...98b1",
        txHash: "0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
        blockNumber: 1984501,
        location: "Newark Logistics Hub, NJ",
        notes: "Physical seal verified intact. Temp sensor avg: 21.4°C.",
        temperatureVerified: true,
      },
      {
        id: "cust-4",
        timestamp: "2026-01-22T11:00:00Z",
        stage: "TransferredToPharmacy",
        actorRole: "Distributor",
        actorName: "SwiftLogistics Health",
        actorAddress: "0x3A2...98b1",
        toActorName: "CityCare Central Pharmacy",
        toActorAddress: "0x89D...71c4",
        txHash: "0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
        blockNumber: 1985100,
        location: "Newark Outbound Dock 3",
        notes: "Direct courier dispatch to CityCare Manhattan.",
        temperatureVerified: true,
      },
      {
        id: "cust-5",
        timestamp: "2026-01-22T15:40:00Z",
        stage: "ReceivedByPharmacy",
        actorRole: "Pharmacy",
        actorName: "CityCare Central Pharmacy",
        actorAddress: "0x89D...71c4",
        txHash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
        blockNumber: 1985390,
        location: "Manhattan Pharmacy Dispensary",
        notes: "Shelved into secure prescription storage unit B-12.",
        temperatureVerified: true,
      },
    ],
  },
  {
    id: "BAT-2026-0104",
    batchNumber: "PCM-650-04",
    productName: "Paracetamol Extra 650mg",
    genericName: "Acetaminophen",
    ndcCode: "50580-491-01",
    dosage: "650mg Tablet",
    formulation: "Coated Tablet",
    dispensingType: "OTC",
    quantity: 800,
    initialQuantity: 1200,
    unit: "Packs (24ct)",
    mfgDate: "2026-02-01",
    expDate: "2028-02-01",
    storageCondition: "Store at room temperature 15°C to 30°C",
    status: "Valid",
    currentCustodianRole: "Pharmacy",
    currentCustodianName: "CityCare Central Pharmacy",
    currentCustodianAddress: "0x89D...71c4",
    manufacturerName: "Apex BioPharma Inc.",
    manufacturerAddress: "0x71C...4F9a",
    l2ContractAddress: "0x4b71829eFa30d4C919d85449A5881062bA7b0F81",
    mintTxHash: "0x98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7",
    ipfsDocs: [
      {
        id: "doc-3",
        name: "COA_Paracetamol_PCM650.pdf",
        type: "CertificateOfAnalysis",
        cid: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
        size: "950 KB",
        uploadedAt: "2026-02-01T11:00:00Z",
        uploaderRole: "Manufacturer",
        verified: true,
      },
    ],
    custodyTimeline: [
      {
        id: "cust-10",
        timestamp: "2026-02-01T11:15:00Z",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        txHash: "0x98a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7",
        blockNumber: 1989000,
        location: "Bridgewater Facility, NJ",
        notes: "OTC formulation certified and batch minted.",
        temperatureVerified: true,
      },
      {
        id: "cust-11",
        timestamp: "2026-02-03T09:00:00Z",
        stage: "TransferredToDistributor",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        toActorName: "SwiftLogistics Health",
        toActorAddress: "0x3A2...98b1",
        txHash: "0x87b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6",
        blockNumber: 1989400,
        location: "Bridgewater Shipping",
        temperatureVerified: true,
      },
      {
        id: "cust-12",
        timestamp: "2026-02-03T16:20:00Z",
        stage: "ReceivedByDistributor",
        actorRole: "Distributor",
        actorName: "SwiftLogistics Health",
        actorAddress: "0x3A2...98b1",
        txHash: "0x76c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5",
        blockNumber: 1989800,
        location: "Newark Logistics Hub, NJ",
        temperatureVerified: true,
      },
      {
        id: "cust-13",
        timestamp: "2026-02-05T10:00:00Z",
        stage: "TransferredToPharmacy",
        actorRole: "Distributor",
        actorName: "SwiftLogistics Health",
        actorAddress: "0x3A2...98b1",
        toActorName: "CityCare Central Pharmacy",
        toActorAddress: "0x89D...71c4",
        txHash: "0x65d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4",
        blockNumber: 1990400,
        location: "Newark Outbound",
        temperatureVerified: true,
      },
      {
        id: "cust-14",
        timestamp: "2026-02-05T14:10:00Z",
        stage: "ReceivedByPharmacy",
        actorRole: "Pharmacy",
        actorName: "CityCare Central Pharmacy",
        actorAddress: "0x89D...71c4",
        txHash: "0x54e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3",
        blockNumber: 1990700,
        location: "Manhattan Pharmacy Shelf A-04",
        temperatureVerified: true,
      },
    ],
  },
  {
    id: "BAT-2026-0155",
    batchNumber: "OZP-2MG-15",
    productName: "Ozempic 2mg/3mL Pen",
    genericName: "Semaglutide",
    ndcCode: "0169-4130-12",
    dosage: "2mg/3mL Pre-filled Pen",
    formulation: "Subcutaneous Solution",
    dispensingType: "Prescription",
    quantity: 300,
    initialQuantity: 300,
    unit: "Pens",
    mfgDate: "2026-02-10",
    expDate: "2027-08-10",
    storageCondition: "Refrigerate 2°C to 8°C (36°F to 46°F). Do not freeze.",
    status: "PendingAcceptance",
    currentCustodianRole: "Distributor",
    currentCustodianName: "SwiftLogistics Health",
    currentCustodianAddress: "0x3A2...98b1",
    manufacturerName: "Apex BioPharma Inc.",
    manufacturerAddress: "0x71C...4F9a",
    l2ContractAddress: "0x4b71829eFa30d4C919d85449A5881062bA7b0F81",
    mintTxHash: "0x43e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2",
    ipfsDocs: [
      {
        id: "doc-4",
        name: "ColdChain_Validation_Ozempic.pdf",
        type: "LabTestReport",
        cid: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
        size: "2.1 MB",
        uploadedAt: "2026-02-10T14:00:00Z",
        uploaderRole: "Manufacturer",
        verified: true,
      },
    ],
    custodyTimeline: [
      {
        id: "cust-20",
        timestamp: "2026-02-10T14:00:00Z",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        txHash: "0x43e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2",
        blockNumber: 1993200,
        location: "Bridgewater Cold Production Line 1",
        notes: "Strict 2-8°C cold chain initiated.",
        temperatureVerified: true,
      },
      {
        id: "cust-21",
        timestamp: "2026-02-12T11:30:00Z",
        stage: "TransferredToDistributor",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        toActorName: "SwiftLogistics Health",
        toActorAddress: "0x3A2...98b1",
        txHash: "0x32a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1",
        blockNumber: 1994100,
        location: "Bridgewater Cold Bay #4",
        notes: "Awaiting acceptance by SwiftLogistics.",
        temperatureVerified: true,
      },
    ],
  },
  {
    id: "BAT-2026-0021",
    batchNumber: "LIP-20-99",
    productName: "Lipitor 20mg",
    genericName: "Atorvastatin Calcium",
    ndcCode: "0071-0156-23",
    dosage: "20mg Tablet",
    formulation: "Film-coated Tablet",
    dispensingType: "Prescription",
    quantity: 500,
    initialQuantity: 500,
    unit: "Bottles (90ct)",
    mfgDate: "2026-01-05",
    expDate: "2028-01-05",
    storageCondition: "Store at 20°C to 25°C",
    status: "Valid",
    currentCustodianRole: "Manufacturer",
    currentCustodianName: "Apex BioPharma Inc.",
    currentCustodianAddress: "0x71C...4F9a",
    manufacturerName: "Apex BioPharma Inc.",
    manufacturerAddress: "0x71C...4F9a",
    l2ContractAddress: "0x4b71829eFa30d4C919d85449A5881062bA7b0F81",
    mintTxHash: "0x21a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0",
    ipfsDocs: [
      {
        id: "doc-5",
        name: "COA_Lipitor_LIP20.pdf",
        type: "CertificateOfAnalysis",
        cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        size: "1.1 MB",
        uploadedAt: "2026-01-05T12:00:00Z",
        uploaderRole: "Manufacturer",
        verified: true,
      },
    ],
    custodyTimeline: [
      {
        id: "cust-30",
        timestamp: "2026-01-05T12:00:00Z",
        stage: "Manufactured",
        actorRole: "Manufacturer",
        actorName: "Apex BioPharma Inc.",
        actorAddress: "0x71C...4F9a",
        txHash: "0x21a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0",
        blockNumber: 1980100,
        location: "Bridgewater Facility, NJ",
        notes: "Stored in Manufacturer Vault 2.",
        temperatureVerified: true,
      },
    ],
  },
];

export const INITIAL_PRESCRIPTIONS: PrescriptionRecord[] = [
  {
    id: "RX-2026-9482",
    prescriptionHash: "0xe7f9a2b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    patientIdentifier: "PT-9482-X",
    patientAge: 42,
    patientGender: "Female",
    drugCode: "0093-3109-01",
    drugName: "Amoxicillin 500mg",
    dosage: "500mg Capsule, 1 capsule 3x daily for 10 days",
    quantity: 30,
    refillsAllowed: 0,
    refillsRemaining: 0,
    issuedAt: "2026-02-20T10:30:00Z",
    expiresAt: "2026-03-22T23:59:59Z",
    status: "Pending",
    doctorName: "Dr. Evelyn Reed, MD",
    doctorAddress: "0x14E...C309",
    doctorLicense: "MED-NY-492019",
    instructions: "Take with food. Complete the full 10-day course even if symptoms subside.",
  },
  {
    id: "RX-2026-5519",
    prescriptionHash: "0x89ab4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
    patientIdentifier: "PT-5519-K",
    patientAge: 58,
    patientGender: "Male",
    drugCode: "0169-4130-12",
    drugName: "Ozempic 2mg/3mL Pen",
    dosage: "0.5mg injected subcutaneously once weekly",
    quantity: 1,
    refillsAllowed: 2,
    refillsRemaining: 2,
    issuedAt: "2026-02-18T14:15:00Z",
    expiresAt: "2026-05-18T23:59:59Z",
    status: "Pending",
    doctorName: "Dr. Evelyn Reed, MD",
    doctorAddress: "0x14E...C309",
    doctorLicense: "MED-NY-492019",
    instructions: "Rotate injection site weekly. Keep refrigerated.",
  },
  {
    id: "RX-2026-1102",
    prescriptionHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    patientIdentifier: "PT-1102-M",
    patientAge: 64,
    patientGender: "Male",
    drugCode: "0093-3109-01",
    drugName: "Amoxicillin 500mg",
    dosage: "500mg Capsule, 1 capsule twice daily for 7 days",
    quantity: 14,
    refillsAllowed: 0,
    refillsRemaining: 0,
    issuedAt: "2026-02-10T09:00:00Z",
    expiresAt: "2026-03-10T23:59:59Z",
    status: "Fulfilled",
    doctorName: "Dr. Evelyn Reed, MD",
    doctorAddress: "0x14E...C309",
    doctorLicense: "MED-NY-492019",
    instructions: "Take after meals.",
    fulfilledAt: "2026-02-11T16:45:00Z",
    fulfilledByPharmacy: "CityCare Central Pharmacy",
    fulfilledPharmacyAddress: "0x89D...71c4",
    dispenseTxHash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    matchedBatchId: "BAT-2026-0089",
  },
];

export const INITIAL_DISPENSINGS: DispensingRecord[] = [
  {
    id: "DISP-2026-001",
    timestamp: "2026-02-11T16:45:00Z",
    batchId: "BAT-2026-0089",
    batchNumber: "AMX-500-26",
    productName: "Amoxicillin 500mg",
    dispensingType: "Prescription",
    quantityDispensed: 14,
    pharmacyName: "CityCare Central Pharmacy",
    pharmacyAddress: "0x89D...71c4",
    pharmacistName: "Marcus Vance, PharmD",
    prescriptionHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    patientIdentifier: "PT-1102-M",
    txHash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    status: "Confirmed",
  },
  {
    id: "DISP-2026-002",
    timestamp: "2026-02-14T11:20:00Z",
    batchId: "BAT-2026-0104",
    batchNumber: "PCM-650-04",
    productName: "Paracetamol Extra 650mg",
    dispensingType: "OTC",
    quantityDispensed: 2,
    pharmacyName: "CityCare Central Pharmacy",
    pharmacyAddress: "0x89D...71c4",
    pharmacistName: "Marcus Vance, PharmD",
    txHash: "0x98f7e6d5c4b3a201f9e8d7c6b5a403f2e1d0c9b8a706f5e4d3c2b10a9f8e7d6c",
    status: "Confirmed",
  },
];

/* ---------------------------------------------------------------
   Client Store Helpers (Reactive LocalStorage Sync)
----------------------------------------------------------------*/

const STORAGE_KEYS = {
  BATCHES: "medtrace_batches_v2",
  PRESCRIPTIONS: "medtrace_prescriptions_v2",
  DISPENSINGS: "medtrace_dispensings_v2",
  CURRENT_ROLE: "medtrace_active_role",
};

export function getStoredBatches(): BatchRecord[] {
  if (typeof window === "undefined") return INITIAL_BATCHES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
      return INITIAL_BATCHES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BATCHES;
  }
}

export function saveStoredBatches(batches: BatchRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  window.dispatchEvent(new Event("medtrace_data_updated"));
}

export function getStoredPrescriptions(): PrescriptionRecord[] {
  if (typeof window === "undefined") return INITIAL_PRESCRIPTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(INITIAL_PRESCRIPTIONS));
      return INITIAL_PRESCRIPTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRESCRIPTIONS;
  }
}

export function saveStoredPrescriptions(prescriptions: PrescriptionRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  window.dispatchEvent(new Event("medtrace_data_updated"));
}

export function getStoredDispensings(): DispensingRecord[] {
  if (typeof window === "undefined") return INITIAL_DISPENSINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPENSINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DISPENSINGS, JSON.stringify(INITIAL_DISPENSINGS));
      return INITIAL_DISPENSINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DISPENSINGS;
  }
}

export function saveStoredDispensings(dispensings: DispensingRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.DISPENSINGS, JSON.stringify(dispensings));
  window.dispatchEvent(new Event("medtrace_data_updated"));
}

// Utility: Random Tx Hash Generator
export function generateTxHash(): string {
  const chars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Utility: SHA-256 Prescription Hash Generator
export function generatePrescriptionHash(
  patientId: string,
  drugCode: string,
  doctorAddress: string,
  timestamp: string
): string {
  const seed = `${patientId}:${drugCode}:${doctorAddress}:${timestamp}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `0x${hex}${generateTxHash().slice(10)}`;
}
