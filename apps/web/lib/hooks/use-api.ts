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

export function useVerifyInvitationOtp() {
  return useMutation({
    mutationFn: (data: { email: string; otp: string; invitationToken: string }) =>
      ApiClient.post<{ success: boolean; invitation: any }>('/api/auth/otp/verify-invitation', data),
  });
}

export function useCheckInvitationIntakeForm() {
  return useMutation({
    mutationFn: (data: { invitationToken: string }) =>
      ApiClient.post<{ hasIntakeForm: boolean }>('/api/auth/invitation/check-intake-form', data),
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

export function useCompleteProfile() {
  return useMutation({
    mutationFn: (formData: FormData) => ApiClient.post<LoginResponse>('/api/auth/profile/complete', formData),
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

export function useGetClientIntakeForm(enabled: boolean = true) {
  return useQuery({
    queryKey: ['clientIntakeForm'],
    queryFn: () => ApiClient.get<ClientIntakeForm>('/api/client/intake-form'),
    staleTime: 5 * 60 * 1000,
    enabled: enabled,
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
    mutationFn: ({ messageId, reactionId }: { messageId: string; reactionId: string }) =>
      ApiClient.delete<{ message: string }>(`/api/messages/${messageId}/reactions/${reactionId}`),
    onSuccess: (_, { messageId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', messageId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export { useCreateOrGetConversation as useGetOrCreateConversation };

export function useGetSessionsByClient(clientId: string) {
  return useQuery({
    queryKey: ['sessions', 'client', clientId],
    queryFn: () => ApiClient.get<any[]>(`/api/sessions/client/${clientId}`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetMySessions() {
  return useQuery({
    queryKey: ['sessions', 'practitioner', 'me'],
    queryFn: () => ApiClient.get<any[]>('/api/sessions/practitioner/me'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => ApiClient.get<any>(`/api/sessions/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetSessionForPolling(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => ApiClient.get<any>(`/api/sessions/${sessionId}`),
    enabled: !!sessionId,
    staleTime: 0,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { clientId: string; title: string; notes?: string }) =>
      ApiClient.post<{ id: string }>('/api/sessions', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', 'client', variables.clientId] });
    },
  });
}

export function useUploadSessionAudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, formData }: { sessionId: string; formData: FormData }) =>
      ApiClient.post(`/api/sessions/${sessionId}/upload`, formData, {}),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: any }) =>
      ApiClient.put<any>(`/api/sessions/${sessionId}`, data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function usePublishPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => ApiClient.patch<any>(`/api/plans/${planId}/publish`),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['planData', planId] });
      queryClient.invalidateQueries({ queryKey: ['planStatus', planId] });
    },
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) => ApiClient.post<any>('/api/plans/generate', { sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useGenerateMoreTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => ApiClient.post<any>(`/api/plans/${planId}/generate-more-tasks`),
    onSuccess: (_, planId) => {
      // Force refetch the plan data immediately
      queryClient.invalidateQueries({ queryKey: ['planData', planId] });
      queryClient.invalidateQueries({ queryKey: ['planData'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-plans'] });
    },
  });
}

export function useGetPlanWithSuggestions(planId: string) {
  return useQuery({
    queryKey: ['planData', planId],
    queryFn: () => ApiClient.get<any>(`/api/plans/${planId}/with-suggestions`),
    enabled: !!planId,
    staleTime: 30 * 1000,
  });
}

export function useGetPlanStatus(planId: string) {
  return useQuery({
    queryKey: ['planStatus', planId],
    queryFn: async () => {
      const plan = await ApiClient.get<{ status: 'DRAFT' | 'PUBLISHED' }>(`/api/plans/${planId}`);
      return plan.status;
    },
    enabled: !!planId,
    staleTime: 30 * 1000,
  });
}

export function useApproveSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => ApiClient.post(`/api/plans/suggestions/${suggestionId}/approve`),
    onSuccess: () => {
      // Invalidate all plan data queries since we don't have the planId in the response
      queryClient.invalidateQueries({ queryKey: ['planData'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => ApiClient.post(`/api/plans/suggestions/${suggestionId}/reject`),
    onSuccess: () => {
      // Invalidate all plan data queries since we don't have the planId in the response
      queryClient.invalidateQueries({ queryKey: ['planData'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suggestionId, updatedData }: { suggestionId: string; updatedData: any }) =>
      ApiClient.patch(`/api/plans/suggestions/${suggestionId}`, updatedData),
    onSuccess: () => {
      // Invalidate all plan data queries since we don't have the planId in the response
      queryClient.invalidateQueries({ queryKey: ['planData'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useAddCustomActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) =>
      ApiClient.post(`/api/plans/${planId}/action-items`, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['planData', planId] });
    },
  });
}

export function useDeleteActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, itemId }: { planId: string; itemId: string }) =>
      ApiClient.delete(`/api/plans/${planId}/action-items/${itemId}`),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['planData', planId] });
    },
  });
}

export function useUpdateActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, itemId, data }: { planId: string; itemId: string; data: any }) =>
      ApiClient.patch(`/api/plans/${planId}/action-items/${itemId}`, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['planData', planId] });
    },
  });
}

export function useGetPlan(planId: string) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => ApiClient.get<any>(`/api/plans/${planId}`),
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: any }) => ApiClient.put<any>(`/api/plans/${planId}`, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useGetClient(clientId: string) {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ApiClient.get<any>(`/api/practitioner/clients/${clientId}`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetClientPlans(clientId: string) {
  return useQuery({
    queryKey: ['client-plans', clientId],
    queryFn: () => ApiClient.get<any[]>(`/api/plans/client/${clientId}`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompleteActionItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, completionData }: { taskId: string; completionData: any }) =>
      ApiClient.post(`/api/action-items/${taskId}/complete`, completionData),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-plans'] });
    },
  });
}

// Journal API hooks
export interface JournalEntry {
  id: string;
  title?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export function useGetJournalEntries() {
  return useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => ApiClient.get<JournalEntry[]>('/api/journal'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetJournalEntry(entryId: string) {
  return useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: () => ApiClient.get<JournalEntry>(`/api/journal/${entryId}`),
    enabled: !!entryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; content: string }) => ApiClient.post<JournalEntry>('/api/journal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, data }: { entryId: string; data: any }) =>
      ApiClient.put<JournalEntry>(`/api/journal/${entryId}`, data),
    onSuccess: (_, { entryId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => ApiClient.delete(`/api/journal/${entryId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}

export function useSearchJournalEntries(searchTerm: string) {
  return useQuery({
    queryKey: ['journal-search', searchTerm],
    queryFn: () => ApiClient.get<JournalEntry[]>(`/api/journal/search?q=${encodeURIComponent(searchTerm)}`),
    enabled: !!searchTerm,
    staleTime: 5 * 60 * 1000,
  });
}

// Practitioner journal hooks
export function useGetClientJournalEntries(clientId: string) {
  return useQuery({
    queryKey: ['client-journal-entries', clientId],
    queryFn: () => ApiClient.get<JournalEntry[]>(`/api/journal/client/${clientId}`),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });
}
