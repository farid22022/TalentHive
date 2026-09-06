# AI Architecture

`AIService` (feature layer) → `AIProvider` (transport). Selected by `AI_PROVIDER`.

## Providers
- **mock** (default dev) — deterministic, hash-seeded transport, no API key. `integrations/ai/index.js`.
  The `AIService` detects the mock provider and runs its own deterministic heuristic analyzer
  (skill-dictionary scan, `N years` regex, section detection, length/section scoring) so dev output
  is genuinely useful without an API key.
- **openai / openrouter / local** — OpenAI-compatible `chat({messages,json,temperature,maxTokens})`.
  Base URLs: openai `https://api.openai.com/v1`, openrouter `https://openrouter.ai/api/v1`,
  local `AI_BASE_URL`. Uses `response_format: json_object` for structured features. ✅ wired (Phase 3).

## Feature methods
- `analyzeCV` — ✅ Phase 3. Extracts CV text (stored file or pasted), prompts for strict JSON, validates
  with Zod, falls back to the heuristic analyzer on any parse/validation failure, and persists results.
- `assistProposal` — ✅ Phase 6. Cover-letter assistant behind `POST /api/ai/proposal/draft`. Reads the job
  post + the caller's profile, computes skill overlap and a budget-aware suggested bid, then either prompts
  the provider for strict JSON or (mock provider / parse failure) runs `heuristicProposalDraft`. A model's
  suggested bid is only trusted when it lands inside the advertised budget. Returns the draft plus
  `talkingPoints`, `matchedSkills`, `missingSkills` and a disclaimer. Refuses your own job or a job that is
  not `open`. **Advisory only** — nothing is persisted as an `AIAnalysis` and no proposal is ever created;
  the freelancer edits the text and submits it themselves, optionally disclosing `aiAssisted` to the client.
- `matchTalent`, `generateJobPost`, `analyzeJob`, `improveProfile`, `riskSignals`, `recommend` — later phases.

## Cost control
- Content-hash cache: skip re-analysis of unchanged CVs (store `textHash`).
- Token limits + per-user AI rate limits (`aiLimiter` guards `cv/analyze` and `proposal/draft`).
- Retry with model fallback.
- `AIUsage` log: userId, feature, provider, model, inputTokens, outputTokens, estimatedCost, createdAt.
- Persist results to `AIAnalysis`.

## Guardrail
AI CV analysis is NOT identity verification. Risk scores feed a rule engine → human/admin review;
never auto-ban from an AI score alone. Likewise the proposal assistant is a drafting aid: it never
submits on the freelancer's behalf and its output carries a visible disclaimer.
