import { otpTemplate } from './otp-template';
import type { OtpTemplateContext } from './otp-template';
import { clientInvitationTemplate } from './client-invitation-template';
import type { ClientInvitationTemplateContext } from './client-invitation-template';

export const templates = {
  OTP: otpTemplate,
  CLIENT_INVITATION: clientInvitationTemplate,
} as const;

export type Template = keyof typeof templates;

export type TemplateContextMap = {
  OTP: OtpTemplateContext;
  CLIENT_INVITATION: ClientInvitationTemplateContext;
};
