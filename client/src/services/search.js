import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.js';
export const searchKeys = { global: (q) => ['search', q], recommendations: ['search', 'recommendations'] };
export const useGlobalSearch = (q) => useQuery({ queryKey: searchKeys.global(q), queryFn: () => searchApi.global(q), enabled: !!q });
export const useRecommendedJobs = () => useQuery({ queryKey: searchKeys.recommendations, queryFn: searchApi.recommendations });
