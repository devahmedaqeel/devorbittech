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
