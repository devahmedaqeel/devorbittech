'use strict';

const fs = require('fs');
const path = require('path');

// Rate limiting cache (IP -> timestamp array)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MIN = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  let timestamps = rateLimits.get(ip) || [];
  timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_MIN) {
    return false;
  }
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  return true;
}

// Load knowledge bases safely
function loadJsonSafe(filename) {
  try {
    const p = path.join(__dirname, '..', 'knowledge', filename);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn(`[Chatbot API] Error loading ${filename}:`, e.message);
  }
  return null;
}

const company = loadJsonSafe('company.json');
const services = loadJsonSafe('services.json');
const projects = loadJsonSafe('projects.json');
const faqs = loadJsonSafe('faqs.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { message, history, state, stage, language } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const cleanMessage = message.trim().slice(0, 1000); // 1000 char safety ceiling

  // Check if Gemini API key exists
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const systemInstruction = `
You are DEV ORBIT AI, the official AI Project & Technology Assistant for Dev Orbit Tech (https://devorbittech.org).
Role: Help visitors understand Dev Orbit Tech, discuss project ideas (Web, Mobile App, AI, Automation, SaaS, Custom Software), and organize their requirements.
Guidelines:
- Ground all facts in verified company information. Headquarters: Software Technology Park, University of Kotli, AJK. Lead Engineer: Engr. Ahmed Aqeel.
- Never invent prices, fake clients, or guarantee unrealistic timelines.
- Respond in the user's language: English, Urdu, or Roman Urdu.
- Be concise, friendly, and professional. Avoid sales spam.
- Current project state: ${JSON.stringify(state || {})}
`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemInstruction + '\nUser message: ' + cleanMessage }] }
          ]
        })
      });
      if (response.ok) {
        const geminiData = await response.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return res.json({ reply: text });
        }
      }
    } catch (e) {
      console.warn('[Chatbot API] Cloud LLM error, falling back to local engine:', e.message);
    }
  }

  // Built-in Knowledge Response Logic (Zero Hallucination)
  const lower = cleanMessage.toLowerCase();
  if (faqs && faqs.faqs) {
    for (const faq of faqs.faqs) {
      if (faq.keywords && faq.keywords.some(k => lower.includes(k))) {
        return res.json({ reply: faq.answer });
      }
    }
  }

  // Default intelligent response based on language
  if (language === 'roman_urdu') {
    return res.json({
      reply: "Main Dev Orbit Tech ka official AI assistant hoon. Main aapki digital requirements samajh kar sahi service recommend kar sakta hoon. Kya aap koi Website, Mobile App ya AI Automation build karna chahte hain?"
    });
  } else if (language === 'urdu') {
    return res.json({
      reply: "میں دیو اوربٹ ٹیک کا باضابطہ AI اسسٹنٹ ہوں۔ میں آپ کے پروجیکٹ کے تقاضے سمجھ کر مناسب رہنمائی فراہم کر سکتا ہوں۔ آپ کس قسم کا پروجیکٹ شروع کرنا چاہتے ہیں؟"
    });
  }

  res.json({
    reply: "Dev Orbit Tech specializes in custom web development, mobile applications (Flutter & React Native), SaaS platforms, and AI automation. Could you tell me a little about what you are planning to build?"
  });
};
