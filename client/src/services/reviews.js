import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews.js';
export const reviewKeys = { eligibility: (id) => ['reviews', 'eligibility', id], user: (id) => ['reviews', 'user', id], reputation: (id) => ['reviews', 'reputation', id] };
export const useReviewEligibility = (id) => useQuery({ queryKey: reviewKeys.eligibility(id), queryFn: () => reviewsApi.eligibility(id), enabled: !!id });
export const useUserReviews = (id, params = {}) => useQuery({ queryKey: [...reviewKeys.user(id), params], queryFn: () => reviewsApi.list(id, params), enabled: !!id });
export const useReputation = (id) => useQuery({ queryKey: reviewKeys.reputation(id), queryFn: () => reviewsApi.reputation(id), enabled: !!id });
export const useCreateReview = (contractId) => { const qc = useQueryClient(); return useMutation({ mutationFn: (body) => reviewsApi.create(contractId, body), onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }) }); };
