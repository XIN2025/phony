'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import {
  LoginResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  Message,
  CreateMessageRequest,
  GetConversationsResponse,
  GetConversationResponse,
  GetMessagesResponse,
} from '@repo/shared-types';
import { InviteClientDto, InvitationResponse, CreateIntakeFormDto } from '@repo/shared-types';

export type { InvitationResponse };
export function useSendOtp() {
  return useMutation({
    mutationFn: (data: SendOtpRequest) => ApiClient.post<boolean>('/api/auth/otp', data),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => ApiClient.post<LoginResponse>('/api/auth/otp/verify', data),
  });
}

export function usePractitionerSignup() {
  return useMutation({
    mutationFn: (formData: FormData) => ApiClient.post<LoginResponse>('/api/auth/practitioner/signup', formData),
  });
}

export function useClientSignup() {
  return useMutation({
    mutationFn: (data: FormData) =>
      ApiClient.post<LoginResponse>('/api/auth/client/signup', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (formData: FormData) => ApiClient.post<LoginResponse>('/api/auth/profile', formData),
  });
}

export function useGetCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => ApiClient.get<LoginResponse['user']>('/api/auth/me'),
    staleTime: 5 * 60 * 1000,
  });
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clientStatus?: string;
  avatarUrl?: string;
  createdAt: Date;
  hasCompletedIntake: boolean;
}

export function useInviteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteClientDto) => ApiClient.post<InvitationResponse>('/api/practitioner/invite-client', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.refetchQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useGetInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => ApiClient.get<InvitationResponse[]>('/api/practitioner/invitations'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      ApiClient.post<InvitationResponse>(`/api/practitioner/invitations/${invitationId}/resend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      ApiClient.delete<{ message: string }>(`/api/practitioner/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useCleanupExpiredInvitations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ApiClient.post<{ message: string }>('/api/practitioner/invitations/cleanup-expired'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useGetClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => ApiClient.get<Client[]>('/api/practitioner/clients'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useGetInvitationByToken(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () =>
      ApiClient.get<{ clientEmail: string; clientFirstName: string; clientLastName: string; isAccepted: boolean }>(
        `/api/practitioner/invitations/token/${token}`,
      ),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}
export interface IntakeFormQuestion {
  id: string;
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
  order: number;
}

export interface IntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: IntakeFormQuestion[];
  questionCount?: number;
  submissionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useGetIntakeForms() {
  return useQuery({
    queryKey: ['intakeForms'],
    queryFn: () => ApiClient.get<IntakeForm[]>('/api/intake-forms'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

export function useGetIntakeForm(id: string) {
  return useQuery({
    queryKey: ['intakeForm', id],
    queryFn: () => ApiClient.get<IntakeForm>(`/api/intake-forms/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateIntakeForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIntakeFormDto) => ApiClient.post<IntakeForm>('/api/intake-forms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      queryClient.refetchQueries({ queryKey: ['intakeForms'] });
    },
  });
}

export function useUpdateIntakeForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateIntakeFormDto }) =>
      ApiClient.put<IntakeForm>(`/api/intake-forms/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      queryClient.refetchQueries({ queryKey: ['intakeForms'] });
      queryClient.invalidateQueries({ queryKey: ['intakeForm', id] });
      queryClient.refetchQueries({ queryKey: ['intakeForm', id] });
    },
  });
}

export function useDeleteIntakeForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiClient.delete<void>(`/api/intake-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      queryClient.refetchQueries({ queryKey: ['intakeForms'] });
    },
  });
}
export interface ClientIntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: IntakeFormQuestion[];
}

export function useGetClientIntakeForm() {
  return useQuery({
    queryKey: ['clientIntakeForm'],
    queryFn: () => ApiClient.get<ClientIntakeForm>('/api/client/intake-form'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitIntakeForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { formId: string; answers: Record<string, unknown> }) =>
      ApiClient.post<{ success: boolean; submissionId: string; clientStatus: string }>(
        '/api/client/intake-form/submit',
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientIntakeForm'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useFixClientStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ApiClient.post<{ message: string }>('/api/practitioner/fix-client-statuses'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export interface UpdateIntakeFormDto {
  title?: string;
  description?: string;
  questions?: Array<{
    text: string;
    type: string;
    options: string[];
    isRequired: boolean;
    order: number;
  }>;
}

export interface SubmitIntakeFormDto {
  answers: Array<{
    questionId: string;
    value: string;
  }>;
}

export function useGetConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => ApiClient.get<GetConversationsResponse>('/api/chat/conversations'),
    staleTime: 2 * 1000,
    retry: 1,
    retryDelay: 500,
  });
}

export function useGetConversation(conversationId: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => ApiClient.get<GetConversationResponse>(`/api/chat/conversations/${conversationId}`),
    enabled: !!conversationId,
    staleTime: 30 * 1000,
  });
}

export function useGetMessages(conversationId: string, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['messages', conversationId, page, limit],
    queryFn: () =>
      ApiClient.get<GetMessagesResponse>(
        `/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      ),
    enabled: !!conversationId,
    staleTime: 10 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMessageRequest & { authorId?: string; currentUser?: any }) =>
      ApiClient.post<{ message: Message }>('/api/chat/messages', data),
    onMutate: async (data: CreateMessageRequest & { authorId?: string; currentUser?: any }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', data.conversationId] });

      const cacheKey = ['messages', data.conversationId, 1, 50];

      const previousMessages = queryClient.getQueryData(cacheKey);

      queryClient.setQueryData(cacheKey, (old: any) => {
        if (!old) {
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            conversationId: data.conversationId,
            authorId: data.authorId || 'temp-author',
            content: data.content,
            createdAt: new Date(),
            readAt: null,
            author: data.currentUser
              ? {
                  id: data.currentUser.id,
                  firstName: data.currentUser.firstName || '',
                  lastName: data.currentUser.lastName || '',
                  avatarUrl: data.currentUser.avatarUrl,
                  role: data.currentUser.role || 'USER',
                }
              : undefined,
          };

          return {
            messages: [optimisticMessage],
            pagination: {
              page: 1,
              limit: 50,
              total: 1,
              totalPages: 1,
            },
          };
        }

        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          conversationId: data.conversationId,
          authorId: data.authorId || 'temp-author',
          content: data.content,
          createdAt: new Date(),
          readAt: null,
          author: data.currentUser
            ? {
                id: data.currentUser.id,
                firstName: data.currentUser.firstName || '',
                lastName: data.currentUser.lastName || '',
                avatarUrl: data.currentUser.avatarUrl,
                role: data.currentUser.role || 'USER',
              }
            : undefined,
        };

        return {
          ...old,
          messages: [...old.messages, optimisticMessage],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        };
      });

      return { previousMessages, cacheKey };
    },
    onError: (err, data, context) => {
      if (context?.previousMessages && context?.cacheKey) {
        queryClient.setQueryData(context.cacheKey, context.previousMessages);
      }
    },
    onSuccess: (response) => {
      const newMessage = response.message;
      const cacheKey = ['messages', newMessage.conversationId, 1, 50];

      queryClient.setQueryData(cacheKey, (old: any) => {
        if (!old) {
          return {
            messages: [newMessage],
            pagination: {
              page: 1,
              limit: 50,
              total: 1,
              totalPages: 1,
            },
          };
        }

        const filteredMessages = old.messages.filter((msg: any) => msg.id !== newMessage.id);

        const updatedMessages = filteredMessages.map((msg: any) =>
          msg.id.startsWith('temp-') && msg.content === newMessage.content ? newMessage : msg,
        );

        const hasReplaced = updatedMessages.some((msg: any) => msg.id === newMessage.id);
        if (!hasReplaced) {
          updatedMessages.push(newMessage);
        }

        return {
          ...old,
          messages: updatedMessages,
          pagination: {
            ...old.pagination,
            total: Math.max(old.pagination?.total || 0, updatedMessages?.length || 0),
          },
        };
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      return ApiClient.post<{ success: boolean }>(`/api/chat/conversations/${conversationId}/read`);
    },
    onSuccess: async (response, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error, conversationId) => {},
  });
}

export function useCreateOrGetConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: string) =>
      ApiClient.post<GetConversationResponse>('/api/chat/conversations', { participantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string; currentUserId?: string }) =>
      ApiClient.post<{ reaction: any }>(`/api/chat/messages/${messageId}/reactions`, { emoji }),
    onMutate: async ({ messageId, emoji, currentUserId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['messages'] });

      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          messages: old.messages.map((msg: any) => {
            if (msg.id === messageId) {
              const existingReactions = msg.reactions || [];

              const alreadyReacted = existingReactions.some(
                (r: any) => r.userId === currentUserId && r.emoji === emoji,
              );

              if (!alreadyReacted) {
                const optimisticReaction = {
                  id: `temp-${Date.now()}`,
                  messageId,
                  userId: currentUserId,
                  emoji,
                  createdAt: new Date(),
                  user: {
                    id: currentUserId,
                    firstName: 'You',
                    lastName: '',
                    avatarUrl: '',
                  },
                };
                return {
                  ...msg,
                  reactions: [...existingReactions, optimisticReaction],
                };
              }
            }
            return msg;
          }),
        };
      });

      return { previousData };
    },
    onSuccess: (response, { messageId }) => {
      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          messages: old.messages.map((msg: any) => {
            if (msg.id === messageId) {
              const existingReactions = (msg.reactions || []).filter((r: any) => !r.id.startsWith('temp-'));

              const realReactionExists = existingReactions.some(
                (r: any) => r.userId === response.reaction.userId && r.emoji === response.reaction.emoji,
              );

              if (!realReactionExists) {
                return {
                  ...msg,
                  reactions: [...existingReactions, response.reaction],
                };
              }
              return {
                ...msg,
                reactions: existingReactions,
              };
            }
            return msg;
          }),
        };
      });
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji, currentUserId }: { messageId: string; emoji: string; currentUserId?: string }) =>
      ApiClient.delete<{ success: boolean }>(`/api/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
    onMutate: async ({ messageId, emoji, currentUserId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['messages'] });

      queryClient.setQueriesData({ queryKey: ['messages'] }, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          messages: old.messages.map((msg: any) => {
            if (msg.id === messageId) {
              const filteredReactions = (msg.reactions || []).filter(
                (reaction: any) => !(reaction.emoji === emoji && reaction.userId === currentUserId),
              );
              return {
                ...msg,
                reactions: filteredReactions,
              };
            }
            return msg;
          }),
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

export { useCreateOrGetConversation as useGetOrCreateConversation };
