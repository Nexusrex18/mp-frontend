# Backend Architecture
### Blockchain-Enabled Pharmaceutical Supply Chain — Backend Design (Final)

> Companion to `frontend-architecture-plan.md`, `Plan.md`, and `agent.md`. This document is the backend equivalent: the system design, data placement rules, module breakdown, and end-to-end flows that any implementation (human or AI agent) should build against.

---

## 1. Core Principle

> **Backend handles application logic, orchestration, and validation. PostgreSQL handles fast/queryable operational data. IPFS handles large, genuinely-public off-chain documents. Ethereum L2 provides tamper-evident, auditable supply-chain state. Smart contracts enforce critical state transitions and role-based authorization. The backend never signs blockchain transactions on a stakeholder's behalf — each role's own wallet does that directly from the frontend.**

That last sentence is the single most important architectural decision in this document — everything else follows from it.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            CLIENTS                                │
│  Manufacturer / Distributor / Pharmacy / Doctor  (own MetaMask)   │
│  Patient  (no wallet — public QR scan only)                       │
└───────────────┬───────────────────────────────┬───────────────────┘
                │                               │
         HTTPS / REST                   Direct signed tx
    (auth, validation, prep,             submission to L2
     reads, IPFS uploads)               (bypasses backend)
                │                               │
   ┌────────────▼────────────┐                  │
   │       BACKEND API        │                  │
   │  (modular monolith)      │                  │
   │                          │                  │
   │  auth · users · batches  │                  │
   │  custody · prescriptions │                  │
   │  verification (read-only)│                  │
   │  ipfs-prep · audit       │                  │
   └───┬─────────────┬───────┘                  │
       │             │                          │
 ┌─────▼─────┐ ┌─────▼─────┐                     │
 │ PostgreSQL │ │   IPFS    │                     │
 │ (+ Redis   │ │ (public   │                     │
 │  cache)    │ │  docs only:│                    │
 │            │ │  QC certs, │                    │
 │            │ │  lab       │                    │
 │            │ │  reports)  │                    │
 └─────▲──────┘ └───────────┘                     │
       │                                          │
       │ writes indexed state                     │
┌──────┴───────────┐                              │
│  EVENT LISTENER /  │◄──── subscribes to events ──┤
│      INDEXER       │                             │
└────────────────────┘                             ▼
                                        ┌────────────────────┐
                                        │   Ethereum L2       │
                                        │   (testnet, e.g.    │
                                        │   Arbitrum/Base      │
                                        │   Sepolia)           │
                                        │                      │
                                        │   Smart Contracts:   │
                                        │   Batch · Custody ·  │
                                        │   Prescription ·     │
                                        │   Dispensing         │
                                        └──────────────────────┘
```

**Read the two arrows out of "CLIENTS" carefully — they are the crux of the design:**
- Internal stakeholders talk to the Backend API for everything *except* actually submitting a state-changing blockchain transaction. Their own wallet signs and submits that transaction **directly to the L2**, bypassing the backend entirely.
- The Backend's only relationship to the blockchain is **reading** — either via the indexer (subscribing to events, keeping Postgres in sync) or via a direct read call as a cache-miss fallback for `/verify`. **The backend never has a write path to the blockchain in the current design.**

---

## 3. Data Placement Strategy

The blockchain is not a general-purpose database. Every piece of data in the system gets placed in exactly one of three tiers based on this rule:

| Tier | Put here if... | Examples |
|---|---|---|
| **On-chain (Ethereum L2)** | it must be tamper-evident, auditable, and part of the trusted supply-chain history | Batch ID, product ID/classification, manufacturer address, current custodian, batch status, IPFS CID reference, custody transfer/accept events, verification checkpoints, prescription hash + ID + doctor identity + status, dispensing events |
| **PostgreSQL (+ Redis cache)** | it's operational application data needed for fast queries, or it's sensitive and must stay access-controlled | Users, organizations, roles, product catalog, QR-to-batch mappings, **prescription content** (see §6 — deliberately *not* on IPFS), indexed copies of on-chain events, operational/audit logs |
| **IPFS** | it's a large document that is genuinely fine to be publicly fetchable by CID | Quality certificates, lab reports, other batch-level compliance documents |

**Critical rule:** prescriptions are *not* IPFS documents. IPFS is public content-addressed storage — anyone with the CID can fetch the content from any gateway, encrypted or not. Prescription content is sensitive and access-controlled, so it lives in Postgres behind authenticated pharmacy/doctor access, with only the hash/ID/status on-chain.

---

## 4. Wallet & Auth Model

Two separate uses of a wallet, never conflated:

```
1. AUTHENTICATION (proves "I control this wallet")

   Wallet ──SIWE signature──► Backend ──► Authenticated session (JWT)


2. BLOCKCHAIN AUTHORIZATION (proves "this on-chain identity performed this action")

   Wallet ──signs transaction──► Smart Contract
   (contract enforces: msg.sender has MANUFACTURER_ROLE / DISTRIBUTOR_ROLE / etc.)
```

- **Sign-In With Ethereum (SIWE)** → backend session, used for all normal API calls (fetching data, uploading docs, RBAC-gated reads).
- **Each stakeholder's own wallet** signs and submits their own state-changing transactions (`registerBatch`, `acceptCustody`, `dispense`, etc.) directly to the L2. The smart contract itself checks the role of `msg.sender` — this is real on-chain authorization, not just backend-trusted authorization.
- **No backend/service wallet exists in the core system.** It's deferred (see §11) until there's an actual backend-initiated write to justify it — there currently isn't one, since the AI/forecasting oracle has been scoped out as a future, non-core module.

---

## 5. Backend Modules (modular monolith, not microservices)

```
backend/
│
├── auth/            → SIWE verification, session/JWT issuance
├── users/            → accounts, organizations, role assignment
├── batches/          → batch registration prep, metadata validation
├── products/          → product catalog, dispensing classification rules
├── qr/                → QR generation/decoding, batch/prescription ID mapping
├── ipfs/              → document upload/pin (public docs only), CID retrieval
├── custody/            → custody transfer/accept prep & validation
├── prescriptions/       → prescription creation, private storage, pharmacy-side lookup
├── verification/         → read-only batch/prescription status checks (incl. public /verify)
├── dispensing/            → dispensing prep & policy branch (OTC vs Prescription)
├── indexer/                → event listener, chain→Postgres sync
└── audit/                    → operational/audit log
```

A modular monolith (not 10+ microservices) is the right starting shape — each module has a clear, single responsibility, but they share one deployable, one database connection pool, and one codebase, which is far easier to build and reason about for a project at this stage. Modules can be split into services later if a specific one genuinely needs independent scaling.

---

## 6. Event Listener / Indexer

Since stakeholders submit transactions directly to the L2 (bypassing the backend), Postgres would silently drift out of sync unless something actively watches the chain. This is a required component, not optional:

```
Ethereum L2
     │
Smart Contracts emit events:
  BatchRegistered · CustodyInitiated · CustodyAccepted ·
  VerificationRecorded · PrescriptionCreated · Dispensed
     │
     ▼
┌─────────────────┐
│  Event Listener  │  subscribes to contract events
│    / Indexer     │
└────────┬─────────┘
         │
    Queue / Worker   (buffers events, handles retries/reorg safety)
         │
         ▼
    PostgreSQL        (fast, queryable representation)
```

**Division of truth:** the blockchain is the source of truth; PostgreSQL is the indexed, queryable representation of it. The frontend/backend API always reads from Postgres for speed, and Postgres is always kept correct by the indexer watching the chain — never by the backend "remembering" what it told the chain to do.

---

## 7. Database Schema (PostgreSQL, indicative)

```
users
organizations
roles

products
batches
qr_codes

custody_transfers
verification_records
prescriptions          -- private content lives here, NOT on IPFS
dispensing_records

ipfs_documents         -- references only (CIDs), for public batch docs

blockchain_transactions
blockchain_events      -- raw indexed events, source for the tables above
```

Core relationship:
```
Product
   │
   └── Batch
         │
         ├── QR
         ├── IPFS Documents (public certs/reports)
         ├── Custody History
         ├── Verification History
         ├── Dispensing History
         └── (if Prescription-classified) linked Prescription record
```

---

## 8. Smart Contract Responsibilities

Contracts stay focused — application-level validation happens in the backend before a transaction is even built; contracts enforce the rules that must be trustless.

| Contract | Responsible for |
|---|---|
| `AccessControl.sol` | Role assignment/checks (`MANUFACTURER_ROLE`, `DISTRIBUTOR_ROLE`, `PHARMACY_ROLE`, `DOCTOR_ROLE`) |
| `Batch.sol` | `registerBatch()`, `getBatch()`, `updateBatchStatus()` |
| `Custody.sol` | `initiateTransfer()`, `acceptTransfer()`, `getCustodyHistory()` |
| `Prescription.sol` | `createPrescription()` (hash/ID/doctor/status), `getPrescriptionStatus()`, `markFulfilled()` |
| `Dispensing.sol` | `recordDispensing()` (OTC or Prescription branch), `getDispensingRecord()` |
| `Verification.sol` | `recordVerification()` — reserved for **meaningful authenticated checkpoints** (e.g. pharmacy verifying before dispensing), never for arbitrary public patient scans |

```
Backend
   │  application-level validation
   ▼
Smart Contract
   │  blockchain-level rules (role checks, state transitions)
   ▼
Ethereum L2
```

---

## 9. Key End-to-End Flows

### 9.1 Batch Registration
```
Manufacturer (frontend)
     │
     ├─ upload docs ──► Backend (ipfs module) ──► IPFS ──► returns CID
     │
     └─ frontend builds registerBatch(cid, productId, classification, ...)
             │
             └─ Manufacturer's own wallet signs & submits ──► Ethereum L2
                                                                     │
                                                          BatchRegistered event
                                                                     │
                                                                     ▼
                                                          Indexer → PostgreSQL
                                                                     │
                                                                     ▼
                                                            QR generated (batch ID + CID)
```
Backend's role here is entirely **prep**: validate, upload to IPFS, return the data the frontend needs to build the transaction. It never submits the transaction itself.

### 9.2 Custody Transfer & Accept
```
Manufacturer's wallet ──initiateTransfer(batchId, distributorAddr)──► L2
                                                                        │
                                                             CustodyInitiated event
                                                                        │
                                                                        ▼
                                                              Indexer → PostgreSQL
                                                        (Distributor's "Incoming" list updates)

Distributor scans QR → backend validates it matches a pending transfer to them
                     → Distributor's wallet ──acceptTransfer(batchId)──► L2
                                                                            │
                                                                 CustodyAccepted event
                                                                            │
                                                                            ▼
                                                                  Indexer → PostgreSQL
```
Same pattern repeats Distributor → Pharmacy.

### 9.3 Prescription Issuance & Dispensing
```
Doctor (authenticated) creates prescription
     │
     ├─ full content (medicine, dosage, quantity, patient ID, validity)
     │      → stored in PostgreSQL, access-controlled (NOT IPFS)
     │
     └─ Doctor's wallet ──createPrescription(hash, id, status)──► L2
                                                                     │
                                                          PrescriptionCreated event
                                                                     │
                                                                     ▼
                                                          Indexer → PostgreSQL
                                                                     │
                                                          QR generated (prescription ID)
                                                                     │
                                                          Patient carries QR to pharmacy

Pharmacy (authenticated) scans batch QR + prescription QR
     │
     ├─ backend fetches prescription content from Postgres (authenticated access)
     ├─ backend/contract checks:
     │     ✓ prescription exists & doctor authorized
     │     ✓ not expired
     │     ✓ medicine matches the batch being dispensed
     │     ✓ quantity permitted
     │     ✓ not already fulfilled
     │
     └─ if VALID → pharmacist confirms → Pharmacy's wallet ──recordDispensing(...)──► L2
                                                                                          │
                                                                                Dispensed event
                                                                                          │
                                                                                          ▼
                                                                                Indexer → PostgreSQL
                                                                            (prescription marked fulfilled)
```
The doctor does **not** re-participate at dispense time — their authorization happened once, at issuance. The pharmacy subsequently verifies that authorization through the blockchain-backed prescription record, not through a manual doctor check.

For OTC-classified batches, the same `Dispensing.sol.recordDispensing()` call happens but skips the prescription-matching branch entirely — just a pharmacist verification checklist before confirming.

### 9.4 Patient Verification (`/verify`) — read-only, always
```
Patient scans QR (no wallet)
     │
     ▼
GET /verify/{batchId}
     │
     ├─ Rate Limiter
     ├─ Redis Cache (hit? → return immediately)
     └─ Backend (verification module)
              │
              ├─ PostgreSQL index (fast path)
              │
              └─ Blockchain read call (fallback if cache/index miss — READ ONLY)
     │
     ▼
Verification Result: product, batch, manufacturer, dates, status, simplified custody trail
```
No wallet, no login, no gas, no transaction — ever. `recordVerification()` is never called from this endpoint; it's reserved for meaningful authenticated checkpoints elsewhere in the system (e.g. pharmacy's pre-dispense check).

---

## 10. Public `/verify` Endpoint — Scalability Notes

This is the most exposed, highest-traffic-potential endpoint in the system (unauthenticated, patient-facing, could be scanned at any volume). Treat these as required from day one, not later hardening:

- **Rate limiting** at the API gateway/middleware level.
- **Redis cache** in front of the Postgres/chain read, short TTL.
- Falls back to a **read-only** blockchain call only on cache/index miss — never a write, never a signed transaction.

These are implementation/scalability details, not part of the inventive concept — the patent-relevant claim is simply that the public verification interface performs read-only verification without requiring authentication or blockchain transaction submission.

---

## 11. Explicitly Deferred / Out of Scope (for now)

| Item | Why deferred | Revisit when |
|---|---|---|
| **Backend/service wallet** | No backend-initiated blockchain write currently exists in the core system | If/when an automated writer (e.g. the AI demand-forecasting oracle) is reintroduced as a real feature, not just a display module |
| **Nonce management / transaction queue** | Only relevant once a single wallet submits concurrent transactions — doesn't apply while every write is a distinct stakeholder's own signed transaction | Same trigger as above |
| **Polygon CDK / custom rollup** | That's a framework for launching your *own* L2, not just deploying to one | Only if there's a specific future need to run independent chain infrastructure; for now, deploy to one existing EVM-compatible L2 testnet (e.g. Arbitrum Sepolia or Base Sepolia — exact network decided at implementation time) |
| **Prescription encryption / multi-party key sharing** | Adds real complexity; for the prototype, authenticated access control in Postgres is sufficient | If/when this moves beyond prototype toward a production deployment with stricter data-protection requirements |

---

## 12. Non-Negotiables Summary

1. **Backend never signs or submits blockchain transactions on a stakeholder's behalf.** Each role's own wallet does that directly, so the contract can enforce real on-chain role checks against `msg.sender`.
2. **The indexer is mandatory, not optional** — it's the only thing keeping Postgres in sync once transactions bypass the backend.
3. **Patient verification is always a read.** No wallet, no auth, no gas, no `recordVerification()` call.
4. **Prescriptions never touch IPFS.** Sensitive content stays in Postgres behind authenticated access; only hash/ID/status/doctor go on-chain.
5. **Data placement follows the three-tier rule in §3** — don't put operational/queryable data on-chain, and don't put sensitive data on IPFS.
6. **One existing EVM L2 testnet**, not a custom rollup — Polygon CDK and similar frameworks are future scope only.
7. **No backend/service wallet exists yet** — it's introduced only alongside an actual feature that needs backend-initiated writes.
