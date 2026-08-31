# Deployment

## Environments
- **Dev:** in-memory Mongo, mock AI/payments/email/storage. Zero external keys.
- **Prod:** set `MONGODB_URI`, strong `JWT_SECRET`/`JWT_REFRESH_SECRET`, real provider keys.

## Build & run
```bash
# Backend
cd server && npm ci && NODE_ENV=production node src/server.js
# Frontend
cd client && npm ci && npm run build   # serve dist/ via CDN/static host
```

## Checklist (Phase 15)
- [ ] Set all secrets via environment / secret manager (never commit `.env`).
- [ ] `COOKIE_SECURE=true` behind HTTPS; correct `CLIENT_URL` for CORS.
- [ ] MongoDB Atlas with backups + IP allowlist.
- [ ] Reverse proxy (TLS termination), `trust proxy` already set.
- [ ] Centralized logging + error monitoring.
- [ ] Rate limits tuned; WAF/CDN in front.
- [ ] Run test suite in CI before deploy.
