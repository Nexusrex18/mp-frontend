### Standing context & rules for any AI coding agent working on this project

This file is read by the coding agent at the start of every session. It is the **contract** for how work gets done on this codebase. `frontend-architecture-plan.md` is the design spec; `Plan.md` is the build roadmap; this file is *how you, the agent, should behave* while executing that roadmap.

---

## 1. What this project is

A role-based Web3 dApp for pharmaceutical batch traceability, built on:
- An Ethereum L2 rollup (Arbitrum/Base/Polygon CDK) for custody tracking and dispensing logic.
- IPFS for batch documents/certificates.
- A single public, wallet-free QR verification surface for patients.
- Five internal roles: Admin, Manufacturer, Distributor, Pharmacy, Doctor.
- An isolated, optional AI/Demand Intelligence module (BERT + CNN-LSTM output, read-only display) that must never be required for the core flow.

**The core narrative, always:** Create → Track → Transfer → Verify → Dispense → Verify as Patient.

Reference documents (read these before starting any task, in this order):
1. `frontend-architecture-plan.md` — the design spec (routes, pages, components, flows)
2. `Plan.md` — the build roadmap (phases, definitions of done)
3. this file — behavioral rules

---

## 2. Hard rules (never violate these, even if a task description seems to ask for it)

1. **Dispensing Type is never a user-facing choice.** It is read from the on-chain batch record. If you are ever asked to add a dropdown/toggle letting a pharmacist pick OTC vs Prescription, flag it — that contradicts the architecture and should not be implemented without an explicit, deliberate scope change.
2. **No wallet UI, ever, on `/verify` or `/verify/report`.** These routes are the public trust surface. Do not import `WalletConnectButton`, do not gate them behind role checks, do not add MetaMask prompts.
3. **No blockchain jargon in patient-facing copy.** Banned words/phrases in `/verify*` UI text: "gas," "wallet," "transaction hash," "smart contract," "blockchain" (the last one is a gray area — prefer "secure registry" or similar if it must appear at all).
4. **`CustodyTimeline` is one component, not two.** It takes a `mode: 'full' | 'simplified'` prop. If a page needs a different look, extend the prop/variant system — do not fork the component.
5. **Every state-changing (mutating) action must show `TxStateBanner`'s Pending → Confirmed sequence.** Never resolve a write directly to a success screen without the pending intermediate state, even if the L2 is fast enough that it's visually brief.
6. **Doctor and Admin are not part of the primary demo path.** Don't design onboarding, empty states, or default routing that funnels users through Doctor/Admin unless the task specifically concerns those roles.
7. **The AI/Demand Intelligence module must remain removable.** It lives only at `/admin/intelligence`, is read-only, and must never be a dependency for any Manufacturer/Distributor/Pharmacy/Patient flow to function. If a task requires wiring core dispensing or custody logic to the AI output, stop and flag it — that's a scope/architecture change, not a normal implementation task.

---

## 3. Working conventions

- **Shared-first:** before building page-specific UI, check `components/shared` for an existing component. Extend before duplicating.
- **Route additions:** any new route must be added to the Route Map in `frontend-architecture-plan.md` §2 in the same change — the doc and the code should never drift.
- **Phase discipline:** follow the phase order in `Plan.md` §3 unless explicitly told to jump ahead. Pharmacy (Phase 5) depends on patterns established in Manufacturer (Phase 3) and Distributor (Phase 4); Doctor (Phase 6) depends on Pharmacy's prescription-matching logic existing first.
- **Definition of done:** before marking any phase task complete, re-check the "Definition of done" bullet(s) for that phase in `Plan.md` — don't rely on "it renders" as sufficient.
- **Copy review:** any new patient-facing string should be sanity-checked against the banned-jargon list in §2.4 above before merging.

---

## 4. When requirements conflict

If a new instruction (from a person, a ticket, or another doc) seems to conflict with:
- a **Hard rule** in §2 → do not silently implement it. Ask for confirmation, since these encode deliberate product/safety decisions (e.g., the OTC/Prescription auto-detection exists specifically to remove a class of dispensing error).
- the **architecture spec** (`frontend-architecture-plan.md`) on a non-hard-rule matter (e.g., exact wording, layout details) → the newer instruction wins, but update the architecture doc to keep it in sync.
- the **build order** in `Plan.md` only → fine to reorder with a note, no need to ask.

---

## 5. Quick reference — role/route map

```
PUBLIC (no wallet)          INTERNAL (wallet + role)
├ /                         /auth/connect
├ /verify                   /admin/*        (ADMIN_ROLE)
└ /verify/report            /manufacturer/* (MANUFACTURER_ROLE)
                             /distributor/*  (DISTRIBUTOR_ROLE)
                             /pharmacy/*     (PHARMACY_ROLE)
                             /doctor/*       (DOCTOR_ROLE, conditional)
                             /admin/intelligence (optional AI module)
```

Full page-by-page detail: `frontend-architecture-plan.md` §4.
Full component list: `frontend-architecture-plan.md` §3.
Build order and definitions of done: `Plan.md` §3.
