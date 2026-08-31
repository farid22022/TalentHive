import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../api/verification.js';
import { profileKeys } from './profile.js';

const KEYS = {
  status: ['verification', 'status'],
  myRequests: ['verification', 'requests'],
  queue: (params) => ['verification', 'admin', 'queue', params],
  adminRequest: (id) => ['verification', 'admin', 'request', id],
};

export function useVerificationStatus(options = {}) {
  return useQuery({ queryKey: KEYS.status, queryFn: verificationApi.getStatus, ...options });
}

export function useMyRequests(options = {}) {
  return useQuery({ queryKey: KEYS.myRequests, queryFn: verificationApi.myRequests, ...options });
}

export function useResendEmail() {
  return useMutation({ mutationFn: verificationApi.resendEmail });
}

export function useSendPhoneCode() {
  return useMutation({ mutationFn: verificationApi.sendPhone });
}

export function useVerifyPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verificationApi.verifyPhone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      qc.invalidateQueries({ queryKey: profileKeys.mine });
    },
  });
}

export function useSubmitRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verificationApi.submitRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      qc.invalidateQueries({ queryKey: KEYS.myRequests });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: verificationApi.cancelRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      qc.invalidateQueries({ queryKey: KEYS.myRequests });
    },
  });
}

// --- Admin ---
export function useVerificationQueue(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.queue(params), queryFn: () => verificationApi.adminQueue(params), ...options });
}

export function useAdminRequest(id, options = {}) {
  return useQuery({
    queryKey: KEYS.adminRequest(id),
    queryFn: () => verificationApi.adminGetRequest(id),
    enabled: !!id,
    ...options,
  });
}

export function useDecideRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => verificationApi.adminDecide(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification', 'admin'] });
    },
  });
}

export { KEYS as verificationKeys };
