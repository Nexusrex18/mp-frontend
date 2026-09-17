# Frontend Development — Division of Labor

> Two developers working in parallel. Split by domain to minimize merge conflicts.
> Approved: 2026-08-26

---

## Developer A: Public Surface & Administration (Read-Heavy)

### Owned Routes
| Route | Description |
|---|---|
| `(public)/*` | Landing page, `/verify`, `/verify/report` |
| `admin/*` | Stakeholders, Batches, Audit, Alerts, Settings |
| `admin/intelligence/*` | Optional AI/Demand module |

### Owned Phases (from Plan.md)
- **Phase 2:** Public Surface (Patient-facing)
- **Phase 7:** Admin Dashboard
- **Phase 8:** Demand Intelligence Module (optional)

### Assigned Shared Components
- `StatusBadge` (Valid / Recalled / Pending / Counterfeit)
- `CustodyTimeline` (both modes — but primarily the `simplified` patient view)
- `EmptyState`, `DataTable`, `IPFSDocPreview`
- `PublicNavbar`, `Footer`

---

## Developer B: Core Supply Chain (Write-Heavy Web3)

### Owned Routes
| Route | Description |
|---|---|
| `auth/*` | Wallet connect + role redirect |
| `manufacturer/*` | Create Batch, Transfer Custody, Batch Detail |
| `distributor/*` | Incoming, Scan & Accept, Inventory, Transfer |
| `pharmacy/*` | Incoming, Inventory, Dispense (OTC/Prescription auto-branch), History |
| `doctor/*` | Prescriptions (new, list, detail) |

### Owned Phases (from Plan.md)
- **Phase 3:** Auth + Manufacturer
- **Phase 4:** Distributor
- **Phase 5:** Pharmacy (most complex — dispense auto-branching)
- **Phase 6:** Doctor

### Assigned Shared Components
- `WalletConnectButton`, `NetworkGuard`
- `TxStateBanner` (Pending → Confirmed)
- `QRScannerModal`, `QRCodeDisplay`
- `NavbarRoleAware` (internal sidebar layout)

---

## Collaboration Points

1. **Shared types:** Both devs must agree on `lib/types.ts` — interfaces for `Batch`, `TimelineEvent`, `Role`, `PrescriptionRecord` — before building pages.
2. **Phase 0 (Foundation):** Web3 provider setup, `useRole` hook, and `NetworkGuard` should be done first by Dev B so Dev A can mock the role context.
3. **Phase 1 (Shared Components):** Each dev builds their assigned components. Both should be done before starting page work.
4. **Phase 9 (Integration):** Both devs come together. The batch created by Dev B's Manufacturer flow must appear correctly on Dev A's `/verify` page.

---

## Non-Negotiables (both devs)

- Dispensing Type is read from chain, never a manual choice.
- `/verify*` routes have zero wallet UI, zero blockchain jargon.
- `CustodyTimeline` is ONE component with a `mode` prop — no forked copies.
- Every mutating action uses `TxStateBanner` Pending → Confirmed.
