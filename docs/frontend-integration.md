# frontend-integration.md

### Wiring the Next.js frontend (`mp-frontend`) to the NestJS backend (`mp-backend`)

> **Read first:** `frontend-architecture-plan.md` (what each page is), `Plan.md` (build order), `CLAUDE.md` / `AGENTS.md` (behavioral rules). On the backend side: `backend-architecture.md` (§4 wallet model, §9 flows) and `plan.md` (endpoint specs per phase).
>
> **Scope of this document:** everything the frontend must add to talk to the backend. Backend-side changes required for this to work are in `backend-integration.md` — the two must land together.
>
> **Current state:** `lib/web3/`, `lib/hooks/`, `lib/ipfs/`, and `context/` are empty directories. `components/shared/` has `CustodyTimeline`, `DataTable`, `EmptyState`, `StatusBadge`, `Footer`, `PublicNavbar` — missing `QRScannerModal`, `QRCodeDisplay`, `TxStateBanner`, `WalletConnectButton`, `NetworkGuard`, `NavbarRoleAware`, `IPFSDocPreview`.

---

## 1. The Single Most Important Integration Rule

The backend **never submits a blockchain transaction**. Every write follows a three-step dance, and every mutating page in the app implements it identically:

```
STEP 1 — PREPARE (frontend → backend, REST)
   POST /batches/prepare  (or /custody/prepare-transfer, /dispensing/prepare-otc, etc.)
   Backend validates, does off-chain work (IPFS pin, Postgres write),
   returns a PreparedTransaction payload.
        │
        ▼
STEP 2 — SIGN & SUBMIT (frontend → L2 directly, NO backend involved)
   User's own wallet signs the calldata and submits to the L2.
   Frontend holds the tx hash.
        │
        ▼
STEP 3 — WAIT FOR INDEX (frontend polls backend)
   Chain emits event → backend indexer picks it up → writes Postgres.
   Frontend polls until the record appears, THEN shows success.
```

**If you ever find yourself writing frontend code that expects the backend to have already changed on-chain state after a `prepare` call, that's a bug.** The `prepare` response is instructions, not a completed action.

---

## 2. Transaction States — three, not two

`frontend-architecture-plan.md` specifies `TxStateBanner` with Pending → Confirmed. **Integration reality requires a third state**, because on-chain confirmation and backend-visible data are not simultaneous — the indexer runs asynchronously:

```
idle
  │
  ▼
awaiting_signature      "Confirm in your wallet"          (MetaMask popup open)
  │
  ▼
pending_onchain         "Submitting to the network…"      (tx submitted, awaiting receipt)
  │
  ▼
confirming_index        "Confirming…"                     (receipt received, polling backend)
  │                                                        ← THIS STATE IS NEW
  ▼
confirmed               "Done"                            (backend returns the indexed record)
  │
  └─ (error paths) rejected_by_user · reverted · index_timeout
```

Without `confirming_index`, the user gets a success screen and then navigates to a list page that doesn't yet contain their batch — the classic "I just created it, where is it?" bug. Build this state into `TxStateBanner` from day one.

**`index_timeout` handling:** if polling exceeds ~30s, don't show an error — the transaction _did_ succeed on-chain. Show "Your transaction succeeded and is being processed. It will appear shortly." with a link to the block explorer. Never tell the user something failed when it demonstrably didn't.

---

## 3. Files to Create

```
lib/
├── api/
│   ├── client.ts            → fetch wrapper: base URL, JWT header, error normalization, 429 handling
│   ├── types.ts             → shared response types (mirror backend DTOs — see §9)
│   ├── auth.ts              → nonce, verify, me
│   ├── batches.ts           → prepare, get, list
│   ├── custody.ts           → incoming, prepare-transfer, prepare-accept, history
│   ├── prescriptions.ts     → create, get, list, validate
│   ├── dispensing.ts        → prepare, prepare-otc, prepare-prescription, history
│   ├── verification.ts      → public verify, record-verification
│   ├── qr.ts                → generate, decode
│   ├── ipfs.ts              → upload
│   ├── products.ts          → list, create
│   ├── users.ts             → register-request, admin approve/revoke
│   └── audit.ts             → log query
├── web3/
│   ├── config.ts            → chain ID, RPC URL, contract addresses (from env)
│   ├── abis/                → generated/copied from backend — see §8
│   ├── provider.ts          → browser provider + signer access
│   ├── submitTx.ts          → THE shared submit helper — see §4
│   └── explorer.ts          → tx hash → block explorer URL
├── hooks/
│   ├── useAuth.ts           → SIWE login flow, session state
│   ├── useRole.ts           → current role, route guarding
│   ├── useTxFlow.ts         → THE prepare→sign→poll orchestrator — see §4
│   ├── useQRScanner.ts      → camera lifecycle, decode, error states
│   ├── useBatch.ts / useBatches.ts
│   ├── useCustody.ts
│   ├── usePrescriptions.ts
│   ├── useDispensing.ts
│   └── useVerify.ts         → public, unauthenticated
└── ipfs/
    └── upload.ts            → wraps POST /ipfs/upload (backend pins; frontend never talks to IPFS directly)

context/
├── WalletContext.tsx        → address, chainId, connect/disconnect, signer
├── AuthContext.tsx          → JWT session, role, hydration on mount
└── TxContext.tsx            → global tx state for TxStateBanner
```

---

## 4. The Shared Transaction Orchestrator (`useTxFlow`)

Every mutating action in the app routes through one hook. Build this **before** any role dashboard, because every write page depends on it and you do not want five slightly-different copies of this logic.

```ts
// conceptual shape — not final code
useTxFlow({
  prepare: () => api.custody.prepareTransfer({ batchId, toOrgId }), // step 1
  poll: () => api.custody.getHistory(batchId), // step 3
  isIndexed: (data) => data.some((h) => h.txHash === myTxHash), // step 3 predicate
});
// returns: { state, execute, txHash, error, reset }
```

Internally it must:

1. Call `prepare` → receive `PreparedTransaction` (see §5).
2. Assert `chainId` matches the configured L2 (surface `NetworkGuard` if not) — **check this before opening MetaMask**, not after.
3. Get signer from `WalletContext`, submit the transaction, capture the hash.
4. `await tx.wait(N)` for receipt.
5. Poll the `poll` endpoint with backoff until `isIndexed` returns true, or timeout → `index_timeout`.
6. Drive `TxContext` state transitions throughout so `TxStateBanner` renders correctly anywhere.

**Never let an individual page call `signer.sendTransaction` directly.** All submission goes through `lib/web3/submitTx.ts`, invoked by this hook.

---

## 5. The `PreparedTransaction` Contract

Every backend `prepare*` endpoint returns the same shape (this is specified on the backend side in `backend-integration.md` §3 — the two docs must agree exactly):

```ts
type PreparedTransaction = {
  contract:
    | "Batch"
    | "Custody"
    | "Prescription"
    | "Dispensing"
    | "Verification"
    | "AccessControl";
  address: string; // deployed contract address
  method: string; // e.g. 'registerBatch'
  args: unknown[]; // ordered args, already normalized (BigInt-safe as strings)
  value?: string; // wei, if ever needed (currently always absent)
  meta?: {
    // non-transactional context for the UI
    batchId?: string;
    prescriptionId?: string;
    ipfsCid?: string;
  };
};
```

Frontend encodes this against the ABI in `lib/web3/abis/` and submits. The backend deliberately returns structured args rather than pre-encoded calldata so the frontend can display a human-readable confirmation before opening the wallet.

---

## 6. Authentication (SIWE) Wiring

```
/auth/connect page
      │
      ├─ 1. WalletConnectButton → wallet.connect() → address
      │
      ├─ 2. GET  /auth/nonce?address=0x…        → { nonce }
      │
      ├─ 3. build SIWE message, wallet.signMessage()
      │
      ├─ 4. POST /auth/verify { message, signature } → { token, user: { role, orgId } }
      │
      ├─ 5. store JWT (see note below), hydrate AuthContext
      │
      └─ 6. redirect by role:
             MANUFACTURER → /manufacturer      PHARMACY → /pharmacy
             DISTRIBUTOR  → /distributor       DOCTOR   → /doctor
             ADMIN        → /admin             (none)   → /unauthorized
```

- **JWT storage:** prefer an httpOnly cookie set by the backend over `localStorage` (XSS exposure). This requires `credentials: 'include'` in the client and matching CORS config — see `backend-integration.md` §2.
- **Hydration:** `AuthContext` calls `GET /users/me` on mount to restore session/role after refresh. Role-protected layouts must render a loading state during this, not flash-redirect to `/unauthorized`.
- **Wallet/session mismatch:** if the connected wallet address changes (MetaMask account switch) and no longer matches the session's address, **immediately invalidate the session** and send the user back to `/auth/connect`. Do not let a session issued for wallet A remain active while wallet B is connected — that wallet is the one that will sign transactions.

---

## 7. Route Guards

| Route group                                              | Guard behavior                                                                                                                            |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(public)/*` — `/`, `/verify`, `/verify/report`      | **No guard.** No `AuthContext` dependency, no `WalletContext` dependency, no wallet UI rendered. Must work with MetaMask absent entirely. |
| `app/auth/connect`                                       | No guard (it _is_ the auth entry).                                                                                                        |
| `app/{admin,manufacturer,distributor,pharmacy,doctor}/*` | Require session + exact role match. On no session → `/auth/connect`. On role mismatch → `/unauthorized`.                                  |
| `app/admin/intelligence`                                 | Same as admin, plus feature flag — must be removable without breaking anything else.                                                      |

Implement via a shared `<RoleGuard role="PHARMACY">` wrapper in each role's `layout.tsx`, not per-page.

---

## 8. Contract ABIs & Addresses

Contracts live in the **backend** repo (`contracts/*.sol`, compiled by Hardhat). The frontend needs their ABIs and deployed addresses.

**Chosen approach:** backend exposes them; frontend consumes at build time.

- Backend adds `GET /web3/config` returning `{ chainId, contracts: { Batch: { address, abi }, … } }` (see `backend-integration.md` §4).
- Frontend adds a `scripts/sync-abis.ts` that hits that endpoint and writes `lib/web3/abis/*.json` + `lib/web3/addresses.json`, run as a prebuild step.

**Do not** hand-copy ABIs — they will silently drift the moment a contract signature changes, and the failure mode (decode errors at transaction time) is painful to debug. If the sync script hasn't run, the build should fail loudly.

Env vars needed (`.env.local`):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=421614            # Arbitrum Sepolia (finalize per plan.md §8)
NEXT_PUBLIC_RPC_URL=…
NEXT_PUBLIC_EXPLORER_BASE_URL=https://sepolia.arbiscan.io
```

---

## 9. Type Sharing

Backend DTOs live in `src/**/dto/*.ts`. Frontend needs matching request/response types.

**Pragmatic approach for now:** hand-maintain `lib/api/types.ts` mirroring the backend DTOs, with a comment on each type naming its source file (e.g. `// mirrors backend: src/dispensing/dto/prepare-otc.dto.ts`). Add these to the PR checklist so they're updated together.

**Better, if time allows:** backend exposes an OpenAPI spec (NestJS `@nestjs/swagger` — it already has DTOs with decorators) and frontend generates types from it. Worth doing if the API surface keeps churning.

---

## 10. Page-by-Page Wiring

| Page                                 | Endpoints consumed                                                                                                                                                                                        | Writes a tx?                   | Notes                                                                                                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `(public)/page.tsx`                  | none                                                                                                                                                                                                      | no                             | fully static                                                                                                                                                                         |
| `(public)/verify/page.tsx`           | `GET /verify/:batchId`, `POST /qr/decode`                                                                                                                                                                 | **no**                         | no wallet, no auth, no `AuthContext`. Handle **429** with a friendly "too many checks, try again shortly" — not a stack trace. Handle 404 as "not registered," not as an error page. |
| `(public)/verify/report/page.tsx`    | `POST /verify/report`                                                                                                                                                                                     | no                             | carries batch context from `/verify` if present                                                                                                                                      |
| `auth/connect/page.tsx`              | `/auth/nonce`, `/auth/verify`, `/users/me`                                                                                                                                                                | no                             | §6                                                                                                                                                                                   |
| `unauthorized/page.tsx`              | `POST /users/register-request`                                                                                                                                                                            | no                             | surfaces later in admin alerts/stakeholders                                                                                                                                          |
| `manufacturer/page.tsx`              | `GET /batches?owner=` (aggregate)                                                                                                                                                                         | no                             | stat cards                                                                                                                                                                           |
| `manufacturer/batches/new`           | `POST /ipfs/upload`, `POST /batches/prepare`, `POST /qr/generate`                                                                                                                                         | **yes** → `registerBatch`      | wizard: step 3 uploads → CID; step 4 prepare → `useTxFlow`; success → generate QR. Poll `GET /batches/:id` to confirm indexing before showing the QR step.                           |
| `manufacturer/batches/page.tsx`      | `GET /batches?owner=`                                                                                                                                                                                     | no                             | `DataTable`                                                                                                                                                                          |
| `manufacturer/batches/[id]`          | `GET /batches/:id`, `GET /custody/history/:id`                                                                                                                                                            | no                             | `CustodyTimeline` mode=`full`, `IPFSDocPreview`                                                                                                                                      |
| `manufacturer/batches/[id]/transfer` | `POST /custody/prepare-transfer`                                                                                                                                                                          | **yes** → `initiateTransfer`   | poll `/custody/history/:id` for the `initiated` record                                                                                                                               |
| `distributor/page.tsx`               | `GET /custody/incoming?org=` (counts)                                                                                                                                                                     | no                             |                                                                                                                                                                                      |
| `distributor/incoming`               | `GET /custody/incoming?org=`                                                                                                                                                                              | no                             | list with "Scan to Accept"                                                                                                                                                           |
| `distributor/scan`                   | `POST /qr/decode`, `POST /custody/prepare-accept`                                                                                                                                                         | **yes** → `acceptTransfer`     | `QRScannerModal` → decode → validate → tx flow                                                                                                                                       |
| `distributor/inventory`              | `GET /batches?custodian=`                                                                                                                                                                                 | no                             |                                                                                                                                                                                      |
| `distributor/transfer`               | `POST /custody/prepare-transfer`                                                                                                                                                                          | **yes** → `initiateTransfer`   | multi-select → one tx per batch (sequential, not parallel — nonce ordering)                                                                                                          |
| `distributor/batches/[id]`           | same as manufacturer detail                                                                                                                                                                               | no                             | shared component                                                                                                                                                                     |
| `pharmacy/page.tsx`                  | inventory + history aggregates                                                                                                                                                                            | no                             | prominent "Scan Medicine" CTA                                                                                                                                                        |
| `pharmacy/incoming`                  | `GET /custody/incoming?org=`, `POST /custody/prepare-accept`                                                                                                                                              | **yes** → `acceptTransfer`     |                                                                                                                                                                                      |
| `pharmacy/inventory`                 | `GET /batches?custodian=`                                                                                                                                                                                 | no                             | expiry highlighting                                                                                                                                                                  |
| `pharmacy/dispense`                  | `POST /qr/decode`, `POST /dispensing/prepare`, then **either** `/dispensing/prepare-otc` **or** (`GET /prescriptions/:id` + `POST /prescriptions/:id/validate` + `POST /dispensing/prepare-prescription`) | **yes** → `recordDispensing`   | **See §11 — the critical page.**                                                                                                                                                     |
| `pharmacy/history`                   | `GET /dispensing/history?org=`                                                                                                                                                                            | no                             |                                                                                                                                                                                      |
| `doctor/page.tsx`                    | `GET /prescriptions?doctor=` (aggregate)                                                                                                                                                                  | no                             |                                                                                                                                                                                      |
| `doctor/prescriptions/new`           | `POST /prescriptions`, `POST /qr/generate`                                                                                                                                                                | **yes** → `createPrescription` | store content (backend, Postgres) → prepare → sign → poll → QR                                                                                                                       |
| `doctor/prescriptions/page.tsx`      | `GET /prescriptions?doctor=`                                                                                                                                                                              | no                             |                                                                                                                                                                                      |
| `doctor/prescriptions/[id]`          | `GET /prescriptions/:id`                                                                                                                                                                                  | no                             | links to fulfilling dispensing record if fulfilled                                                                                                                                   |
| `admin/page.tsx`                     | aggregates across modules                                                                                                                                                                                 | no                             |                                                                                                                                                                                      |
| `admin/stakeholders`                 | `GET /users`, `POST /admin/stakeholders/:id/approve`                                                                                                                                                      | **yes** → `grantRole`          | admin's own wallet signs — same rule as everyone                                                                                                                                     |
| `admin/batches`                      | `GET /batches` (all)                                                                                                                                                                                      | no                             |                                                                                                                                                                                      |
| `admin/audit`                        | `GET /audit/log`                                                                                                                                                                                          | no                             | export CSV/PDF                                                                                                                                                                       |
| `admin/alerts`                       | `GET /verify/reports`, flagged batches                                                                                                                                                                    | no                             |                                                                                                                                                                                      |
| `admin/settings`                     | `GET/PATCH /products` classification rules                                                                                                                                                                | no                             |                                                                                                                                                                                      |
| `admin/intelligence`                 | (optional module)                                                                                                                                                                                         | no                             | feature-flagged; removable                                                                                                                                                           |

---

## 11. `pharmacy/dispense` — the critical page

This page carries the highest risk of getting integration wrong. Exact sequence:

```
1. QRScannerModal → scan medicine box QR
        │
2. POST /qr/decode { payload } → { batchId }
        │
3. POST /dispensing/prepare { batchId }
        │
        └─► response includes: { dispensingType: 'OTC' | 'PRESCRIPTION',
                                  product, batch, expiry, custodianOk, availableQty }
        │
   ★ dispensingType is READ FROM THIS RESPONSE.
     It is NEVER a client-side choice, never a form field,
     never sent in a request body. The UI branches on it.
        │
   ┌────┴─────────────────────────┐
   │                              │
  OTC                        PRESCRIPTION
   │                              │
4a. render OTCDispenseForm    4b. render PrescriptionDispenseForm
    (quantity + pharmacist         │
     checklist ONLY —         5b. QRScannerModal (2nd use) → scan patient's
     no prescription               prescription QR → POST /qr/decode
     fields rendered at all)       → { prescriptionId }
   │                              │
   │                         6b. GET /prescriptions/:id  (authenticated)
   │                              POST /prescriptions/:id/validate
   │                                 { scannedBatchProductId }
   │                              → backend checks: exists, doctor authorized,
   │                                not expired, prescription.product_id ==
   │                                scannedBatchProductId, qty permitted,
   │                                not already fulfilled
   │                              │
   │                              └─ INVALID → block, show specific reason.
   │                                            Do NOT allow proceeding.
   │                              │
5a. POST /dispensing/prepare-otc  7b. POST /dispensing/prepare-prescription
   │                              │
   └──────────┬───────────────────┘
              ▼
   useTxFlow → wallet signs recordDispensing(...) → L2
              ▼
   poll GET /dispensing/history?org= until this tx appears
              ▼
   Receipt screen (batch, qty, timestamp, explorer link)
```

**Integration rules for this page specifically:**

- The OTC branch's request payloads must not contain a `prescriptionId` field at all — absent, not null.
- Never send `dispensingType` to the backend. If you find it in a request body, that's the bug this whole design exists to prevent.
- The prescription match is `product_id == product_id`. A prescription is **not** tied to a specific batch — any valid batch of the prescribed product qualifies. Don't build UI implying otherwise.

---

## 12. Error Handling Conventions

Normalize in `lib/api/client.ts`:

| Status | Meaning                                                                | Frontend behavior                                                                                           |
| ------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 401    | session expired/invalid                                                | clear `AuthContext`, redirect `/auth/connect` — **except on public routes**, where 401 should be impossible |
| 403    | role mismatch                                                          | `/unauthorized`                                                                                             |
| 404    | not found                                                              | on `/verify`: render "not registered" result card, not an error page. Elsewhere: not-found state            |
| 409    | conflict (e.g. prescription already fulfilled, batch already accepted) | show the specific domain message inline — these are expected business states, not crashes                   |
| 422    | validation failed                                                      | field-level form errors                                                                                     |
| 429    | rate limited (public `/verify`)                                        | friendly retry message + retry-after                                                                        |
| 5xx    | server error                                                           | generic retry                                                                                               |

**Wallet-side errors are separate and must not be normalized as API errors:** user rejected signature (`ACTION_REJECTED`), insufficient gas, wrong network, transaction reverted. These come from the wallet/chain, not the backend, and need their own messaging in `TxStateBanner`.

---

## 13. Build Order (integration-specific)

1. `lib/api/client.ts` + `AuthContext` + `WalletContext` + SIWE on `/auth/connect` — nothing else works without it.
2. ABI sync script + `lib/web3/config.ts` + `NetworkGuard`.
3. `TxContext` + `TxStateBanner` (all 5 states) + `useTxFlow` + `submitTx`.
4. `QRScannerModal` + `QRCodeDisplay` + `useQRScanner` + `/qr` wiring.
5. Public `/verify` (proves read path, zero-auth path, 429 handling) — **and verify it works with MetaMask uninstalled.**
6. Manufacturer create-batch (proves the full IPFS → prepare → sign → poll loop end to end).
7. Distributor, then Pharmacy, then Doctor, then Admin.
8. `admin/intelligence` last, behind a flag.

---

## 14. Integration Checklist (verify before calling it done)

- [ ] `/verify` and `/verify/report` work in a browser with **no wallet extension installed at all**.
- [ ] No component under `app/(public)/` imports from `context/WalletContext` or `context/AuthContext`.
- [ ] No frontend code calls `signer.sendTransaction` outside `lib/web3/submitTx.ts`.
- [ ] No request body anywhere contains a `dispensingType` field.
- [ ] Switching MetaMask accounts mid-session invalidates the session.
- [ ] Wrong-network state is caught _before_ the wallet popup opens, not after.
- [ ] Every write page shows all three phases (signature → on-chain → indexing) and never shows success before the backend can actually return the record.
- [ ] `index_timeout` shows a reassuring message + explorer link, never a failure message.
- [ ] ABIs are generated by the sync script, not hand-copied; a stale-ABI build fails loudly.
- [ ] A prescription created by Doctor is scannable and validates correctly in `pharmacy/dispense` against a _different_ batch of the same product than any the doctor ever saw.
