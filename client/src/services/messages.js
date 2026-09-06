import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '../api/messages.js';

export const messageKeys = {
  all: ['messages'],
  conversations: () => ['messages', 'conversations'],
  conversation: (id) => ['messages', 'conversation', id],
};

export function useConversations(options = {}) {
  return useQuery({ queryKey: messageKeys.conversations(), queryFn: conversationsApi.list, ...options });
}

export function useConversation(id, options = {}) {
  return useQuery({ queryKey: messageKeys.conversation(id), queryFn: () => conversationsApi.getOne(id), enabled: !!id, ...options });
}

export function useConversationMessages(id, options = {}) {
  return useQuery({ queryKey: ['messages', 'items', id], queryFn: () => conversationsApi.listMessages(id), enabled: !!id, ...options });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...payload }) => conversationsApi.createMessage(conversationId, payload),
    onSuccess: (_msg, vars) => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
      qc.invalidateQueries({ queryKey: ['messages', 'items', vars.conversationId] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => conversationsApi.markRead(conversationId),
    onSuccess: (_data, conversationId) => {
      qc.invalidateQueries({ queryKey: messageKeys.conversation(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
  });
}
