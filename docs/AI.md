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
- `matchTalent`, `generateJobPost`, `analyzeJob`, `assistProposal`, `improveProfile`, `riskSignals`,
  `recommend` — later phases.

## Cost control
- Content-hash cache: skip re-analysis of unchanged CVs (store `textHash`).
- Token limits + per-user AI rate limits.
- Retry with model fallback.
- `AIUsage` log: userId, feature, provider, model, inputTokens, outputTokens, estimatedCost, createdAt.
- Persist results to `AIAnalysis`.

## Guardrail
AI CV analysis is NOT identity verification. Risk scores feed a rule engine → human/admin review;
never auto-ban from an AI score alone.
