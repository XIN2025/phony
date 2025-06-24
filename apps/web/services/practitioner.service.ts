import { HttpClient } from '@/lib/http-client';

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
  avatar?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

export class PractitionerService {
  static async inviteClient(data: InviteClientDto, headers: Record<string, string>): Promise<InvitationResponse> {
    return HttpClient.post<InvitationResponse>('/api/practitioner/invite-client', data, { headers });
  }

  static async getInvitations(headers: Record<string, string>): Promise<InvitationResponse[]> {
    return HttpClient.get<InvitationResponse[]>('/api/practitioner/invitations', { headers });
  }

  static async resendInvitation(invitationId: string, headers: Record<string, string>): Promise<InvitationResponse> {
    return HttpClient.post<InvitationResponse>(`/api/practitioner/invitations/${invitationId}/resend`, {}, { headers });
  }

  static async deleteInvitation(invitationId: string, headers: Record<string, string>): Promise<{ message: string }> {
    return HttpClient.delete<{ message: string }>(`/api/practitioner/invitations/${invitationId}`, { headers });
  }

  static async getClients(headers: Record<string, string>): Promise<Client[]> {
    return HttpClient.get<Client[]>('/api/practitioner/clients', { headers });
  }

  static async getInvitationByToken(token: string): Promise<{ clientEmail: string; isAccepted: boolean }> {
    return HttpClient.get<{ clientEmail: string; isAccepted: boolean }>(`/api/practitioner/invitations/token/${token}`);
  }
}
