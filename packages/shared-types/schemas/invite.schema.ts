import * as z from 'zod';

export const inviteClientSchema = z.object({
  clientFirstName: z.string().min(1, 'First name is required'),
  clientLastName: z.string().min(1, 'Last name is required'),
  clientEmail: z.string().email('Invalid email address'),
  includeIntakeForm: z.boolean(),
});
