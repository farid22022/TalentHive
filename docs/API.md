# API Reference

Base URL: `/api`. All responses use a consistent envelope.

**Success:** `{ "success": true, "message": "...", "data": {} }`
**Error:** `{ "success": false, "message": "...", "error": { "code": "...", "details": [] } }`
**Paginated:** `data: { items: [], pagination: { page, limit, total, totalPages } }` via `?page=&limit=`.

## Auth (`/api/auth`) — Phase 1 ✅
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| POST | `/register` | – | name, email, password, role | Sets refresh cookie; returns accessToken + user |
| POST | `/login` | – | email, password | Sets refresh cookie |
| POST | `/refresh` | cookie | – | Rotates refresh token (reuse detection) |
| POST | `/logout` | cookie | – | Revokes refresh token |
| GET  | `/me` | Bearer | – | Current user |
| POST | `/change-password` | Bearer | currentPassword, newPassword | Invalidates sessions |
| POST | `/forgot-password` | – | email | Enumeration-safe |
| POST | `/reset-password` | – | token, newPassword | |
| POST | `/verify-email` | – | token | |
| DELETE | `/account` | Bearer | – | Soft-delete |

## Users (`/api/users`) — Phase 1 ✅
| PATCH | `/me` | Bearer | name?, avatar?, phone? | Update own account |

## Profiles (`/api/profiles`) — Phase 2 ✅
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET  | `/talent` | – | `?search=&category=&availability=&skills=a,b&sort=recent\|rate_asc\|rate_desc&page=&limit=` | Paginated public directory (public profiles only) |
| GET  | `/me` | Bearer | – | Own profile (auto-created on first fetch) |
| PATCH | `/me` | Bearer | title?, overview?, category?, hourlyRate?, availability?, skills[]?, languages[]?, location?, links?, education[]?, experience[]?, certifications[]?, portfolio[]?, visibility? | Partial update; recomputes completeness |
| POST | `/me/onboarding` | Bearer | basics + skills + details | Marks onboardingCompleted; sets public unless visibility given |
| POST | `/me/avatar` | Bearer | multipart `image` | ImgBB when configured, else local; updates `user.avatar` |
| POST | `/me/cv` | Bearer | multipart `document` | Private storage (pdf/doc/docx/txt, ≤ MAX_FILE_MB) |
| DELETE | `/me/cv` | Bearer | – | Removes stored CV |
| GET  | `/:userId` | – | – | Public profile by user id (404 if private/not found) |

## Files (`/api/files`) — Phase 2 ✅
| GET | `/:kind/:name` | optional | – | `images` public; `documents` require Bearer (owner) |

## AI (`/api/ai`) — Phase 3 ✅
All require Bearer. `analyze` is rate-limited (per-user) and content-hash cached.
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/cv/analyze` | `text?`, `force?` | Analyzes pasted `text`, else the profile's stored CV. Cached by content hash unless `force`. Advisory only — never touches verification |
| GET  | `/cv/latest` | – | Most recent CV analysis (or null) |
| GET  | `/cv/analyses` | `?feature=&page=&limit=` | Paginated history |
| GET  | `/cv/analyses/:id` | – | Single analysis (owner-scoped) |
| DELETE | `/cv/analyses/:id` | – | Delete one |
| POST | `/cv/analyses/:id/apply-skills` | – | Merge that run's suggested skills into the profile |

## Verification (`/api/verification`) — Phase 4 ✅
All require Bearer. Email/phone are self-serve; identity/document need admin review. Advisory AI never
elevates state here — only human admin approval does.
| Method | Path | Auth | Body | Notes |
|--------|------|------|------|-------|
| GET  | `/status` | Bearer | – | Own signals + derived badges + recent requests |
| POST | `/email/resend` | Bearer | – | Re-issue email verification link (rate-limited); dev token echoed in non-prod |
| POST | `/phone/send` | Bearer | phone? | Sends a 6-digit OTP (mock SMS in dev; dev code echoed). Rate-limited |
| POST | `/phone/verify` | Bearer | code | Confirms the OTP → sets `phoneVerified`, refreshes badges |
| POST | `/requests` | Bearer | multipart `documents[]` (≤3), type(`identity`\|`document`), note? | One pending request per type; docs stored privately |
| GET  | `/requests` | Bearer | – | Own verification requests |
| DELETE | `/requests/:id` | Bearer | – | Cancel an own pending request |
| GET  | `/admin/requests` | Admin | `?status=&type=&page=&limit=` | Review queue (defaults to `pending`, FIFO) |
| GET  | `/admin/requests/:id` | Admin | – | Single request with applicant detail |
| POST | `/admin/requests/:id/decision` | Admin | decision(`approve`\|`reject`), reviewNote? | Records decision; approval grants badges + elevates `verificationState` |

## Jobs (`/api/jobs`) — Phase 5 ✅
Public board shows only `open` jobs. Posting auto-grants the `client` role. Owner-only mutations are
enforced server-side (403 for non-owners). Draft/closed/filled jobs are visible only to their owner.
| Method | Path | Auth | Body / Query | Notes |
|--------|------|------|--------------|-------|
| GET  | `/` | – | `?q=&category=&skills=a,b&budgetType=fixed\|hourly&experienceLevel=&duration=&minBudget=&maxBudget=&sort=recent\|budget_asc\|budget_desc&page=&limit=` | Paginated public board (open jobs) |
| POST | `/` | Bearer | title, description, category, skills[]?, budget{type,min,max}?, experienceLevel?, duration?, status(`draft`\|`open`)? | Creates a job; grants `client` role |
| GET  | `/mine` | Bearer | `?status=&page=&limit=` | Caller's own jobs (any status) |
| GET  | `/saved` | Bearer | `?page=&limit=` | Caller's saved jobs |
| GET  | `/:id` | optional | – | Single job; non-open visible only to owner (else 404) |
| PATCH | `/:id` | Bearer (owner) | any job field + status(`draft`\|`open`\|`closed`\|`filled`) | Partial update |
| DELETE | `/:id` | Bearer (owner) | – | Delete job (also clears its saves) |
| POST | `/:id/save` | Bearer | – | Bookmark a job (idempotent) |
| DELETE | `/:id/save` | Bearer | – | Remove bookmark |

## Planned mounts (later phases)
`/clients /proposals /contracts /milestones /payments /wallet /withdrawals`
`/messages /notifications /reviews /services /categories /skills /admin /reports /disputes`
