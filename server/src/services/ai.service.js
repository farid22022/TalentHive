import { z } from 'zod';
import { AIAnalysis } from '../models/AIAnalysis.js';
import { AIUsage } from '../models/AIUsage.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
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
  PROFILE_LIMITS,
  SENIORITY,
} from '../config/constants.js';
import fs from 'node:fs';

const DISCLAIMER =
  'This AI analysis is advisory only. It assesses CV content and presentation — it is not identity ' +
  'verification and does not confirm the accuracy of any claim. Use it to improve your profile, not as proof of credentials.';

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
async function chatJSON(provider, messages) {
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
      const valid = parsed && resultSchema.safeParse(parsed);
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
};
