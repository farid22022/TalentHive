import { User } from '../models/User.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { Job } from '../models/Job.js';
import { Proposal } from '../models/Proposal.js';
import { SavedJob } from '../models/SavedJob.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import {
  AVAILABILITY,
  BADGES,
  BUDGET_TYPE,
  EXPERIENCE_LEVEL,
  JOB_DURATION,
  JOB_STATUS,
  PROPOSAL_STATUS,
  ROLES,
  VERIFICATION_REQUEST_STATUS,
  VERIFICATION_STATE,
  VERIFICATION_TYPE,
} from '../config/constants.js';
import { logger } from '../config/logger.js';
import {
  CATEGORY_KITS,
  CLIENTS,
  DEGREES,
  FIRST_NAMES,
  LANGUAGE_SETS,
  LAST_NAMES,
  LOCATIONS,
  SCHOOLS,
} from './demoContent.js';

const DEMO_PASSWORD = 'ChangeMe123!';

const now = () => new Date();

const pick = (arr, index) => arr[index % arr.length];

const take = (arr, count) => arr.slice(0, Math.min(count, arr.length));

const toTitleCase = (value) =>
  String(value)
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

async function ensureUser({ name, email, role, password = DEMO_PASSWORD, roles = [role] }) {
  const normalizedEmail = email.toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (user) return { user, created: false };

  user = new User({
    name,
    email: normalizedEmail,
    role,
    roles,
    emailVerified: true,
    phoneVerified: role === ROLES.ADMIN,
  });
  await user.setPassword(password);
  await user.save();
  return { user, created: true };
}

async function upsertProfile(user, payload) {
  let profile = await FreelancerProfile.findOne({ user: user._id });
  if (!profile) {
    profile = new FreelancerProfile({ user: user._id, ...payload });
    await profile.save();
    return { profile, created: true };
  } else {
    profile.set(payload);
    await profile.save();
    return { profile, created: false };
  }
}

async function upsertJob(payload) {
  const query = { client: payload.client, title: payload.title };
  let job = await Job.findOne(query);
  if (!job) {
    job = new Job(payload);
    await job.save();
    return { job, created: true };
  } else {
    job.set(payload);
    await job.save();
    return { job, created: false };
  }
}

async function upsertProposal(payload) {
  const query = { job: payload.job, freelancer: payload.freelancer };
  let proposal = await Proposal.findOne(query);
  if (!proposal) {
    proposal = new Proposal(payload);
    await proposal.save();
    return { proposal, created: true };
  } else {
    proposal.set(payload);
    await proposal.save();
    return { proposal, created: false };
  }
}

async function upsertSavedJob(payload) {
  const existing = await SavedJob.findOne(payload);
  if (existing) return { savedJob: existing, created: false };
  return { savedJob: await SavedJob.create(payload), created: true };
}

async function upsertVerificationRequest(payload) {
  const existing = await VerificationRequest.findOne({
    user: payload.user,
    type: payload.type,
    status: VERIFICATION_REQUEST_STATUS.PENDING,
  });
  if (existing) return { request: existing, created: false };
  return { request: await VerificationRequest.create(payload), created: true };
}

function buildFreelancerPayload(category, index) {
  const kit = CATEGORY_KITS[category];
  const languages = pick(LANGUAGE_SETS, index);
  const location = pick(LOCATIONS, index);
  const firstName = pick(FIRST_NAMES, index);
  const lastName = pick(LAST_NAMES, index);
  const title = pick(kit.titles, index);
  const overview = pick(kit.overviews, index);
  const company = pick(kit.companies, index);
  const school = pick(SCHOOLS, index);
  const degree = pick(DEGREES, index);
  const isVerified = index < 4;

  return {
    name: `${firstName} ${lastName}`,
    title,
    overview,
    category,
    hourlyRate: 25 + index * 7,
    availability: index % 3 === 0 ? AVAILABILITY.FULL_TIME : AVAILABILITY.PART_TIME,
    skills: take(kit.skills, 8),
    languages,
    location,
    links: {
      website: '',
      linkedin: `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      github: `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    },
    education: [
      {
        school,
        degree,
        field: pick(kit.fields, index),
        startYear: 2012 + (index % 6),
        endYear: 2016 + (index % 6),
      },
    ],
    experience: [
      {
        company,
        title: `${toTitleCase(category.split(' & ')[0])} specialist`,
        location: `${location.city}, ${location.country}`,
        startDate: new Date(2020 - (index % 4), 0, 1),
        current: true,
        description: overview,
      },
    ],
    certifications: take(kit.certs, 2).map((cert, certIndex) => ({
      ...cert,
      year: 2018 + certIndex + (index % 3),
    })),
    portfolio: take(kit.portfolio, 2),
    visibility: 'public',
    onboardingCompleted: true,
    verificationState: isVerified ? VERIFICATION_STATE.VERIFIED : VERIFICATION_STATE.PROFILE_REVIEW,
    badges: isVerified ? [BADGES.EMAIL, BADGES.VERIFIED] : [BADGES.EMAIL],
  };
}

function buildJobPayload(clientId, client, category, kit, index) {
  const template = pick(kit.jobs, index);
  const description = template.brief
    .replaceAll('{company}', client.company)
    .replaceAll('{about}', client.about);

  return {
    client: clientId,
    title: template.title,
    description,
    category,
    skills: template.skills,
    budget: {
      type: template.type === 'hourly' ? BUDGET_TYPE.HOURLY : BUDGET_TYPE.FIXED,
      min: template.budget[0],
      max: template.budget[1],
      currency: 'USD',
    },
    experienceLevel:
      template.level === 'entry'
        ? EXPERIENCE_LEVEL.ENTRY
        : template.level === 'expert'
          ? EXPERIENCE_LEVEL.EXPERT
          : EXPERIENCE_LEVEL.INTERMEDIATE,
    duration:
      template.duration === 'short'
        ? JOB_DURATION.SHORT
        : template.duration === 'long'
          ? JOB_DURATION.LONG
          : JOB_DURATION.MEDIUM,
    status: JOB_STATUS.OPEN,
  };
}

function buildProposalPayload(job, freelancer, clientId, category, index) {
  const amount = job.budget.type === BUDGET_TYPE.HOURLY
    ? Math.max(job.budget.min, Math.round((job.budget.min + job.budget.max) / 2))
    : Math.max(job.budget.min, Math.round(job.budget.max * (0.75 + (index % 2) * 0.1)));

  return {
    job: job._id,
    freelancer: freelancer.user._id,
    client: clientId,
    coverLetter:
      `${freelancer.name} here. I work in ${category.toLowerCase()} and can take this from brief to delivery without handing you a pile of unfinished work. ` +
      `Your job scope matches my recent projects, especially ${freelancer.portfolio?.[0]?.title || 'similar delivery work'}. ` +
      `I would start by confirming milestones, risks, and the fastest path to a first useful draft.`,
    bid: {
      amount,
      type: job.budget.type,
      currency: job.budget.currency,
    },
    estimatedDays: job.duration === JOB_DURATION.SHORT ? 10 : job.duration === JOB_DURATION.MEDIUM ? 28 : 60,
    status:
      index % 3 === 0
        ? PROPOSAL_STATUS.SHORTLISTED
        : index % 5 === 0
          ? PROPOSAL_STATUS.REJECTED
          : PROPOSAL_STATUS.SUBMITTED,
    reviewNote: index % 3 === 0 ? 'Strong fit for the brief.' : '',
    viewedAt: index % 3 === 0 ? now() : null,
    decidedAt: index % 3 === 0 || index % 5 === 0 ? now() : null,
    aiAssisted: index % 2 === 0,
    milestones:
      job.budget.type === BUDGET_TYPE.FIXED
        ? [
            {
              title: 'Discovery and plan',
              amount: Math.round(amount * 0.2),
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              description: 'Confirm scope, timeline, and acceptance criteria.',
            },
            {
              title: 'Delivery',
              amount: Math.round(amount * 0.8),
              dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
              description: 'Complete the agreed deliverables and revisions.',
            },
          ]
        : [],
  };
}

export async function seedDemoData() {
  logger.info('Seeding demo marketplace data...');

  const counts = {
    users: 0,
    profiles: 0,
    jobs: 0,
    proposals: 0,
    savedJobs: 0,
    verificationRequests: 0,
  };

  const { user: adminUser, created: adminCreated } = await ensureUser({
    name: 'Platform Admin',
    email: 'admin@example.com',
    role: ROLES.ADMIN,
    roles: [ROLES.ADMIN],
  });

  const { user: coreFreelancer, created: coreFreelancerCreated } = await ensureUser({
    name: 'Demo Freelancer',
    email: 'freelancer@example.com',
    role: ROLES.FREELANCER,
    roles: [ROLES.FREELANCER],
  });

  const { user: coreClient, created: coreClientCreated } = await ensureUser({
    name: 'Demo Client',
    email: 'client@example.com',
    role: ROLES.CLIENT,
    roles: [ROLES.CLIENT],
  });

  counts.users += [adminCreated, coreFreelancerCreated, coreClientCreated].filter(Boolean).length;

  const freelancerEntries = [
    {
      user: coreFreelancer,
      category: Object.keys(CATEGORY_KITS)[0],
    },
    ...Object.keys(CATEGORY_KITS).slice(1).map((category, index) => ({
      user: null,
      category,
      index: index + 1,
    })),
  ];

  for (let i = 1; i < freelancerEntries.length; i += 1) {
    const idx = freelancerEntries[i].index;
    const { user, created } = await ensureUser({
      name: `${pick(FIRST_NAMES, idx)} ${pick(LAST_NAMES, idx)}`,
      email: `freelancer-${idx + 1}@example.com`,
      role: ROLES.FREELANCER,
      roles: [ROLES.FREELANCER],
    });
    freelancerEntries[i].user = user;
    if (created) counts.users += 1;
  }

  const clientEntries = CLIENTS.map((client, index) => ({
    client,
    category: Object.keys(CATEGORY_KITS)[index % Object.keys(CATEGORY_KITS).length],
    email: index === 0 ? 'client@example.com' : `client-${index + 1}@example.com`,
    index,
  }));

  for (const entry of clientEntries) {
    const { user, created } = await ensureUser({
      name: entry.client.name,
      email: entry.email,
      role: ROLES.CLIENT,
      roles: [ROLES.CLIENT],
    });
    entry.user = user;
    if (created) counts.users += 1;
  }

  for (let i = 0; i < freelancerEntries.length; i += 1) {
    const entry = freelancerEntries[i];
    const payload = buildFreelancerPayload(entry.category, i);
    const { created } = await upsertProfile(entry.user, payload);
    if (created) counts.profiles += 1;
  }

  const jobs = [];
  for (const entry of clientEntries) {
    const kits = CATEGORY_KITS[entry.category];
    const payload = buildJobPayload(entry.user._id, entry.client, entry.category, kits, entry.index);
    const { job, created } = await upsertJob(payload);
    jobs.push(job);
    if (created) counts.jobs += 1;
  }

  for (let i = 0; i < clientEntries.length; i += 1) {
    const job = jobs[i];
    const primaryFreelancer = freelancerEntries[i % freelancerEntries.length];
    const secondaryFreelancer = freelancerEntries[(i + 3) % freelancerEntries.length];

    const primary = await upsertProposal(buildProposalPayload(job, primaryFreelancer, job.client, job.category, i));
    const secondary = await upsertProposal(buildProposalPayload(job, secondaryFreelancer, job.client, job.category, i + 1));
    if (primary.created) counts.proposals += 1;
    if (secondary.created) counts.proposals += 1;
  }

  const savedPairs = [
    { user: coreFreelancer._id, job: jobs[1]?._id },
    { user: coreFreelancer._id, job: jobs[4]?._id },
    { user: freelancerEntries[2].user._id, job: jobs[0]?._id },
    { user: freelancerEntries[3].user._id, job: jobs[5]?._id },
    { user: freelancerEntries[4].user._id, job: jobs[2]?._id },
  ].filter((item) => item.job);

  for (const pair of savedPairs) {
    const { created } = await upsertSavedJob(pair);
    if (created) counts.savedJobs += 1;
  }

  const verificationSeeds = [
    {
      user: freelancerEntries[1].user._id,
      type: VERIFICATION_TYPE.IDENTITY,
      note: 'Submitting identity docs before onboarding the first client.',
      documents: [
        {
          url: '/files/documents/identity-card.pdf',
          filename: 'identity-card.pdf',
          provider: 'local',
          uploadedAt: now(),
        },
      ],
    },
    {
      user: freelancerEntries[2].user._id,
      type: VERIFICATION_TYPE.DOCUMENT,
      note: 'Document verification for a public portfolio review.',
      documents: [
        {
          url: '/files/documents/portfolio-sample.pdf',
          filename: 'portfolio-sample.pdf',
          provider: 'local',
          uploadedAt: now(),
        },
      ],
    },
    {
      user: coreFreelancer._id,
      type: VERIFICATION_TYPE.IDENTITY,
      note: 'Core demo account identity check.',
      documents: [
        {
          url: '/files/documents/demo-id.pdf',
          filename: 'demo-id.pdf',
          provider: 'local',
          uploadedAt: now(),
        },
      ],
    },
  ];

  for (const request of verificationSeeds) {
    const { created } = await upsertVerificationRequest(request);
    if (created) counts.verificationRequests += 1;
  }

  logger.info(
    {
      users: counts.users,
      profiles: counts.profiles,
      jobs: counts.jobs,
      proposals: counts.proposals,
      savedJobs: counts.savedJobs,
      verificationRequests: counts.verificationRequests,
      adminEmail: adminUser.email,
    },
    'Demo data seeded'
  );

  return counts;
}
