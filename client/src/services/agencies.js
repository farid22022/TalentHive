import { useMutation, useQuery } from '@tanstack/react-query';
import { agenciesApi } from '../api/agencies.js';
export const agencyKeys = { list: ['agencies'], one: (slug) => ['agency', slug], workspace: (id) => ['agency', 'workspace', id] };
export const useAgencies = (params) => useQuery({ queryKey: [...agencyKeys.list, params], queryFn: () => agenciesApi.list(params) });
export const useAgency = (slug) => useQuery({ queryKey: agencyKeys.one(slug), queryFn: () => agenciesApi.get(slug), enabled: !!slug });
export const useAgencyWorkspace = (id) => useQuery({ queryKey: agencyKeys.workspace(id), queryFn: () => agenciesApi.workspace(id), enabled: !!id });
export const useAgencyWorkspaceBySlug = (slug) => useQuery({ queryKey: agencyKeys.workspace(slug), queryFn: () => agenciesApi.workspaceBySlug(slug), enabled: !!slug });
export const useCreateAgency = () => useMutation({ mutationFn: agenciesApi.create });
