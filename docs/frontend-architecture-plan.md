## Frontend Architecture & Page Plan (v2)

### Blockchain-Enabled Pharmaceutical Supply Chain (Paper 1 + L2 Rollup + OTC/Prescription Branching)

<aside>
🧾

**Changelog from v1:** Dispensing type is now auto-detected from the batch record (pharmacist never manually picks OTC vs Prescription); OTC/Prescription are sub-states of "Dispense," not permanent sidebar pages; Doctor is explicitly a *conditional* role; Patient path is fully wallet-free with a "Report Issue" branch; Batch Detail now has two explicit variants (Internal vs Patient); transaction states (Pending → Confirmed) are called out; AI/Demand Intelligence is isolated as an optional module, separate from the core narrative.

</aside>

---

## 1. Overall Frontend Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  React.js / Next.js (App Router)                                 │
│  ├── Public Routes        (no wallet, no login)                  │
│  ├── Internal Auth Routes (wallet connect required)               │
│  └── Role-Protected Routes (wallet + on-chain role required)      │
└───────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
      ┌────────────────┐ ┌───────────────┐ ┌─────────────────┐
      │  STATE / HOOKS  │ │  WEB3 LAYER   │ │  DATA/QUERY LAYER│
      │  - Wallet ctx   │ │  - Ethers/Viem│ │  - React Query   │
      │  - Role ctx     │ │  - Contract   │ │    (cache chain  │
      │  - QR scan ctx  │ │    ABIs       │ │    reads)        │
      │  - Tx state ctx │ │               │ │                  │
      └────────────────┘ └───────┬───────┘ └─────────┬────────┘
                                  │                    │
                                  ▼                    ▼
                     ┌─────────────────────┐  ┌─────────────────┐
                     │  L2 SMART CONTRACTS │  │   IPFS GATEWAY   │
                     │  (Arbitrum/Base/    │  │  (batch docs,    │
                     │   Polygon CDK)      │  │   certificates)  │
                     └─────────────────────┘  └─────────────────┘
```

**Key principle:** the public `/verify` page never touches the Web3 layer directly through a wallet — it reads chain data through a read-only RPC call server-side or via a public provider, so a patient never needs MetaMask installed. Internal roles authenticate via wallet address → `AccessControl.sol.getRole(address)` → routes/menus render conditionally.

---

## 2. Route Map

```
/                          → Landing Page (public)
/verify                    → Patient QR Verification (public, no wallet)   ★ zero blockchain UI
/verify/report             → Report Issue / Suspected Counterfeit (public)

/auth/connect              → Wallet Connect + Role Detection  (INTERNAL USERS ONLY)

/admin/*                   → Health Authority dashboard   (ADMIN_ROLE)
/manufacturer/*            → Manufacturer dashboard        (MANUFACTURER_ROLE)
/distributor/*             → Distributor dashboard         (DISTRIBUTOR_ROLE)
/pharmacy/*                → Pharmacy dashboard            (PHARMACY_ROLE)
/doctor/*                  → Doctor dashboard               (DOCTOR_ROLE, conditional/optional actor)

/admin/intelligence         → Optional AI / Demand Intelligence module (secondary, not core flow)

/unauthorized                → shown if wallet has no recognized role
/404                          → not found
```

**Important change from v1:** `Connect Wallet` is *removed* from the public nav entirely. It now lives conceptually under "Internal Users" — a patient never sees a wallet-connect button anywhere on `/verify`.

---

## 3. Shared / Global Components

| Component | Purpose |
| --- | --- |
| `NavbarRoleAware` | Shows different menu items depending on connected role |
| `WalletConnectButton` | Only rendered inside `/auth/*` and role-protected shells — never on public pages |
| `NetworkGuard` | Warns/blocks if internal user is on wrong chain (must be on the L2) |
| `QRScannerModal` | Reusable camera/webcam QR reader — used by Distributor, Pharmacy, Doctor, and the public Patient page |
| `QRCodeDisplay` | Renders a generated QR (batch ID + IPFS CID, or prescription hash) with download/print |
| `StatusBadge` | Colored pill: Valid / Expired / Recalled / Pending / Counterfeit |
| `CustodyTimeline` | Vertical stepper: Manufacturer → Distributor → Pharmacy → (Dispensed). Has two render modes — `full` (internal) and `simplified` (patient) |
| `TxStateBanner` | **New** — shows `Pending → Confirmed` state explicitly for every on-chain write, since L2 confirmation isn't instant even if fast (~200ms–a few sec) |
| `EmptyState` | Reusable "no data yet" placeholder |
| `DataTable` | Paginated/sortable table used for inventories, logs, batch lists |
| `IPFSDocPreview` | Shows/downloads certificates, lab reports pinned to IPFS |

---

## 4. Page-by-Page Breakdown

### 4.0 PUBLIC PAGES (no wallet, ever)

#### A. Landing Page (`/`)

- Hero + "Verify a Medicine" CTA (→ `/verify`) + "I'm a Stakeholder" CTA (→ `/auth/connect`).
- How-it-works strip: Manufacturer → Distributor → Pharmacy → Patient.

#### B. Patient Verification Page (`/verify`) — the only patient-facing page

- **Needs:** `QRScannerModal` or manual Batch ID input, result card.
- **Data shown:** Product/Medicine name · Batch number · Manufacturer · Manufacturing date · Expiry date · Current status (Valid/Expired/Invalid/Recalled) · Authenticity result · simplified `CustodyTimeline` (Manufacturer → Distributor → Pharmacy only, no addresses/hashes).
- **Flow:**

```
[Scan QR / enter Batch ID]
        │
        ▼
[Read-only chain query: getBatch(batchId)]
        │
   ┌────┴─────┐
   │ Found?    │
   └────┬─────┘
   No ──┤── Yes
   │         │
   ▼         ▼
[❌ Not      [Check expiry & status]
 registered]      │
             ┌──────────────┐
             │ Valid?        │
             └──┬─────┬─────┘
              Yes     No
                │       │
                ▼       ▼
        [✅ Verified   [⚠️ Expired/
         card +         Recalled
         simplified      card]
         timeline]           │
                              ▼
                     [Report Issue button]
```

- **Zero blockchain jargon.** No wallet, no gas, no tx hash, no "smart contract."

#### C. Report Issue (`/verify/report`) — **new page**

- Reached from the ❌/⚠️ result states on `/verify`.
- Simple form: photo upload of packaging (optional), location, free-text description → submitted off-chain to a moderation queue that surfaces in **Admin → Alerts**.
- No wallet required here either — this is still part of the public trust surface.

#### D. Wallet Connect / Role Detection (`/auth/connect`) — internal users only

- "Connect Wallet" → `AccessControl.sol` lookup → redirect to matching dashboard or `/unauthorized` (with a "Request Access" form).

---

### 4.1 ADMIN / HEALTH AUTHORITY (`/admin/*`)

*Framing note: Admin is infrastructure/governance, not part of the core product narrative. When telling the "story" of the system, the throughline is Manufacturer → Distributor → Pharmacy → Patient; Admin sits beside it.*

| Page | Purpose | Key elements |
| --- | --- | --- |
| **Dashboard** (`/admin`) | Bird's-eye view | Stat cards (total batches, active custodians, flagged alerts, dispensing errors this week), activity feed |
| **Stakeholder Management** (`/admin/stakeholders`) | Approve/revoke roles | Pending requests table → Approve/Reject (`grantRole()`); active stakeholders table with revoke |
| **Batch Registry** (`/admin/batches`) | Global read-only batch view | Searchable/filterable `DataTable`, click-through to batch detail (custody timeline, IPFS docs) |
| **Audit Log** (`/admin/audit`) | Regulatory audit trail | Immutable event log with tx hash links, export CSV/PDF |
| **Alerts** (`/admin/alerts`) | Counterfeit/anomaly flags + **incoming Report Issue submissions** | List of flagged batches and patient-reported issues |
| **Settings** (`/admin/settings`) | Dispensing rule defaults per product category, role permission matrix |  |
| **Demand Intelligence** (`/admin/intelligence`) — *optional module, see §7* | AI forecasting dashboard | Kept visually and structurally separate from the core operational pages |

---

### 4.2 MANUFACTURER (`/manufacturer/*`)

| Page | Purpose | Key elements |
| --- | --- | --- |
| **Dashboard** (`/manufacturer`) | Overview | Stat cards (batches created, in transit, dispensed), quick "Create New Batch" CTA |
| **Create Batch** (`/manufacturer/batches/new`) | Register a new batch | 4-step wizard (updated) |
| **My Batches** (`/manufacturer/batches`) | List all own batches | `DataTable`, status filters |
| **Batch Detail (Internal)** (`/manufacturer/batches/[id]`) | Full detail view | See §6 |
| **Transfer Custody** (`/manufacturer/batches/[id]/transfer`) | Hand off to distributor | Select distributor → confirm → `TxStateBanner` (Pending → Confirmed) |

**Create Batch flow — updated to explicitly capture Dispensing Type:**

| Purpose |
| --- |
| Overview |
| Batches manufacturer has initiated transfer for, awaiting acceptance |
| Physical receiving step |
| Batches currently held |
| Outgoing handoff |
| Same pattern as manufacturer's detail page |

```
[+ Create Batch]
      │
      ▼
[Step 1: Product Info — name, dosage]
      │
      ▼
[Step 2: Dispensing Classification]
      │   ○ OTC
      │   ○ Prescription
      │   (based on the product's regulatory classification —
      │    not a freely-editable business toggle)
      ▼
[Step 3: Dates/Qty + Upload Docs → IPFS → CID]
      │
      ▼
[Step 4: Review & Submit]
      │
      ▼
[MetaMask confirm → Pending → Confirmed]
      │
      ▼
[Success: QR generated] → [Print/Download] → [Attach to physical box]
```

---

### 4.3 DISTRIBUTOR (`/distributor/*`)

*Unchanged from v1 — this section was already sound.*

| Page | Key elements | Purpose |
| --- | --- | --- |
| **Dashboard** (`/distributor`) | Stat cards: pending incoming, in-warehouse, dispatched | Overview |
| **Incoming** (`/distributor/incoming`) | Batches awaiting acceptance | Batches manufacturer has initiated transfer for, awaiting acceptance |
| **Scan & Accept** (`/distributor/scan`) | `QRScannerModal` → verify → Accept Custody (`TxStateBanner`) | Physical receiving step |
| **Inventory** (`/distributor/inventory`) | Batches currently held | Batches currently held |
| **Transfer** (`/distributor/transfer`) | Select batch(es) → destination pharmacy → confirm | Outgoing handoff |
| **Batch Detail (Internal)** (`/distributor/batches/[id]`) | Same shared component as §6 |  |

```
Incoming → Scan QR → Verify Batch → Accept Custody
Inventory → Select Batch → Select Pharmacy → Transfer Custody
```

---

### 4.4 PHARMACY (`/pharmacy/*`) — the highest-risk, most-changed section

**Navigation (updated):** OTC and Prescription are **not** permanent sidebar items. They only appear as sub-states inside the single "Dispense" flow, determined automatically by the scanned batch.

```
PHARMACY
├── Dashboard
├── Incoming
├── Inventory
├── Dispense            ← single entry point
│     (auto-branches into OTC or Prescription based on batch record)
├── Dispensing History
└── Batch Detail
```

| Page | Purpose |
| --- | --- |
| **Dashboard** (`/pharmacy`) | Overview |
| **Incoming Shipment / Accept Custody** (`/pharmacy/incoming`) | Same pattern as distributor's accept flow |
| **Inventory** (`/pharmacy/inventory`) | Current stock on hand |
| **Dispense Medicine** (`/pharmacy/dispense`) | **Core operational page** — the OTC/Prescription branch |
| **Dispensing History** (`/pharmacy/history`) | Log of everything dispensed |
| **Batch Detail** (`/pharmacy/batches/[id]`) | Standard detail view |

**Dashboard** — Scan Medicine is the single most prominent action:

```
┌──────────────────────────────────────────────┐
│ Pharmacy Dashboard                            │
├──────────────────────────────────────────────┤
│  Total Batches   Low Stock   Expiring         │
│      42              5          3             │
├──────────────────────────────────────────────┤
│ Recent Activity                               │
│ ✓ Batch A102 received                         │
│ ✓ Batch B203 custody accepted                 │
│ ✓ Medicine C dispensed                        │
├──────────────────────────────────────────────┤
│              [  Scan Medicine  ]              │
└──────────────────────────────────────────────┘
```

**Dispense flow — full version (this is the core screen of the app):**

```
[Pharmacist taps "Scan Medicine"]
      │
      ▼
[Camera scans box QR]
      │
      ▼
[Fetching batch...]
      │
      ▼
┌─────────────────────────┐
│ Medicine: ABC            │
│ Batch: ABC001             │
│ Expiry: 2027-08          │
│ Status: VALID             │
│ Dispensing Type: OTC      │   ← read directly from the batch
└─────────────────────────┘        record, NOT chosen by the
      │                            pharmacist
   ┌──┴───────────────┐
   │ Batch valid &     │
   │ owned by pharmacy?│
   └──┬─────────┬──────┘
    No│         │Yes
      ▼         ▼
[❌ Block]   [UI auto-switches to the matching sub-screen]
                   │
              ┌────┴─────┐
              ▼          ▼
             OTC     Prescription
```

**OTC sub-screen:**

```
┌──────────────────────────┐
│ OTC DISPENSING             │
├──────────────────────────┤
│ Medicine: XYZ              │
│ Batch: XYZ001              │
│ Expiry: 2027-09            │
│ Available: 120             │
│                            │
│ Quantity: [ 1 ]            │
│                            │
│ Pharmacist Verification    │
│ ☑ Batch verified           │
│ ☑ Medicine verified        │
│                            │
│ [ Confirm Dispensing ]     │
└──────────────────────────┘
```

No prescription field appears at all — the screen literally does not render prescription UI for OTC batches.

**Prescription sub-screen:**

```
┌──────────────────────────────┐
│ PRESCRIPTION DISPENSING        │
├──────────────────────────────┤
│ Medicine: XYZ                 │
│ Batch: XYZ001                 │
│ Expiry: 2027-09               │
│                                │
│ [ Scan Prescription QR ]       │
│           OR                  │
│ [ Enter Prescription Ref ]     │
│                                │
│ ✓ Prescription Verified        │
│                                │
│ [ Confirm Dispensing ]         │
└──────────────────────────────┘
```

- Prescription hash is validated against `Dispensing.sol` (matches an unfulfilled, non-expired prescription tied to the same drug code).

**Confirm → transaction states (both sub-screens converge here):**

```
[Confirm Dispensing]
      │
      ▼
[MetaMask confirm]
      │
      ▼
⏳ Pending — "Waiting for blockchain confirmation..."
      │
      ▼
✅ Confirmed — inventory -1, dispensing event logged
      │
      ▼
[Receipt screen: tx hash, timestamp, batch, quantity]
```

| Page | Purpose |
| --- | --- |
| **Dispensing History** (`/pharmacy/history`) | Searchable log, exportable, each row links to the on-chain event |
| **Batch Detail (Internal)** (`/pharmacy/batches/[id]`) | Shared component, §6 |

---

### 4.5 DOCTOR (`/doctor/*`) — conditional/optional actor

> **Framing:** Doctor is only activated for Prescription-classified medicines. It should never be presented as a mandatory step in the overall pharmaceutical flow — the primary story is Manufacturer → Distributor → Pharmacy → Patient, and Doctor plugs in only when a batch's Dispensing Type requires it.
> 

| Page | Purpose |
| --- | --- |
| **Dashboard** (`/doctor`) | Stat cards: issued, pending fulfillment, fulfilled |
| **New Prescription** (`/doctor/prescriptions/new`) | Patient identifier (anonymized), drug code, dosage → off-chain hash generated → optionally registered as "pending" on `Dispensing.sol` → QR generated for the patient |
| **Prescription History** (`/doctor/prescriptions`) | `DataTable`, status (Pending/Fulfilled/Expired) |
| **Prescription Detail** (`/doctor/prescriptions/[id]`) | Hash, issue date, fulfillment link back to the pharmacy dispensing event |

```
[Doctor fills form: patient ID + drug + dosage]
      │
      ▼
[Generate off-chain hash = hash(patientID + drugCode + doctorSig + timestamp)]
      │
      ▼
[Optionally register as "pending" on-chain]
      │
      ▼
[QR generated] → [Patient carries QR to pharmacy]
```

---

## 5. Navigation Structure Summary

```
PUBLIC (no sidebar, no wallet)
├ Landing (/)
├ Verify Medicine (/verify)
└ Report Issue (/verify/report)

INTERNAL USERS
└ Connect Wallet / Role Detection (/auth/connect)

ADMIN               MANUFACTURER        DISTRIBUTOR         PHARMACY            DOCTOR (conditional)
├ Dashboard         ├ Dashboard         ├ Dashboard          ├ Dashboard         ├ Dashboard
├ Stakeholders      ├ Create Batch      ├ Incoming           ├ Incoming          ├ New Prescription
├ Batch Registry    ├ My Batches        ├ Scan & Accept      ├ Inventory         └ Prescriptions
├ Audit Log         └ Batch Detail      ├ Inventory          ├ Dispense
├ Alerts                                ├ Transfer           │   (auto-branches:
├ Settings                              └ Batch Detail       │    OTC / Prescription)
└ Demand Intelligence (optional)                              ├ Dispensing History
                                                                └ Batch Detail
```

---

## 6. Batch Detail — two explicit variants

**Internal (Manufacturer/Distributor/Pharmacy/Admin):**

```
Batch ABC001
Product        XYZ
Manufacturer   ABC Pharma
Quantity       1000
Expiry         Aug 2027
Status         Valid

Custody Timeline (full)
Manufacturer → Distributor A → Pharmacy B

Documents
[ Quality Certificate ]  [ Lab Report ]

Blockchain
[ View Transaction ]  [ View on Block Explorer ]
```

**Patient (rendered inside `/verify` result card):**

```
✓ Verified

Medicine        XYZ
Batch           ABC001
Manufacturer    ABC Pharma
Expiry          Aug 2027
Status          Valid

Basic Traceability
Manufacturer → Distributor → Pharmacy

[ Report Issue ]
```

Same underlying `CustodyTimeline` component, rendered in `full` vs `simplified` mode — no separate component to maintain.

---

## 7. Optional Module: Demand Intelligence (AI / Secondary System)

Kept structurally and visually separate from the core operational nav so it never competes with the primary story (Create → Track → Transfer → Verify → Dispense → Verify as Patient).

```
CORE APPLICATION                       OPTIONAL
│                                       │
├── Supply Chain                       └── Demand Intelligence
├── Batches                                  ├── Forecast (CNN-LSTM output)
├── Custody                                  ├── Sentiment Trends (BERT output)
├── Inventory                                └── AI-suggested Supply Quotas
├── Dispensing                                    → feeds SupplyManager.sol
└── Verification                                    as a non-blocking suggestion
```

- Lives under `/admin/intelligence` only — no other role sees it in their nav.
- If BERT/CNN-LSTM were removed entirely, every other page in this document still functions unchanged.

---

## 8. Key Cross-Cutting UX Rules (updated)

1. **Shared `CustodyTimeline` component**, two render modes (`full` / `simplified`) — one component, not two.
2. **Every state-changing action** follows: *Review → Confirm in MetaMask → Pending → Confirmed/Receipt* — the explicit Pending state matters even on L2, since confirmation isn't literally 0ms.
3. **`/verify` never shows blockchain jargon** and **never requires a wallet** — no gas, no tx hash, no "smart contract" language. Internal role pages may show a "View on block explorer" link for transparency.
4. **Dispensing Type is never pharmacist-chosen** — it's read from the batch record and the UI auto-branches; this removes an entire class of human error.
5. **Doctor is a conditional actor** — present in the system, but only invoked when a batch's Dispensing Type is Prescription.
6. **Admin is infrastructure, not the core narrative** — useful for governance/audit, but the demo story is Manufacturer → Distributor → Pharmacy → Patient.
7. **AI/Demand Intelligence is isolated** under Admin as an optional module — removing it should never break the primary flow.
