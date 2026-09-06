import { ReviewEligibility } from '../models/ReviewEligibility.js';
import { Review } from '../models/Review.js';
import { ReviewReport } from '../models/ReviewReport.js';
import { Reputation } from '../models/Reputation.js';
import { Contract } from '../models/Contract.js';
import { Project } from '../models/Project.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { REVIEW_CATEGORIES, CONTRACT_STATUS } from '../config/constants.js';
const id = (v) => String(v);
const clean = (s) => String(s || '').replace(/<[^>]*>/g, '').trim();
export async function createReviewEligibility(contractId) {
  const c = await Contract.findById(contractId); if (!c || c.status !== CONTRACT_STATUS.COMPLETED) return null;
  const project = await Project.findOne({ contract: c._id }); if (!project || project.status !== 'completed') return null;
  return ReviewEligibility.findOneAndUpdate({ contract: c._id }, { $setOnInsert: { contract: c._id, project: project._id, client: c.client, freelancer: c.freelancer, deadline: new Date(Date.now() + 14 * 86400000) } }, { upsert: true, new: true });
}
async function eligible(user, contractId) { const e = await ReviewEligibility.findOne({ contract: contractId }); if (!e || e.deadline < new Date() || e.status === 'locked' || e.status === 'expired') throw ApiError.badRequest('This review is no longer eligible'); if (![e.client, e.freelancer].some((x) => id(x) === id(user._id))) throw ApiError.forbidden('You did not participate in this contract'); return e; }
export const reviewService = {
  createEligibility: createReviewEligibility,
  async getEligibility(user, contractId) { const e = await eligible(user, contractId); return e; },
  async create(user, contractId, body) {
    const e = await eligible(user, contractId); const isClient = id(e.client) === id(user._id); const reviewee = isClient ? e.freelancer : e.client; const categories = REVIEW_CATEGORIES[isClient ? 'freelancer' : 'client'];
    const categoryRatings = body.categoryRatings || {}; for (const [key, value] of Object.entries(categoryRatings)) if (!categories.includes(key) || value < 1 || value > 5) throw ApiError.badRequest('Invalid category rating');
    const review = await Review.create({ reviewer: user._id, reviewee, client: e.client, freelancer: e.freelancer, contract: e.contract, project: e.project, overallRating: body.overallRating, categoryRatings, title: clean(body.title), comment: clean(body.comment) });
    await ReviewEligibility.updateOne({ _id: e._id }, { $set: isClient ? { clientSubmitted: true } : { freelancerSubmitted: true } }); await this.recalculate(reviewee); await Activity.create({ actor: user._id, action: 'REVIEW_SUBMITTED', resourceType: 'Review', resourceId: review._id, project: e.project }); await Notification.create({ recipient: reviewee, sender: user._id, type: 'REVIEW_SUBMITTED' }); return review;
  },
  async listForUser(userId, query = {}) { const filter = { reviewee: userId, status: 'published' }; const sort = query.sort === 'highest' ? { overallRating: -1 } : query.sort === 'lowest' ? { overallRating: 1 } : { createdAt: -1 }; const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(50, Math.max(1, Number(query.limit) || 10)); const [items, total] = await Promise.all([Review.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate('reviewer', 'name avatar role').populate('project', 'title'), Review.countDocuments(filter)]); return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } }; },
  async getOne(reviewId) { const review = await Review.findOne({ _id: reviewId, status: 'published' }).populate('reviewer', 'name avatar role').populate('reviewee', 'name avatar role').populate('project', 'title'); if (!review) throw ApiError.notFound('Review not found'); return review; },
  async reply(user, reviewId, content) { const review = await Review.findOne({ _id: reviewId, status: 'published' }); if (!review) throw ApiError.notFound('Review not found'); if (id(review.reviewee) !== id(user._id)) throw ApiError.forbidden('Only the reviewee can reply'); if (review.reply?.content) throw ApiError.conflict('A reply already exists'); review.reply = { author: user._id, content: clean(content), createdAt: new Date(), updatedAt: new Date() }; await review.save(); await Notification.create({ recipient: review.reviewer, sender: user._id, type: 'REVIEW_REPLY' }); return review; },
  async report(user, reviewId, body) { const review = await Review.findOne({ _id: reviewId, status: 'published' }); if (!review) throw ApiError.notFound('Review not found'); if (id(review.reviewer) === id(user._id)) throw ApiError.badRequest('You cannot report your own review'); const report = await ReviewReport.create({ review: review._id, reporter: user._id, reason: body.reason, description: clean(body.description) }); await Review.updateOne({ _id: review._id }, { $inc: { reportCount: 1 }, $set: { status: 'flagged' } }); return report; },
  async recalculate(userId) { const reviews = await Review.find({ reviewee: userId, status: 'published' }).select('overallRating'); const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; reviews.forEach((r) => { distribution[r.overallRating] = (distribution[r.overallRating] || 0) + 1; }); const raw = reviews.length ? reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length : 0; return Reputation.findOneAndUpdate({ user: userId }, { user: userId, rawAverage: raw, averageRating: Math.round(raw * 10) / 10, reviewCount: reviews.length, distribution, successScore: reviews.length ? Math.round((raw / 5) * 100) : 0 }, { upsert: true, new: true }); },
  getReputation: (userId) => Reputation.findOne({ user: userId }),
};
