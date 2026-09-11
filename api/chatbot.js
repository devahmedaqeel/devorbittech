'use strict';

const fs = require('fs');
const path = require('path');

// Rate limiting cache (IP -> timestamp array)
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_MIN = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  let timestamps = rateLimits.get(ip) || [];
  timestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_MIN) return false;
  timestamps.push(now);
  rateLimits.set(ip, timestamps);
  return true;
}

function loadJsonSafe(filename) {
  try {
    const p = path.join(__dirname, '..', 'knowledge', filename);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`[Chatbot API] Error loading ${filename}:`, e.message);
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const company = loadJsonSafe('company.json');
  const services = loadJsonSafe('services.json');
  const projects = loadJsonSafe('projects.json');
  const faqs = loadJsonSafe('faqs.json');
  const technologies = loadJsonSafe('technologies.json');

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  const { message, history, state, stage, language } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const cleanMessage = message.trim().slice(0, 1000);
  const lower = cleanMessage.toLowerCase();

  // Cloud LLM Provider Execution (if key is set)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const knowledgeContext = `
VERIFIED DEV ORBIT TECH FACTS:
Company: Dev Orbit Tech
Founder/CEO: Engr. Ahmed Aqeel (Lead Software Engineer)
Office: Software Technology Park, University of Kotli, Azad Jammu & Kashmir (AJK), Pakistan
Contact: WhatsApp / Phone +92 316 1893004, Email: official.devorbittech@gmail.com
Core Services: Business Website Development, Company Websites, Web Apps, Mobile Apps (Flutter, React Native), Custom Software, SaaS MVPs, AI Development & Automation, UI/UX Design, Final Year Projects (FYP) mentorship & documentation (SRS/SDS).
Verified Projects: MediReport AI (Healthcare AI), Blissful Blinds Ltd (UK E-commerce), DevSync AI (Developer SaaS), OFM Mobile App (Logistics in Flutter).
Guarantees: 100% intellectual property and source code ownership delivered to client. No recurring platform lock-in. Milestone pricing.
Active Conversation Context: ${JSON.stringify(state || {})}
`;
      const systemInstruction = `
You are DEV ORBIT AI, the official AI Project & Technology Assistant for Dev Orbit Tech (https://devorbittech.org).
Mission: Give completely ACCURATE, FACTUAL, and HELPFUL answers to visitors inquiring about software, web, mobile, AI, and company details.
Strict Rules:
1. Ground answers 100% in the provided facts. Never invent prices, fake offices, or fake employees.
2. If language is Roman Urdu, respond in natural, professional Roman Urdu. If Urdu, reply in Urdu. If English, reply in English.
3. Be direct, concise, and structured.
4. Current user message: ${cleanMessage}
`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: knowledgeContext + '\n' + systemInstruction }] }
          ]
        })
      });
      if (response.ok) {
        const geminiData = await response.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.json({ reply: text });
      }
    } catch (e) {
      console.warn('[Chatbot API] Cloud LLM error, continuing to specialized knowledge engine:', e.message);
    }
  }

  // Specialized High-Accuracy Knowledge Retrieval Engine
  // 1. FAQs & Specific Fact Matching
  if (faqs && faqs.faqs) {
    let bestFaq = null;
    let maxMatches = 0;
    for (const faq of faqs.faqs) {
      let matches = 0;
      for (const k of faq.keywords || []) {
        if (lower.includes(k)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestFaq = faq;
      }
    }
    if (bestFaq && maxMatches > 0) {
      if (language === 'roman_urdu' && bestFaq.answerRoman) {
        return res.json({ reply: bestFaq.answerRoman });
      }
      if (language === 'urdu' && bestFaq.answerUrdu) {
        return res.json({ reply: bestFaq.answerUrdu });
      }
      return res.json({ reply: bestFaq.answer });
    }
  }

  // 2. Services Knowledge Matching
  if (services && services.services) {
    for (const s of services.services) {
      const matchTerms = [s.title.toLowerCase(), s.id.replace(/-/g, ' ')];
      if (s.features) matchTerms.push(...s.features.map(f => f.toLowerCase()));
      if (matchTerms.some(t => lower.includes(t) || (t.includes('web') && lower.includes('website')) || (t.includes('mobile') && (lower.includes('app') || lower.includes('android'))))) {
        if (language === 'roman_urdu') {
          return res.json({
            reply: `Hum ${s.title} professionally provide karte hain. Isme hum ${s.features.slice(0, 3).join(', ')} waghera offer karte hain. Kya aap apne project ke bare mein thora batana chahenge?`
          });
        }
        if (language === 'urdu') {
          return res.json({
            reply: `ہم ${s.title} کی مکمل سروس فراہم کرتے ہیں۔ اس میں ${s.features.slice(0, 3).join('، ')} شامل ہیں۔`
          });
        }
        return res.json({
          reply: `Yes, Dev Orbit Tech provides **${s.title}**. We deliver: ${s.features.join(', ')}. Would you like to discuss your specific requirements or get an estimate?`
        });
      }
    }
  }

  // 3. Projects Knowledge Matching
  if (projects && projects.projects) {
    for (const p of projects.projects) {
      if (lower.includes(p.id) || lower.includes(p.title.toLowerCase()) || lower.includes('portfolio') || lower.includes('projects') || lower.includes('kaam dekhna')) {
        if (language === 'roman_urdu') {
          return res.json({
            reply: `Hamare verified projects mein **MediReport AI** (Healthcare AI), **Blissful Blinds Ltd** (UK E-commerce), **DevSync AI** (Developer tool), aur **OFM Mobile App** (Flutter logistics) shamil hain. Aap inki details hamari website ke Case Studies section mein dekh sakte hain.`
          });
        }
        return res.json({
          reply: `Our verified portfolio includes **MediReport AI** (Healthcare Diagnostic AI), **Blissful Blinds Ltd** (UK Dynamic Quoting System), **DevSync AI** (Code Documentation Tool), and **OFM Mobile App** (Logistics & GPS Dispatch). You can explore them in detail on our Case Studies page.`
        });
      }
    }
  }

  // Default multilingual fallback
  if (language === 'roman_urdu') {
    return res.json({
      reply: "Main Dev Orbit Tech ka official AI assistant hoon. Main aapke sawalat ke bilkul accurate jawabat deta hoon. Aap mujhse hamari services, development process, technologies, ya apne kisi project idea ke baare mein pooch sakte hain."
    });
  }
  if (language === 'urdu') {
    return res.json({
      reply: "میں دیو اوربٹ ٹیک کا باضابطہ AI اسسٹنٹ ہوں۔ میں آپ کے تمام سوالات کے درست اور جامع جوابات فراہم کرتا ہوں۔ آپ سروسز، ٹیکنالوجیز یا پروجیکٹ آئیڈیا کے متعلق پوچھ سکتے ہیں۔"
    });
  }
  res.json({
    reply: "I am Dev Orbit AI, your official Project & Technology Assistant. I can provide verified details on our custom web, mobile, SaaS, and AI development capabilities, or help you structure your project scope."
  });
};
