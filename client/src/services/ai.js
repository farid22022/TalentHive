import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai.js';
import { profileKeys } from './profile.js';

const KEYS = {
  latest: ['ai', 'cv', 'latest'],
  list: (params) => ['ai', 'cv', 'analyses', params],
  one: (id) => ['ai', 'cv', 'analysis', id],
};

export function useCvLatest(options = {}) {
  return useQuery({ queryKey: KEYS.latest, queryFn: aiApi.getLatest, ...options });
}

export function useCvAnalyses(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.list(params), queryFn: () => aiApi.listAnalyses(params), ...options });
}

export function useAnalysis(id, options = {}) {
  return useQuery({ queryKey: KEYS.one(id), queryFn: () => aiApi.getAnalysis(id), enabled: !!id, ...options });
}

export function useAnalyzeCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.analyzeCv,
    onSuccess: (analysis) => {
      qc.setQueryData(KEYS.latest, analysis);
      qc.invalidateQueries({ queryKey: ['ai', 'cv', 'analyses'] });
    },
  });
}

export function useDeleteAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.deleteAnalysis,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai', 'cv'] });
    },
  });
}

export function useApplySkills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: aiApi.applySkills,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileKeys.mine });
    },
  });
}

export { KEYS as aiKeys };
