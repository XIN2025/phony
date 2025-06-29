import { z } from 'zod';

export const inviteClientSchema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().optional(),
  clientEmail: z.string().email('Invalid email format'),
  intakeFormId: z.string().optional(),
});

export type InviteClientDto = z.infer<typeof inviteClientSchema>;

export interface InvitationResponse {
  id: string;
  clientEmail: string;
  clientFirstName: string;
  clientLastName: string | null;
  status: 'PENDING' | 'JOINED' | 'EXPIRED';
  invited?: string;
  expiresAt?: string;
  intakeFormTitle?: string;
  avatar?: string;
  createdAt: Date;
}
