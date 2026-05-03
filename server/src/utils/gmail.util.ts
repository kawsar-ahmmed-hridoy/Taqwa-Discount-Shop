import nodemailer from 'nodemailer';
import { config } from '../config/app.config';
import { ValidationError } from '../errors';

export const sendStaffVerificationEmail = async (payload: {
  to: string;
  fullName: string;
  code: string;
  expiresInMinutes: number;
}) => {
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
    throw new ValidationError('Gmail verification is not configured yet');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_APP_PASSWORD,
    },
  });

  const html = `
    <div style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
        <div style="background:#111318;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;color:#f0f2f5;">
          <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6ea8fe;font-weight:700;">${config.GMAIL_FROM_NAME}</div>
          <h2 style="margin:12px 0 10px;font-size:24px;line-height:1.2;">Verify the new staff account</h2>
          <p style="margin:0 0 18px;color:#c8cdd8;font-size:14px;line-height:1.6;">Hi ${payload.fullName}, use the one-time verification code below to finish creating the staff account.</p>
          <div style="display:inline-block;background:#1f6feb;color:#fff;font-size:28px;font-weight:800;letter-spacing:0.22em;padding:16px 22px;border-radius:14px;">${payload.code}</div>
          <p style="margin:18px 0 0;color:#c8cdd8;font-size:13px;line-height:1.6;">This code expires in ${payload.expiresInMinutes} minutes. If you did not request it, you can ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"${config.GMAIL_FROM_NAME}" <${config.GMAIL_USER}>`,
    to: payload.to,
    subject: 'Your Taqwa staff verification code',
    html,
    text: `Your Taqwa staff verification code is ${payload.code}. It expires in ${payload.expiresInMinutes} minutes.`,
  });
};