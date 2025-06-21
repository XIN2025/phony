export interface ClientInvitationTemplateContext {
  clientName: string;
  practitionerName: string;
  invitationLink: string;
  intakeFormTitle?: string;
}

export const clientInvitationTemplate = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">You're Invited to Join Continuum</h2>
  
  <p>Hello {{clientName}},</p>
  
  <p>{{practitionerName}} has invited you to join Continuum, a secure platform for your sessions together.</p>
  
  {{intakeFormTitle}}
  
  <p>To get started, please click the button below to create your account:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitationLink}}" 
       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Accept Invitation
    </a>
  </div>
  
  <p style="font-size: 14px; color: #666;">
    This invitation link will expire in 7 days. If you have any questions, please contact your practitioner.
  </p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  
  <p style="font-size: 12px; color: #999;">
    This email was sent by Continuum on behalf of {{practitionerName}}.
  </p>
</div>
`;
