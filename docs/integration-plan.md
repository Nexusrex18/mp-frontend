# integration-plan.md
### Cross-Repo Execution Roadmap — `mp-frontend` ⇄ `mp-backend`

> **Specs:** `frontend-integration.md` (frontend-side changes) and `backend-integration.md` (backend-side changes) define *what* to build. **This file defines *in what order, in which repo, and how each step is verified*** so the two codebases stay in lockstep.
>
> **Related docs:** `backend-architecture.md`, `plan.md`, `AGENTS.md` (backend) · `docs/frontend-architecture-plan.md`, `docs/Plan.md`, `docs/agent.md`, `CLAUDE.md` (frontend).

---

## 1. Strategy

**Vertical slices, not horizontal layers.** Don't build "all backend endpoints," then "all frontend pages." Build one complete path through both repos at a time — auth spine first, then one write flow end-to-end, then replicate the pattern. Every stage below ends with something demonstrable in a browser against a real testnet.

**Backend lands first within each stage.** The frontend consumes contracts the backend defines (`PreparedTransaction`, `/web3/config`, error envelopes). Backend PR merges → frontend PR merges → stage verified. Never the reverse.

**The three shared contracts.** These are the only places where the two repos are genuinely coupled. Changing any of them requires coordinated PRs in both:
1. `PreparedTransactionDto` — `backend-integration.md` §3 ≡ `frontend-integration.md` §5
2. `GET /web3/config` payload — `backend-integration.md` §4 ≡ frontend `scripts/sync-abis.ts`
3. Error envelope + stable `error` codes — `backend-integration.md` §6 ≡ `frontend-integration.md` §12

---

## 2. Cross-Repo Dependency Graph

```
Stage 0  Local env (both repos running, docker-compose, envs)
   │
   ▼
Stage 1  AUTH SPINE ────────────────────── blocks everything role-protected
   │     BE: CORS, cookie JWT, /users/me     FE: api/client, contexts, /auth/connect
   │
   ├──────────────────┐
   ▼                  ▼
Stage 2  CHAIN     Stage 3  PUBLIC READ PATH  (independent — can run in parallel)
   PLUMBING         BE: /verify, /qr/decode, /verify/report, 429 headers
   BE: /web3/config  FE: (public)/verify, /verify/report
       /indexer/status
   FE: abi sync, NetworkGuard,
       TxContext, TxStateBanner,
       useTxFlow, submitTx
   │
   ▼
Stage 4  FIRST WRITE SLICE — Manufacturer Create Batch
   │     (proves IPFS → prepare → sign → poll-index loop)
   ▼
Stage 5  CUSTODY LOOP — Mfr transfer → Dist accept → Dist transfer → Pharm accept
   │
   ├──────────────────┐
   ▼                  ▼
Stage 6  DOCTOR    (Stage 6 must precede Stage 7's prescription branch)
   Prescriptions
   │
   ▼
Stage 7  DISPENSING — OTC branch + Prescription branch
   │
   ▼
Stage 8  ADMIN — stakeholders/grantRole, audit, alerts (consumes Stage 3 reports)
   │
   ▼
Stage 9  OPTIONAL AI MODULE (feature-flagged, removable)
   │
   ▼
Stage 10 HARDENING & FULL INTEGRATION PASS
```

---

## 3. Stage 0 — Local Environment

**Backend (`mp-backend`)**
- [ ] `docker-compose.yml` brings up Postgres + Redis; confirm `prisma migrate dev` applies `20260916174942_init` cleanly.
- [ ] `.env`: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN=http://localhost:3000`, `RPC_URL`, `CHAIN_ID`, IPFS pinning key, deployed contract addresses.
- [ ] `scripts/deploy-local.ts` deploys all six contracts to a local Hardhat node; record addresses into env/config.
- [ ] Confirm API boots on a fixed port (assume `3001` throughout this doc).

**Frontend (`mp-frontend`)**
- [ ] `.env.local`: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_EXPLORER_BASE_URL`.
- [ ] Dev server on `:3000`, both repos running simultaneously.

**Decisions to lock here (from `plan.md` §8):**
- [ ] L2 testnet: Arbitrum Sepolia vs Base Sepolia — **needed before Stage 2.**
- [ ] IPFS provider: Pinata vs web3.storage — **needed before Stage 4.**
- [ ] Session transport: httpOnly cookie (recommended) vs bearer token — **needed before Stage 1.**

**Verify:** both servers run; a `curl` to a backend health route succeeds from the frontend origin without CORS error.

---

## 4. Stage 1 — Auth Spine

*Blocks every role-protected page. Nothing else proceeds until this works.*

**Backend first**
- [ ] `src/main.ts` — `enableCors({ origin: FRONTEND_ORIGIN, credentials: true })`
- [ ] `src/auth/auth.controller.ts` — `GET /auth/nonce?address=`, `POST /auth/verify` sets httpOnly cookie
- [ ] JWT payload includes the wallet address; reject requests where a supplied address disagrees with the session
- [ ] `src/users/users.controller.ts` — `GET /users/me` resolves role/org from cookie alone
- [ ] `src/common/guards/roles.guard.ts` — verify it rejects role mismatch with **403**, missing session with **401**
- [ ] `src/users/users.controller.ts` — `POST /users/register-request`

**Frontend next**
- [ ] `lib/api/client.ts` — base URL, `credentials: 'include'`, error normalization skeleton
- [ ] `lib/api/auth.ts`, `lib/api/types.ts`
- [ ] `context/WalletContext.tsx` — address, chainId, connect/disconnect, signer, **account-change listener**
- [ ] `context/AuthContext.tsx` — session, role, hydrate via `/users/me` on mount
- [ ] `components/shared/WalletConnectButton.tsx`
- [ ] `app/auth/connect/page.tsx` — full SIWE flow + role-based redirect
- [ ] `app/unauthorized/page.tsx` — wired to `POST /users/register-request`
- [ ] `RoleGuard` wrapper applied in each role's `layout.tsx` (create the five layouts)

**Verify:**
- Connect wallet → sign → land on the correct role dashboard (stub content is fine).
- Refresh the page → session survives, no re-signing prompt.
- Switch MetaMask accounts → session invalidates, redirected to `/auth/connect`.
- Hit `/pharmacy` with a manufacturer session → `/unauthorized`, not a crash.
- Role-protected layout shows a loading state during hydration — **no flash-redirect to `/unauthorized`.**

---

## 5. Stage 2 — Chain Plumbing

*The machinery every write flow reuses. Build it once, correctly, before any write page.*

**Backend first**
- [ ] `src/common/dto/prepared-transaction.dto.ts` — the canonical shape (`backend-integration.md` §3)
- [ ] `src/common/web3/` — `GET /web3/config` returning chainId, RPC, explorer, and per-contract `{ address, abi }` sourced from Hardhat artifacts
- [ ] `src/indexer/indexer.controller.ts` — `GET /indexer/status?txHash=` → `{ indexed, blockNumber?, entity? }`
- [ ] `GET /indexer/health` → `{ lastProcessedBlock, chainHead, lagBlocks, healthy }`
- [ ] Ensure every indexed read response includes `txHash`
- [ ] `src/common/` — global exception filter emitting `{ statusCode, error, message, details? }`

**Frontend next**
- [ ] `scripts/sync-abis.ts` — fetch `/web3/config`, write `lib/web3/abis/*.json` + `lib/web3/addresses.json`; wire as `prebuild`; **fail the build loudly if it can't run**
- [ ] `lib/web3/config.ts`, `lib/web3/provider.ts`, `lib/web3/explorer.ts`
- [ ] `lib/web3/submitTx.ts` — the *only* place `signer.sendTransaction` is called
- [ ] `components/shared/NetworkGuard.tsx` — wrong-chain detection **before** the wallet popup opens
- [ ] `context/TxContext.tsx`
- [ ] `components/shared/TxStateBanner.tsx` — all five states: `awaiting_signature`, `pending_onchain`, `confirming_index`, `confirmed`, plus error paths (`rejected_by_user`, `reverted`, `index_timeout`)
- [ ] `lib/hooks/useTxFlow.ts` — prepare → sign → receipt → poll `/indexer/status` → confirmed, with backoff + timeout
- [ ] `lib/api/client.ts` — finish error normalization per `frontend-integration.md` §12

**Verify:** using any throwaway contract call, drive `useTxFlow` through all five states in the UI. Deliberately reject the signature in MetaMask → `rejected_by_user`, not a crash. Deliberately stop the indexer → `index_timeout` with a reassuring message and explorer link, **not** a failure message.

---

## 6. Stage 3 — Public Read Path *(can run in parallel with Stage 2)*

*Deliberately early: it's the highest-trust surface and has zero dependencies on auth or tx machinery.*

**Backend first**
- [ ] `src/verification/` — `GET /verify/:batchId` (public, cached, rate-limited)
- [ ] `src/verification/guards/verify-rate-limit.guard.ts` — emit `Retry-After`, `X-RateLimit-*`
- [ ] `POST /verify/report` (public, rate-limited) + `GET /verify/reports` (admin-only) — **new, currently missing**
- [ ] `src/qr/` — `POST /qr/decode`
- [ ] Redis caching on the verify read path

**Frontend next**
- [ ] `components/shared/QRScannerModal.tsx` + `lib/hooks/useQRScanner.ts`
- [ ] `lib/api/verification.ts`, `lib/api/qr.ts`, `lib/hooks/useVerify.ts`
- [ ] `app/(public)/verify/page.tsx` — scan or manual entry → result card using existing `StatusBadge` + `CustodyTimeline` (mode=`simplified`)
- [ ] `app/(public)/verify/report/page.tsx`
- [ ] `app/(public)/layout.tsx` — confirm it imports **no** wallet/auth context

**Verify (this stage's checks matter more than most):**
- Works in a browser profile with **MetaMask not installed at all.**
- 404 renders a "not registered" result card, not an error page.
- 429 renders a friendly retry message using `Retry-After`.
- Copy audit: no "wallet," "gas," "transaction hash," "smart contract" anywhere on screen.
- `grep` confirms nothing under `app/(public)/` imports `WalletContext` or `AuthContext`.

---

## 7. Stage 4 — First Write Slice: Manufacturer Create Batch

*The template every subsequent write flow copies. Get it right here and the rest is repetition.*

**Backend first**
- [ ] `src/ipfs/` — `POST /ipfs/upload` pins documents, returns CID
- [ ] `src/products/` — `GET /products` (needed for the wizard's product + classification step)
- [ ] `src/batches/` — `POST /batches/prepare` returning `PreparedTransactionDto` for `Batch.registerBatch`
- [ ] `GET /batches/:id`, `GET /batches?owner=` with pagination envelope
- [ ] `src/indexer/` — `Batch.sol` event handling writes the `batches` row on `BatchRegistered`
- [ ] `src/qr/` — `POST /qr/generate`

**Frontend next**
- [ ] `lib/api/ipfs.ts`, `lib/api/batches.ts`, `lib/api/products.ts`, `lib/hooks/useBatch.ts`
- [ ] `components/shared/QRCodeDisplay.tsx`, `components/shared/IPFSDocPreview.tsx`
- [ ] `components/manufacturer/CreateBatchWizard.tsx` — 4 steps (Product → **Dispensing Classification** → Dates/Qty/Docs → Review)
- [ ] `app/manufacturer/batches/new/page.tsx` — wizard + `useTxFlow` + QR success step
- [ ] `app/manufacturer/page.tsx`, `app/manufacturer/batches/page.tsx`, `app/manufacturer/batches/[id]/page.tsx`

**Verify:** create a batch end-to-end on testnet → document lands on IPFS → transaction signed by the *manufacturer's own wallet* → `confirming_index` state visible → batch appears in `GET /batches/:id` → QR renders and is printable. Then confirm the new batch appears in My Batches **without a manual refresh hack**.

**Critical check:** `grep` the backend for `signer`/private-key usage outside `indexer/`'s read-only provider — must be zero hits.

---

## 8. Stage 5 — Custody Loop

**Backend first**
- [ ] `src/custody/` — `GET /custody/incoming?org=`, `POST /custody/prepare-transfer`, `POST /custody/prepare-accept`, `GET /custody/history/:batchId`
- [ ] Indexer handles `CustodyInitiated` / `CustodyAccepted` → `custody_transfers`
- [ ] 409 codes: `NOT_CURRENT_CUSTODIAN`, `BATCH_ALREADY_ACCEPTED`, `NO_PENDING_TRANSFER`

**Frontend next**
- [ ] `lib/api/custody.ts`, `lib/hooks/useCustody.ts`
- [ ] `app/manufacturer/batches/[id]/transfer/page.tsx`
- [ ] `app/distributor/` — `page.tsx`, `incoming/`, `scan/`, `inventory/`, `transfer/`, `batches/[id]/`
- [ ] `app/pharmacy/incoming/page.tsx`, `app/pharmacy/inventory/page.tsx`, `app/pharmacy/batches/[id]/page.tsx`
- [ ] `CustodyTimeline` wired with real data in `full` mode

**Verify:** full chain with three distinct wallets — Manufacturer initiates → Distributor scans QR + accepts → Distributor initiates → Pharmacy scans + accepts. `GET /custody/history/:batchId` shows all four hops in order. Multi-batch transfer submits **sequentially** (nonce ordering), not in parallel. Attempting to accept a batch not assigned to you returns a specific 409 shown inline.

---

## 9. Stage 6 — Doctor Prescriptions

**Backend first**
- [ ] `src/prescriptions/` — `POST /prescriptions` (writes private Postgres content **+** returns `PreparedTransactionDto` for `Prescription.createPrescription`)
- [ ] `GET /prescriptions/:id` — **403 for every role except issuing doctor and authenticated pharmacy**
- [ ] `GET /prescriptions?doctor=`
- [ ] `POST /prescriptions/:id/validate` — body `{ scannedBatchProductId }`, returns `{ valid, prescription, failures[] }`
- [ ] Indexer handles `PrescriptionCreated` / `PrescriptionFulfilled`
- [ ] 409 codes: `PRESCRIPTION_EXPIRED`, `PRESCRIPTION_ALREADY_FULFILLED`, `PRESCRIPTION_PRODUCT_MISMATCH`

**Frontend next**
- [ ] `lib/api/prescriptions.ts`, `lib/hooks/usePrescriptions.ts`
- [ ] `app/doctor/page.tsx`, `prescriptions/new/`, `prescriptions/`, `prescriptions/[id]/`
- [ ] Prescription QR via `QRCodeDisplay`

**Verify:** doctor issues a prescription → private content is in Postgres, **not** IPFS (verify by inspection) → hash/status on-chain → QR generated. Fetching `GET /prescriptions/:id` as a distributor returns 403. Prescription references `product_id`, **never** a batch ID — confirm in the DB row.

---

## 10. Stage 7 — Dispensing *(the critical stage)*

**Backend first**
- [ ] `POST /dispensing/prepare` — returns server-derived `dispensingType`, product, batch, `custodianOk`, `blockers[]`
- [ ] **Reject any request body containing `dispensingType`**
- [ ] `POST /dispensing/prepare-otc` — no `prescriptionId` in the accepted shape at all
- [ ] `POST /dispensing/prepare-prescription` — internally re-validates via prescriptions module; `blockers`/failures must hard-block server-side (never rely on the frontend)
- [ ] `GET /dispensing/history?org=`
- [ ] Indexer handles `Dispensed` → `dispensing_records` + flips `prescriptions.status = fulfilled`

**Frontend next**
- [ ] `lib/api/dispensing.ts`, `lib/hooks/useDispensing.ts`
- [ ] `components/pharmacy/OTCDispenseForm.tsx`, `components/pharmacy/PrescriptionDispenseForm.tsx`
- [ ] `app/pharmacy/dispense/page.tsx` — exact sequence in `frontend-integration.md` §11
- [ ] `app/pharmacy/history/page.tsx`, `app/pharmacy/page.tsx` (prominent "Scan Medicine" CTA)

**Verify — the highest-value checks in the whole project:**
- Scanning an **OTC** batch renders zero prescription UI, and the request payload contains **no** `prescriptionId` field (absent, not null).
- Scanning a **Prescription** batch blocks confirmation until validation passes.
- A prescription validates against a **different batch of the same product** than any the doctor ever saw — this is the product-vs-batch rule working correctly.
- Reusing a fulfilled prescription returns `PRESCRIPTION_ALREADY_FULFILLED` inline.
- `grep` both repos: **`dispensingType` never appears in any request body.**
- After dispensing, `/verify` (public) reflects the new status.

---

## 11. Stage 8 — Admin

**Backend first**
- [ ] `POST /admin/stakeholders/:id/approve|revoke` → `PreparedTransactionDto` for `AccessControl.grantRole` / `revokeRole`
- [ ] `GET /audit/log` with filters; confirm the audit interceptor fires on **every** state-changing endpoint from Stages 1–7
- [ ] `GET /verify/reports` (consumes Stage 3's submissions)
- [ ] `GET /batches` (all), `GET/PATCH /products`

**Frontend next**
- [ ] `lib/api/users.ts`, `lib/api/audit.ts`
- [ ] `app/admin/` — `page.tsx`, `stakeholders/`, `batches/`, `audit/`, `alerts/`, `settings/`

**Verify:** approving a stakeholder is signed by the **admin's own wallet** (same rule as everyone) → indexed → that user's next `/auth/connect` resolves to the granted role. A `/verify/report` submitted back in Stage 3 appears in `/admin/alerts`.

---

## 12. Stage 9 — Optional AI Module

- [ ] `app/admin/intelligence/page.tsx` behind a feature flag, read-only.
- **Verify:** flag it off, re-run Stages 4–8 flows → zero errors, zero missing functionality. If anything breaks, the isolation rule has been violated.

---

## 13. Stage 10 — Hardening & Full Integration Pass

- [ ] **Workflow A (OTC), full lifecycle** with real distinct wallets per role — mirrors `plan.md` §6.1.
- [ ] **Workflow B (Prescription), full lifecycle** — mirrors `plan.md` §6.2.
- [ ] Negative paths: expired batch, wrong custodian accept, reused prescription, unregistered wallet, wrong network, rejected signature, reverted transaction.
- [ ] **Indexer downtime drill:** stop the indexer mid-flow → confirm frontend shows `index_timeout` gracefully → restart + backfill → data reconciles with no manual DB edits.
- [ ] Load test `/verify/:batchId` — cache warm means ≤1 chain read; confirm zero writes triggered.
- [ ] Final `grep` audit (see §15 checklist).
- [ ] Copy audit on all public screens.

---

## 14. Milestone Summary

| Stage | Demoable outcome | Blocks |
|---|---|---|
| 0 | Both repos running locally, CORS clean | everything |
| 1 | Wallet → SIWE → correct role dashboard | all role pages |
| 2 | A transaction driven through all 5 UI states | all write flows |
| 3 | Patient verifies a medicine with no wallet installed | — |
| 4 | Manufacturer creates a batch, gets a printable QR | 5 |
| 5 | Full custody chain across 3 wallets | 7 |
| 6 | Doctor issues a prescription QR | 7 (rx branch) |
| 7 | Both OTC and Prescription dispensing complete | 8 |
| 8 | Admin grants a role; alerts show patient reports | — |
| 9 | AI module toggles off without breaking anything | — |
| 10 | Both full workflows green end-to-end | ship |

---

## 15. Standing Audit Checklist (run at every stage boundary)

- [ ] Backend: zero `signer`/private-key usage outside `indexer/`'s read-only provider.
- [ ] Backend: nothing outside `src/indexer/` writes to `custody_transfers`, `verification_records`, `dispensing_records`, or on-chain-mirrored `batches`/`prescriptions` fields.
- [ ] Frontend: zero `signer.sendTransaction` calls outside `lib/web3/submitTx.ts`.
- [ ] Frontend: nothing under `app/(public)/` imports `WalletContext` or `AuthContext`.
- [ ] Neither repo: `dispensingType` in any request body.
- [ ] Neither repo: prescription content on any IPFS-bound code path.
- [ ] Every write page shows `confirming_index` before success.
- [ ] ABIs generated by `sync-abis.ts`, never hand-edited.

---

## 16. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **ABI drift** between repos after a contract change | `sync-abis.ts` as a prebuild step that fails loudly; redeploy = mandatory re-sync (document in the deploy runbook) |
| **Indexer lag** perceived as failure by users | `confirming_index` state + `index_timeout` messaging that never says "failed"; `/indexer/health` for diagnosis |
| **Indexer downtime** silently desyncing Postgres | Backfill-from-block capability (`plan.md` Phase 4) + the Stage 10 downtime drill |
| **Type drift** between backend DTOs and frontend types | Hand-mirrored types carry a source-file comment + PR checklist; escalate to OpenAPI generation if churn is high |
| **Nonce collisions** on multi-batch transfers | Submit sequentially, never `Promise.all` over signed transactions |
| **Session/wallet mismatch** letting wallet B act under wallet A's session | Address in JWT + frontend account-change listener + server-side rejection |
| **Scope creep into the AI module** | Feature flag + the Stage 9 removal test |

---

## 17. Working Conventions

- **Coordinated PRs:** any change to the three shared contracts (§1) requires paired PRs in both repos, merged backend-first, referenced to each other.
- **Spec sync:** new endpoint → update `plan.md` (backend) *and* `backend-integration.md`/`frontend-integration.md` in the same PR. New page → update `docs/frontend-architecture-plan.md`. Docs and code should never drift.
- **Hard rules are not negotiable:** `AGENTS.md` (backend) §2 and `docs/agent.md` / `CLAUDE.md` (frontend) §2 govern. If a stage task appears to conflict with one, stop and flag rather than implementing — those rules encode deliberate safety/architecture decisions (backend-never-signs, auto-detected dispensing type, wallet-free patient surface).
- **Definition of done** for a stage = its Verify block passes *and* the §15 audit checklist is still clean.

---

## 18. Open Decisions

| Decision | Needed by | Default if undecided |
|---|---|---|
| L2 testnet (Arbitrum Sepolia vs Base Sepolia) | Stage 2 | Arbitrum Sepolia |
| Session transport (httpOnly cookie vs bearer) | Stage 1 | httpOnly cookie |
| IPFS provider (Pinata vs web3.storage) | Stage 4 | Pinata |
| Indexer impl (custom listener + BullMQ vs Ponder) | Stage 2 | custom (already scaffolded in `src/indexer/`) |
| `/verify/report` anonymity (anonymous-only vs optional contact) | Stage 3 | anonymous-only |
| Type sharing (hand-mirrored vs OpenAPI generation) | Stage 1 | hand-mirrored, revisit at Stage 7 |
