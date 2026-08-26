# fronendplan.md
### Implementation Roadmap — Blockchain-Enabled Pharmaceutical Supply Chain Frontend

> Source of truth for scope/design: `frontend-architecture-plan.md` (v2). This file is the **execution roadmap** — build order, per-page detail, page-to-page connections, and definition-of-done. If the two ever disagree, `frontend-architecture-plan.md` wins on *what* to build; this file governs *in what order, with what data, and how it all connects*.

---

## 0. Goal Statement

Build a role-based Web3 dApp for pharmaceutical batch traceability with:
- 5 authenticated internal roles: Admin, Manufacturer, Distributor, Pharmacy, Doctor (conditional).
- 1 fully public, wallet-free patient verification surface.
- Custody tracked end-to-end on an Ethereum L2 (Arbitrum/Base/Polygon CDK), documents on IPFS.
- Dispensing auto-branches (OTC vs Prescription) based on on-chain batch metadata — never a manual pharmacist choice.
- AI/Demand Intelligence is an isolated, removable, optional module.

**Core narrative to preserve at every step:** Create → Track → Transfer → Verify → Dispense → Verify as Patient.

---

## 1. Tech Stack (confirmed)

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Web3 | Ethers.js or Viem + MetaMask |
| Data fetching / caching | React Query (TanStack Query) |
| Off-chain storage | IPFS (Pinata/Infura gateway) |
| Chain | L2 rollup testnet (Arbitrum Sepolia / Base Sepolia / Polygon CDK) |
| Styling | TBD at implementation time (not blocking architecture) |
| QR | `html5-qrcode` or equivalent camera-based scanner lib |

---

## 2. Folder Structure (target)

```
/app
  /(public)
    /page.tsx                → Landing
    /verify/page.tsx         → Patient verification
    /verify/report/page.tsx  → Report Issue
  /auth/connect/page.tsx     → Wallet connect + role redirect
  /admin/...
  /manufacturer/...
  /distributor/...
  /pharmacy/...
  /doctor/...
  /unauthorized/page.tsx
/components
  /shared        → NavbarRoleAware, WalletConnectButton, NetworkGuard,
                    QRScannerModal, QRCodeDisplay, StatusBadge,
                    CustodyTimeline, TxStateBanner, EmptyState,
                    DataTable, IPFSDocPreview
  /pharmacy      → OTCDispenseForm, PrescriptionDispenseForm
  /manufacturer  → CreateBatchWizard
/lib
  /web3          → contract ABIs, provider setup, role-lookup hook
  /ipfs          → upload/fetch helpers
  /hooks         → useRole, useTxState, useBatch, useQRScanner
/context
  WalletContext, RoleContext, TxStateContext
```

---

## 3. Whole-App Page Connection Map

This is the map to check before building any single page — every page exists because something links *into* it and it links *out* to something else. Cross-role connections (QR handoffs, alert feeds) are the parts most likely to be missed if pages are built in isolation.

```
                              ┌───────────────┐
                              │   Landing (/) │
                              └──┬─────────┬──┘
                    "Verify a    │         │  "I'm a
                     Medicine"   │         │   Stakeholder"
                                 ▼         ▼
                      ┌──────────────┐  ┌────────────────┐
                      │   /verify    │  │ /auth/connect   │
                      └──────┬───────┘  └───────┬────────┘
                     invalid │                  │ role lookup
                     result  ▼                  ▼
              ┌──────────────────────┐   ┌──────────────────────────┐
              │  /verify/report      │   │ redirects to:             │
              │  (feeds Admin/Alerts)│   │ /admin /manufacturer      │
              └──────────┬───────────┘   │ /distributor /pharmacy    │
                         │                │ /doctor  or /unauthorized │
                         ▼                └──────────┬────────────────┘
                 ┌───────────────┐                    │
                 │  Admin/Alerts │◄───────────────────┘ (role-protected area)
                 └───────────────┘

  CROSS-ROLE QR / DATA HANDOFFS (the connective tissue of the whole app):

  [Manufacturer: Create Batch] ──generates QR──► [Distributor: Scan & Accept]
              │                                          │
              └── writes Batch record on-chain ──────────┘── reads on scan
                                                            │
  [Distributor: Transfer] ──same QR, new owner──► [Pharmacy: Incoming/Accept]
                                                            │
  [Doctor: New Prescription] ──generates prescription QR──► [Pharmacy: Dispense
                                                              → Prescription sub-screen]
                                                            │
  [Pharmacy: Dispense] ──writes dispensing event on-chain──► visible everywhere:
                                                              - /verify (patient)
                                                              - any role's Batch Detail
                                                              - Admin/Audit Log

  [Any Batch Detail page, any role] ──"View on Block Explorer"──► external explorer
  [Every mutating action, every role] ──uses──► TxStateBanner (Pending → Confirmed)
  [/admin/intelligence] ──reads (never writes core state)──► SupplyManager.sol output
                          (isolated: no arrow feeds INTO the core flow from here)
```

---

## 4. Build Phases — Detailed Page Specs

For every page below: **Purpose**, **Built from** (shared components used), **Data in** (what it reads on load — chain/IPFS), **Data out** (what it writes/submits), **Comes from** (entry points), **Goes to** (exit points), and phase-level **Definition of done**.

---

### Phase 0 — Foundation (blocking everything else)
- [ ] Next.js app scaffold, routing skeleton matching §3's map
- [ ] Web3 provider setup — read-only provider for public pages; wallet-connected provider for internal pages
- [ ] `AccessControl.sol` role-lookup hook (`useRole`)
- [ ] `NetworkGuard` (detect wrong chain, prompt switch to L2)
- [ ] Two layout shells: **Public Shell** (zero wallet UI, ever) and **Internal Shell** (role-aware sidebar + wallet button + `NetworkGuard`)

**Definition of done:** every route in §3 resolves to the correct shell with stubbed data; Public Shell literally cannot render a wallet button even if a developer tries to add one carelessly (enforce via layout-level component exclusion, not just convention).

---

### Phase 1 — Shared Components Library
Build once, reuse everywhere.

| Component | Used by (forward reference) | Key states to handle |
|---|---|---|
| `StatusBadge` | Every Batch Detail, every list, `/verify` | Valid / Expired / Recalled / Pending / Counterfeit |
| `CustodyTimeline` | All internal Batch Details (`full` mode), `/verify` (`simplified` mode) | empty (no history yet), 1-hop, multi-hop |
| `QRScannerModal` | Distributor Scan&Accept, Pharmacy Incoming + Dispense, Doctor (to look up existing rx), `/verify` | camera permission denied, no QR in frame, decode success, decode failure |
| `QRCodeDisplay` | Manufacturer Create Batch (success step), Doctor New Prescription | loading (generating), ready, print/download triggered |
| `TxStateBanner` | every mutating page across every role | idle, awaiting wallet confirmation, pending on-chain, confirmed, failed/reverted |
| `DataTable` | My Batches, Inventory (x2), Dispensing History, Stakeholders, Batch Registry, Audit Log, Prescription History | empty, loading, paginated, filtered |
| `EmptyState` | any list page with zero rows | — |
| `IPFSDocPreview` | Batch Detail (internal), Create Batch review step | loading, loaded, fetch failed |

**Definition of done:** each component demoed in isolation with all states above before being wired into a real page.

---

### Phase 2 — Public Surface (patient-facing, highest trust sensitivity)

#### `/` Landing
- **Purpose:** entry point, explains the system, routes visitors to the right side of the app.
- **Built from:** hero section, "how it works" strip (static content), two CTA buttons.
- **Data in:** none (fully static).
- **Data out:** none.
- **Comes from:** direct visit / external link.
- **Goes to:** `/verify` ("Verify a Medicine"), `/auth/connect` ("I'm a Stakeholder").

#### `/verify` Patient Verification
- **Purpose:** the only patient-facing page — scan or type a Batch ID, get a plain-language authenticity result.
- **Built from:** `QRScannerModal`, `StatusBadge`, `CustodyTimeline` (`simplified` mode).
- **Data in:** read-only call `getBatch(batchId)` against the L2 contract (via public RPC, no wallet).
- **Data out:** none — this page never writes to chain.
- **Comes from:** Landing, direct link/QR sticker on physical packaging.
- **Goes to:** `/verify/report` (only on ❌ Not Found or ⚠️ Expired/Recalled result).
- **Copy rule:** zero blockchain jargon — no "gas," "wallet," "tx hash," "smart contract."

#### `/verify/report` Report Issue
- **Purpose:** lets a patient flag a suspected counterfeit or problem, without needing a wallet.
- **Built from:** simple form (photo upload optional, location, free-text description).
- **Data in:** the Batch ID / result context passed from `/verify` (if arriving from there).
- **Data out:** submitted off-chain to a moderation queue/table — **not** written to the blockchain directly.
- **Comes from:** `/verify` (bad result state) — should also be reachable standalone for a general report.
- **Goes to:** confirmation screen only; the underlying record surfaces later in **Admin → Alerts**.
- **Open question (unresolved):** anonymous-only vs. optional contact field — resolve before closing this phase.

#### `/auth/connect` Wallet Connect + Role Detection
- **Purpose:** the single doorway into every internal role.
- **Built from:** `WalletConnectButton`, `NetworkGuard`.
- **Data in:** on connect, calls `AccessControl.sol.getRole(address)`.
- **Data out:** none (read-only role lookup).
- **Comes from:** Landing ("I'm a Stakeholder"), or a stakeholder bookmarking it directly.
- **Goes to:** the matching role dashboard (`/admin`, `/manufacturer`, `/distributor`, `/pharmacy`, `/doctor`) **or** `/unauthorized` if no role found.

#### `/unauthorized`
- **Purpose:** graceful landing for a connected wallet with no recognized role.
- **Built from:** message + "Request Access" form.
- **Data out:** submits a request that surfaces in **Admin → Stakeholder Management** as a pending item.
- **Comes from:** `/auth/connect` (no role match).
- **Goes to:** back to `/auth/connect` once approved (user reconnects/refreshes).

**Phase 2 definition of done:** `/verify` and `/verify/report` fully usable with zero wallet installed; copy audit passes; a Report Issue submission is visible (even as a stub) in a data store that Phase 7's Admin/Alerts can later read.

---

### Phase 3 — Manufacturer (first internal role, establishes patterns for all others)

#### `/manufacturer` Dashboard
- **Purpose:** overview + fastest path to the most common action.
- **Built from:** stat cards (batches created, in transit, dispensed), "Create New Batch" CTA.
- **Data in:** aggregate reads over the manufacturer's own batches (filtered `getBatchesByOwner(address)` or equivalent).
- **Comes from:** `/auth/connect` redirect.
- **Goes to:** `/manufacturer/batches/new`, `/manufacturer/batches`.

#### `/manufacturer/batches/new` Create Batch (4-step wizard)
- **Purpose:** register a new physical batch and mint its digital identity.
- **Built from:** `CreateBatchWizard`, `IPFSDocPreview` (review step), `QRCodeDisplay` (success step), `TxStateBanner`.
- **Steps & data captured:**
  1. Product Info — name, dosage
  2. **Dispensing Classification** — OTC or Prescription (based on regulatory classification, not freely editable later)
  3. Dates/Qty + document upload → IPFS → returns CID
  4. Review & Submit
- **Data out:** `createBatch(...)` write, referencing the IPFS CID; on success, QR generated encoding Batch ID + CID.
- **Comes from:** Manufacturer Dashboard.
- **Goes to:** success screen → `/manufacturer/batches/[id]` (the newly created batch's detail page); QR gets printed and physically attached — **this QR is the object every downstream role scans**.

#### `/manufacturer/batches` My Batches
- **Purpose:** list/manage everything this manufacturer has created.
- **Built from:** `DataTable`, `StatusBadge`, status filters.
- **Data in:** manufacturer's batch list.
- **Comes from:** Dashboard.
- **Goes to:** `/manufacturer/batches/[id]` per row.

#### `/manufacturer/batches/[id]` Batch Detail (Internal)
- **Purpose:** full detail + action hub for one batch, while manufacturer still holds custody.
- **Built from:** `CustodyTimeline` (`full`), `StatusBadge`, `IPFSDocPreview`, `QRCodeDisplay` (re-download), "View on Block Explorer" link.
- **Data in:** full batch record + custody history + linked IPFS docs.
- **Comes from:** My Batches, Create Batch success screen.
- **Goes to:** `/manufacturer/batches/[id]/transfer` (only while manufacturer is current custodian).

#### `/manufacturer/batches/[id]/transfer` Transfer Custody
- **Purpose:** hand a batch off to a distributor.
- **Built from:** distributor selector (dropdown of registered distributors), `TxStateBanner`.
- **Data out:** `transferCustody(batchId, distributorAddress)` write.
- **Comes from:** Batch Detail.
- **Goes to:** back to Batch Detail, status now "Pending Distributor Acceptance" — **this is the state Phase 4's Distributor/Incoming reads.**

**Phase 3 definition of done:** full create → transfer flow works end-to-end against a testnet L2, including IPFS upload and QR generation/print; the generated QR is a real artifact Phase 4 can scan.

---

### Phase 4 — Distributor

#### `/distributor` Dashboard
- **Purpose:** overview.
- **Data in:** counts — pending incoming, in-warehouse, dispatched.
- **Comes from:** `/auth/connect` redirect.
- **Goes to:** `/distributor/incoming`, `/distributor/inventory`.

#### `/distributor/incoming` Incoming Shipments
- **Purpose:** list of batches a manufacturer has initiated a transfer for, awaiting this distributor's acceptance.
- **Built from:** `DataTable` with "Scan to Accept" action.
- **Data in:** batches where `pendingCustodian == this distributor address`.
- **Comes from:** Dashboard.
- **Goes to:** `/distributor/scan`.

#### `/distributor/scan` Scan & Accept Custody
- **Purpose:** the physical receiving step.
- **Built from:** `QRScannerModal`, batch summary card, `TxStateBanner`.
- **Data in:** decoded Batch ID → fetch batch record → check it matches a pending transfer to this address.
- **Data out:** `acceptCustody(batchId)` write.
- **Comes from:** Incoming Shipments ("Scan to Accept").
- **Goes to:** on success, batch moves into `/distributor/inventory`.

#### `/distributor/inventory` Inventory
- **Purpose:** batches currently held.
- **Built from:** `DataTable`, `StatusBadge`.
- **Comes from:** Dashboard, post-accept redirect from Scan & Accept.
- **Goes to:** `/distributor/transfer` (bulk-select), `/distributor/batches/[id]`.

#### `/distributor/transfer` Transfer to Pharmacy
- **Purpose:** outgoing handoff.
- **Built from:** batch multi-select, pharmacy selector, `TxStateBanner`.
- **Data out:** `transferCustody(batchId, pharmacyAddress)` per selected batch.
- **Comes from:** Inventory.
- **Goes to:** back to Inventory, batch status now "Pending Pharmacy Acceptance" — **the state Phase 5's Pharmacy/Incoming reads.**

#### `/distributor/batches/[id]` Batch Detail (Internal)
- Same shared component pattern as Manufacturer's Batch Detail (§Phase 3).

**Phase 4 definition of done:** a batch created in Phase 3 can be scanned, accepted, and re-transferred by a Distributor test account; the "Pending Pharmacy Acceptance" state is correctly readable by Phase 5.

---

### Phase 5 — Pharmacy (highest-risk section)

#### `/pharmacy` Dashboard
- **Purpose:** overview, with "Scan Medicine" as the single most prominent action.
- **Built from:** stat cards (total batches, low stock, expiring soon), recent activity feed, large "Scan Medicine" CTA.
- **Data in:** aggregate reads over pharmacy's inventory.
- **Comes from:** `/auth/connect` redirect.
- **Goes to:** `/pharmacy/dispense`, `/pharmacy/incoming`, `/pharmacy/inventory`.

#### `/pharmacy/incoming` Incoming / Accept Custody
- **Purpose:** same pattern as Distributor's accept flow.
- **Built from:** `DataTable` + `QRScannerModal` + `TxStateBanner`.
- **Data in:** batches where `pendingCustodian == this pharmacy address` (written by Phase 4's Transfer).
- **Data out:** `acceptCustody(batchId)`.
- **Comes from:** Dashboard.
- **Goes to:** `/pharmacy/inventory` on success.

#### `/pharmacy/inventory` Inventory
- **Purpose:** current stock on hand.
- **Built from:** `DataTable`, expiry-warning highlighting.
- **Comes from:** Dashboard, post-accept.
- **Goes to:** `/pharmacy/batches/[id]`.

#### `/pharmacy/dispense` Dispense Medicine — the core screen
- **Purpose:** scan a medicine, auto-detect its Dispensing Type, and complete the correct sub-flow.
- **Built from:** `QRScannerModal` → batch summary card (shows Dispensing Type read from chain, **not editable**) → auto-branch to one of:
  - **OTC sub-screen** (`OTCDispenseForm`): quantity field, pharmacist checklist (batch verified / medicine verified), no prescription field rendered at all.
  - **Prescription sub-screen** (`PrescriptionDispenseForm`): scan/enter Prescription Hash (via `QRScannerModal` again, scanning the patient's doctor-issued QR from Phase 6), validated against `Dispensing.sol` (unfulfilled, non-expired, matching drug code).
  - Both converge on `TxStateBanner` → Confirm → Receipt.
- **Data in:** batch record (incl. Dispensing Type, expiry, current owner check); for prescription path, the prescription record from Phase 6.
- **Data out:** `dispenseMedicine(batchId, [prescriptionHash])` write; inventory decremented, dispensing event logged.
- **Comes from:** Dashboard ("Scan Medicine"), Inventory (per-item "Dispense" action).
- **Goes to:** Receipt screen → `/pharmacy/history` (new row appears) — **this event is what `/verify` and Batch Detail everywhere will subsequently show as "Dispensed."**

#### `/pharmacy/history` Dispensing History
- **Purpose:** searchable log of everything dispensed.
- **Built from:** `DataTable`, each row links to the on-chain event (block explorer).
- **Comes from:** Dispense success, Dashboard.
- **Goes to:** `/pharmacy/batches/[id]` per row.

#### `/pharmacy/batches/[id]` Batch Detail (Internal)
- Same shared component pattern as other roles' Batch Detail.

**Phase 5 definition of done:**
- Scanning an OTC-classified batch never renders any prescription UI.
- Scanning a Prescription-classified batch blocks confirmation until a valid, unfulfilled, non-expired prescription hash is matched (requires Phase 6 to at least be stubbed/mocked for testing).
- Both paths converge on the same `TxStateBanner` → Receipt pattern.

---

### Phase 6 — Doctor (conditional actor — depends on Phase 5's prescription-matching logic existing)

#### `/doctor` Dashboard
- **Purpose:** overview.
- **Data in:** counts — issued, pending fulfillment, fulfilled.
- **Comes from:** `/auth/connect` redirect.
- **Goes to:** `/doctor/prescriptions/new`, `/doctor/prescriptions`.

#### `/doctor/prescriptions/new` New Prescription
- **Purpose:** issue a prescription that a patient will carry (as a QR) to a pharmacy.
- **Built from:** form (anonymized patient identifier, drug code, dosage, notes), `QRCodeDisplay`.
- **Data out:** off-chain hash generated = `hash(patientID + drugCode + doctorSignature + timestamp)`; optionally registered as "pending" on `Dispensing.sol`; QR generated encoding the hash.
- **Comes from:** Dashboard.
- **Goes to:** success screen with QR to print/share with the patient — **this QR is what Phase 5's Prescription sub-screen scans.**

#### `/doctor/prescriptions` Prescription History
- **Built from:** `DataTable`, status column (Pending/Fulfilled/Expired).
- **Comes from:** Dashboard.
- **Goes to:** `/doctor/prescriptions/[id]`.

#### `/doctor/prescriptions/[id]` Prescription Detail
- **Data in:** hash, issue date, and — once fulfilled — a link back to the specific Phase 5 dispensing event that consumed it.
- **Comes from:** Prescription History.

**Phase 6 definition of done:** a prescription QR generated here is scannable and validated correctly inside the Pharmacy Prescription sub-screen from Phase 5 (run this as a joint test, not two isolated tests).

---

### Phase 7 — Admin

#### `/admin` Dashboard
- **Data in:** network-wide stat cards (total batches, active custodians, flagged alerts, dispensing errors this week), activity feed.
- **Comes from:** `/auth/connect` redirect.
- **Goes to:** every other `/admin/*` page.

#### `/admin/stakeholders` Stakeholder Management
- **Purpose:** approve/revoke roles.
- **Data in:** pending "Request Access" submissions (from `/unauthorized`, Phase 2), active stakeholders list.
- **Data out:** `grantRole()` / revoke calls.
- **Goes to:** approvals here unblock the corresponding user's next `/auth/connect` attempt (Phase 2/3–6 loop closes here).

#### `/admin/batches` Batch Registry
- **Purpose:** global read-only view of every batch in the system.
- **Built from:** `DataTable`, click-through to internal Batch Detail.

#### `/admin/audit` Audit Log
- **Purpose:** regulatory audit trail.
- **Data in:** immutable event log across all contract writes, with tx hash links; export CSV/PDF.

#### `/admin/alerts` Alerts
- **Purpose:** counterfeit/anomaly flags **and** incoming Report Issue submissions.
- **Data in:** flagged batches (failed verification attempts, expired-but-scanned events) + the Phase 2 `/verify/report` queue — **this is where Phase 2's Report Issue submissions surface.**

#### `/admin/settings` Settings
- **Purpose:** dispensing rule defaults per product category, role permission matrix.

**Phase 7 definition of done:** role approvals granted here are immediately reflected in `/auth/connect` redirects for a newly-registering wallet; a `/verify/report` submission from Phase 2 is visible in `/admin/alerts`.

---

### Phase 8 — Optional: Demand Intelligence Module

#### `/admin/intelligence`
- **Purpose:** read-only display of the off-chain AI pipeline's output.
- **Built from:** Forecast (CNN-LSTM output), Sentiment Trends (BERT output), AI-suggested Supply Quotas.
- **Data in:** reads from `SupplyManager.sol` (values written by the separate Python pipeline, out of scope for this frontend).
- **Data out:** none from this frontend — it's a display, not a control surface, for the core flow.
- **Isolation rule:** no other page anywhere in the app should have a hard dependency on this page or its data existing.

**Phase 8 definition of done:** feature-flagging this entire phase off and re-running the Phase 3–7 flows produces no errors or missing functionality.

---

### Phase 9 — Integration Pass
- [ ] Full walkthrough A (OTC): Manufacturer creates OTC batch → Distributor accepts/transfers → Pharmacy accepts/dispenses (OTC path) → Patient verifies on `/verify` and sees "Dispensed."
- [ ] Full walkthrough B (Prescription): Doctor issues prescription → Manufacturer creates Prescription batch → Distributor accepts/transfers → Pharmacy accepts, scans batch + prescription QR, dispenses → Patient verifies.
- [ ] Negative paths: expired batch scanned, wrong custodian attempts accept, already-fulfilled prescription hash reused, unregistered wallet hits `/auth/connect`.
- [ ] Copy audit across every `/verify*` screen (no jargon).
- [ ] Transaction-state audit — confirm every write path shows Pending before Confirmed, no page skips straight to success.
- [ ] Confirm a `/verify/report` submission correctly appears in `/admin/alerts`.

---

## 5. Cross-Phase Non-Negotiables (check before merging any PR)

- [ ] Dispensing Type is read from chain, never a form field the pharmacist fills in.
- [ ] `/verify*` routes contain no wallet-connect UI, no gas/tx-hash/smart-contract language.
- [ ] `CustodyTimeline` is a single component with a mode prop — no forked copy.
- [ ] Every mutating action uses `TxStateBanner`'s Pending → Confirmed pattern.
- [ ] Admin/Doctor/AI never appear in the primary demo narrative unless explicitly relevant.
- [ ] Every "generates a QR" page (Create Batch, New Prescription) has a verified downstream "scans that QR" page tested against it, not just built in isolation.

---

## 6. Open Decisions (resolve before or during the relevant phase)

- [ ] **Report Issue form (`/verify/report`):** anonymous-only, or optional contact field for follow-up? *(resolve before Phase 2 completion)*
- [ ] Styling system choice (not architecturally blocking, but pick before Phase 1 component build).
- [ ] Which L2 testnet to target first for the integration pass (Phase 9).
