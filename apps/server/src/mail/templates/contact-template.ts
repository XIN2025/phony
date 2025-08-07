export interface ContactTemplateContext {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
}

export const contactTemplate = `
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #ffffff;">
  <tr>
    <td style="padding: 50px 40px; text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <h1 style="color: #333333; font-size: 28px; margin-bottom: 25px; font-weight: 600;">New Contact Form Submission</h1>
      <p style="color: #666666; font-size: 18px; margin-bottom: 0; line-height: 1.5;">You have received a new message from your website contact form.</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 40px 50px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 30px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e9ecef;">
        <h2 style="color: #333333; font-size: 20px; margin-bottom: 20px; font-weight: 600;">Contact Details</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="color: #666666; margin: 12px 0; font-size: 16px; line-height: 1.4;"><strong style="color: #333333;">Name:</strong><br>{{firstName}} {{lastName}}</p>
            <p style="color: #666666; margin: 12px 0; font-size: 16px; line-height: 1.4;"><strong style="color: #333333;">Email:</strong><br>{{email}}</p>
          </div>
          <div>
            <p style="color: #666666; margin: 12px 0; font-size: 16px; line-height: 1.4;"><strong style="color: #333333;">Phone:</strong><br>{{phone}}</p>
          </div>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 30px; border-radius: 12px; border: 1px solid #e9ecef;">
        <h2 style="color: #333333; font-size: 20px; margin-bottom: 20px; font-weight: 600;">Message</h2>
        <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border-left: 5px solid #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="color: #333333; line-height: 1.7; margin: 0; white-space: pre-wrap; font-size: 16px;">{{message}}</p>
        </div>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding: 30px 50px; text-align: center; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
      <p style="color: #999999; font-size: 14px; margin: 8px 0;">This message was sent via the Continuum contact form.</p>
      <p style="color: #999999; font-size: 14px; margin: 8px 0;">Please respond directly to <strong>{{email}}</strong> to reply to this inquiry.</p>
    </td>
  </tr>
</table>
`;
