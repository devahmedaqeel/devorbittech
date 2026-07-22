'use strict';

require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const path       = require('path');
const fs         = require('fs');

const app  = express();
const PORT = process.env.PORT || 8888;

// Auto-sync preview images from brain folder to images/ and frontend/images/
(function syncPreviewImages() {
  try {
    const srcDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\0a1b3137-6c59-4ef9-ba11-931ade2cb715';
    const destDir = path.join(__dirname, 'images');
    const frontendDestDir = path.join(__dirname, 'frontend', 'images');

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    if (!fs.existsSync(frontendDestDir)) fs.mkdirSync(frontendDestDir, { recursive: true });

    const filesToCopy = [
      { src: 'medireport_ai_preview_1784748580744.png', dest: 'medireport-ai-preview.png' },
      { src: 'blissful_blinds_preview_1784748601218.png', dest: 'blissfulblinds-preview.png' },
      { src: 'devsync_ai_preview_1784748623980.png', dest: 'devsync-ai-preview.png' },
      { src: 'ofm_mobile_preview_1784748643238.png', dest: 'ofm-preview.png' },
      { src: 'devorbittech_platform_preview_1784749289560.png', dest: 'devorbittech-platform-preview.png' },
      { src: 'portfolio_banner_preview_1784749168719.png', dest: 'portfolio-banner-preview.png' }
    ];

    filesToCopy.forEach(item => {
      const fullSrc = path.join(srcDir, item.src);
      const fullDest = path.join(destDir, item.dest);
      const fullFrontendDest = path.join(frontendDestDir, item.dest);
      if (fs.existsSync(fullSrc)) {
        if (!fs.existsSync(fullDest)) fs.copyFileSync(fullSrc, fullDest);
        if (!fs.existsSync(fullFrontendDest)) fs.copyFileSync(fullSrc, fullFrontendDest);
      }
    });
  } catch (err) {
    console.warn('Image sync warning:', err.message);
  }
})();

// Security & Production Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Non-www redirect for canonical domain https://devorbittech.org
  if (req.headers.host && req.headers.host.startsWith('www.devorbittech.org')) {
    return res.redirect(301, 'https://devorbittech.org' + req.url);
  }
  next();
});

// Serve logo for favicon / touch icons directly
app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(__dirname, 'images', 'logo.jpg')));
app.get('/apple-touch-icon.png', (_req, res) => res.sendFile(path.join(__dirname, 'images', 'logo.jpg')));
app.get('/apple-touch-icon-precomposed.png', (_req, res) => res.sendFile(path.join(__dirname, 'images', 'logo.jpg')));

app.use(express.json());
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));
app.use(express.static(__dirname)); 

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateTime() {
  return new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'full', timeStyle: 'medium' });
}

const handleContactSubmit = async (req, res) => {
  const { name, email, phone, service, message } = req.body || {};

  const errors = [];
  if (!name    || name.trim().length < 2)                            errors.push('Name must be at least 2 characters.');
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('A valid email address is required.');
  if (!service || !service.trim())                                   errors.push('Please select a service.');
  if (!message || message.trim().length < 10)                        errors.push('Message must be at least 10 characters.');
  if (errors.length > 0) return res.status(422).json({ error: errors.join(' ') });

  const { GMAIL_USER, GMAIL_APP_PASSWORD, ADMIN_EMAIL } = process.env;

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !ADMIN_EMAIL) {
    return res.status(500).json({ error: 'Missing env vars. Check your .env file or contact via WhatsApp/Email.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const submittedAt = formatDateTime();
  const logoUrl = 'https://devorbittech.org/images/logo.jpg';

  try {
    const info = await transporter.sendMail({
      from:    `"Dev Orbit Tech Website" <${GMAIL_USER}>`,
      to:      ADMIN_EMAIL,
      replyTo: `"${name.trim()}" <${email.trim().toLowerCase()}>`,
      subject: `📬 New Inquiry: ${service.trim()} — ${name.trim()}`,
      text:    `Name: ${name.trim()}\nEmail: ${email.trim()}\nPhone: ${phone || 'Not provided'}\nService: ${service.trim()}\nSubmitted: ${submittedAt}\n\n${message.trim()}`,
      html:    `<p><b>Name:</b> ${esc(name)}</p><p><b>Email:</b> ${esc(email)}</p><p><b>Phone:</b> ${phone ? esc(phone) : 'Not provided'}</p><p><b>Service:</b> ${esc(service)}</p><p><b>Time:</b> ${submittedAt}</p><p><b>Message:</b><br/>${esc(message)}</p>`,
    });
    console.log(`[submit-contact] Sent: ${info.messageId}`);

    try {
      await transporter.sendMail({
        from:    `"Dev Orbit Tech" <${GMAIL_USER}>`,
        to:      email.trim(),
        subject: 'Your Request Has Been Sent Successfully — Dev Orbit Tech',
        text:    `Hi ${name.trim()},\n\nThank you for reaching out to Dev Orbit Tech! We've received your message and our team will contact you shortly.\n\nService : ${service.trim()}\nMessage : ${message.trim()}\n\nWhatsApp: https://wa.me/923161893004\nWebsite : https://devorbittech.org\n\n— Dev Orbit Tech Team`,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>We've Received Your Message</title></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#050a14 0%,#0a1628 100%);border-radius:12px 12px 0 0;padding:36px;text-align:center;">
    <img src="${logoUrl}" alt="Dev Orbit Tech" width="64" height="64" style="border-radius:50%;border:2px solid #00d4ff;display:block;margin:0 auto 14px;"/>
    <h1 style="margin:0;color:#1d8cf8;font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">DEV <span style="color:#00d4ff;">ORBIT</span> TECH</h1>
    <p style="margin:6px 0 0;color:#8ea8c3;font-size:12px;letter-spacing:2px;">CODE. CREATE. INNOVATE.</p>
  </td></tr>
  <tr><td style="background:#10b981;padding:14px 36px;"><h2 style="margin:0;color:#fff;font-size:16px;">✅ Your Request Has Been Sent Successfully</h2></td></tr>
  <tr><td style="background:#fff;padding:32px 36px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 6px;color:#111827;font-size:17px;font-weight:600;">Hi ${esc(name)},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">Thank you for reaching out to <strong>Dev Orbit Tech</strong>! We've received your message and our team will get back to you shortly to discuss your requirements.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9fafb;"><td style="padding:14px 18px;width:130px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e5e7eb;">Service</td><td style="padding:14px 18px;border-bottom:1px solid #e5e7eb;"><span style="background:#eff6ff;color:#1d4ed8;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;">${esc(service)}</span></td></tr>
      <tr><td colspan="2" style="padding:18px 18px 20px;"><p style="margin:0 0 10px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;">Your Message</p><div style="background:#f8fafc;border-left:4px solid #1d8cf8;border-radius:4px;padding:16px;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${esc(message)}</div></td></tr>
    </table>
    <div style="margin-top:28px;text-align:center;">
      <a href="https://wa.me/923161893004" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:600;margin:0 6px 10px;">Chat on WhatsApp</a>
      <a href="https://devorbittech.org" style="display:inline-block;background:#1d8cf8;color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:600;margin:0 6px 10px;">Visit Our Website</a>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;border-top:1px solid #f3f4f6;padding-top:20px;">This is an automated confirmation from Dev Orbit Tech. Please do not reply directly to this email — our team will contact you at <strong>${esc(email)}</strong>.<br/>Software Technology Park, University of Kotli (AJK)</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      });
    } catch (clientErr) {
      console.warn('[submit-contact] Client confirmation email failed (admin was still notified):', clientErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[submit-contact] Failed:', err.message);
    res.status(500).json({ error: 'Failed to send. Please email us at official.devorbittech@gmail.com or WhatsApp +923161893004' });
  }
};

app.post('/.netlify/functions/submit-contact', handleContactSubmit);
app.post('/api/submit-contact', handleContactSubmit);

const handleGetStats = (_req, res) => res.json({ count: 50 });
app.get('/.netlify/functions/get-stats', handleGetStats);
app.get('/api/get-stats', handleGetStats);

// 404 Fallback Route
app.use((_req, res) => {
  const p404 = path.join(frontendPath, '404.html');
  if (fs.existsSync(p404)) return res.status(404).sendFile(p404);
  res.status(404).send('404 Page Not Found');
});

// Global Error Handler (500)
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  const p500 = path.join(frontendPath, '500.html');
  if (fs.existsSync(p500)) return res.status(500).sendFile(p500);
  res.status(500).send('500 Internal Server Error');
});

app.listen(PORT, () => {
  console.log(`\n✅  Dev Orbit Tech — http://localhost:${PORT}\n`);
  console.log(`   GMAIL_USER  : ${process.env.GMAIL_USER  || '(not set)'}`);
  console.log(`   ADMIN_EMAIL : ${process.env.ADMIN_EMAIL || '(not set)'}\n`);
});
