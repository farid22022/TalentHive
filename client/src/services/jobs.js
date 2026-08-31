import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs.js';

const KEYS = {
  all: ['jobs'],
  list: (params) => ['jobs', 'list', params],
  detail: (id) => ['jobs', 'detail', id],
  mine: (params) => ['jobs', 'mine', params],
  saved: (params) => ['jobs', 'saved', params],
};

export function useJobs(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.list(params), queryFn: () => jobsApi.list(params), ...options });
}

export function useJob(id, options = {}) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => jobsApi.getOne(id), enabled: !!id, ...options });
}

export function useMyJobs(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.mine(params), queryFn: () => jobsApi.listMine(params), ...options });
}

export function useSavedJobs(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.saved(params), queryFn: () => jobsApi.listSaved(params), ...options });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => jobsApi.update(id, payload),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      if (job) qc.invalidateQueries({ queryKey: KEYS.detail(job.id || job._id) });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useSaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.save,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUnsaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobsApi.unsave,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export { KEYS as jobKeys };
