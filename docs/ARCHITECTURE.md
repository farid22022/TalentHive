# Architecture

## 1. High-Level Architecture

```
React (Vite) SPA
   │  Axios (REST)   Socket.IO client (real-time)
   ▼
Express API  ──  HTTP + WebSocket gateway
   ▼
Route → Validator → Controller → Service Layer → Model (Mongoose) → MongoDB
                          │
                          ├── integrations/ai      (AIProvider: OpenAI | OpenRouter | Local | Mock)
                          ├── integrations/payment  (PaymentProvider: Stripe | PayPal | Mock)
                          ├── integrations/storage  (StorageProvider: Cloudinary | Local)
                          └── integrations/email    (EmailProvider: SMTP | Mock)
```

**Rules of layering**
- **Routes** wire HTTP verb + path → middleware chain. No business logic.
- **Validators** (Zod) validate/normalize `req.body|query|params` before controllers.
- **Controllers** translate HTTP ⇄ service calls. No direct DB access.
- **Services** hold business logic and orchestrate models + integrations. Reusable, testable.
- **Models** define schema, indexes, instance/statics. No cross-domain logic.
- **Integrations** are provider-agnostic interfaces selected by env — swappable without touching services.

## 2. Backend Folder Structure

```
server/src/
├── config/         env loading, db connect, logger, constants
├── controllers/    thin HTTP handlers
├── services/       business logic
├── models/         Mongoose schemas
├── routes/         express routers (mounted under /api/*)
├── middlewares/    auth, rbac, error handler, rate limit, upload, validate
├── validators/     Zod schemas per resource
├── utils/          ApiError, ApiResponse, asyncHandler, tokens, pagination
├── jobs/           scheduled/background jobs (cron, queues)
├── sockets/        Socket.IO namespaces + handlers
├── integrations/   ai/ payment/ storage/ email/ (provider factories)
├── ai/             AIService (feature-level: cv, matching, job-gen, risk)
└── uploads/        local file storage (dev)
```

## 3. Frontend Folder Structure

```
client/src/
├── api/          axios instance + endpoint modules
├── components/   reusable UI (Button, Card, Modal, Skeleton, Toast...)
├── pages/        route-level pages
├── layouts/      PublicLayout, DashboardLayout, AuthLayout
├── routes/       route table + ProtectedRoute/RoleRoute
├── hooks/        custom hooks (useAuth, useDebounce...)
├── context/      AuthContext, SocketContext
├── store/        lightweight client state
├── services/     TanStack Query hooks wrapping api/
├── validators/   Zod form schemas
├── constants/    enums mirrored from backend
└── utils/        formatters, helpers
```

## 4. Authentication Architecture

- **Passwords:** bcrypt hashed (cost 12). `passwordHash` never serialized to clients.
- **Tokens:** short-lived JWT **access token** (15m) + long-lived **refresh token** (7d).
  - Access token returned in JSON, sent via `Authorization: Bearer`.
  - Refresh token stored in an **HTTP-only, SameSite=strict cookie** + persisted (rotated) server-side.
- **Refresh rotation:** each refresh issues a new refresh token and invalidates the old (reuse detection).
- **RBAC:** `role` + `roles[]` on User. `requireAuth` → `requireRole('admin')` etc. Permissions
  are ALWAYS checked on the backend; frontend role state is a UX hint only.
- **Flows:** register, login, logout, refresh, forgot/reset password, email verification (token),
  change password, account deletion, suspension enforcement middleware.

## 5. AI Architecture

`AIService` exposes feature methods (`analyzeCV`, `matchTalent`, `generateJobPost`, `analyzeJob`,
`assistProposal`, `improveProfile`, `riskSignals`, `recommend`). Internally it calls the configured
`AIProvider` (`chat`/`complete`). Providers: **OpenAI**, **OpenRouter**, **Local**, **Mock** (default
in dev — deterministic, no API key). Selected by `AI_PROVIDER`.

**Cost control:** content-hash cache (skip re-analysis of unchanged CVs), token limits, per-user rate
limits, retry with model fallback, and a `AIUsage` log (userId, feature, provider, model, tokens,
estimatedCost). Results persisted to `AIAnalysis`.

## 6. Payment Abstraction

`PaymentProvider` interface: `createPaymentIntent`, `capture`, `refund`, `payout`, `webhook`.
Implementations: **StripeProvider**, **PayPalProvider**, **MockPaymentProvider** (default dev).
Supports deposits, milestone funding (escrow-style hold), release, refunds, configurable platform
fees, freelancer earnings, transactions, invoices. **No raw card data ever stored.**

## 7. Verification Architecture

States: `UNVERIFIED → PROFILE_REVIEW → AI_REVIEWED → DOCUMENT_VERIFIED → IDENTITY_VERIFIED →
MANUALLY_VERIFIED → VERIFIED` (+ `REJECTED`, `SUSPENDED`). Pipeline:
`CV upload → validate → text extract → AI analyze → extract profile → consistency checks →
risk signals → verification queue → admin/external review → badge`. **AI analysis ≠ identity
verification** — badges are distinct (CV Verified / Identity Verified / Skill Verified).

## 8. Real-Time (Socket.IO)

Authenticated socket (JWT handshake). Events: chat message, typing, presence (online/offline),
notifications, proposal/contract/payment updates. Rooms per conversation and per user.

## 9. Dependencies & External Services (need keys in prod)

| Concern    | Prod service            | Dev default                | Env |
|------------|-------------------------|----------------------------|-----|
| Database   | MongoDB / Atlas         | in-memory mongo            | `MONGODB_URI` |
| AI         | OpenAI / OpenRouter     | MockProvider (no key)      | `AI_PROVIDER`, `AI_API_KEY` |
| Payments   | Stripe / PayPal         | MockPaymentProvider        | `STRIPE_SECRET_KEY` |
| Storage    | Cloudinary (docs) / ImgBB (images) | local disk (`uploads/`) | `IMGBB_API_KEY`, `CLOUDINARY_*` |
| Email      | SMTP provider           | Mock (logs to console)     | `SMTP_*` |

## 10. What Is Mocked in Development
- **AI** → deterministic MockProvider (structured fake analyses).
- **Payments** → MockPaymentProvider (instant success, no charge).
- **Email** → console transport.
- **Storage** → local `uploads/` with signed-URL-style access route.
- **Database** → optional in-memory MongoDB when `MONGODB_URI` unset.

## 11. Security Risks Tracked
JWT secret leakage, refresh-token theft/reuse, NoSQL injection, file-upload abuse (MIME/size),
XSS in user content, IDOR on documents/messages, over-trusting AI risk scores (always human review
before bans), rate-limit gaps on auth. Mitigations in [SECURITY.md](SECURITY.md).
