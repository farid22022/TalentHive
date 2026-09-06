/**
 * Fictional content pool for the development demo seed.
 *
 * Everything here is invented for TalentHive — names, companies, project briefs and
 * cover letters. Nothing is copied from another marketplace. Imported only by
 * `seedDemo.js`; never by application code.
 */

export const FIRST_NAMES = [
  'Mira', 'Tomas', 'Aisha', 'Diego', 'Lena', 'Noah', 'Priya', 'Kofi', 'Sofia', 'Elias',
  'Hana', 'Marcus', 'Yara', 'Ivan', 'Nadia', 'Omar', 'Freya', 'Rafael', 'Chloe', 'Sami',
  'Anika', 'Bruno', 'Leila', 'Jonas', 'Mei', 'Andres', 'Talia', 'Viktor', 'Zoe', 'Rahul',
  'Ingrid', 'Mateo', 'Selin', 'Oskar', 'Amara', 'Julien', 'Nora', 'Pavel', 'Iris', 'Dario',
];

export const LAST_NAMES = [
  'Solberg', 'Vance', 'Okafor', 'Marchetti', 'Halvorsen', 'Brennan', 'Raman', 'Mensah',
  'Duarte', 'Lindqvist', 'Takeda', 'Bell', 'Haddad', 'Petrov', 'Novak', 'Rashid', 'Nyberg',
  'Alvarez', 'Fontaine', 'Karlsen', 'Dasgupta', 'Ferreira', 'Aziz', 'Weiss', 'Chen',
  'Moreno', 'Bergstrom', 'Kovac', 'Lambert', 'Iyer', 'Strand', 'Silva', 'Demir', 'Lehto',
  'Adeyemi', 'Rousseau', 'Bakken', 'Sokolov', 'Murphy', 'Costa',
];

export const LOCATIONS = [
  { country: 'Portugal', city: 'Lisbon', timezone: 'Europe/Lisbon' },
  { country: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin' },
  { country: 'Kenya', city: 'Nairobi', timezone: 'Africa/Nairobi' },
  { country: 'Canada', city: 'Toronto', timezone: 'America/Toronto' },
  { country: 'Norway', city: 'Oslo', timezone: 'Europe/Oslo' },
  { country: 'Ireland', city: 'Dublin', timezone: 'Europe/Dublin' },
  { country: 'India', city: 'Bengaluru', timezone: 'Asia/Kolkata' },
  { country: 'Ghana', city: 'Accra', timezone: 'Africa/Accra' },
  { country: 'Spain', city: 'Valencia', timezone: 'Europe/Madrid' },
  { country: 'Sweden', city: 'Gothenburg', timezone: 'Europe/Stockholm' },
  { country: 'Japan', city: 'Osaka', timezone: 'Asia/Tokyo' },
  { country: 'United States', city: 'Austin', timezone: 'America/Chicago' },
  { country: 'Jordan', city: 'Amman', timezone: 'Asia/Amman' },
  { country: 'Czechia', city: 'Brno', timezone: 'Europe/Prague' },
  { country: 'Poland', city: 'Kraków', timezone: 'Europe/Warsaw' },
  { country: 'Egypt', city: 'Alexandria', timezone: 'Africa/Cairo' },
  { country: 'Finland', city: 'Tampere', timezone: 'Europe/Helsinki' },
  { country: 'Brazil', city: 'Curitiba', timezone: 'America/Sao_Paulo' },
  { country: 'Australia', city: 'Melbourne', timezone: 'Australia/Melbourne' },
  { country: 'Türkiye', city: 'Izmir', timezone: 'Europe/Istanbul' },
];

export const LANGUAGE_SETS = [
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Portuguese', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'German', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'native' }, { name: 'Swahili', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'native' }, { name: 'French', proficiency: 'conversational' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Norwegian', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Hindi', proficiency: 'native' }, { name: 'Tamil', proficiency: 'conversational' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Spanish', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Japanese', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Arabic', proficiency: 'native' }],
  [{ name: 'English', proficiency: 'fluent' }, { name: 'Czech', proficiency: 'native' }, { name: 'German', proficiency: 'basic' }],
];

export const SCHOOLS = [
  'Northfield Institute of Technology', 'Riverside University', 'Lakeshore Polytechnic',
  'Aurora State University', 'Meridian College of Design', 'Highfield University',
  'Cedar Valley University', 'Blackwood School of Business', 'Solstice Technical University',
  'Ravenna University of Applied Sciences',
];

export const DEGREES = ['BSc', 'BA', 'MSc', 'MA', 'MBA', 'Diploma'];

/** Hiring side. `company` + `about` are woven into the job briefs this client posts. */
export const CLIENTS = [
  { name: 'Helena Brandt', company: 'Northwind Ledger', industry: 'Fintech', about: 'a mid-market accounting platform', location: { country: 'Germany', city: 'Hamburg', timezone: 'Europe/Berlin' } },
  { name: 'Adebayo Cole', company: 'Kestrel Logistics', industry: 'Logistics', about: 'a regional freight and last-mile carrier', location: { country: 'Nigeria', city: 'Lagos', timezone: 'Africa/Lagos' } },
  { name: 'Renata Alves', company: 'Verdemar Foods', industry: 'Food & beverage', about: 'a direct-to-consumer specialty grocer', location: { country: 'Brazil', city: 'São Paulo', timezone: 'America/Sao_Paulo' } },
  { name: 'Daniel Whitmore', company: 'Loomcraft Studio', industry: 'Home goods', about: 'an independent furniture and textiles brand', location: { country: 'United Kingdom', city: 'Bristol', timezone: 'Europe/London' } },
  { name: 'Sanne de Vries', company: 'Pelagic Health', industry: 'Healthcare', about: 'a telehealth provider for chronic care', location: { country: 'Netherlands', city: 'Utrecht', timezone: 'Europe/Amsterdam' } },
  { name: 'Yusuf Karam', company: 'Atlas Field Services', industry: 'Field operations', about: 'a facilities-maintenance contractor', location: { country: 'United Arab Emirates', city: 'Dubai', timezone: 'Asia/Dubai' } },
  { name: 'Marta Kowalski', company: 'Brightseed Learning', industry: 'Education', about: 'an online school for vocational courses', location: { country: 'Poland', city: 'Warsaw', timezone: 'Europe/Warsaw' } },
  { name: 'Grace Lam', company: 'Tidewater Outdoors', industry: 'Retail', about: 'an outdoor-gear retailer with 12 stores', location: { country: 'Canada', city: 'Vancouver', timezone: 'America/Vancouver' } },
  { name: 'Peter Ostrowski', company: 'Cobalt Metrics', industry: 'SaaS analytics', about: 'a product-analytics startup, Series A', location: { country: 'United States', city: 'Denver', timezone: 'America/Denver' } },
  { name: 'Amina Suleiman', company: 'Zawadi Microfinance', industry: 'Financial services', about: 'a microlender serving small traders', location: { country: 'Tanzania', city: 'Dar es Salaam', timezone: 'Africa/Dar_es_Salaam' } },
  { name: 'Louis Marchand', company: 'Ferrolite Manufacturing', industry: 'Manufacturing', about: 'a precision-parts manufacturer', location: { country: 'France', city: 'Lyon', timezone: 'Europe/Paris' } },
  { name: 'Ingrid Hoffmann', company: 'Solvent & Sage', industry: 'Legal services', about: 'a boutique commercial law practice', location: { country: 'Austria', city: 'Vienna', timezone: 'Europe/Vienna' } },
  { name: 'Ravi Menon', company: 'Halcyon Travel Group', industry: 'Travel', about: 'a tour operator for small-group trips', location: { country: 'India', city: 'Kochi', timezone: 'Asia/Kolkata' } },
  { name: 'Erika Lund', company: 'Nordlys Renewables', industry: 'Energy', about: 'a community solar and storage developer', location: { country: 'Denmark', city: 'Aarhus', timezone: 'Europe/Copenhagen' } },
];

/**
 * Per-category content kits. `{company}` / `{about}` in a job brief are replaced with the
 * posting client's details, `{skill}` in a cover letter with a matched skill.
 */
export const CATEGORY_KITS = {
  'Development & IT': {
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Docker', 'AWS', 'Python', 'Django', 'Next.js', 'Redis'],
    titles: ['Full-stack engineer — React & Node', 'Backend engineer — APIs and data', 'Frontend engineer specialising in design systems', 'DevOps engineer — AWS and containers'],
    overviews: [
      'I build and maintain production web applications end to end: API design, database modelling, and interfaces that stay fast as the data grows. Most of my work is with small product teams that need a senior pair of hands rather than a large agency.',
      'I focus on the unglamorous half of shipping software — migrations that do not lose rows, background jobs that retry properly, and test suites that catch regressions before your users do. I document what I hand over so your team can own it afterwards.',
      'Ten years of frontend work has taught me that most performance problems are architectural. I rebuild slow, sprawling interfaces into component libraries teams actually enjoy working in, and I leave behind a written style guide.',
    ],
    companies: ['Quantle', 'Barnwell Digital', 'Fathom Labs', 'Orbit Retail', 'Setpoint Systems'],
    fields: ['Computer Science', 'Software Engineering', 'Information Systems'],
    certs: [
      { name: 'AWS Certified Solutions Architect — Associate', issuer: 'Amazon Web Services' },
      { name: 'Certified Kubernetes Application Developer', issuer: 'Cloud Native Computing Foundation' },
      { name: 'Professional Scrum Developer', issuer: 'Scrum.org' },
    ],
    portfolio: [
      { title: 'Warehouse operations dashboard', description: 'Replaced three spreadsheets with a single React dashboard over a Node API. Stock accuracy went from 82% to 99% in one quarter.', tags: ['React', 'Node.js', 'PostgreSQL'] },
      { title: 'Booking API rebuild', description: 'Migrated a monolithic PHP booking flow to a documented REST API with 94% test coverage and zero downtime cutover.', tags: ['Node.js', 'Docker', 'AWS'] },
      { title: 'Design-system rollout', description: 'Built a 48-component library and migrated 60 screens onto it, cutting new-feature build time roughly in half.', tags: ['React', 'TypeScript'] },
    ],
    jobs: [
      { title: 'Rebuild our customer dashboard in React', brief: '{company} is {about}. Our current dashboard grew out of an internal tool and is now the first thing customers see, so we are rebuilding it properly. Scope is nine screens against an existing REST API: chart-heavy reporting, CSV export, saved filters, and role-based visibility. You will work alongside our product designer and one backend engineer, with daily PR reviews and a preference for readable, tested code. In your proposal, tell us how you would structure the state and data-fetching layer.', skills: ['React', 'TypeScript', 'Node.js'], budget: [4000, 9000], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Node.js API for our mobile app', brief: '{company} is {about}. We have a React Native app in beta and need a proper backend behind it: authentication, push-notification tokens, an order endpoint set, and a small admin API. Postgres is already provisioned; we want migrations, request validation, and integration tests from day one. Deployment is on AWS ECS and we can hand over the Terraform. We would rather have twelve well-tested endpoints than thirty fragile ones.', skills: ['Node.js', 'PostgreSQL', 'Docker'], budget: [55, 85], type: 'hourly', level: 'expert', duration: 'long' },
      { title: 'Fix performance issues on our storefront', brief: '{company} is {about}. Our storefront takes eight seconds to become interactive on mobile and it is costing us sales. We need someone to profile it honestly, tell us what is actually slow, and then fix the top offenders — bundle size, render-blocking scripts, and an over-fetching product page are our own suspicions. Deliverables are a short written audit, the fixes themselves, and Lighthouse scores before and after. This is a focused two-to-three week engagement.', skills: ['React', 'Next.js', 'TypeScript'], budget: [1800, 3500], type: 'fixed', level: 'intermediate', duration: 'short' },
      { title: 'Set up CI/CD and container deployments', brief: '{company} is {about}. Deploys are currently a manual SSH session and one engineer is the single point of failure. We want containerised builds, a staging environment that mirrors production, automated tests on every pull request, and a rollback we can trigger without panic. Our stack is Node and Postgres on AWS. Documentation and a handover session for two internal engineers are part of the job.', skills: ['Docker', 'AWS', 'Node.js'], budget: [2500, 5000], type: 'fixed', level: 'expert', duration: 'short' },
    ],
  },
  'Design & Creative': {
    skills: ['UI Design', 'UX Research', 'Figma', 'Brand Identity', 'Illustration', 'Motion Graphics', 'Adobe Illustrator', 'Design Systems', 'Prototyping', 'Webflow', 'Packaging Design', 'Art Direction'],
    titles: ['Product designer — SaaS dashboards', 'Brand identity designer & illustrator', 'UX researcher and interaction designer', 'Motion designer for product marketing'],
    overviews: [
      'I design software that people can use without a training session. My process is research first, wireframes second, and pixels last, and I hand over Figma files that engineers can build from without guessing at spacing or states.',
      'I build brand identities for small companies that have outgrown their first logo: wordmark, palette, type system, and a usage guide short enough that the team actually reads it. I also produce the launch assets so nothing sits half-finished.',
      'I work at the intersection of illustration and interface, mostly on onboarding flows, empty states, and marketing pages that need personality without slowing the page down. Everything I deliver is exported and named for developers.',
    ],
    companies: ['Studio Halden', 'Paperkite Creative', 'Mono & Co', 'Northlight Brand Studio', 'Fern & Iron'],
    fields: ['Graphic Design', 'Interaction Design', 'Visual Communication'],
    certs: [
      { name: 'Certified Usability Analyst', issuer: 'Human Factors International' },
      { name: 'Adobe Certified Professional — Illustrator', issuer: 'Adobe' },
      { name: 'Design Thinking Practitioner', issuer: 'Meridian College of Design' },
    ],
    portfolio: [
      { title: 'Analytics app redesign', description: 'Restructured a 40-screen analytics product around three core tasks. Support tickets about "where do I find" dropped by two thirds after launch.', tags: ['UI Design', 'Figma', 'Design Systems'] },
      { title: 'Coffee roastery rebrand', description: 'Full identity for a regional roastery: wordmark, six-colour palette, packaging for four blends, and a 20-page usage guide.', tags: ['Brand Identity', 'Packaging Design'] },
      { title: 'Onboarding illustration set', description: 'Twelve-piece illustration system plus three animated transitions used across web onboarding and the mobile app.', tags: ['Illustration', 'Motion Graphics'] },
    ],
    jobs: [
      { title: 'Redesign our web app onboarding', brief: '{company} is {about}. Roughly half the people who sign up never finish setting up their account, and we believe onboarding is the reason. We want a designer to interview six existing customers, map where they stall, and redesign the first-run experience across five or six screens. Deliverables are a research summary, wireframes, and final Figma screens with states and annotations. We have a small component library you can build on.', skills: ['UX Research', 'UI Design', 'Figma'], budget: [3000, 6500], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Brand identity for a new product line', brief: '{company} is {about}. We are launching a second product line next quarter and it needs its own identity that still lives comfortably beside the parent brand. Scope is a wordmark, colour and type system, three packaging layouts, and a short usage guide. Please share two or three identity projects you have taken from brief to print — we care more about consistency than novelty.', skills: ['Brand Identity', 'Adobe Illustrator', 'Packaging Design'], budget: [2200, 4800], type: 'fixed', level: 'intermediate', duration: 'short' },
      { title: 'Design system cleanup in Figma', brief: '{company} is {about}. Our Figma file has grown into four competing button styles and nobody trusts it any more. We want someone to audit what exists, consolidate it into documented components with proper variants and tokens, and align the names with what our engineers already use in code. Ongoing hourly work with our two in-house designers, roughly fifteen hours a week.', skills: ['Design Systems', 'Figma', 'Prototyping'], budget: [40, 65], type: 'hourly', level: 'intermediate', duration: 'medium' },
      { title: 'Marketing site design — 6 pages', brief: '{company} is {about}. Our marketing site was built from a template in 2021 and it no longer matches the product. We need six responsive pages designed (home, two product pages, pricing, about, contact) with a clear visual hierarchy and space for real screenshots rather than stock photography. Copy is written and ready. Handover in Figma; the build is handled by our developer.', skills: ['UI Design', 'Figma', 'Art Direction'], budget: [1800, 3800], type: 'fixed', level: 'intermediate', duration: 'short' },
    ],
  },
  'Writing & Translation': {
    skills: ['Copywriting', 'Technical Writing', 'SEO Writing', 'Editing', 'Localization', 'Content Strategy', 'Ghostwriting', 'Proofreading', 'Scriptwriting', 'Grant Writing', 'Spanish Translation', 'German Translation'],
    titles: ['B2B copywriter and content strategist', 'Technical writer — developer documentation', 'Editor and localization specialist', 'Long-form writer for founders'],
    overviews: [
      'I write the kind of B2B copy that survives a legal review and still sounds like a person wrote it. Most engagements start with a messaging audit, because the problem is usually not the words on the page but the order of the ideas behind them.',
      'I turn engineering knowledge into documentation people can follow: getting-started guides, API references, and the troubleshooting pages that quietly cut your support volume. I read the code before I write about it.',
      'I ghostwrite articles and newsletters for founders who have opinions but no time. You talk for forty minutes, I come back with a draft that sounds like you, sourced and structured, plus two headline options.',
    ],
    companies: ['Ledgerline Media', 'Clearfield Content', 'Two Rivers Press', 'Signal & Serif', 'Beacon Copy Co.'],
    fields: ['English Literature', 'Journalism', 'Translation Studies'],
    certs: [
      { name: 'Certified Professional Technical Communicator', issuer: 'Society for Technical Communication' },
      { name: 'Content Marketing Certification', issuer: 'Brightseed Learning' },
      { name: 'Certified Translator (EN↔ES)', issuer: 'Ravenna University of Applied Sciences' },
    ],
    portfolio: [
      { title: 'SaaS pricing page rewrite', description: 'Rewrote a pricing page and its three plan descriptions. Trial starts from that page rose 31% over the following two months.', tags: ['Copywriting', 'Content Strategy'] },
      { title: 'Developer docs from scratch', description: 'Wrote 40 pages of documentation for a payments API, including quickstarts in three languages and a migration guide.', tags: ['Technical Writing', 'Editing'] },
      { title: 'Localized help centre', description: 'Localized 120 help-centre articles into Spanish and German, building a shared glossary so terminology stayed consistent.', tags: ['Localization', 'Spanish Translation'] },
    ],
    jobs: [
      { title: 'Rewrite our website copy (8 pages)', brief: '{company} is {about}. Our website explains what we do in our own internal language and prospects tell us they cannot work out who it is for. We want a writer to interview three of our salespeople and two customers, then rewrite eight pages with a consistent value proposition. Deliverables are a one-page messaging summary and the page copy in a shared doc, with headline alternatives where it matters.', skills: ['Copywriting', 'Content Strategy', 'Editing'], budget: [1600, 3400], type: 'fixed', level: 'intermediate', duration: 'short' },
      { title: 'Technical writer for API documentation', brief: '{company} is {about}. Our public API has grown to 60 endpoints and the only documentation is a Postman collection. We need a writer who can read a Node codebase, work through each endpoint with an engineer, and produce a proper reference plus three quickstart guides. Long-term hourly engagement, around twenty hours a week, with a strong preference for someone who has documented a payments or logistics API before.', skills: ['Technical Writing', 'Editing'], budget: [35, 60], type: 'hourly', level: 'expert', duration: 'long' },
      { title: 'Monthly SEO articles — ongoing', brief: '{company} is {about}. We publish two long-form articles a month and want to hand the whole pipeline to one writer: keyword brief, draft, one revision round, and internal linking. Target length is 1,500 to 2,000 words, written for practitioners rather than search engines — we would rather rank slowly with something worth reading. Please include two samples on a technical or B2B subject.', skills: ['SEO Writing', 'Copywriting', 'Content Strategy'], budget: [900, 2000], type: 'fixed', level: 'intermediate', duration: 'long' },
      { title: 'Translate our product into Spanish and German', brief: '{company} is {about}. We are expanding into Spain and Germany and need our interface strings, 40 help articles, and three onboarding emails localized. There are roughly 1,400 UI strings in a JSON file. We want a glossary built first so terminology stays consistent, and we would like the same person available for smaller updates afterwards. Native-level fluency in at least one target language required.', skills: ['Localization', 'Spanish Translation', 'German Translation'], budget: [2400, 5200], type: 'fixed', level: 'expert', duration: 'medium' },
    ],
  },
  'Sales & Marketing': {
    skills: ['SEO', 'Google Ads', 'Email Marketing', 'Marketing Automation', 'Lead Generation', 'HubSpot', 'Social Media Marketing', 'Conversion Optimization', 'Analytics', 'Paid Social', 'Copywriting', 'CRM Management'],
    titles: ['Performance marketer — paid search & social', 'SEO consultant for growing sites', 'Lifecycle & email marketing specialist', 'B2B lead generation strategist'],
    overviews: [
      'I run paid acquisition for companies spending between five and fifty thousand a month. I start by fixing measurement, because half the accounts I inherit are optimising towards the wrong event, and I report in revenue rather than impressions.',
      'I do technical and content SEO for sites that already have traffic and want more of the right kind. Expect a crawl audit in week one, a prioritised fix list you can hand to developers, and a content plan tied to actual search demand.',
      'I build lifecycle email and automation programmes: welcome series, abandoned checkout, win-back, and the segmentation underneath them. I write the copy too, so you are not coordinating three freelancers to send one email.',
    ],
    companies: ['Highwater Growth', 'Pinecrest Media', 'Loop & Ladder', 'Vantage Demand', 'Copperline Agency'],
    fields: ['Marketing', 'Business Administration', 'Communications'],
    certs: [
      { name: 'Google Ads Search Certification', issuer: 'Google' },
      { name: 'HubSpot Inbound Marketing', issuer: 'HubSpot Academy' },
      { name: 'Certified Analytics Professional', issuer: 'Aurora State University' },
    ],
    portfolio: [
      { title: 'Paid search rebuild', description: 'Restructured a 40-campaign account into eight themed campaigns with proper conversion tracking. Cost per qualified lead fell 44%.', tags: ['Google Ads', 'Analytics'] },
      { title: 'SEO recovery after migration', description: 'Diagnosed a botched site migration, fixed redirects and canonical tags, and recovered 90% of lost organic traffic in eleven weeks.', tags: ['SEO', 'Analytics'] },
      { title: 'Lifecycle email programme', description: 'Built nine automated flows for a subscription box. Email went from 6% to 22% of monthly revenue.', tags: ['Email Marketing', 'Marketing Automation'] },
    ],
    jobs: [
      { title: 'Manage our Google Ads account', brief: '{company} is {about}. We spend about twelve thousand a month on search and shopping, and we have run it in-house for two years with steady but unspectacular results. We want an experienced hand to audit the account, restructure the campaigns, fix our conversion tracking, and then manage it monthly with a short written report. Access is available on day one. Tell us about an account you turned around and what you actually changed.', skills: ['Google Ads', 'Analytics', 'Conversion Optimization'], budget: [45, 75], type: 'hourly', level: 'expert', duration: 'long' },
      { title: 'SEO audit and 90-day roadmap', brief: '{company} is {about}. Organic traffic has been flat for a year while our competitors climb, and we do not know whether the problem is technical, content, or authority. We want a full audit — crawl, on-page, content gaps, backlink profile — delivered as a prioritised roadmap our developer and writer can execute without further interpretation. A working session to walk us through it is included.', skills: ['SEO', 'Analytics', 'Content Strategy'], budget: [1500, 3200], type: 'fixed', level: 'expert', duration: 'short' },
      { title: 'Build an email automation programme', brief: '{company} is {about}. We currently send one newsletter a month and nothing else, which means we are leaving obvious revenue on the table. We want a welcome series, an abandoned-cart flow, a post-purchase sequence, and a win-back campaign built in our existing platform, with the copy written and the segments defined. Please state which platforms you have built in and roughly how long each flow takes you.', skills: ['Email Marketing', 'Marketing Automation', 'Copywriting'], budget: [2000, 4200], type: 'fixed', level: 'intermediate', duration: 'medium' },
      { title: 'Outbound lead generation for B2B sales', brief: '{company} is {about}. We sell to operations managers at mid-sized companies and we need a repeatable outbound motion rather than one-off blasts. Scope is building a qualified list of 500 accounts, writing and testing three sequences, and handing over a documented process with the CRM configured properly. We will not pay for scraped lists dressed up as research — the qualification criteria matter more than the volume.', skills: ['Lead Generation', 'CRM Management', 'Copywriting'], budget: [30, 55], type: 'hourly', level: 'intermediate', duration: 'medium' },
    ],
  },
  'Admin & Support': {
    skills: ['Data Entry', 'Calendar Management', 'Travel Coordination', 'CRM Management', 'Executive Support', 'Airtable', 'Notion', 'Process Documentation', 'Bookkeeping Support', 'Email Management', 'Research', 'Excel'],
    titles: ['Executive assistant for founders', 'Operations coordinator — remote teams', 'Virtual assistant & inbox manager', 'Data and CRM administrator'],
    overviews: [
      'I keep small companies organised: inbox triage, calendars across four time zones, travel that does not fall apart, and the small follow-ups that otherwise get dropped. After two weeks you should stop thinking about scheduling at all.',
      'I document and tidy the processes a growing team has been improvising. That usually means building a proper task board, writing down the twelve things only one person knows, and setting up templates so onboarding a new hire takes an hour instead of a week.',
      'I do careful, high-volume data work — CRM cleanups, deduplication, migrations between tools — and I flag the records that look wrong instead of copying them across. I have handled datasets up to 90,000 rows without losing a field.',
    ],
    companies: ['Wren & Post Admin', 'Cadence Operations', 'Rowan Support Group', 'Kestrel Back Office', 'Anchorpoint VA'],
    fields: ['Business Administration', 'Office Management', 'Information Systems'],
    certs: [
      { name: 'Certified Administrative Professional', issuer: 'Blackwood School of Business' },
      { name: 'Airtable Builder Certification', issuer: 'Airtable' },
      { name: 'Notion Essentials', issuer: 'Notion' },
    ],
    portfolio: [
      { title: 'CRM migration and cleanup', description: 'Migrated 34,000 contacts between CRMs, merged 4,100 duplicates, and wrote the field-mapping documentation the team still uses.', tags: ['CRM Management', 'Data Entry'] },
      { title: 'Operations handbook', description: 'Documented 26 recurring processes for a 15-person remote team, cutting new-hire onboarding from two weeks to three days.', tags: ['Process Documentation', 'Notion'] },
      { title: 'Executive support for two founders', description: 'Ran calendars, travel, and inbox triage across three time zones for eighteen months with no missed meetings.', tags: ['Executive Support', 'Calendar Management'] },
    ],
    jobs: [
      { title: 'Part-time executive assistant (20 hrs/week)', brief: '{company} is {about}. Our two founders are losing a day a week to scheduling, expense reports, and inbox noise. We want a reliable assistant for twenty hours a week with overlap with European mornings: calendar management, travel booking, expense submission, meeting notes, and light research. Discretion matters — you will see contracts and financial documents. Please tell us which tools you are fastest in.', skills: ['Executive Support', 'Calendar Management', 'Email Management'], budget: [22, 38], type: 'hourly', level: 'intermediate', duration: 'long' },
      { title: 'Clean up and migrate our CRM data', brief: '{company} is {about}. Our CRM has eleven years of accumulated mess: duplicates, dead accounts, inconsistent country fields, and notes stored in the wrong records. We need someone methodical to deduplicate roughly 28,000 contacts, normalise the fields we care about, and document the rules applied so we can keep it clean. Accuracy matters far more than speed here.', skills: ['CRM Management', 'Data Entry', 'Excel'], budget: [1200, 2600], type: 'fixed', level: 'intermediate', duration: 'short' },
      { title: 'Document our internal processes in Notion', brief: '{company} is {about}. We have grown from six to twenty-two people and nothing is written down, which means every question routes through two overloaded managers. We want someone to interview team leads, document the recurring processes, and build a clear Notion workspace with templates and owners. Deliverable is a structured handbook, not a folder of loose pages.', skills: ['Process Documentation', 'Notion', 'Research'], budget: [1400, 3000], type: 'fixed', level: 'intermediate', duration: 'medium' },
      { title: 'Ongoing inbox and scheduling support', brief: '{company} is {about}. Our customer-facing inbox gets around 80 messages a day and roughly a third need nothing more than a template reply and a calendar invite. We want ongoing support to triage, respond from prepared templates, escalate the genuine issues, and keep the shared calendar accurate. Around fifteen hours a week, with clear written handover notes at the end of each day.', skills: ['Email Management', 'Calendar Management', 'Data Entry'], budget: [18, 32], type: 'hourly', level: 'entry', duration: 'long' },
    ],
  },
  'Finance & Accounting': {
    skills: ['Bookkeeping', 'Financial Modelling', 'QuickBooks', 'Xero', 'Payroll', 'VAT Returns', 'Management Accounts', 'Cash Flow Forecasting', 'Accounts Payable', 'Excel', 'Financial Reporting', 'Cost Accounting'],
    titles: ['Bookkeeper for small businesses', 'Financial analyst & modelling specialist', 'Management accountant — monthly close', 'Payroll and compliance specialist'],
    overviews: [
      'I do the monthly books for owner-managed businesses: reconciliation, payables, VAT, and a management report that explains what changed rather than just listing balances. My clients typically close within five working days of month end.',
      'I build financial models that survive contact with reality — three-statement models, scenario planning, and the unit economics investors will actually interrogate. I show my assumptions on a separate tab so you can defend every number.',
      'I take over messy bookkeeping and bring it back to a clean, auditable state. That usually means rebuilding a year of miscategorised transactions first, then handing you a chart of accounts that matches how you actually run the business.',
    ],
    companies: ['Marlowe & Finch', 'Steadyledger', 'Ashcroft Accounting', 'Brightbook Partners', 'Cornerstone Finance'],
    fields: ['Accounting', 'Finance', 'Economics'],
    certs: [
      { name: 'Chartered Certified Accountant (ACCA)', issuer: 'ACCA' },
      { name: 'QuickBooks Online ProAdvisor', issuer: 'Intuit' },
      { name: 'Certified Management Accountant', issuer: 'Blackwood School of Business' },
    ],
    portfolio: [
      { title: 'Two-year bookkeeping rebuild', description: 'Reconstructed 24 months of miscategorised transactions for a retailer, then closed the year cleanly with no auditor adjustments.', tags: ['Bookkeeping', 'QuickBooks'] },
      { title: 'Series A financial model', description: 'Built a three-statement model with hiring plan and three scenarios that carried a startup through a successful funding round.', tags: ['Financial Modelling', 'Excel'] },
      { title: 'Monthly management pack', description: 'Designed a six-page management report — margin by product line, cash runway, and variance commentary — delivered by day four each month.', tags: ['Management Accounts', 'Financial Reporting'] },
    ],
    jobs: [
      { title: 'Monthly bookkeeping and VAT returns', brief: '{company} is {about}. We process around 350 transactions a month across two bank accounts and a card, and our current arrangement means the books are always six weeks behind. We want a bookkeeper to take over the monthly cycle in Xero: reconciliation, supplier invoices, VAT returns, and a short management summary. Ongoing engagement, and we would like the same person for the year-end pack.', skills: ['Bookkeeping', 'Xero', 'VAT Returns'], budget: [35, 55], type: 'hourly', level: 'intermediate', duration: 'long' },
      { title: 'Build a three-statement financial model', brief: '{company} is {about}. We are raising a funding round in the spring and our current forecast is a single spreadsheet tab that nobody trusts. We need a proper three-statement model with a hiring plan, working-capital assumptions, and base, upside and downside scenarios. It has to be legible enough that our CEO can defend the assumptions in a meeting without calling you. Prior fundraising experience strongly preferred.', skills: ['Financial Modelling', 'Excel', 'Cash Flow Forecasting'], budget: [2500, 6000], type: 'fixed', level: 'expert', duration: 'short' },
      { title: 'Clean up 18 months of accounts', brief: '{company} is {about}. Our previous bookkeeper left mid-year and the accounts since then are unreliable: personal and business expenses mixed, unreconciled bank feeds, and a chart of accounts that has drifted. We need someone to rebuild it to a state our accountant will accept, then document the categorisation rules. Please be honest in your proposal about how long this realistically takes.', skills: ['Bookkeeping', 'QuickBooks', 'Financial Reporting'], budget: [1800, 4000], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Set up payroll for a 14-person team', brief: '{company} is {about}. We have hired eleven people in fourteen months and payroll is still being run manually, which is now a real compliance risk. We want someone to set up a proper payroll process, handle the statutory filings, document the monthly run, and train one internal person to operate it. Experience with multi-country contractors would be useful — four of our team are outside our home jurisdiction.', skills: ['Payroll', 'Bookkeeping', 'Financial Reporting'], budget: [1200, 2800], type: 'fixed', level: 'intermediate', duration: 'short' },
    ],
  },
  'Engineering & Architecture': {
    skills: ['AutoCAD', 'SolidWorks', 'Revit', 'Mechanical Design', 'Structural Analysis', 'CAD Drafting', '3D Modelling', 'Electrical Design', 'HVAC Design', 'Technical Drawings', 'Finite Element Analysis', 'BIM'],
    titles: ['Mechanical design engineer — CAD & DFM', 'Structural engineer for small buildings', 'Architectural drafter — Revit & BIM', 'Electrical design engineer'],
    overviews: [
      'I take mechanical products from sketch to manufacturable drawings: tolerance stacks, material selection, and the design-for-manufacture conversations that stop a part costing three times what it should. I have run parts into injection moulding and sheet-metal production.',
      'I produce structural calculations and drawings for residential and light commercial projects, sized properly rather than conservatively. Everything is delivered as a signed calculation pack alongside the drawing set your contractor can build from.',
      'I work in Revit on renovation and fit-out projects, modelling existing conditions accurately before anything new is drawn. My deliverables are coordinated sets — plans, sections, schedules — that do not contradict each other on site.',
    ],
    companies: ['Girder & Vale Engineering', 'Trestle Design Group', 'Ironwood Consulting', 'Northbay Structures', 'Axiom Mechanical'],
    fields: ['Mechanical Engineering', 'Civil Engineering', 'Architecture'],
    certs: [
      { name: 'Chartered Engineer (CEng)', issuer: 'Engineering Council' },
      { name: 'SolidWorks Certified Professional', issuer: 'Dassault Systèmes' },
      { name: 'Autodesk Certified Professional — Revit', issuer: 'Autodesk' },
    ],
    portfolio: [
      { title: 'Sheet-metal enclosure redesign', description: 'Redesigned a control enclosure for manufacturability, removing nine parts and cutting unit cost by 28% with no loss of ingress rating.', tags: ['SolidWorks', 'Mechanical Design'] },
      { title: 'Mezzanine structural design', description: 'Designed and certified a 220 m² steel mezzanine inside an existing warehouse, including foundation checks and a full calculation pack.', tags: ['Structural Analysis', 'AutoCAD'] },
      { title: 'Clinic fit-out BIM model', description: 'Modelled a 900 m² clinic fit-out in Revit with coordinated MEP, resolving 60 clashes before construction started.', tags: ['Revit', 'BIM'] },
    ],
    jobs: [
      { title: 'CAD drawings for a sheet-metal product', brief: '{company} is {about}. We have a working prototype of an equipment enclosure built by hand and we need proper manufacturing drawings before we can quote it out. Scope is a parametric CAD model, a flat-pattern set, tolerances, a bill of materials, and one round of revisions after our fabricator reviews it. Experience quoting through sheet-metal shops is more valuable to us than a long CV.', skills: ['SolidWorks', 'CAD Drafting', 'Mechanical Design'], budget: [1600, 3600], type: 'fixed', level: 'expert', duration: 'short' },
      { title: 'Structural calculations for a mezzanine', brief: '{company} is {about}. We want to install a storage mezzanine in a leased warehouse and the landlord requires stamped structural calculations before work begins. We can supply the existing structural drawings and a laser survey. Deliverables are the calculation pack, a drawing set for the steel fabricator, and answers to the building-control queries that follow. Local certification is required.', skills: ['Structural Analysis', 'AutoCAD', 'Technical Drawings'], budget: [1200, 3000], type: 'fixed', level: 'expert', duration: 'short' },
      { title: 'Revit modelling for an office fit-out', brief: '{company} is {about}. We are fitting out a new floor and need it modelled properly in Revit: existing conditions from a point cloud, new partitions, ceilings, and coordinated MEP with our services engineer. Around twenty-five hours a week for two months, with weekly coordination calls. Please tell us the largest point cloud you have worked from and how you handled it.', skills: ['Revit', 'BIM', '3D Modelling'], budget: [40, 70], type: 'hourly', level: 'intermediate', duration: 'medium' },
      { title: 'Electrical design for a production line upgrade', brief: '{company} is {about}. We are adding two machines to an existing production line and the current electrical documentation is a decade out of date. We need load calculations, updated single-line diagrams, panel schedules, and a specification our installer can price. Site visits are possible and preferred. The plant cannot stop for more than one weekend, so phasing needs to be part of the design.', skills: ['Electrical Design', 'AutoCAD', 'Technical Drawings'], budget: [2000, 4500], type: 'fixed', level: 'expert', duration: 'medium' },
    ],
  },
  Legal: {
    skills: ['Contract Drafting', 'Contract Review', 'GDPR Compliance', 'Corporate Law', 'Employment Law', 'Intellectual Property', 'Legal Research', 'Privacy Policy', 'Terms of Service', 'Due Diligence', 'Commercial Law', 'Trademark Filing'],
    titles: ['Commercial contracts lawyer', 'Privacy & data protection consultant', 'Employment law adviser for small firms', 'IP and trademark specialist'],
    overviews: [
      'I draft and negotiate the commercial contracts small companies actually use: customer agreements, supplier terms, NDAs, and reseller deals. I write in plain language wherever the law allows, because a contract nobody understands gets ignored.',
      'I help software companies get their data protection in order without theatre: a real data map, processor agreements that match reality, and policies that describe what your product genuinely does. I also prepare teams for customer security reviews.',
      'I advise owner-managed businesses on employment matters — contracts, handbooks, restructures, and the difficult conversations that precede them. Practical risk assessment first, formal advice second, always in writing.',
    ],
    companies: ['Hartley & Reeve', 'Solvent & Sage', 'Ashgrove Legal', 'Redmond Chambers', 'Vantage Counsel'],
    fields: ['Law', 'International Business Law', 'Intellectual Property Law'],
    certs: [
      { name: 'Certified Information Privacy Professional (CIPP/E)', issuer: 'IAPP' },
      { name: 'Admitted Solicitor', issuer: 'Law Society' },
      { name: 'Certified Contract Manager', issuer: 'Highfield University' },
    ],
    portfolio: [
      { title: 'SaaS contract suite', description: 'Drafted a full commercial suite — MSA, order form, DPA, and support terms — that closed twelve enterprise deals without major redlines.', tags: ['Contract Drafting', 'Commercial Law'] },
      { title: 'GDPR readiness programme', description: 'Ran a data-mapping exercise across nine systems, rewrote the privacy notice, and put 23 processor agreements in place.', tags: ['GDPR Compliance', 'Privacy Policy'] },
      { title: 'Trademark portfolio filing', description: 'Filed and prosecuted trademarks in four jurisdictions for a consumer brand, including one successful opposition response.', tags: ['Trademark Filing', 'Intellectual Property'] },
    ],
    jobs: [
      { title: 'Draft our SaaS customer agreement', brief: '{company} is {about}. We have been selling on a two-page agreement inherited from our first customer and enterprise buyers are now pushing back hard. We need a proper master services agreement, an order form, a support and SLA schedule, and a data processing addendum. Please write in plain commercial language and flag the three clauses you expect us to negotiate most often. Qualification in a common-law jurisdiction preferred.', skills: ['Contract Drafting', 'Commercial Law', 'Terms of Service'], budget: [2200, 5500], type: 'fixed', level: 'expert', duration: 'short' },
      { title: 'GDPR review of our product and vendors', brief: '{company} is {about}. We handle personal data for customers in three European countries and have never had a proper review. We want a data map, a gap analysis against GDPR, a rewritten privacy notice, and processor agreements with our nine subprocessors. Deliverables should be practical: a prioritised action list our engineers can work through, not a fifty-page memo. Ongoing advisory afterwards is likely.', skills: ['GDPR Compliance', 'Privacy Policy', 'Legal Research'], budget: [2500, 6000], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Review supplier contracts (ongoing)', brief: '{company} is {about}. We sign fifteen to twenty supplier and partner contracts a quarter and our operations lead is reviewing them with no legal background. We want a lawyer on retainer to review incoming contracts against an agreed risk playbook, mark up the unacceptable clauses, and be available for a weekly call. Turnaround of two working days per contract is what we need. Hourly, roughly ten hours a month.', skills: ['Contract Review', 'Commercial Law', 'Due Diligence'], budget: [70, 130], type: 'hourly', level: 'expert', duration: 'long' },
      { title: 'Employment contracts and handbook', brief: '{company} is {about}. We are hiring our first ten employees after years of using contractors and we need this done properly from the start. Scope is an employment contract template, contractor agreement, staff handbook covering leave, conduct and remote work, and a short written briefing for our managers. Advice on correctly classifying two current contractors is part of the engagement.', skills: ['Employment Law', 'Contract Drafting', 'Legal Research'], budget: [1500, 3800], type: 'fixed', level: 'expert', duration: 'short' },
    ],
  },
  'Data Science & Analytics': {
    skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Power BI', 'Tableau', 'dbt', 'Data Warehousing', 'A/B Testing', 'Forecasting', 'ETL Pipelines', 'Statistics'],
    titles: ['Analytics engineer — dbt & warehousing', 'Data scientist — forecasting and ML', 'BI developer — dashboards that get used', 'Product analyst & experimentation lead'],
    overviews: [
      'I build the layer between raw data and decisions: modelled tables in dbt, tested transformations, and dashboards that answer a specific question rather than showing everything at once. I would rather ship six trustworthy metrics than sixty unclear ones.',
      'I work on forecasting and classification problems where the business cost of being wrong is known. Every model I hand over comes with a baseline to beat, an honest evaluation, and a plan for what happens when it degrades.',
      'I run product analytics and experimentation programmes: event schemas that survive a redesign, sample-size calculations before the test rather than after, and readouts that state clearly whether the result is real.',
    ],
    companies: ['Cobalt Metrics', 'Deepvector Analytics', 'Northbeam Data', 'Lightfold Insights', 'Ravel Data Group'],
    fields: ['Data Science', 'Statistics', 'Applied Mathematics'],
    certs: [
      { name: 'Professional Data Engineer', issuer: 'Google Cloud' },
      { name: 'dbt Analytics Engineering Certification', issuer: 'dbt Labs' },
      { name: 'Microsoft Certified: Power BI Data Analyst', issuer: 'Microsoft' },
    ],
    portfolio: [
      { title: 'Warehouse and dbt build-out', description: 'Consolidated six data sources into a tested dbt project with 90 models. Reporting that took two days now runs in fifteen minutes.', tags: ['dbt', 'SQL', 'Data Warehousing'] },
      { title: 'Demand forecasting model', description: 'Built a weekly SKU-level forecast that reduced stockouts by 34% and beat the previous spreadsheet baseline by 19% on MAPE.', tags: ['Python', 'Forecasting', 'Machine Learning'] },
      { title: 'Churn analysis and dashboard', description: 'Identified three behavioural churn signals in the first 30 days and shipped a monitoring dashboard the CS team reviews weekly.', tags: ['Python', 'Power BI', 'Statistics'] },
    ],
    jobs: [
      { title: 'Build a reporting warehouse and dashboards', brief: '{company} is {about}. Our numbers live in five systems and every board pack is assembled by hand, which means the figures never quite agree. We want a proper warehouse with modelled tables, documented definitions for our core metrics, and four dashboards for finance, operations, sales and support. Tooling is open to discussion; we care that it is testable and that someone besides you can maintain it.', skills: ['SQL', 'dbt', 'Data Warehousing', 'Power BI'], budget: [5000, 12000], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Forecasting model for inventory planning', brief: '{company} is {about}. We hold roughly 900 SKUs and our current reorder logic is a three-month moving average in a spreadsheet, which leaves us both overstocked and out of our best sellers. We have four years of clean sales history. We want a forecast that beats that baseline, a written evaluation showing by how much, and a weekly job that produces the numbers our planner can act on.', skills: ['Python', 'Forecasting', 'Machine Learning'], budget: [4000, 9000], type: 'fixed', level: 'expert', duration: 'medium' },
      { title: 'Set up product analytics and event tracking', brief: '{company} is {about}. We instrumented our app in a hurry two years ago and now have 300 event names, many of them duplicates, so we cannot answer basic questions about retention. We want someone to design a proper event schema, work with our engineers to implement it, backfill what can be backfilled, and document the tracking plan. Around twenty hours a week for two months.', skills: ['A/B Testing', 'SQL', 'Statistics'], budget: [45, 80], type: 'hourly', level: 'expert', duration: 'medium' },
      { title: 'One-off analysis: why are customers churning?', brief: '{company} is {about}. We lose about 4% of subscribers a month and we have theories but no evidence. You would get read access to our database and a year of support tickets. We want an honest analysis of which factors actually predict cancellation, presented as a short written report with the three interventions you would test first. Please state clearly what the data cannot tell us.', skills: ['Python', 'SQL', 'Statistics'], budget: [1500, 3500], type: 'fixed', level: 'intermediate', duration: 'short' },
    ],
  },
  'Customer Service': {
    skills: ['Customer Support', 'Zendesk', 'Intercom', 'Live Chat', 'Technical Support', 'Help Centre Writing', 'Escalation Management', 'Quality Assurance', 'Onboarding Calls', 'Complaint Handling', 'CRM Management', 'Support Metrics'],
    titles: ['Customer support specialist — SaaS', 'Support team lead & QA reviewer', 'Technical support engineer (tier 2)', 'Customer success manager for SMB accounts'],
    overviews: [
      'I handle front-line support for software products and I write replies people do not have to read twice. I also keep a running list of the tickets that should not have existed, which is usually the most valuable thing a support person can give a product team.',
      'I lead and coach small support teams: shift coverage, macros that stay current, quality reviews with actual feedback, and reporting on first-response and resolution times. I have taken a queue from a two-day backlog to same-day twice.',
      'I do tier-two technical support — reading logs, reproducing bugs, and writing the reproduction steps engineers need instead of forwarding a screenshot. My background is technical, so escalations arrive already diagnosed.',
    ],
    companies: ['Helpline Nine', 'Tidewater Outdoors', 'Brightseed Learning', 'Cobalt Metrics', 'Kestrel Logistics'],
    fields: ['Communications', 'Business Administration', 'Information Systems'],
    certs: [
      { name: 'Zendesk Support Administrator', issuer: 'Zendesk' },
      { name: 'Customer Experience Professional', issuer: 'Riverside University' },
      { name: 'ITIL 4 Foundation', issuer: 'PeopleCert' },
    ],
    portfolio: [
      { title: 'Backlog recovery', description: 'Took a 1,400-ticket backlog to zero in five weeks, then held first response under two hours for the following year.', tags: ['Customer Support', 'Zendesk'] },
      { title: 'Help centre rebuild', description: 'Wrote 70 help articles mapped to the top ticket drivers, cutting repeat contacts on those topics by 41%.', tags: ['Help Centre Writing', 'Support Metrics'] },
      { title: 'Support QA programme', description: 'Introduced a weekly review rubric for a six-person team; customer satisfaction rose from 87% to 94% in one quarter.', tags: ['Quality Assurance', 'Escalation Management'] },
    ],
    jobs: [
      { title: 'Email and chat support (European hours)', brief: '{company} is {about}. We get around 120 conversations a day across email and chat, and our small team cannot cover European mornings properly. We need someone to own that shift: answer from our existing macros, escalate genuine bugs with clear reproduction steps, and keep our help articles current. Written English needs to be excellent — you are the company voice for half our customers.', skills: ['Customer Support', 'Live Chat', 'Zendesk'], budget: [18, 30], type: 'hourly', level: 'intermediate', duration: 'long' },
      { title: 'Write our help centre from scratch', brief: '{company} is {about}. Every question our customers ask is currently answered from memory by three people, which does not scale and is not consistent. We want someone to analyse a year of tickets, identify the top 50 topics, and write clear articles for each with screenshots. Deliverables are the articles, a category structure, and a short guide so our team can keep adding to it properly.', skills: ['Help Centre Writing', 'Customer Support', 'Support Metrics'], budget: [1600, 3600], type: 'fixed', level: 'intermediate', duration: 'medium' },
      { title: 'Tier-2 technical support for our platform', brief: '{company} is {about}. Our front-line team handles the routine questions well but anything involving integrations, webhooks or data imports gets escalated straight to engineering, which is expensive. We want a technically confident support person to sit in between: read logs, reproduce issues, resolve what can be resolved, and hand engineering a proper write-up when it cannot. Some SQL is useful.', skills: ['Technical Support', 'Escalation Management', 'Intercom'], budget: [28, 48], type: 'hourly', level: 'expert', duration: 'long' },
      { title: 'Set up support processes and reporting', brief: '{company} is {about}. Support has grown from one person answering a shared inbox to four people with no shared process, and we cannot tell whether we are getting better or worse. We want someone to configure our helpdesk properly — views, macros, SLAs, tags — define the metrics that matter, build the reporting, and write a short playbook. A focused four-to-six week engagement with a handover session.', skills: ['Zendesk', 'Support Metrics', 'Quality Assurance'], budget: [1400, 3200], type: 'fixed', level: 'expert', duration: 'short' },
    ],
  },
};

// SEED_CONTENT_PLACEHOLDER
