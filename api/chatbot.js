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
YOU ARE DEV ORBIT AI — OFFICIAL AI ASSISTANT FOR DEV ORBIT TECH (https://devorbittech.org).
STRICT DOMAIN BOUNDARY:
- You ONLY answer questions related to Dev Orbit Tech, its software development services, project inquiries, technology stack, founders, office location, and how clients can build their projects with Dev Orbit Tech.
- If a user asks about unrelated topics (such as general trivia, politics, cooking recipes, general news, or outside homework), politely decline in their language and guide them back to Dev Orbit Tech's services:
  (e.g., in Roman Urdu: "Main Dev Orbit Tech ka official assistant hoon. Main sirf Dev Orbit Tech ki services, website, mobile app, aur AI projects ke mutaliq jawab de sakta hoon. Kya aap koi digital project discuss karna chahte hain?")

OFFICIAL VERIFIED FACTS ABOUT DEV ORBIT TECH:
Company Name: Dev Orbit Tech
Tagline: Code. Create. Innovate.
Founder & CEO: Engr. Ahmed Aqeel (Lead Software Engineer)
Office / Location: Software Technology Park, University of Kotli, Azad Jammu & Kashmir (AJK), Pakistan. (Serving international & domestic clients worldwide).
Official Contact:
- Phone & WhatsApp: +92 316 1893004
- Email: official.devorbittech@gmail.com
- Website: https://devorbittech.org

CORE SERVICES:
1. Business Website Development (High-performance, lead generation, local and commercial businesses)
2. Company Website Development (Corporate branding, executive profiles, compliance, enterprises)
3. Custom Web Development & SaaS Applications (React, Next.js, Node.js, Stripe subscriptions)
4. Mobile App Development (Flutter & React Native cross-platform apps for iOS and Android)
5. Custom Software & Internal Systems (ERP, CRM, dashboards, eliminating recurring software license fees)
6. Artificial Intelligence (AI) Development (LLM integration, AI agents, document summarizers)
7. AI & Business Workflow Automation (Automating repetitive tasks, webhooks, human-in-the-loop workflows)
8. UI/UX Interface Design (Figma clickable prototypes, design systems)
9. University Final Year Projects (FYP mentorship, full-stack development, and SRS/SDS documentation)

VERIFIED PORTFOLIO:
- MediReport AI: Automated healthcare diagnostic report generation platform (Python, GPT-4, React).
- Blissful Blinds Ltd: UK online custom window blind measurement & quoting platform with Stripe.
- DevSync AI: Automated developer documentation and GitHub commit tracking SaaS.
- OFM Mobile App: Cross-platform Flutter logistics, driver GPS dispatch & order management.

GUARANTEES & POLICIES:
- 100% intellectual property and complete source code ownership delivered to client.
- No proprietary lock-in.
- Transparent milestone-based billing (no fake fixed prices without technical scoping).
- Direct communication with lead engineers.

LANGUAGE INSTRUCTIONS:
- If user speaks English -> Reply in concise, professional English.
- If user speaks Roman Urdu (e.g., "mujhe website banwani hai") -> Reply in natural, professional Roman Urdu.
- If user speaks Urdu (اردو) -> Reply in polite, clear Urdu.
`;
      const systemInstruction = `
User Message: "${cleanMessage}"
Conversation State: ${JSON.stringify(state || {})}

Task: Provide an accurate, direct, professional answer grounded 100% in Dev Orbit Tech's verified facts above. Guide the user toward defining their project or reaching out via WhatsApp (+92 316 1893004) or the contact form.
`;
      let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: knowledgeContext + '\n' + systemInstruction }] }
          ]
        })
      });
      if (!response.ok) {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: knowledgeContext + '\n' + systemInstruction }] }
            ]
          })
        });
      }
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
  // Intent Trigger: Website Project Scoping
  if (lower.includes('website') || lower.includes('websote') || lower.includes('web site') || lower.includes('web development') || lower.includes('site banani')) {
    if (language === 'roman_urdu') {
      return res.json({ reply: "Zabardast! Ek high-performance aur modern website business ke liye bohot zaroori hai. Yeh website kis company ya business ke liye banwani hai?" });
    }
    if (language === 'urdu') {
      return res.json({ reply: "بہترین! ایک جدید اور تیز رفتار ویب سائٹ کاروبار کی پہچان کے لیے لازمی ہے۔ یہ ویب سائٹ کس کمپنی یا کاروبار کے لیے بنوانی ہے؟" });
    }
    return res.json({ reply: "Awesome! A tailored, high-performance website is essential for building authority and driving leads. What type of business or company is this website for?" });
  }

  // Intent Trigger: Mobile App Scoping
  if (lower.includes('mobile app') || lower.includes('app idea') || lower.includes('android app') || lower.includes('ios app') || lower.includes('app banani')) {
    if (language === 'roman_urdu') {
      return res.json({ reply: "Bohot khoob! Hum Flutter aur React Native ke zariye iOS aur Android apps banate hain. Aapki mobile app ka basic maqsad ya idea kya hai?" });
    }
    if (language === 'urdu') {
      return res.json({ reply: "بہترین! ہم آئی او ایس اور اینڈرائیڈ دونوں کے لیے تیز رفتار موبائل ایپس بناتے ہیں۔ آپ کی ایپ کا بنیادی مقصد کیا ہے؟" });
    }
    return res.json({ reply: "Great choice! We develop high-speed Flutter and React Native apps for iOS & Android. What core problem will your application solve?" });
  }

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
