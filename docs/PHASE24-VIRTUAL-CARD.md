# Phase 24: Simulated Virtual Card

The developer virtual card is a fictional TalentHive marketplace wallet. It is not a bank card and this phase does not integrate Bkash, Nagad, Rocket, Visa, Mastercard, or any real payment provider.

## Flow

Freelancer registration creates one idempotent `VirtualCard` with status `inactive` and a zero BDT balance. A successful simulated reload creates a `PaymentTransaction`, credits the card, writes a `WalletLedgerEntry`, and activates the card when the stored activation minimum is reached. Failed reloads leave the balance unchanged.

The ledger is authoritative for movement history. The card balance is a cached current balance and can be checked with `reconcileVirtualCard(cardId)`.

## API

- `GET /api/cards/me`
- `POST /api/cards/create`
- `POST /api/cards/activate`
- `POST /api/cards/freeze`
- `POST /api/cards/unfreeze`
- `GET /api/cards/me/transactions`
- `GET /api/wallet/me`
- `GET /api/wallet/ledger`
- `POST /api/wallet/reload` with `Idempotency-Key`, `amount`, `provider`, and optional `outcome`
- `GET /api/developers/me/eligibility`

Admin-only operations are available through `GET /api/admin/virtual-cards`, `PATCH /api/admin/virtual-cards/:id/status`, and `POST /api/admin/virtual-cards/:id/adjust`. Adjustments always create an auditable ledger entry; balances are never changed directly without a ledger record.

Supported simulation providers are `BKASH_SIMULATED`, `NAGAD_SIMULATED`, and `ROCKET_SIMULATED`. No PIN, OTP, CVV, bank credential, or full card number is accepted or returned.

## Work eligibility

`developerEligibility(user)` is the single proposal gate. A freelancer must have an active card to submit a new proposal; suspended or inactive cards receive `CARD_ACTIVATION_REQUIRED` or `CARD_SUSPENDED`. Existing proposals are preserved.

## Frontend

The protected route `/dashboard/card` provides the masked HTML/CSS 3D card, balance, activation state, simulated reload form, freeze/unfreeze actions, and recent ledger activity. Server state is managed with TanStack Query and invalidates card, wallet, transaction, and eligibility queries after reload or status changes.
