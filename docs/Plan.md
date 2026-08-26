### Implementation Roadmap — Blockchain-Enabled Pharmaceutical Supply Chain Frontend

> Source of truth for scope/design: `frontend-architecture-plan.md` (v2). This file is the **execution roadmap** — build order, checklists, and definition-of-done. If the two ever disagree, `frontend-architecture-plan.md` wins on *what* to build; this file governs *in what order and how we verify it's done*.

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

## 3. Build Phases

### Phase 0 — Foundation (blocking everything else)
- [ ] Next.js app scaffold, routing skeleton matching the Route Map (§2 of architecture doc)
- [ ] Web3 provider setup (read-only provider for public pages; wallet-connected provider for internal pages)
- [ ] `AccessControl.sol` role-lookup hook (`useRole`)
- [ ] `NetworkGuard` (detect wrong chain, prompt switch to L2)
- [ ] Global layout shells: one for Public (no wallet UI at all), one for Internal (role-aware nav + wallet button)

**Definition of done:** navigating to any route in the Route Map renders the correct shell (public shell has zero wallet UI; internal shell shows role-correct sidebar) even with stubbed/mock data.

---

### Phase 1 — Shared Components Library
Build once, reuse everywhere. Do not let any page invent a one-off version of these.

- [ ] `StatusBadge` (Valid / Expired / Recalled / Pending / Counterfeit)
- [ ] `CustodyTimeline` — **two render modes**: `full` (internal) and `simplified` (patient). Single component, mode prop, not two components.
- [ ] `QRScannerModal` — camera-based, returns decoded batch ID / prescription hash
- [ ] `QRCodeDisplay` — generates + prints/downloads QR from batch ID + IPFS CID
- [ ] `TxStateBanner` — explicit `Pending → Confirmed` states for every on-chain write, regardless of L2 speed
- [ ] `DataTable`, `EmptyState`, `IPFSDocPreview`

**Definition of done:** each component has a Storybook-style isolated demo (or equivalent) showing all its states (empty, loading, error, success) before being wired into a real page.

---

### Phase 2 — Public Surface (patient-facing, highest trust sensitivity)
- [ ] `/` Landing page
- [ ] `/verify` — scan or manual entry → `getBatch()` read-only call → result card using `CustodyTimeline` (`simplified` mode) and `StatusBadge`
- [ ] `/verify/report` — issue form (see open question in §5)

**Definition of done:** `/verify` and `/verify/report` are fully usable with **zero wallet installed** and contain **zero blockchain terminology** in the UI copy (audit the copy explicitly — no "gas," "tx hash," "smart contract," "wallet").

---

### Phase 3 — Auth + Manufacturer (first internal role, establishes patterns)
- [ ] `/auth/connect` — connect wallet → role lookup → redirect
- [ ] `/unauthorized` + "Request Access" form
- [ ] Manufacturer Dashboard
- [ ] Create Batch wizard (4 steps: Product Info → **Dispensing Classification** → Dates/Qty/Docs→IPFS → Review/Submit) ending in `TxStateBanner` → QR generation
- [ ] My Batches list
- [ ] Batch Detail (Internal variant)
- [ ] Transfer Custody action

**Definition of done:** a full create → transfer flow works end-to-end against a testnet L2 deployment, including IPFS doc upload and QR generation/print.

---

### Phase 4 — Distributor
- [ ] Dashboard, Incoming, Scan & Accept, Inventory, Transfer, Batch Detail (reuse Internal variant)

**Definition of done:** a batch created in Phase 3 can be scanned, accepted, and re-transferred by a Distributor test account.

---

### Phase 5 — Pharmacy (highest-risk section — build last among the "core 3" so patterns are mature)
- [ ] Dashboard (Scan Medicine as primary CTA)
- [ ] Incoming / Accept Custody
- [ ] Inventory
- [ ] **Dispense flow**: scan → fetch batch → auto-branch by `Dispensing Type` field (never a manual toggle) → OTC sub-screen OR Prescription sub-screen → Confirm → `TxStateBanner` → Receipt
- [ ] Dispensing History
- [ ] Batch Detail (Internal variant)

**Definition of done:**
- Scanning an OTC-classified batch **never renders any prescription UI**.
- Scanning a Prescription-classified batch **blocks confirmation** until a valid, unfulfilled, non-expired prescription hash is matched.
- Both paths converge on the same `TxStateBanner` → Receipt pattern.

---

### Phase 6 — Doctor (conditional actor — build after Pharmacy since it feeds Pharmacy's prescription check)
- [ ] Dashboard
- [ ] New Prescription (generates off-chain hash, optional on-chain "pending" registration, QR output)
- [ ] Prescription History / Detail

**Definition of done:** a prescription QR generated here is scannable and validated correctly inside the Pharmacy Prescription sub-screen from Phase 5.

---

### Phase 7 — Admin
- [ ] Dashboard, Stakeholder Management, Batch Registry, Audit Log, Alerts (including Report Issue submissions from Phase 2), Settings

**Definition of done:** role approvals granted here are immediately reflected in `/auth/connect` redirects for a newly-registering wallet.

---

### Phase 8 — Optional: Demand Intelligence Module
- [ ] `/admin/intelligence` — Forecast, Sentiment Trends, AI-suggested Supply Quotas (read-only display of off-chain Python pipeline output written to `SupplyManager.sol`)

**Definition of done:** removing this entire phase/route from the build does not break any other page — verify by feature-flagging it off and re-running the Phase 3–7 flows.

---

### Phase 9 — Integration Pass
- [ ] Full end-to-end walkthrough: Manufacturer creates OTC batch → Distributor accepts/transfers → Pharmacy accepts/dispenses (OTC path) → Patient verifies on `/verify`.
- [ ] Full end-to-end walkthrough: same but Prescription batch, including Doctor issuing prescription first.
- [ ] Negative-path testing: expired batch, wrong custodian scanning, already-fulfilled prescription hash, unregistered wallet on `/auth/connect`.
- [ ] Copy audit on all public pages (no jargon).
- [ ] Transaction state audit — confirm every write path shows Pending before Confirmed (no page skips straight to success).

---

## 4. Cross-Phase Non-Negotiables (check before merging any PR)

- [ ] Dispensing Type is read from chain, never a form field the pharmacist fills in.
- [ ] `/verify*` routes contain no wallet-connect UI, no gas/tx-hash/smart-contract language.
- [ ] `CustodyTimeline` is a single component with a mode prop — no forked copy.
- [ ] Every mutating action uses `TxStateBanner`'s Pending → Confirmed pattern.
- [ ] Admin/Doctor/AI never appear in the primary demo narrative unless explicitly relevant.

---

## 5. Open Decisions (resolve before or during the relevant phase)

- [ ] **Report Issue form (`/verify/report`):** anonymous-only, or optional contact field for follow-up? *(resolve before Phase 2 completion)*
- [ ] Styling system choice (not architecturally blocking, but pick before Phase 1 component build).
- [ ] Which L2 testnet to target first for the integration pass (Phase 9).
