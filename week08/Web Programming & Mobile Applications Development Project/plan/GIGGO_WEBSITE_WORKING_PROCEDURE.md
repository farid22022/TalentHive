# Giggo Website Working Procedure

Document date: 23 September 2026  
Purpose: End-to-end operating procedure for the Giggo freelance marketplace

## 1. Scope and status legend

This document explains how the complete Giggo website should work from a
visitor's first visit through hiring, project delivery, payment, completion,
review, support, and administration.

It deliberately separates implemented behavior from future behavior:

- **CURRENT** — available in the current Giggo frontend/backend code.
- **PARTIAL** — code exists, but a provider, final verification, or a broader
  workflow is still incomplete.
- **PLANNED** — part of the approved roadmap but not yet available.
- **DEVELOPMENT ONLY** — safe local demonstration behavior; not a production
  external-service integration.

This is the target website procedure, not a claim that every planned step is
already deployed.

## 2. Main users

### 2.1 Visitor

A visitor can view the home page, browse public jobs, search visible freelancer
profiles, open job/profile details, and access registration or login.

### 2.2 Freelancer

A freelancer can build a professional profile, upload a CV, request
verification, find and save jobs, submit proposals, negotiate offers, accept
contracts, communicate with clients, and deliver work.

### 2.3 Client

A client can maintain a client profile, publish jobs, review applicants,
negotiate and send offers, manage contracts, inspect submitted work, request
revisions, and complete projects.

### 2.4 Administrator

The current administrator role can review verification requests. The complete
operations, moderation, dispute, finance, and security dashboard is planned.

## 3. Standard system processing rule

Every protected action follows the same trusted path:

1. The user performs an action in the React interface.
2. The frontend validates obvious required fields and formats.
3. The frontend sends the Supabase access token with the API request.
4. Express verifies the token and identifies the MongoDB domain user.
5. The server verifies the user's role and resource relationship.
6. The server validates the request again; frontend validation is never treated
   as authorization.
7. The domain service checks the current state and permitted transition.
8. MongoDB applies the write with relevant uniqueness/concurrency safeguards.
9. Notifications and real-time events are created when applicable.
10. The API returns a structured success or safe error response.
11. The interface refreshes the affected data and shows success, loading,
    empty, or error feedback.

## 4. Complete marketplace journey

### Step 1 — Visit and explore the public website [CURRENT/PARTIAL]

1. A visitor opens Giggo.
2. The visitor can browse public jobs and available freelancer profiles.
3. Public job details show scope, skills, experience, duration, budget type,
   budget range, and current availability.
4. Public freelancer profiles expose only information marked for public use.
5. Services, pricing, help, legal, and several marketing pages are currently
   placeholders and must not be presented as completed product areas.
6. A protected action redirects an unauthenticated visitor to login.

### Step 2 — Register an account [CURRENT]

1. The user selects a client or freelancer role.
2. The user enters name, email, and a compliant password.
3. Supabase Auth creates the authentication identity.
4. Giggo sends an email-verification link through the configured Supabase email
   flow.
5. The user opens the link and returns to Giggo's authentication callback.
6. Giggo establishes a verified session and creates or synchronizes the MongoDB
   domain user by immutable Supabase user ID.
7. An unverified or expired flow shows recovery instructions and permits a
   verification-link resend after the cooldown.
8. Passwords, service-role keys, and authentication tokens are never stored in
   frontend source or MongoDB profile documents.

### Step 3 — Log in and restore a session [CURRENT]

1. The user submits email and password to Supabase Auth.
2. Supabase returns a short-lived authenticated session.
3. The frontend sends the access token to `GET /api/auth/me`.
4. The backend verifies the token and returns the current Giggo user, roles,
   verification state, and profile context.
5. The dashboard navigation is built from the user's authorized roles.
6. On refresh, Supabase restores the session and Giggo reloads the domain user.
7. Logout clears the Supabase session and the frontend access token.

### Step 4 — Complete role-specific onboarding [CURRENT]

1. A new user is directed to onboarding.
2. A freelancer enters professional title, overview, skills, availability,
   experience, education, portfolio, language, and related profile data.
3. A client enters client/company information and the details required to act
   as a job owner.
4. The server validates the role and saves only the fields permitted for that
   profile type.
5. The dashboard shows profile-completion guidance.
6. A freelancer controls whether the profile is publicly visible.
7. Only suitable completed public profiles enter the talent directory; an
   explicitly public applicant profile may still be visible privately to the
   relevant client through its proposal.

### Step 5 — Maintain profile and avatar [CURRENT]

1. The user opens Profile from the dashboard.
2. The user edits allowed profile fields.
3. The user can upload JPEG, PNG, or WebP avatar media within the configured
   size limit.
4. The backend validates the media and sends it to the configured avatar
   storage provider or local development storage.
5. Replacing/removing an avatar updates the Giggo record and cleans local files
   when applicable.
6. For ImgBB-hosted images, removal detaches the image from Giggo; provider-side
   deletion cannot currently be guaranteed.

### Step 6 — Build trust and analyze a CV [CURRENT/PARTIAL]

1. Email verification is derived from Supabase's verified identity.
2. A freelancer can request supported phone or document/CV verification.
3. Verification files remain private and are never exposed through public
   profile routes.
4. An administrator reviews the request and approves or rejects it with a
   recorded decision.
5. Approved trust indicators appear on the appropriate profile.
6. A freelancer may upload a private PDF, DOCX, or TXT CV for analysis.
7. The CV analyzer produces advisory feedback and skill suggestions.
8. Suggested skills change the profile only after the freelancer explicitly
   applies them.
9. AI analysis cannot approve verification, hire a freelancer, or make another
   authoritative marketplace decision.
10. The CV feature has automated coverage but still retains its documented
    live browser verification gate.

### Step 7 — Create and publish a job [CURRENT/PARTIAL]

1. A client opens **My Jobs** and selects **Post a Job**.
2. The client enters title, description, category, required skills, experience
   level, duration, budget type, range, and currency.
3. The frontend validates form completeness.
4. The backend verifies the client role, validates bounds, and stores the job.
5. A job follows `draft -> open -> closed/filled` according to owner action and
   hiring outcome.
6. An open job becomes visible in public discovery.
7. The owner can edit or remove the job while permitted by its lifecycle.
8. Full authenticated job-post/edit browser verification remains a recorded
   quality gate even though the implementation is present.

### Step 8 — Discover, follow, and evaluate jobs [CURRENT/PARTIAL]

1. A freelancer browses **Find Jobs**.
2. The freelancer searches/filters the available job set.
3. Each result can show whether the freelancer has already applied or followed
   it.
4. The freelancer can save/unsave an eligible job.
5. **Saved Jobs** shows followed opportunities.
6. **Applied**, **Followed**, and **Completed** are different meanings:
   - Applied means the freelancer submitted a proposal.
   - Followed means the freelancer saved the job.
   - Completed requires a completed contract and cannot be inferred from a job
     or proposal status alone.
7. Full global marketplace discovery across jobs, talent, agencies, and
   services is planned for a later phase.

### Step 9 — Submit and manage a proposal [CURRENT]

1. An authenticated freelancer opens an eligible open job.
2. The freelancer selects **Submit Proposal**.
3. The freelancer enters a cover letter, bid, estimated duration, and optional
   proposed milestones.
4. The freelancer may request an editable AI-assisted draft based on the
   profile and job context.
5. Using that draft enables the AI-assistance disclosure; the user must review
   and submit it manually.
6. The backend verifies the freelancer role, job state, valid amounts/duration,
   and the one-proposal-per-freelancer-per-job invariant.
7. The proposal begins as `submitted`.
8. The freelancer can edit an active proposal, withdraw it, or resubmit the
   withdrawn proposal without creating a duplicate.
9. **My Proposals** shows the proposal and its current decision state.

### Step 10 — Review applicants [CURRENT]

1. The client opens **Proposals Received**.
2. The client sees proposals only for jobs owned by that client.
3. The client reviews the cover letter, bid, duration, milestones, AI
   disclosure, and relevant public applicant profile.
4. The client can shortlist, reject, or reconsider a proposal with appropriate
   notes.
5. Proposal status can move among `submitted`, `shortlisted`, `rejected`,
   `withdrawn`, and `accepted` only through permitted actions.
6. Shortlisting does not hire the freelancer; hiring occurs only after an offer
   is accepted.

### Step 11 — Create and negotiate an offer [CURRENT]

1. The client creates an offer only from a shortlisted proposal for the
   client's own job.
2. The client selects fixed-price or hourly terms, budget/rate, schedule, and
   fixed-price milestones where applicable.
3. A draft is private to the client.
4. Sending the offer creates an immutable published revision.
5. The freelancer reviews the exact published revision.
6. The freelancer can accept, decline, or request changes.
7. A change request and the accompanying conversation remain in chronological
   history.
8. The client edits a new draft without overwriting the earlier published
   revision, then sends the new revision.
9. Acceptance is tied to the exact current revision, preventing stale-term
   acceptance.
10. Before acceptance, obvious off-platform contact details are blocked in the
    offer conversation. After acceptance, participants may share their chosen
    communication details.
11. Offer states are `draft`, `sent`, `changes_requested`, `revising`,
    `accepted`, `rejected`, or `withdrawn`.

### Step 12 — Convert acceptance into active work [CURRENT]

When a freelancer accepts the current offer, one protected server operation:

1. Confirms the offer is sent, current, unexpired, and addressed to that
   freelancer.
2. Confirms the job, proposal, client, and freelancer relationships.
3. Conditionally marks the chosen proposal accepted.
4. Marks the job filled so a concurrent second acceptance cannot hire another
   freelancer.
5. Copies the immutable accepted terms into exactly one contract.
6. Creates or reuses exactly one participant-only project workspace.
7. Creates fixed-price project milestones or a default delivery milestone when
   the accepted fixed-price terms contain none.
8. Retains the negotiation conversation and links it from the project.
9. Notifies both participants.
10. Safely reuses the same contract/project if a completed request is retried.

### Step 13 — Use the project workspace [CURRENT]

1. Client and freelancer open **My Projects**.
2. Only the two contract participants can open the project.
3. The workspace shows job context, counterpart, accepted contract terms,
   contract status, progress, project history, messages, and delivery controls.
4. The contract remains the source of truth for commercial terms and lifecycle
   state; the project does not silently alter the accepted agreement.
5. While an active contract is in progress, a freelancer may report increasing
   progress from 1% through 99% with a required note.
6. Progress cannot move backward, be repeated as a stale action, or be changed
   while the contract is paused/completed/cancelled.
7. Final 100% is recorded by contract completion, not by a manual freelancer
   update.

### Step 14 — Communicate and receive notifications [CURRENT]

1. Users can create direct conversations with eligible contacts.
2. Users can create groups and authorized owners can manage participants.
3. Conversation history is loaded through authenticated REST requests.
4. Socket.IO provides live messages, typing state, presence, read state, and
   reconnect behavior.
5. A client-generated message ID prevents duplicate messages on retry.
6. Users can reply, react, pin, save, edit within the permitted window, and
   delete according to sender/owner rules.
7. Opening a conversation marks related message notifications as read.
8. Notifications support unread totals, read/read-all, archive, action links,
   preferences, real-time delivery, and deduplication.
9. Attachments remain disabled until storage access, malware scanning,
   retention, and deletion rules are approved and tested.

### Step 15 — Deliver fixed-price milestone work [CURRENT on week-07-sarafat]

For every fixed-price milestone:

1. The freelancer selects **Start Milestone**.
2. The milestone changes from `pending` to `in_progress`.
3. The freelancer submits a required delivery description and optional bounded
   HTTP/HTTPS delivery links.
4. Giggo creates a new immutable submission version and changes the milestone
   to `submitted`.
5. The client reviews only the latest pending submission.
6. The client either:
   - approves it, moving the milestone/submission to `approved`; or
   - requests a revision with required feedback, moving them to
     `revision_requested`.
7. On a revision request, the freelancer submits a new version instead of
   editing or erasing the previous delivery.
8. The workspace preserves every version, decision, link, timestamp, and
   feedback entry.
9. The approved-milestone ratio advances project progress up to 99%.
10. A fixed-price contract cannot be completed until every milestone is
    approved.

Milestone state flow:

`pending -> in_progress -> submitted -> approved`

Revision loop:

`submitted -> revision_requested -> submitted (new version) -> approved`

### Step 16 — Record hourly work [PARTIAL — implemented locally; browser verification pending]

1. An hourly contract receives a dedicated work diary rather than fixed-price
   delivery milestones.
2. The freelancer starts one active timer for the eligible contract.
3. Heartbeats keep the running session current and allow stale-session
   detection.
4. The freelancer stops the timer and supplies a meaningful work description.
5. The freelancer may add bounded manual entries according to the approved
   policy.
6. Giggo prevents overlapping/concurrent timers and client-side time
   manipulation.
7. Permitted edits/deletions retain revision/audit history.
8. The client can inspect daily/weekly work-diary entries and summaries.
9. Paused, completed, cancelled, or unauthorized contracts reject time writes.
10. A timer already running when the contract leaves `active` can still be
    closed safely; recorded time is capped at the last safe heartbeat and the
    contract transition boundary.
11. Displayed value is an estimate from the accepted rate snapshot. It is not
    an invoice, wallet balance, escrow record, or payment confirmation.

### Step 17 — Generate invoices and process marketplace finance [PLANNED]

1. Giggo closes an hourly billing period using server-calculated billable time
   and the applicable historical rate.
2. The system creates an immutable invoice snapshot.
3. A fixed-price client funds a milestone through an explicitly labeled
   development-only simulated payment provider.
4. Payment requests use idempotency keys so retries do not duplicate money
   events.
5. An immutable ledger records funding, release, fee, refund, withdrawal, and
   adjustment entries.
6. Wallet balances are derived from the ledger, never accepted from the
   browser.
7. A client releases approved milestone funds; hourly invoices follow the
   approved billing policy.
8. Failed operations remain auditable and support safe retry/reconciliation.
9. A freelancer can inspect transaction history and request withdrawal.
10. No real money, escrow guarantee, bank/card credential, or production
    payment claim is permitted until a real provider and its security/legal
    workflow are separately approved and implemented.

### Step 18 — Pause, resume, cancel, or complete a contract [CURRENT]

1. A client may pause an active contract.
2. A paused contract blocks project progress, milestone work, and future hourly
   time writes.
3. The client may resume a paused contract.
4. Either participant may cancel an active/paused contract with a required
   reason.
5. Only the client may complete a contract.
6. Fixed-price completion is rejected until all milestones are approved.
7. Completion moves project progress to 100% and records the actor, role,
   timestamp, prior status, new status, and note.
8. `completed` and `cancelled` are terminal states.

Contract state flow:

- `active <-> paused`
- `active/paused -> cancelled`
- `active -> completed`

### Step 19 — Leave reviews and calculate reputation [PLANNED]

1. Only a successfully completed eligible marketplace outcome enables review.
2. Each participant can leave at most one review for the other participant per
   eligible contract/order.
3. A review contains bounded overall/category ratings, title, and comment.
4. The reviewed party may add one controlled reply.
5. Public profiles show paginated verified-outcome reviews.
6. Reputation is calculated by the server from verified outcomes; users cannot
   submit their own reputation totals.
7. A report workflow sends inappropriate reviews to moderation without silently
   rewriting history.

### Step 20 — Buy and deliver packaged services [PLANNED]

1. A freelancer creates a draft service with media, scope, packages/tiers,
   pricing, delivery time, revisions, and availability.
2. The freelancer publishes the validated service.
3. A client searches services and opens a service detail page.
4. The client selects a package and submits order requirements.
5. Giggo creates a service order connected to the finance abstraction.
6. The freelancer accepts/fulfils the order and submits delivery.
7. The client approves, requests an allowed revision, cancels under policy, or
   opens a dispute.
8. Completion enables review eligibility.

The current Services route is only a placeholder; this workflow must be
designed and implemented before it is advertised as available.

### Step 21 — Handle disputes and reports [PLANNED]

1. An eligible participant opens a dispute against the relevant contract,
   milestone, invoice, payment, or service order.
2. The participant submits a reason and permitted evidence.
3. The other participant receives notice and can respond.
4. An authorized administrator reviews the complete audit trail.
5. The administrator records a reasoned resolution.
6. Any refund or adjustment is written through the immutable finance ledger.
7. Status changes, evidence access, and moderation actions remain restricted
   and auditable.

### Step 22 — Administer marketplace operations [PARTIAL/PLANNED]

Current administrator procedure:

1. An administrator signs in through a provisioned admin account.
2. The administrator opens the verification queue.
3. The administrator reviews private evidence and records an approval or
   rejection.

Planned complete administrator procedure:

1. View bounded marketplace health and recent operational activity.
2. Review users, contracts, disputes, reports, finance exceptions, verification
   requests, and security events.
3. Suspend/reactivate accounts using reversible, reasoned actions.
4. Resolve moderation/finance cases with a complete audit trail.
5. Never expose service credentials or unrestricted sensitive data in the
   dashboard.

### Step 23 — Manage settings and delete an account [CURRENT]

1. A user can manage supported settings and notification preferences.
2. Password reset uses the verified Supabase recovery flow.
3. Permanent account deletion requires recent password reauthentication.
4. The user must enter the exact confirmation text `DELETE`.
5. The backend rate-limits the operation and blocks administrator
   self-deletion.
6. Giggo removes the Supabase identity and owned Giggo records according to the
   deletion policy.
7. Retained group history redacts the departing member.
8. A minimal identity tombstone prevents an old token from recreating the
   deleted account.

## 5. Role and permission summary

| Capability | Visitor | Freelancer | Client | Admin |
| --- | --- | --- | --- | --- |
| Browse public jobs/talent | Yes | Yes | Yes | Yes |
| Maintain own profile | No | Yes | Yes | Yes |
| Publish/manage jobs | No | No | Yes | Only if also client |
| Save/apply to jobs | No | Yes | No | Only if also freelancer |
| Review received proposals | No | No | Job owner only | No |
| Create/revise/send offers | No | No | Eligible job owner | No |
| Accept/decline/request changes | No | Addressed freelancer | No | No |
| View contract/project | No | Participant only | Participant only | Not by default |
| Submit milestone work | No | Contract freelancer | No | No |
| Review milestone work | No | No | Contract client | No |
| Control contract lifecycle | No | Cancel only | Pause/resume/complete/cancel | No |
| Review verification evidence | No | No | No | Yes |
| Use full moderation/finance console | No | No | No | Planned |

## 6. Failure and recovery behavior

1. Invalid input returns field-level or actionable safe feedback.
2. Expired authentication redirects the user to sign in again without exposing
   token details.
3. Unauthorized and non-participant requests return a protected error and do
   not reveal private record contents.
4. Duplicate proposals, offers, contracts, messages, and retryable financial
   writes are prevented through uniqueness/idempotency controls.
5. Stale revisions and invalid state transitions are rejected rather than
   overwriting newer work.
6. Loading, empty, unavailable, offline, and server-error states must be visible
   and recoverable.
7. Real-time messaging supplements persisted REST history; reconnecting does
   not make the socket the source of truth.
8. External provider failures must not expose secrets or falsely report a
   completed action.
9. Logs may include request/event identifiers for diagnosis but must exclude
   passwords, access tokens, service keys, and unnecessary private content.

## 7. Local demonstration procedure

### 7.1 Start the backend

```powershell
cd cseku_26_wpl_Giggo_Backend
npm install
npm run dev
```

Expected API: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

The ignored backend `.env` must contain the approved MongoDB and Supabase
server configuration. Never copy its secret values into documentation or Git.

### 7.2 Start the frontend in a second terminal

```powershell
cd cseku_26_wpl_Giggo_Frontend
npm install
npm run dev
```

Expected website: `http://localhost:5173`

### 7.3 Demonstrate the complete currently available journey

1. Register and verify one client account.
2. Register and verify one freelancer account.
3. Complete both profiles.
4. Client posts a fixed-price job.
5. Freelancer finds/saves the job and submits a proposal.
6. Client shortlists the proposal and sends an offer.
7. Freelancer requests a change; client sends a new revision.
8. Freelancer accepts the current revision.
9. Confirm that one contract and one project workspace appear.
10. Exchange live messages and verify notification read state.
11. Freelancer starts and submits milestone work.
12. Client requests a revision.
13. Freelancer submits a new version.
14. Client verifies history and approves all milestones.
15. Confirm active progress reaches 99%.
16. Client completes the contract.
17. Confirm contract status is completed and project progress is 100%.

Do not include hourly tracking, real payments, reviews, packaged services,
disputes, or the full admin platform in the live demonstration until their
roadmap items are implemented and verified.

## 8. Completion standard for every future step

A planned procedure becomes CURRENT only when all applicable parts pass:

1. Responsive and accessible user interface.
2. Stable frontend API integration.
3. Server-side input validation.
4. Role and resource-level authorization.
5. Persistence, indexes, constraints, and cleanup behavior.
6. Safe failure, retry, concurrency, and idempotency behavior.
7. Relevant unit/integration tests.
8. Frontend production build and backend dependency checks.
9. Authenticated browser journey for both affected roles.
10. Focused commit, remote branch, teammate review, and merge through CI.
