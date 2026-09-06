import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsApi } from '../api/proposals.js';
import { jobKeys } from './jobs.js';

const KEYS = {
  all: ['proposals'],
  mine: (params) => ['proposals', 'mine', params],
  received: (params) => ['proposals', 'received', params],
  detail: (id) => ['proposals', 'detail', id],
};

export function useMyProposals(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.mine(params), queryFn: () => proposalsApi.listMine(params), ...options });
}

export function useReceivedProposals(params = {}, options = {}) {
  return useQuery({ queryKey: KEYS.received(params), queryFn: () => proposalsApi.listReceived(params), ...options });
}

export function useProposal(id, options = {}) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => proposalsApi.getOne(id), enabled: !!id, ...options });
}

/** Job pages ask "did I already apply?" by filtering my proposals down to one job. */
export function useMyProposalForJob(jobId, options = {}) {
  const query = useMyProposals({ job: jobId, limit: 1 }, { enabled: !!jobId, ...options });
  return { ...query, proposal: query.data?.items?.[0] || null };
}

/** Proposal mutations touch the job's proposalsCount, so jobs are invalidated too. */
function useProposalMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (proposal) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: jobKeys.all });
      if (proposal) qc.invalidateQueries({ queryKey: KEYS.detail(proposal.id || proposal._id) });
    },
  });
}

export function useCreateProposal() {
  return useProposalMutation(proposalsApi.create);
}

export function useUpdateProposal() {
  return useProposalMutation(({ id, ...payload }) => proposalsApi.update(id, payload));
}

export function useWithdrawProposal() {
  return useProposalMutation(proposalsApi.withdraw);
}

export function useDecideProposal() {
  return useProposalMutation(({ id, ...payload }) => proposalsApi.decide(id, payload));
}

export { KEYS as proposalKeys };
