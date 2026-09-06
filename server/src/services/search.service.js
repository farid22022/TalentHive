import { Job } from '../models/Job.js';
import { FreelancerProfile } from '../models/FreelancerProfile.js';
import { SavedJob } from '../models/SavedJob.js';
import { SearchHistory } from '../models/SearchHistory.js';
import { SavedSearch } from '../models/SavedSearch.js';
import { SavedFreelancer } from '../models/SavedFreelancer.js';
import { Recommendation } from '../models/Recommendation.js';
import { JOB_STATUS } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
const aliases = { reactjs: 'react', 'react.js': 'react', nodejs: 'node.js', mongo: 'mongodb', js: 'javascript', ts: 'typescript' };
export const normalizeQuery = (query = '') => query.trim().toLowerCase().split(/\s+/).map((x) => aliases[x] || x).join(' ');
const publicJob = (q) => Job.find({ status: JOB_STATUS.OPEN, ...(q ? { $text: { $search: q } } : {}) }).sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 }).limit(20).populate('client', 'name avatar');
const publicTalent = (q) => FreelancerProfile.find({ visibility: 'public', ...(q ? { $text: { $search: q } } : {}) }).sort(q ? { score: { $meta: 'textScore' } } : { completeness: -1 }).limit(20).populate('user', 'name avatar role');
export const searchService = {
  async global(query, user) { const q = normalizeQuery(query); if (user && q) await SearchHistory.create({ user: user._id, query: q, type: 'all' }); const [jobs, freelancers] = await Promise.all([publicJob(q), publicTalent(q)]); return { query: q, jobs, freelancers, suggestions: q ? [q, `${q} developer`, `${q} specialist`] : [] }; },
  async suggestions(query) { const q = normalizeQuery(query); if (!q) return []; const [jobs, profiles] = await Promise.all([Job.find({ status: JOB_STATUS.OPEN, title: { $regex: q, $options: 'i' } }).select('title').limit(5), FreelancerProfile.find({ visibility: 'public', title: { $regex: q, $options: 'i' } }).select('title').limit(5)]); return [...new Set([...jobs.map((x) => x.title), ...profiles.map((x) => x.title)])].slice(0, 10); },
  async history(user) { return SearchHistory.find({ user: user._id }).sort({ createdAt: -1 }).limit(30); },
  async clearHistory(user) { await SearchHistory.deleteMany({ user: user._id }); return { cleared: true }; },
  async savedSearches(user) { return SavedSearch.find({ user: user._id }).sort({ updatedAt: -1 }); },
  async saveSearch(user, body) { return SavedSearch.findOneAndUpdate({ user: user._id, name: body.name }, { ...body, user: user._id }, { upsert: true, new: true, setDefaultsOnInsert: true }); },
  async deleteSearch(user, id) { const row = await SavedSearch.findOneAndDelete({ _id: id, user: user._id }); if (!row) throw ApiError.notFound('Saved search not found'); return { deleted: true }; },
  async saveFreelancer(user, freelancer) { return SavedFreelancer.findOneAndUpdate({ user: user._id, freelancer }, { user: user._id, freelancer }, { upsert: true, new: true, setDefaultsOnInsert: true }); },
  async unsaveFreelancer(user, freelancer) { await SavedFreelancer.deleteOne({ user: user._id, freelancer }); return { saved: false }; },
  async savedFreelancers(user) { return SavedFreelancer.find({ user: user._id }).populate('freelancer', 'name avatar role'); },
  async recommendedJobs(user) { const profile = await FreelancerProfile.findOne({ user: user._id }); const skills = profile?.skills || []; const jobs = await Job.find({ status: JOB_STATUS.OPEN, ...(skills.length ? { skills: { $in: skills } } : {}) }).sort({ createdAt: -1 }).limit(20).populate('client', 'name avatar'); return jobs; },
};
