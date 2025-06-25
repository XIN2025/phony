'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api-client';
import { LoginResponse, SendOtpRequest, VerifyOtpRequest } from '@repo/shared-types/types';
import { CreateIntakeFormDto } from '@repo/shared-types/schemas';

// Auth API hooks
export const useSendOtp = () => {
  return useMutation({
    mutationFn: (data: SendOtpRequest) => ApiClient.post<{ success: boolean }>('/api/auth/otp', data),
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => ApiClient.post<LoginResponse>('/api/auth/otp/verify', data),
  });
};

export const useVerifyOtpForSignup = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) =>
      ApiClient.post<{ success: boolean }>('/api/auth/otp/verify-signup', data),
  });
};

export const usePractitionerSignup = () => {
  return useMutation({
    mutationFn: (data: {
      email: string;
      otp: string;
      role: 'PRACTITIONER';
      firstName: string;
      lastName: string;
      profession: string;
    }) => ApiClient.post<LoginResponse>('/api/auth/practitioner/signup', data),
  });
};

export const useClientSignup = () => {
  return useMutation({
    mutationFn: (data: { email: string; firstName: string; lastName: string; invitationToken: string }) =>
      ApiClient.post<LoginResponse>('/api/auth/client/signup', data),
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: (formData: FormData) => ApiClient.post<LoginResponse>('/api/auth/profile', formData),
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => ApiClient.get<LoginResponse['user']>('/api/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Practitioner API hooks
export interface InviteClientDto {
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  intakeFormId?: string;
}

export interface InvitationResponse {
  id: string;
  clientEmail: string;
  clientFirstName: string;
  clientLastName: string;
  status: 'PENDING' | 'JOINED';
  invited?: string;
  expiresAt?: string;
  intakeFormTitle?: string;
  avatar?: string;
  createdAt: Date;
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

export const useInviteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteClientDto) => ApiClient.post<InvitationResponse>('/api/practitioner/invite-client', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      queryClient.refetchQueries({ queryKey: ['invitations'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useGetInvitations = () => {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => ApiClient.get<InvitationResponse[]>('/api/practitioner/invitations'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useResendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      ApiClient.post<InvitationResponse>(`/api/practitioner/invitations/${invitationId}/resend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      ApiClient.delete<{ message: string }>(`/api/practitioner/invitations/${invitationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
};

export const useGetClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => ApiClient.get<Client[]>('/api/practitioner/clients'),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useGetInvitationByToken = (token: string) => {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () =>
      ApiClient.get<{ clientEmail: string; isAccepted: boolean }>(`/api/practitioner/invitations/token/${token}`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Intake Form API hooks
export interface IntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options: Array<{ text: string }>;
    isRequired: boolean;
    order: number;
  }>;
  questionCount?: number;
  submissionCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useGetIntakeForms = () => {
  return useQuery({
    queryKey: ['intakeForms'],
    queryFn: () => ApiClient.get<IntakeForm[]>('/api/intake-forms'),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useGetIntakeForm = (id: string) => {
  return useQuery({
    queryKey: ['intakeForm', id],
    queryFn: () => ApiClient.get<IntakeForm>(`/api/intake-forms/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateIntakeForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIntakeFormDto) => ApiClient.post<IntakeForm>('/api/intake-forms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
    },
  });
};

export const useUpdateIntakeForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateIntakeFormDto }) =>
      ApiClient.put<IntakeForm>(`/api/intake-forms/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
      queryClient.invalidateQueries({ queryKey: ['intakeForm', id] });
    },
  });
};

export const useDeleteIntakeForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiClient.delete<void>(`/api/intake-forms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakeForms'] });
    },
  });
};

// Client API hooks
export interface ClientIntakeForm {
  id: string;
  title: string;
  description?: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options: string[];
    isRequired: boolean;
    order: number;
  }>;
}

export const useGetClientIntakeForm = () => {
  return useQuery({
    queryKey: ['clientIntakeForm'],
    queryFn: () => ApiClient.get<ClientIntakeForm>('/api/client/intake-form'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmitIntakeForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { formId: string; answers: Record<string, unknown> }) =>
      ApiClient.post<{ message: string; submissionId: string; clientStatus: string }>(
        '/api/client/intake-form/submit',
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientIntakeForm'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useFixClientStatuses = () => {
  return useMutation({
    mutationFn: () => ApiClient.post<{ message: string; fixedCount: number }>('/api/client/fix-statuses'),
  });
};
