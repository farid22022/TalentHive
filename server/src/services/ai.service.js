import { z } from 'zod';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { AIUsage } from '../models/AIUsage.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { Job } from '../models/Job.js';
import { getAIProvider } from '../integrations/ai/index.js';
import { storage } from '../integrations/storage/index.js';
import { extractText, sha256, wordCount } from '../utils/text.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import {
  AI_FEATURES,
  AI_LIMITS,
  AI_PRICING,
  ANALYSIS_STATUS,
  BUDGET_TYPE,
  JOB_STATUS,
  PROFILE_LIMITS,
  PROPOSAL_LIMITS,
  PROPOSAL_TONE,
  SENIORITY,
} from '../config/constants.js';
import fs from 'node:fs';

const DISCLAIMER =
  'This AI analysis is advisory only. It assesses CV content and presentation — it is not identity ' +
  'verification and does not confirm the accuracy of any claim. Use it to improve your profile, not as proof of credentials.';

const PROPOSAL_DISCLAIMER =
  'This is an AI-generated draft, not a finished proposal. Review every claim before sending — you are ' +
  'responsible for what you submit. Edit it to sound like you, and never state experience you do not have.';

// Skill dictionary for deterministic detection (mock/fallback). Original, generic list.
const SKILL_DICTIONARY = [
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift',
  'react', 'vue', 'angular', 'svelte', 'next.js', 'node.js', 'express', 'nestjs', 'django', 'flask', 'spring',
  'rails', 'laravel', '.net', 'graphql', 'rest', 'html', 'css', 'tailwind', 'sass',
  'mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'elasticsearch', 'dynamodb', 'firebase',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'github actions', 'linux',
  'git', 'jest', 'cypress', 'playwright', 'figma', 'photoshop', 'illustrator', 'ui/ux', 'seo',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'data analysis',
  'project management', 'agile', 'scrum', 'leadership', 'communication', 'copywriting', 'marketing',
];

const SECTION_HINTS = {
  summary: /\b(summary|objective|profile|about)\b/i,
  experience: /\b(experience|employment|work history|professional background)\b/i,
  education: /\b(education|academic|degree|university|bachelor|master|phd)\b/i,
  skills: /\b(skills|technologies|competencies|proficienc)/i,
  contact: /(@|\bphone\b|\bemail\b|linkedin\.com|github\.com)/i,
};

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function seniorityFromYears(years) {
  if (years >= 8) return SENIORITY.LEAD;
  if (years >= 5) return SENIORITY.SENIOR;
  if (years >= 2) return SENIORITY.MID;
  return SENIORITY.JUNIOR;
}

/** Deterministic, offline CV analysis used for the mock provider and as a validation fallback. */
function heuristicAnalyzeCV(text) {
  const lower = text.toLowerCase();
  const words = wordCount(text);

  const detectedSkills = SKILL_DICTIONARY.filter((s) => lower.includes(s));

  // Estimate years of experience from phrases like "6 years", "6+ yrs".
  const yearMatches = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)\b/gi)].map((m) => parseInt(m[1], 10));
  const experienceYears = yearMatches.length ? Math.min(40, Math.max(...yearMatches)) : 0;

  const present = Object.entries(SECTION_HINTS).filter(([, re]) => re.test(text)).map(([k]) => k);
  const missingSections = Object.keys(SECTION_HINTS).filter((k) => !present.includes(k));

  // Scoring: sections present, skill coverage, and reasonable length.
  const sectionScore = (present.length / Object.keys(SECTION_HINTS).length) * 45;
  const skillScore = Math.min(30, detectedSkills.length * 3);
  const lengthScore = words >= 250 && words <= 1200 ? 25 : words < 250 ? (words / 250) * 25 : 15;
  const overallScore = clamp(sectionScore + skillScore + lengthScore);

  // ATS score rewards contact info, skills section, and quantified content.
  const hasNumbers = /\d+%|\$\d|\d+\s*(?:users|clients|projects|k\b)/i.test(text);
  const atsScore = clamp(
    (present.includes('contact') ? 25 : 0) +
      (present.includes('skills') ? 25 : 0) +
      (detectedSkills.length >= 5 ? 25 : detectedSkills.length * 5) +
      (hasNumbers ? 25 : 10)
  );

  const strengths = [];
  if (detectedSkills.length >= 6) strengths.push(`Strong technical breadth (${detectedSkills.length} recognizable skills).`);
  if (present.includes('experience')) strengths.push('Clear work-experience section.');
  if (hasNumbers) strengths.push('Includes quantified, measurable achievements.');
  if (!strengths.length) strengths.push('CV text is readable and parseable.');

  const weaknesses = [];
  if (missingSections.includes('summary')) weaknesses.push('No professional summary near the top.');
  if (missingSections.includes('skills')) weaknesses.push('No dedicated skills section for ATS keyword matching.');
  if (!hasNumbers) weaknesses.push('Achievements are not quantified with metrics.');
  if (words < 250) weaknesses.push('CV is short — add more detail on impact and scope.');

  const recommendations = [];
  if (missingSections.includes('skills'))
    recommendations.push({ title: 'Add a Skills section', detail: 'List core tools and technologies so ATS filters and recruiters can match you quickly.', priority: 'high' });
  if (!hasNumbers)
    recommendations.push({ title: 'Quantify achievements', detail: 'Turn duties into outcomes with numbers (e.g. "cut load time 40%", "led a team of 5").', priority: 'high' });
  if (missingSections.includes('summary'))
    recommendations.push({ title: 'Add a headline summary', detail: 'Open with 2–3 lines stating your role, focus, and standout strengths.', priority: 'medium' });
  if (detectedSkills.length < 5)
    recommendations.push({ title: 'Expand skill coverage', detail: 'Name specific frameworks and platforms you have shipped with.', priority: 'medium' });
  if (!recommendations.length)
    recommendations.push({ title: 'Tailor per application', detail: 'Mirror the language of each job post to lift ATS relevance.', priority: 'low' });

  return {
    summary:
      `Detected ${detectedSkills.length} skills across ~${words} words with an estimated ${experienceYears} year(s) of experience. ` +
      `Presentation scores ${overallScore}/100 overall and ${atsScore}/100 for ATS readiness.`,
    overallScore,
    atsScore,
    detectedSkills,
    suggestedSkills: [],
    experienceYears,
    seniority: seniorityFromYears(experienceYears),
    strengths,
    weaknesses: weaknesses.length ? weaknesses : ['No major gaps detected.'],
    recommendations,
    missingSections,
    wordCount: words,
  };
}

// Zod schema to validate real-provider JSON before trusting it.
const resultSchema = z.object({
  summary: z.string().default(''),
  overallScore: z.coerce.number(),
  atsScore: z.coerce.number(),
  detectedSkills: z.array(z.string()).default([]),
  experienceYears: z.coerce.number().default(0),
  seniority: z.string().default(''),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendations: z
    .array(
      z.object({
        title: z.string().default(''),
        detail: z.string().default(''),
        priority: z.enum(['high', 'medium', 'low']).default('medium'),
      })
    )
    .default([]),
  missingSections: z.array(z.string()).default([]),
});

function buildCvPrompt(text) {
  const system =
    'You are a professional CV/résumé reviewer for a freelance marketplace. Analyze the CV and respond with ' +
    'STRICT JSON only, matching this shape: {summary:string, overallScore:number(0-100), atsScore:number(0-100), ' +
    'detectedSkills:string[], experienceYears:number, seniority:"junior"|"mid"|"senior"|"lead", strengths:string[], ' +
    'weaknesses:string[], recommendations:[{title:string,detail:string,priority:"high"|"medium"|"low"}], ' +
    'missingSections:string[]}. Be specific and constructive. Do NOT verify identity or authenticity of claims — ' +
    'this is presentation feedback only.';
  const user = `CV TEXT:\n"""\n${text}\n"""`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

function estimateCost(model, inTok, outTok) {
  const price = AI_PRICING[model];
  if (!price) return 0;
  return +(((inTok || 0) / 1000) * price.input + ((outTok || 0) / 1000) * price.output).toFixed(6);
}

/** Call the provider for JSON, with one retry, and parse the content. Returns null on failure. */
async function chatJSON(provider, messages, schema = resultSchema) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await provider.chat({ messages, json: true });
      let parsed;
      try {
        parsed = JSON.parse(res.content);
      } catch {
        const m = res.content.match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : null;
      }
      const valid = parsed && schema.safeParse(parsed);
      if (valid?.success) return { result: valid.data, usage: res.usage, model: res.model };
      logger.warn('AI JSON validation failed; retrying/falling back');
    } catch (err) {
      logger.warn({ err }, `AI chat attempt ${attempt + 1} failed`);
    }
  }
  return null;
}

/** Load the caller's CV text from stored file, or throw if unavailable. */
async function readStoredCvText(profile) {
  const cv = profile.cv;
  if (!cv?.url) throw ApiError.badRequest('No CV on file. Upload a CV or paste your CV text.');
  if (cv.provider === 'local' && cv.path && fs.existsSync(cv.path)) {
    const buffer = fs.readFileSync(cv.path);
    const text = extractText(buffer, cv.filename);
    if (text) return { text, filename: cv.filename };
  }
  throw ApiError.badRequest(
    'Could not read text from your uploaded CV (it may be an image-only or compressed PDF). Paste your CV text to analyze it.'
  );
}

// --- Proposal cover-letter assistant (Phase 6) ---

// Rough day estimates per engagement length, used to prefill "estimated days".
const DURATION_DAYS = { short: 21, medium: 60, long: 120 };

/** Suggest a bid inside the job's advertised budget, nudged by the freelancer's own rate. */
function suggestBid(job, profile) {
  const b = job.budget || {};
  const type = b.type || BUDGET_TYPE.FIXED;
  const min = Number(b.min) || 0;
  const max = Number(b.max) || 0;
  const mid = min && max ? (min + max) / 2 : max || min;

  let amount = mid;
  if (type === BUDGET_TYPE.HOURLY) {
    amount = Number(profile?.hourlyRate) || mid;
    if (min && amount < min) amount = min;
    if (max && amount > max) amount = max;
  }
  return {
    amount: Math.min(PROPOSAL_LIMITS.BID_MAX, Math.round((amount || 0) * 100) / 100),
    type,
    currency: b.currency || 'USD',
  };
}

/** Skill overlap between a job and a profile, preserving the job's original casing. */
function skillOverlap(job, profile) {
  const mine = new Set((profile?.skills || []).map((s) => s.toLowerCase()));
  const jobSkills = (job.skills || []).map(String);
  return {
    matchedSkills: jobSkills.filter((s) => mine.has(s.toLowerCase())),
    missingSkills: jobSkills.filter((s) => !mine.has(s.toLowerCase())),
  };
}

/** Concrete, checkable talking points drawn from the profile — never invented credentials. */
function buildTalkingPoints({ profile, matchedSkills, notes }) {
  const points = [];
  if (matchedSkills.length) points.push(`Name where you used ${matchedSkills.slice(0, 4).join(', ')} on a shipped project.`);
  const recent = (profile?.experience || [])[0];
  if (recent?.title) {
    points.push(`Reference your ${recent.title}${recent.company ? ` role at ${recent.company}` : ''} as proof of scope.`);
  }
  if ((profile?.portfolio || []).length) points.push('Link the one portfolio piece closest to this brief.');
  if (notes) points.push(`Work in the detail you flagged: "${notes.slice(0, 120)}".`);
  points.push('Close with a specific next step — a question about scope or a call time.');
  return points.slice(0, 6);
}

const TONE_OPENERS = {
  [PROPOSAL_TONE.PROFESSIONAL]: (title) =>
    `Hello,\n\nI read your posting for "${title}" in full, and it maps closely onto the work I do.`,
  [PROPOSAL_TONE.FRIENDLY]: (title) =>
    `Hi there!\n\nYour "${title}" post caught my eye — it is exactly the kind of project I enjoy taking on.`,
  [PROPOSAL_TONE.CONCISE]: (title) => `Hello,\n\nRe: ${title}. Short version — I can take this on and deliver it cleanly.`,
};

/**
 * Deterministic, offline cover-letter draft. Used for the mock provider and as the fallback when a
 * real provider misbehaves. Written from profile facts only so it never invents credentials.
 */
function heuristicProposalDraft({ job, profile, tone, notes, days, matchedSkills }) {
  const headline = profile?.title ? `As ${profile.title.replace(/^a\s+/i, '')}, ` : '';
  const skillLine = matchedSkills.length
    ? `${headline}I work directly with ${matchedSkills.join(', ')}, which is the core of what you described.`
    : `${headline}my background lines up with the outcome you described, and I can show comparable work on request.`;

  const opener = TONE_OPENERS[tone] || TONE_OPENERS[PROPOSAL_TONE.PROFESSIONAL];
  const paragraphs = [opener(job.title), skillLine];

  if (tone !== PROPOSAL_TONE.CONCISE) {
    paragraphs.push(
      'How I would approach it: start with a short scoping pass so we agree on the details, then deliver in ' +
        'reviewable increments so you can steer early rather than at the end. You get a working version to look at ' +
        'well before the final handover.'
    );
    if ((profile?.portfolio || []).length || (profile?.experience || []).length) {
      paragraphs.push('I am happy to walk you through the most comparable piece of past work so you can judge the fit yourself.');
    }
  }

  if (notes) paragraphs.push(`A note on your requirements: ${notes.trim()}`);

  paragraphs.push(
    `I can start right away and would plan for roughly ${days} day(s) of delivery time. ` +
      'If that fits, tell me which detail matters most to you and I will confirm the plan against it.\n\nThank you for your time.'
  );

  return paragraphs.join('\n\n').slice(0, PROPOSAL_LIMITS.COVER_LETTER_MAX);
}

// Real-provider JSON is validated before it is trusted; anything else falls back to the heuristic.
const draftSchema = z.object({
  coverLetter: z.string().min(1),
  suggestedBid: z.coerce.number().optional(),
  talkingPoints: z.array(z.string()).default([]),
});

function buildProposalPrompt({ job, profile, tone, notes, days }) {
  const system =
    'You are helping a freelancer draft a cover letter for a job on a freelance marketplace. Respond with ' +
    'STRICT JSON only: {coverLetter:string, suggestedBid:number, talkingPoints:string[]}. Rules: write in the ' +
    "freelancer's own first person; use ONLY the facts given about them and never invent employers, credentials, " +
    'certifications, or client names; no placeholders like [Your Name]; do not restate the job description back ' +
    `at the client; keep the letter under ${PROPOSAL_LIMITS.COVER_LETTER_MAX} characters. Tone: ${tone}.`;

  const jobFacts = [
    `Title: ${job.title}`,
    `Category: ${job.category || 'n/a'}`,
    `Required skills: ${(job.skills || []).join(', ') || 'n/a'}`,
    `Experience level: ${job.experienceLevel || 'n/a'}`,
    `Budget: ${job.budget?.type || 'fixed'} ${job.budget?.min ?? '?'}–${job.budget?.max ?? '?'} ${job.budget?.currency || 'USD'}`,
    `Expected duration: ${job.duration || 'n/a'} (~${days} days)`,
    `Description: ${(job.description || '').slice(0, 4000)}`,
  ].join('\n');

  const profileFacts = [
    `Headline: ${profile?.title || 'n/a'}`,
    `Overview: ${(profile?.overview || 'n/a').slice(0, 1200)}`,
    `Skills: ${(profile?.skills || []).join(', ') || 'n/a'}`,
    `Hourly rate: ${profile?.hourlyRate || 0}`,
    `Recent roles: ${(profile?.experience || [])
      .slice(0, 3)
      .map((e) => `${e.title || ''}${e.company ? ` @ ${e.company}` : ''}`)
      .filter(Boolean)
      .join('; ') || 'n/a'}`,
    `Portfolio pieces: ${(profile?.portfolio || []).length}`,
  ].join('\n');

  const user =
    `JOB:\n"""\n${jobFacts}\n"""\n\nFREELANCER (the only facts you may assert):\n"""\n${profileFacts}\n"""` +
    (notes ? `\n\nEXTRA NOTES FROM THE FREELANCER (weave these in):\n"""\n${notes}\n"""` : '');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export const aiService = {
  async analyzeCV(user, { text, force = false } = {}) {
    const profile = await FreelancerProfile.findOne({ user: user._id });
    let source = { kind: 'text', filename: '' };
    let cvText = (text || '').trim();

    if (!cvText) {
      if (!profile) throw ApiError.badRequest('Complete your profile and upload a CV first.');
      const stored = await readStoredCvText(profile);
      cvText = stored.text;
      source = { kind: 'cv_file', filename: stored.filename };
    }
    cvText = cvText.slice(0, AI_LIMITS.CV_TEXT_MAX);
    const textHash = sha256(cvText);
    const feature = AI_FEATURES.CV_ANALYSIS;

    // Content-hash cache: reuse an identical prior analysis unless forced.
    if (!force) {
      const cached = await AIAnalysis.findOne({ user: user._id, feature, textHash }).sort({ createdAt: -1 });
      if (cached) {
        await AIUsage.create({ user: user._id, feature, provider: cached.provider, model: cached.model, cached: true });
        return cached;
      }
    }

    const provider = getAIProvider();
    let result;
    let usage = { inputTokens: 0, outputTokens: 0 };
    let model = provider.model;

    if (provider.name === 'mock') {
      result = heuristicAnalyzeCV(cvText);
    } else {
      const out = await chatJSON(provider, buildCvPrompt(cvText));
      if (out) {
        result = { ...out.result, wordCount: wordCount(cvText) };
        usage = out.usage || usage;
        model = out.model || model;
      } else {
        result = heuristicAnalyzeCV(cvText); // graceful fallback keeps the feature usable
      }
    }

    // Normalize + attach advisory disclaimer and profile-aware skill suggestions.
    result.overallScore = clamp(result.overallScore);
    result.atsScore = clamp(result.atsScore);
    const existing = new Set((profile?.skills || []).map((s) => s.toLowerCase()));
    result.suggestedSkills = (result.detectedSkills || []).filter((s) => !existing.has(s.toLowerCase())).slice(0, 15);
    result.disclaimer = DISCLAIMER;

    const estimatedCost = estimateCost(model, usage.inputTokens, usage.outputTokens);
    const analysis = await AIAnalysis.create({
      user: user._id,
      feature,
      provider: provider.name,
      model,
      textHash,
      source,
      result,
      tokens: { input: usage.inputTokens, output: usage.outputTokens },
      estimatedCost,
      status: ANALYSIS_STATUS.OK,
    });

    await AIUsage.create({
      user: user._id,
      feature,
      provider: provider.name,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCost,
      cached: false,
    });

    // Prune old history beyond the retention cap (oldest first).
    const excess = await AIAnalysis.find({ user: user._id, feature })
      .sort({ createdAt: -1 })
      .skip(AI_LIMITS.HISTORY_MAX)
      .select('_id');
    if (excess.length) await AIAnalysis.deleteMany({ _id: { $in: excess.map((d) => d._id) } });

    return analysis;
  },

  async listAnalyses(user, { feature = AI_FEATURES.CV_ANALYSIS, limit, skip }) {
    const filter = { user: user._id, feature };
    const [items, total] = await Promise.all([
      AIAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AIAnalysis.countDocuments(filter),
    ]);
    return { items, total };
  },

  async getAnalysis(user, id) {
    const analysis = await AIAnalysis.findOne({ _id: id, user: user._id });
    if (!analysis) throw ApiError.notFound('Analysis not found');
    return analysis;
  },

  async latest(user, feature = AI_FEATURES.CV_ANALYSIS) {
    return AIAnalysis.findOne({ user: user._id, feature }).sort({ createdAt: -1 });
  },

  async deleteAnalysis(user, id) {
    const res = await AIAnalysis.findOneAndDelete({ _id: id, user: user._id });
    if (!res) throw ApiError.notFound('Analysis not found');
    return { deleted: true };
  },

  /** Merge an analysis's suggested skills into the caller's profile (opt-in, advisory). */
  async applySuggestedSkills(user, id) {
    const analysis = await this.getAnalysis(user, id);
    const profile = await FreelancerProfile.findOne({ user: user._id });
    if (!profile) throw ApiError.badRequest('No profile to update');
    const have = new Set((profile.skills || []).map((s) => s.toLowerCase()));
    const additions = (analysis.result?.suggestedSkills || []).filter((s) => !have.has(s.toLowerCase()));
    profile.skills = [...(profile.skills || []), ...additions].slice(0, PROFILE_LIMITS.SKILLS_MAX);
    await profile.save();
    return { profile, added: additions };
  },

  /**
   * Draft a cover letter for a job (Phase 6). Advisory output only: nothing is persisted as an
   * analysis and no proposal is created — the freelancer edits and submits it themselves.
   */
  async assistProposal(user, { job: jobId, tone = PROPOSAL_TONE.PROFESSIONAL, notes = '' } = {}) {
    const job = await Job.findById(jobId).select(
      'title description category skills budget experienceLevel duration status client'
    );
    if (!job) throw ApiError.notFound('Job not found');
    if (String(job.client) === String(user._id)) {
      throw ApiError.badRequest('You cannot draft a proposal for your own job');
    }
    if (job.status !== JOB_STATUS.OPEN) throw ApiError.badRequest('This job is not accepting proposals');

    const profile = await FreelancerProfile.findOne({ user: user._id });
    const { matchedSkills, missingSkills } = skillOverlap(job, profile);
    const days = DURATION_DAYS[job.duration] || DURATION_DAYS.medium;
    const bid = suggestBid(job, profile);

    const provider = getAIProvider();
    let usage = { inputTokens: 0, outputTokens: 0 };
    let model = provider.model;
    let coverLetter;
    let talkingPoints = buildTalkingPoints({ profile, matchedSkills, notes });

    if (provider.name === 'mock') {
      coverLetter = heuristicProposalDraft({ job, profile, tone, notes, days, matchedSkills });
    } else {
      const out = await chatJSON(provider, buildProposalPrompt({ job, profile, tone, notes, days }), draftSchema);
      if (out) {
        coverLetter = out.result.coverLetter.slice(0, PROPOSAL_LIMITS.COVER_LETTER_MAX);
        if (out.result.talkingPoints?.length) talkingPoints = out.result.talkingPoints.slice(0, 6);
        // Trust the model's number only when it lands inside the advertised budget.
        const suggested = Number(out.result.suggestedBid);
        const withinBudget =
          suggested > 0 && (!job.budget?.min || suggested >= job.budget.min) && (!job.budget?.max || suggested <= job.budget.max);
        if (withinBudget) bid.amount = Math.round(suggested * 100) / 100;
        usage = out.usage || usage;
        model = out.model || model;
      } else {
        coverLetter = heuristicProposalDraft({ job, profile, tone, notes, days, matchedSkills });
      }
    }

    await AIUsage.create({
      user: user._id,
      feature: AI_FEATURES.PROPOSAL_DRAFT,
      provider: provider.name,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCost: estimateCost(model, usage.inputTokens, usage.outputTokens),
      cached: false,
    });

    return {
      coverLetter,
      suggestedBid: bid,
      suggestedDays: days,
      talkingPoints,
      matchedSkills,
      missingSkills,
      tone,
      provider: provider.name,
      model,
      disclaimer: PROPOSAL_DISCLAIMER,
    };
  },
};
