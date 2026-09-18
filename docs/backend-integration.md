# backend-integration.md
### Backend changes required to integrate with the Next.js frontend (`mp-frontend`)

> **Read first:** `backend-architecture.md` (§4 wallet model, §9 flows), `plan.md` (endpoint specs per phase), `AGENTS.md` (behavioral rules).
>
> **Scope of this document:** only the backend-side changes needed for frontend integration. The frontend's much larger side of this work is in `frontend-integration.md` — the two must land together, and §3 (the `PreparedTransaction` shape) and §4 (`/web3/config`) are shared contracts that must match exactly.
>
> **Current state:** all 12 modules exist with controllers, services, and DTOs. What's missing is cross-cutting integration plumbing — CORS, a standardized response envelope, ABI exposure, and indexer-lag signalling.

---

## 1. Summary of Required Changes

| # | Change | Module | Why |
|---|---|---|---|
| 1 | CORS + cookie-based JWT | `main.ts`, `auth/` | Browser client on a different origin |
| 2 | Canonical `PreparedTransaction` response shape | `common/`, all `prepare*` endpoints | Frontend needs one uniform contract to sign against |
| 3 | `GET /web3/config` endpoint | `common/web3/` | Frontend needs ABIs + addresses without hand-copying |
| 4 | Indexer sync-status signalling | `indexer/`, read endpoints | Frontend must know when a tx has been indexed |
| 5 | Standard error envelope | `common/` | Frontend error normalization (§12 of frontend doc) |
| 6 | Filter params on list endpoints | `batches/`, `custody/`, `dispensing/` | Pages query by custodian/org/owner |
| 7 | `POST /verify/report` + retrieval | `verification/` | `/verify/report` page has no backend endpoint yet |
| 8 | Rate-limit headers on public verify | `verification/guards/` | Frontend 429 handling needs `Retry-After` |
| 9 | (Optional) OpenAPI spec | global | Type generation instead of hand-mirrored types |

---

## 2. CORS & Session Transport

**`src/main.ts`:**
```ts
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN,   // http://localhost:3000 in dev
  credentials: true,                      // required for httpOnly cookie
});
```

**`auth/auth.controller.ts`** — prefer setting the JWT as an **httpOnly, SameSite=Lax, Secure (prod)** cookie on `POST /auth/verify` rather than returning a bare token for `localStorage`. This removes the XSS exposure of a token sitting in JS-readable storage.

If you keep bearer-token-in-body instead, that's workable but document it clearly, because it changes `lib/api/client.ts` on the frontend side.

**Also required:** `GET /users/me` must work off the cookie/session alone so the frontend can hydrate `AuthContext` after a page refresh without re-signing a SIWE message.

**Wallet/session binding:** the JWT payload must include the wallet address it was issued for. The frontend compares this against the currently-connected MetaMask account and invalidates the session on mismatch — but the backend should *also* reject requests where a supplied address hint disagrees with the session, rather than trusting the client to self-police.

---

## 3. The `PreparedTransaction` Contract (shared — must match `frontend-integration.md` §5 exactly)

Every endpoint that prepares an on-chain action returns this identical envelope. Add it as a shared DTO in `src/common/dto/prepared-transaction.dto.ts`:

```ts
export class PreparedTransactionDto {
  contract: 'Batch' | 'Custody' | 'Prescription' | 'Dispensing' | 'Verification' | 'AccessControl';
  address: string;          // deployed contract address for the configured chain
  method: string;           // e.g. 'registerBatch'
  args: unknown[];          // ordered, BigInt-safe (numbers as decimal strings)
  value?: string;           // wei; currently always omitted
  meta?: {
    batchId?: string;
    prescriptionId?: string;
    ipfsCid?: string;
  };
}
```

**Endpoints that must return exactly this shape:**
- `POST /batches/prepare` → `Batch.registerBatch`
- `POST /custody/prepare-transfer` → `Custody.initiateTransfer`
- `POST /custody/prepare-accept` → `Custody.acceptTransfer`
- `POST /prescriptions` → `Prescription.createPrescription` (alongside the created Postgres record)
- `POST /dispensing/prepare-otc` → `Dispensing.recordDispensing`
- `POST /dispensing/prepare-prescription` → `Dispensing.recordDispensing`
- `POST /verification/record` → `Verification.recordVerification`
- `POST /admin/stakeholders/:id/approve` → `AccessControl.grantRole`
- `POST /admin/stakeholders/:id/revoke` → `AccessControl.revokeRole`

**Serialization rule:** `args` must be JSON-safe. Emit `uint256` values as **decimal strings**, not JS numbers (precision loss) and not BigInt (not JSON-serializable). The frontend converts back when encoding.

**Reminder of the invariant this enforces:** these endpoints return *instructions*. They must not sign, must not submit, must not hold a private key. Per `AGENTS.md` §2.1, any `signer` usage outside the indexer's read-only provider is a bug.

---

## 4. `GET /web3/config` (new endpoint)

The frontend cannot hand-copy ABIs without them silently drifting when a contract changes. Expose them from the source of truth (this repo, where `contracts/*.sol` and Hardhat artifacts live).

**Add to `src/common/web3/`:** a controller exposing
```
GET /web3/config
→ {
    chainId: 421614,
    rpcUrl: "…",
    explorerBaseUrl: "https://sepolia.arbiscan.io",
    contracts: {
      Batch:         { address: "0x…", abi: [...] },
      Custody:       { address: "0x…", abi: [...] },
      Prescription:  { address: "0x…", abi: [...] },
      Dispensing:    { address: "0x…", abi: [...] },
      Verification:  { address: "0x…", abi: [...] },
      AccessControl: { address: "0x…", abi: [...] }
    }
  }
```

- **Public, unauthenticated** — these are public-chain artifacts, nothing sensitive.
- Source ABIs from Hardhat artifacts, addresses from the same config `scripts/deploy.ts` writes.
- Frontend's `scripts/sync-abis.ts` consumes this at build time.

**Deployment coupling:** whenever `scripts/deploy.ts` runs against a new network, this endpoint's output changes and the frontend must re-sync. Document that as a deploy step so it doesn't get missed.

---

## 5. Indexer Sync-Status Signalling

This is the subtlest piece. The frontend polls after submitting a transaction, waiting for the indexer to catch up. Two backend changes make that reliable:

**5a. Make indexed records queryable by `txHash`.** The frontend knows its transaction hash and nothing else — it needs to ask "is this specific transaction reflected in your data yet?" The relevant tables already store `tx_hash` (per `plan.md` §3). Expose it:

```
GET /indexer/status?txHash=0x…
→ { indexed: boolean, blockNumber?: number, entity?: { type, id } }
```

This is far cleaner than the frontend refetching a whole list and scanning for its record, and it gives one uniform polling target for every write flow in the app.

**5b. Include `txHash` in every indexed read response** (`batches`, `custody_transfers`, `dispensing_records`, prescription status) so the frontend can correlate and also render explorer links.

**5c. Expose indexer lag** (optional but useful for admin diagnostics):
```
GET /indexer/health → { lastProcessedBlock, chainHead, lagBlocks, healthy: boolean }
```

---

## 6. Standard Error Envelope

The frontend normalizes errors by status code (`frontend-integration.md` §12). Ensure a **consistent body shape** via a global exception filter in `src/common/`:

```ts
{
  statusCode: 409,
  error: "PRESCRIPTION_ALREADY_FULFILLED",   // stable machine-readable code
  message: "This prescription has already been dispensed.",  // human-readable
  details?: { … }                             // field errors for 422
}
```

**Domain conflicts that must return 409 with a specific `error` code** (these are expected business states, not crashes — the frontend shows them inline):
- `PRESCRIPTION_ALREADY_FULFILLED`
- `PRESCRIPTION_EXPIRED`
- `PRESCRIPTION_PRODUCT_MISMATCH` — prescription's `product_id` ≠ scanned batch's `product_id`
- `BATCH_ALREADY_ACCEPTED`
- `NOT_CURRENT_CUSTODIAN`
- `BATCH_EXPIRED`
- `NO_PENDING_TRANSFER`

Stable `error` codes matter more than messages here — the frontend branches on them to show the right UI, and messages may be reworded freely without breaking anything.

---

## 7. List Endpoint Filters

Frontend pages need these query params (confirm they exist in the DTOs under each module's `dto/`):

| Endpoint | Required params | Used by |
|---|---|---|
| `GET /batches` | `owner`, `custodian`, `status`, `page`, `limit`, `search` | Manufacturer My Batches; Distributor/Pharmacy Inventory; Admin Batch Registry |
| `GET /custody/incoming` | `org` | Distributor/Pharmacy Incoming |
| `GET /custody/history/:batchId` | — | `CustodyTimeline` (both modes) |
| `GET /dispensing/history` | `org`, `page`, `limit`, `from`, `to` | Pharmacy History |
| `GET /prescriptions` | `doctor`, `status`, `page`, `limit` | Doctor Prescription History |
| `GET /audit/log` | `actor`, `action`, `from`, `to`, `page`, `limit` | Admin Audit Log |

All list endpoints should return a uniform pagination envelope (`{ data, total, page, limit }`) so `DataTable` has one shape to consume.

---

## 8. `POST /verify/report` (new — currently missing)

The frontend's `app/(public)/verify/report/page.tsx` exists but has no backend counterpart. Add to `verification/`:

```
POST /verify/report        (PUBLIC, no auth, rate-limited)
  body: { batchId?, description, location?, photo? }
  → { reportId }

GET  /verify/reports       (ADMIN only)
  → paginated list for app/admin/alerts
```

- Stored **off-chain in Postgres only** — never written to the blockchain, never sent to IPFS.
- No auth required (a patient suspecting a counterfeit has no account), so rate-limit it like `/verify`.
- Consider requiring nothing identifying by default — the open question in `plan.md` §8 about an optional contact field should be resolved before this ships.

---

## 9. Rate-Limit Headers on Public Verify

`src/verification/guards/verify-rate-limit.guard.ts` exists. Ensure it emits standard headers so the frontend can show a useful retry message rather than a generic failure:

```
429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
```

Apply the same guard to `POST /verify/report`.

---

## 10. Response Shape for `POST /dispensing/prepare`

This one deserves explicit spec because the frontend branches its entire UI on it:

```ts
{
  batchId: string;
  dispensingType: 'OTC' | 'PRESCRIPTION';   // ← authoritative, server-derived
  product: { id, name, dosage };
  batch:   { batchChainId, expiryDate, status, availableQty };
  custodianOk: boolean;                      // is the requesting pharmacy the current custodian?
  blockers: string[];                        // e.g. ['BATCH_EXPIRED'] — empty means clear to proceed
}
```

**Invariants:**
- `dispensingType` is derived from `products.dispensing_type` via the batch — **never** read from the request body. Per `AGENTS.md` §2.5, no dispensing endpoint accepts it as client input; reject the request if it appears.
- `blockers` being non-empty must prevent the corresponding `prepare-otc` / `prepare-prescription` call from succeeding — don't rely on the frontend to enforce it.

---

## 11. `POST /prescriptions/:id/validate` Response Shape

```ts
{
  valid: boolean;
  prescription: { id, productId, productName, dosage, quantity, expiry, status };
  failures: string[];   // e.g. ['PRESCRIPTION_PRODUCT_MISMATCH'] — empty when valid
}
```

Request body takes `{ scannedBatchProductId }`. The match is `prescription.product_id === scannedBatchProductId` — **a prescription is never tied to a specific batch**, so any valid batch of the prescribed product satisfies it (see `backend-architecture.md` §7 and `plan.md` §3).

Access control: authenticated **pharmacy or issuing doctor only**. A `GET /prescriptions/:id` from any other role — or any unauthenticated request — must 403. This is the access control standing in for encryption in the prototype (`backend-architecture.md` §11), so it has to be airtight.

---

## 12. Backend Integration Checklist

- [ ] CORS configured against `FRONTEND_ORIGIN` with `credentials: true`.
- [ ] `GET /users/me` restores role/session from cookie alone (no re-signing required).
- [ ] JWT payload carries the wallet address; mismatched-address requests rejected server-side.
- [ ] Every `prepare*` endpoint returns the exact `PreparedTransactionDto` shape; `uint256` args serialized as decimal strings.
- [ ] **No `prepare*` endpoint signs or submits anything.** Grep for `signer` / private key usage outside `indexer/`'s read-only provider — should be zero hits.
- [ ] `GET /web3/config` returns current ABIs + addresses and is regenerated on every deploy.
- [ ] `GET /indexer/status?txHash=` exists and is the single polling target for all write flows.
- [ ] Every indexed read response includes `txHash`.
- [ ] Global exception filter emits `{ statusCode, error, message }` with stable `error` codes; all seven domain conflicts in §6 return 409.
- [ ] All list endpoints support their §7 filters and return a uniform pagination envelope.
- [ ] `POST /verify/report` + `GET /verify/reports` exist; reports stored in Postgres only, never chain/IPFS.
- [ ] `/verify` and `/verify/report` require no auth and emit `Retry-After` on 429.
- [ ] `POST /dispensing/prepare` returns server-derived `dispensingType`; any request body containing `dispensingType` is rejected.
- [ ] `GET /prescriptions/:id` 403s for every role except the issuing doctor and an authenticated pharmacy.
