import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '../api/matching.js';
export const matchKeys = { job: (id) => ['matching', 'job', id] };
export const useJobMatches = (id) => useQuery({ queryKey: matchKeys.job(id), queryFn: () => matchingApi.list(id), enabled: !!id });
export const useGenerateMatches = (id) => { const qc = useQueryClient(); return useMutation({ mutationFn: () => matchingApi.generate(id), onSuccess: () => qc.invalidateQueries({ queryKey: matchKeys.job(id) }) }); };
