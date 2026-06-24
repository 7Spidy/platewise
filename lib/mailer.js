// api/lib/mailer.js — Resend email wrapper.
import { Resend } from 'resend';

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = 'Platewise <onboarding@resend.dev>';

export async function sendInviteEmail(to, inviteUrl) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'You\'re invited to Platewise',
    html: `<p>You've been approved for the Platewise beta!</p>
<p><a href="${inviteUrl}">Accept your invitation</a></p>
<p>This link expires in 48 hours.</p>`,
  });
}

export async function sendResetEmail(to, resetUrl) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Reset your Platewise password',
    html: `<p>Someone requested a password reset for your Platewise account.</p>
<p><a href="${resetUrl}">Reset password</a> — this link expires in 30 minutes.</p>
<p>If you didn't request this, you can ignore this email.</p>`,
  });
}
