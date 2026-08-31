import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesApi } from '../api/profiles.js';

const KEYS = {
  mine: ['profile', 'me'],
  public: (id) => ['profile', 'public', id],
  talent: (params) => ['talent', params],
};

export function useMyProfile(options = {}) {
  return useQuery({ queryKey: KEYS.mine, queryFn: profilesApi.getMine, ...options });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.updateMine,
    onSuccess: (profile) => qc.setQueryData(KEYS.mine, profile),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.completeOnboarding,
    onSuccess: (profile) => qc.setQueryData(KEYS.mine, profile),
  });
}

export function useUploadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }) => profilesApi.uploadCv(file, onProgress),
    onSuccess: (profile) => qc.setQueryData(KEYS.mine, profile),
  });
}

export function useRemoveCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profilesApi.removeCv,
    onSuccess: (profile) => qc.setQueryData(KEYS.mine, profile),
  });
}

export function usePublicProfile(userId, options = {}) {
  return useQuery({
    queryKey: KEYS.public(userId),
    queryFn: () => profilesApi.getPublic(userId),
    enabled: !!userId,
    ...options,
  });
}

export function useTalent(params, options = {}) {
  return useQuery({
    queryKey: KEYS.talent(params),
    queryFn: () => profilesApi.listTalent(params),
    ...options,
  });
}

export { KEYS as profileKeys };
