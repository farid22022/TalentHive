# Security

## Auth
- bcrypt (cost 12); `passwordHash` has `select:false` and is stripped in `toJSON`.
- JWT access (15m) + opaque refresh (7d) stored hashed server-side (`RefreshToken`).
- Refresh rotation with token-family reuse detection → revoke family on reuse.
- Refresh token in HTTP-only, SameSite=strict cookie scoped to `/api/auth`.
- Password change / reset invalidates all sessions.

## RBAC
- `requireAuth` loads user + enforces status (banned/suspended/deleted).
- `requireRole(...)` checks `role`/`roles[]`. Permissions ALWAYS enforced server-side.

## Hardening
- Helmet, CORS allowlist (credentials), JSON body cap (1mb).
- Rate limiting: global (`apiLimiter`) + strict auth (`authLimiter`).
- Mongoose `sanitizeFilter` + `strictQuery` to blunt operator injection.
- Zod validation on body/query/params before controllers.
- Global error handler; raw errors/stacks never sent in production.
- Enumeration-safe forgot-password.
- Prod fail-fast if JWT secrets are default or `MONGODB_URI` missing.

## Tracked risks / TODO by phase
- File-upload MIME/size validation + private signed URLs (Phase 2).
- IDOR checks on documents/messages/contracts (per resource).
- CSRF: refresh cookie is SameSite=strict; add CSRF tokens if cross-site flows are introduced.
- Persist single-use email/reset tokens to a collection (currently in-memory) (Phase 4).
- Upgrade Multer to 2.x before enabling uploads (Phase 2).
