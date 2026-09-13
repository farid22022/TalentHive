import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hiringApi } from '../api/hiring.js';
export const hiringKeys = { offers: ['hiring', 'offers'], contracts: ['hiring', 'contracts'], projects: ['hiring', 'projects'], project: (id) => ['hiring', 'project', id] };
export const useOffers = () => useQuery({ queryKey: hiringKeys.offers, queryFn: () => hiringApi.offers() });
export const useContracts = () => useQuery({ queryKey: hiringKeys.contracts, queryFn: hiringApi.contracts });
export const useProjects = () => useQuery({ queryKey: hiringKeys.projects, queryFn: hiringApi.projects });
export const useProject = (id) => useQuery({ queryKey: hiringKeys.project(id), queryFn: () => hiringApi.project(id), enabled: !!id });
export const useWorkspace = (id) => useQuery({ queryKey: ['hiring', 'workspace', id], queryFn: () => hiringApi.workspace(id), enabled: !!id, refetchInterval: 5000 });
export function useHiringMutation(action) { const qc = useQueryClient(); return useMutation({ mutationFn: action, onSuccess: () => { qc.invalidateQueries({ queryKey: ['hiring'] }); } }); }
