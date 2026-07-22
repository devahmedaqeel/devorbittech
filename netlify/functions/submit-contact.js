'use strict';

try { require('dotenv').config({ path: require('path').join(__dirname, '../../.env') }); } catch (_) {}

const nodemailer = require('nodemailer');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', ...CORS }, body: JSON.stringify(body) };
}

function formatDateTime() {
  return new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'full', timeStyle: 'medium' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return respond(400, { error: 'Invalid request format.' }); }

  const { name, email, phone, service, message } = body;

  const errors = [];
  if (!name    || name.trim().length < 2)                         errors.push('Name must be at least 2 characters.');
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('A valid email address is required.');
  if (!service || !service.trim())                                 errors.push('Please select a service.');
  if (!message || message.trim().length < 10)                     errors.push('Message must be at least 10 characters.');
  if (errors.length > 0) return respond(422, { error: errors.join(' ') });

  const GMAIL_USER         = process.env.GMAIL_USER         || 'official.devorbittech@gmail.com';
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'qkgf gzzg sahx iavg';
  const ADMIN_EMAIL        = process.env.ADMIN_EMAIL        || 'official.devorbittech@gmail.com';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const submittedAt   = formatDateTime();
  const senderName    = esc(name.trim());
  const senderEmail   = esc(email.trim().toLowerCase());
  const senderPhone   = phone ? esc(phone.trim()) : 'Not provided';
  const senderService = esc(service.trim());
  const senderMessage = esc(message.trim());

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>New Contact Form Submission</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr>
    <td style="background:linear-gradient(135deg,#050a14 0%,#0a1628 100%);border-radius:12px 12px 0 0;padding:32px 36px;text-align:center;">
      <h1 style="margin:0;color:#1d8cf8;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">DEV <span style="color:#00d4ff;">ORBIT</span> TECH</h1>
      <p style="margin:6px 0 0;color:#8ea8c3;font-size:12px;letter-spacing:2px;">CODE. CREATE. INNOVATE.</p>
    </td>
  </tr>
  <tr><td style="background:#1d8cf8;padding:14px 36px;"><h2 style="margin:0;color:#fff;font-size:16px;">📬 New Contact Form Submission</h2></td></tr>
  <tr>
    <td style="background:#fff;padding:32px 36px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 24px;color:#374151;font-size:15px;">New message from the <strong>Dev Orbit Tech</strong> contact form.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr style="background:#f9fafb;"><td style="padding:14px 18px;width:130px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">👤 Name</td><td style="padding:14px 18px;color:#111827;font-size:15px;font-weight:500;border-bottom:1px solid #e5e7eb;">${senderName}</td></tr>
        <tr><td style="padding:14px 18px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">✉️ Email</td><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${senderEmail}" style="color:#1d8cf8;font-size:15px;text-decoration:none;">${senderEmail}</a></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:14px 18px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">📞 Phone</td><td style="padding:14px 18px;color:#111827;font-size:15px;border-bottom:1px solid #e5e7eb;">${senderPhone}</td></tr>
        <tr><td style="padding:14px 18px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">🛠️ Service</td><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><span style="background:#eff6ff;color:#1d4ed8;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;">${senderService}</span></td></tr>
        <tr style="background:#f9fafb;"><td style="padding:14px 18px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">🕒 Submitted</td><td style="padding:14px 18px;color:#111827;font-size:14px;border-bottom:1px solid #e5e7eb;">${submittedAt}</td></tr>
        <tr><td colspan="2" style="padding:18px 18px 20px;"><p style="margin:0 0 10px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;">💬 Message</p><div style="background:#f8fafc;border-left:4px solid #1d8cf8;border-radius:4px;padding:16px;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${senderMessage}</div></td></tr>
      </table>
      <div style="margin-top:28px;text-align:center;">
        <a href="mailto:${senderEmail}?subject=Re:%20Your%20inquiry%20about%20${encodeURIComponent(service.trim())}" style="display:inline-block;background:#1d8cf8;color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:600;">↩️ Reply to ${senderName}</a>
      </div>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;border-top:1px solid #f3f4f6;padding-top:20px;">
        Sent automatically from the Dev Orbit Tech website.<br/>Software Technology Park, University of Kotli (AJK)
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const textBody = [
    'NEW CONTACT FORM SUBMISSION — Dev Orbit Tech',
    '',
    `Name     : ${name.trim()}`,
    `Email    : ${email.trim()}`,
    `Phone    : ${phone ? phone.trim() : 'Not provided'}`,
    `Service  : ${service.trim()}`,
    `Submitted: ${submittedAt}`,
    '',
    message.trim(),
    '',
    `Reply to: ${email.trim()}`,
  ].join('\n');

  try {
    const info = await transporter.sendMail({
      from:    `"Dev Orbit Tech Website" <${GMAIL_USER}>`,
      to:      ADMIN_EMAIL,
      replyTo: `"${name.trim()}" <${email.trim().toLowerCase()}>`,
      subject: `📬 New Inquiry: ${service.trim()} — ${name.trim()}`,
      text:    textBody,
      html:    htmlBody,
    });
    console.log(`[submit-contact] Sent: ${info.messageId}`);
    return respond(200, { success: true });
  } catch (err) {
    console.error('[submit-contact] Failed:', err.message);
    return respond(500, { error: 'Failed to send your message. Please email us at official.devorbittech@gmail.com' });
  }
};
