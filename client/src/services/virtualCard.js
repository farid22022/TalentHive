import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { virtualCardApi } from '../api/virtualCard.js';

export const virtualCardKeys = {
  card: ['virtual-card', 'me'],
  wallet: ['virtual-card', 'wallet'],
  transactions: ['virtual-card', 'transactions'],
  eligibility: ['virtual-card', 'eligibility'],
};

const invalidate = (queryClient) => {
  Object.values(virtualCardKeys).forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
};

export function useMyVirtualCard(options = {}) { return useQuery({ queryKey: virtualCardKeys.card, queryFn: virtualCardApi.getMine, ...options }); }
export function useCardTransactions(options = {}) { return useQuery({ queryKey: virtualCardKeys.transactions, queryFn: virtualCardApi.transactions, ...options }); }
export function useDeveloperEligibility(options = {}) { return useQuery({ queryKey: virtualCardKeys.eligibility, queryFn: virtualCardApi.eligibility, ...options }); }
export function useReloadCard() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: virtualCardApi.reload, onSuccess: () => invalidate(queryClient) });
}
export function useFreezeCard() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: virtualCardApi.freeze, onSuccess: () => invalidate(queryClient) });
}
export function useUnfreezeCard() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: virtualCardApi.unfreeze, onSuccess: () => invalidate(queryClient) });
}
