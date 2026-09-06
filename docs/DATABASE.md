# Database (Mongoose) Schema Plan

Reference-based relationships (ObjectId), no unnecessary duplication. Denormalize only hot read
fields (e.g. cached rating/counts) via background recompute.

## Core (Phase 1)
- **User** — name, email(unique), passwordHash(select:false), role, roles[], avatar, phone,
  emailVerified, phoneVerified, status(active|suspended|banned|deleted), lastActiveAt, timestamps.
- **RefreshToken** — user, tokenHash, family, expiresAt, revoked, replacedBy (rotation/reuse detection).
- **PlatformSetting** — singleton config: fees, limits, feature flags.

## Profiles (Phase 2 ✅)
- **FreelancerProfile** — user (ref, unique), title, overview, category, hourlyRate, availability
  (full_time/part_time/not_available), skills[], languages[{name,proficiency}], location{country,city,timezone},
  links{website,linkedin,github}, education[], experience[], certifications[], portfolio[{title,url,image,description,tags[]}],
  cv{url,filename,provider,path,uploadedAt}, completeness (weighted, pre-save hook), onboardingCompleted,
  visibility (public/private), verificationState, badges[] (Phase 4, denormalized trust chips for public display).
  Text index on title/overview/skills. `toJSON` strips cv.path + __v.
- **ClientProfile / Company** — user, companyName, industry, size, spending, rating. _(later)_
- **Education / Experience / Certification / Portfolio** — owner(user), fields per spec.
- **CV** — user, fileRef, textHash, extracted(AIAnalysis ref), status.
- **Skill / Category** — taxonomy; Category is hierarchical (parent ref).

## Marketplace
- **Job** — ✅ Phase 5. client (ref User, indexed), title, description, category (enum, indexed),
  skills[] (indexed), budget{type(`fixed`|`hourly`),min,max,currency}, experienceLevel(`entry`|`intermediate`|`expert`),
  duration(`short`|`medium`|`long`), status(`draft`|`open`|`closed`|`filled`, indexed), proposalsCount
  (✅ Phase 6 — ±1 as proposals are submitted/withdrawn), savedCount. Indexes: text(title,description),
  {status,createdAt:-1}. Only `open` jobs are public; drafts/closed/filled are owner-only. `toJSON` strips __v.
- **SavedJob** — ✅ Phase 5. user (ref, indexed), job (ref, indexed), timestamps. Unique compound index
  {user,job} (one bookmark per job); incrementing/decrementing Job.savedCount on save/unsave.
- **Service** — freelancer, title, category, packages[{tier,price,delivery,revisions}], portfolio[].
- **Proposal** — ✅ Phase 6. job (ref, indexed), freelancer (ref User, indexed), client (ref User, indexed —
  denormalized job owner so a client can list everything they received in one query), coverLetter,
  bid{amount,type(`fixed`|`hourly`),currency}, estimatedDays, milestones[{title,amount,dueDate,description}]
  (keep their own `_id` so Phase 8 contracts can reference them individually), status
  (`submitted`|`shortlisted`|`rejected`|`withdrawn`|`accepted`, indexed), reviewNote, viewedAt (client's
  first open), decidedAt, withdrawnAt, aiAssisted (freelancer's own disclosure — transparency, not a
  quality signal). Indexes: unique {job,freelancer} (withdrawn proposals are revived, not duplicated),
  {client,status,createdAt:-1} (review queue), {freelancer,createdAt:-1}, {job,status,createdAt:-1}.
  Job.proposalsCount moves ±1 on submit/withdraw. `toJSON` strips __v. Attachments are **not** part of
  this phase — proposals carry text, bid and milestones only.
- **Invitation / Interview** — job, client, freelancer, status, schedule, notes.

## Contracts & Money
- **Contract** — client, freelancer, job, proposal, type, rate, scope, milestones[], status.
- **Milestone** — contract, title, amount, dueDate, status.
- **WorkSubmission** — contract/milestone, files[], links[], notes, status.
- **Payment / Transaction / Wallet / Withdrawal / Invoice** — money movement, provider-agnostic refs.

## Social / Trust
- **Review** — contract, author, target, ratings{communication,quality,...}, comment.
- **Conversation / Message** — participants[], job/contract ref, attachments[], readReceipts.
- **Notification** — user, type, payload, read, channel.
- **SavedJob / SavedFreelancer / SavedSearch** — user + target/query.

## Moderation & AI
- **Dispute / Report / AdminAction** — moderation workflow + audit log.
- **VerificationRequest** — ✅ Phase 4. user (ref, indexed), type (`identity`|`document`), status
  (`pending`|`approved`|`rejected`|`cancelled`, default pending), note, documents[{url,filename,provider,path,uploadedAt}]
  (private storage), reviewNote, reviewedBy (ref User), reviewedAt. Indexes {user,type,status} and
  {status,createdAt:-1} (FIFO queue). `toJSON` strips each document's `path` + __v. Email/phone are
  self-serve signals on **User** (emailVerified/phoneVerified); identity/document need admin approval.
  Approval calls `syncUserBadges` → recomputes **FreelancerProfile.badges[]** and elevates `verificationState`
  (advisory AI never elevates state — only human admin approval does).
- **SkillAssessment** — states, badges, test attempts. _(later)_
- **AIAnalysis** — ✅ Phase 3. user, feature (`cv_analysis`), provider, model, textHash (cache key),
  source{kind,filename}, result{summary, overallScore, atsScore, detectedSkills[], suggestedSkills[],
  experienceYears, seniority, strengths[], weaknesses[], recommendations[{title,detail,priority}],
  missingSections[], wordCount, disclaimer}, tokens{input,output}, estimatedCost, status.
  Indexes: {user,feature,textHash} (cache), {user,feature,createdAt} (history). History pruned to 25/user.
- **AIUsage** — ✅ Phase 3. per-call cost log: user, feature (`cv_analysis` | `proposal_draft`), provider,
  model, inputTokens, outputTokens, estimatedCost, cached. Cover-letter drafts (Phase 6) log usage here
  but are never persisted as an `AIAnalysis` — the draft is advisory and lives only in the freelancer's form.
