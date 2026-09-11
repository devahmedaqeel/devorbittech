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

CORE SERVICES OFFERED:
1. Business Website Development: High-performance, SEO-optimized commercial websites engineered to generate real business leads.
2. Company Website Development: Authoritative corporate web design, executive profiles, compliance, and enterprise portals.
3. Custom Web Development: Hand-crafted, bespoke web applications using clean HTML, modern CSS, JavaScript, React, and Node.js with zero template bloat.
4. Web Application Development: Dynamic, database-backed web portals, internal dashboards, and operational business platforms.
5. Mobile App Development: Cross-platform iOS and Android apps using Flutter and React Native with 60fps animations and offline capability.
6. Flutter App Development: Fast, native-compiled mobile apps from a single unified Dart codebase.
7. React Native Development: High-grade native mobile experiences built with JavaScript and React ecosystem.
8. Custom Software Development: Bespoke software systems tailored to specific company workflows, eliminating expensive monthly SaaS license fees.
9. SaaS Product Development: Multi-tenant cloud software-as-a-service architectures, Stripe subscriptions, and scalable MVPs.
10. Artificial Intelligence (AI) Development: LLM integrations (GPT-4, Gemini), intelligent document summarizers, RAG, and AI agents.
11. AI & Business Workflow Automation: Webhook automation, intelligent document parsing, and automated operations.
12. UI/UX Interface Design: Figma interactive prototypes, user journey mapping, and cohesive design systems.
13. University Final Year Projects (FYP) Mentorship: Complete technical mentorship, full-stack development, and documentation (SRS/SDS) for students.

HOW WE GUIDE & WORK WITH CUSTOMERS (OUR 5-STEP WORKING PROCESS):
- Step 1: Initial Discovery & Requirement Analysis: We thoroughly understand client business goals, target audience, and functional specifications to outline a clear technical roadmap.
- Step 2: Architecture & UI/UX Design: We design wireframes and clickable Figma prototypes so clients can visualize and test the product before coding begins.
- Step 3: Agile Engineering: Clean, bespoke coding (React/Next.js, Flutter, Node.js, Python, PostgreSQL) with regular sprint updates and no bloated pre-made templates.
- Step 4: Rigorous QA & Performance Testing: Sub-second load times, cross-device responsiveness, Core Web Vitals >90, and comprehensive security hardening.
- Step 5: Deployment, Source Code Handover & Post-Launch Support: 100% intellectual property & complete source code ownership delivered to client, domain/server configuration, and ongoing support.

OUR PRICING & PROPOSAL POLICY:
- We never offer misleading blind fixed prices without technical scoping.
- We provide honest, itemized milestone proposals based on exact project requirements.

CUSTOMER ACTION GUIDANCE:
- Always guide the customer to take the next step: either discuss their project directly on WhatsApp (+92 316 1893004) with Lead Engineer Engr. Ahmed Aqeel or submit an inquiry using our website contact form (https://devorbittech.org/#contact).

VERIFIED PORTFOLIO:
- MediReport AI: Automated healthcare diagnostic report generation platform (Python, GPT-4, React).
- Blissful Blinds Ltd: UK online custom window blind measurement & quoting platform with Stripe.
- DevSync AI: Automated developer documentation and GitHub commit tracking SaaS.
- OFM Mobile App: Cross-platform Flutter logistics, driver GPS dispatch & order management.

GUARANTEES & POLICIES:
- 100% intellectual property and complete source code ownership delivered to client.
- No proprietary lock-in.
- Transparent milestone-based billing.
- Direct communication with lead engineers.

LANGUAGE INSTRUCTIONS:
- If user speaks English -> Reply in concise, professional English.
- If user speaks Roman Urdu (e.g., "mujhe website banwani hai") -> Reply in natural, professional Roman Urdu.
- If user speaks Urdu (اردو) -> Reply in polite, clear Urdu.
`;
      const systemInstruction = `
User Message: "${cleanMessage}"
Conversation State: ${JSON.stringify(state || {})}

Task: Provide an accurate, direct, professional answer grounded 100% in Dev Orbit Tech's verified facts above. Clearly explain our services and how we guide customers through our 5-step process. Always guide the user toward defining their project or reaching out via WhatsApp (+92 316 1893004) or the website contact form.
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

  // Specialized High-Accuracy Knowledge Retrieval Engine (Fallback & Direct Match)

  // Intent 1: All Services Overview / What services do you offer?
  const isAllServicesQuery = (
    lower.includes('all service') || lower.includes('services list') || lower.includes('what service') ||
    lower.includes('what do you do') || lower.includes('what you do') || lower.includes('what do you offer') ||
    lower.includes('kon kon si service') || lower.includes('kya service') || lower.includes('kia service') ||
    lower.includes('kya kaam karte ho') || lower.includes('tamam service') || lower.includes('services kya hain') ||
    (lower.includes('service') && (lower.includes('all') || lower.includes('list') || lower.includes('tell') || lower.includes('show') || lower.includes('provide') || lower.includes('offer')))
  );

  if (isAllServicesQuery) {
    if (language === 'roman_urdu') {
      return res.json({
        reply: `Dev Orbit Tech comprehensive digital solutions provide karta hai:\n\n` +
          `1. **Business & Company Websites:** Fast, SEO-optimized aur lead generation websites.\n` +
          `2. **Custom Web & SaaS Development:** React, Next.js, aur Node.js par scalable platforms.\n` +
          `3. **Mobile App Development:** iOS aur Android ke liye Flutter aur React Native apps.\n` +
          `4. **Custom Software & Internal ERP/CRM:** Business processes ko automate karne wale systems.\n` +
          `5. **Artificial Intelligence (AI) Development:** LLM integration, custom AI agents, aur document summarizers.\n` +
          `6. **AI & Business Automation:** Repetitive tasks aur workflow webhooks.\n` +
          `7. **UI/UX Design:** Interactive Figma clickable prototypes.\n` +
          `8. **Final Year Projects (FYP) Mentorship:** University students ke liye software aur SRS/SDS documentation.\n\n` +
          `Aap apne project ke hawale se humse direct WhatsApp (+92 316 1893004) par rabta kar sakte hain ya website form fill kar sakte hain!`
      });
    }
    if (language === 'urdu') {
      return res.json({
        reply: `دیو اوربٹ ٹیک کی تمام بنیادی خدمات درج ذیل ہیں:\n\n` +
          `1. **کاروباری ویب سائٹس (Business Websites):** تیز رفتار، جدید اور لیڈز پیدا کرنے والی ویب سائٹس۔\n` +
          `2. **کسٹم ویب اور SaaS ایپلیکیشنز:** ری ایکٹ، نیکسٹ جے ایس اور نوڈ جے ایس پر مبنی پلیٹ فارمز۔\n` +
          `3. **موبائل ایپ ڈویلپمنٹ:** آئی او ایس اور اینڈرائیڈ دونوں کے لیے فلٹر (Flutter) اور ری ایکٹ نیٹو ایپس۔\n` +
          `4. **کسٹم سافٹ ویئر اور اندرونی سسٹمز:** ERP، CRM اور ڈیش بورڈز۔\n` +
          `5. **مصنوعی ذہانت (AI) سلوشنز:** LLM انٹیگریشن، AI ایجنٹس اور ڈاکومنٹ سمریز۔\n` +
          `6. **کاروباری خودکاری (Workflow Automation):** دفتری عمل کو خودکار بنانا۔\n` +
          `7. **UI/UX ڈیزائن:** انٹرایکٹو فیگما پروٹو ٹائپس۔\n` +
          `8. **فائنل ایئر پروجیکٹس (FYP):** طلباء کے لیے سافٹ ویئر اور مکمل دستاویزات (SRS/SDS)۔\n\n` +
          `اپنے پروجیکٹ کے بارے میں رہنمائی کے لیے آپ WhatsApp (+92 316 1893004) پر رابطہ کر سکتے ہیں۔`
      });
    }
    return res.json({
      reply: `Dev Orbit Tech provides complete, end-to-end digital engineering services:\n\n` +
        `1. **Business & Company Website Development:** High-converting, SEO-optimized, sub-second loading commercial websites.\n` +
        `2. **Custom Web & SaaS Development:** Scalable web applications using React, Next.js, Node.js, and Stripe integrations.\n` +
        `3. **Mobile App Development:** High-performance iOS and Android apps using Flutter and React Native.\n` +
        `4. **Custom Software & Internal Systems:** Bespoke ERP, CRM, and dashboards eliminating recurring seat license fees.\n` +
        `5. **Artificial Intelligence (AI) Development:** Custom LLM integrations, AI agents, and intelligent document analysis.\n` +
        `6. **AI & Business Workflow Automation:** Automated lead processing, webhooks, and human-in-the-loop workflows.\n` +
        `7. **UI/UX Interface Design:** Figma clickable prototypes, design systems, and user journey mapping.\n` +
        `8. **University Final Year Projects (FYP):** Full-stack development mentorship and SRS/SDS technical documentation.\n\n` +
        `We would love to discuss your project! Contact us directly via WhatsApp at **+92 316 1893004** or submit our website contact form.`
    });
  }

  // Intent 2: Working Process & Customer Guidance / How do you work?
  const isProcessQuery = (
    lower.includes('process') || lower.includes('how do you work') || lower.includes('working process') ||
    lower.includes('guide customer') || lower.includes('customer guide') || lower.includes('how to start') ||
    lower.includes('workflow') || lower.includes('procedure') || lower.includes('kaise kaam karte') ||
    lower.includes('tareeqa') || lower.includes('tariqa') || lower.includes('steps') || lower.includes('how it works')
  );

  if (isProcessQuery) {
    if (language === 'roman_urdu') {
      return res.json({
        reply: `Dev Orbit Tech ka 5-Step Professional Working Process yeh hai:\n\n` +
          `1. **Discovery & Requirements:** Hum aapke business goals, users, aur features ko detail mein samajhte hain.\n` +
          `2. **UI/UX Prototype:** Figma par clickable visual prototypes design karte hain taake coding se pehle aap pura experience test kar sakein.\n` +
          `3. **Agile Engineering:** Zero template bloat ke sath clean, custom code likhte hain aur regular sprint updates dete hain.\n` +
          `4. **QA & Speed Testing:** Sub-second speed, cross-device responsiveness, aur security checks.\n` +
          `5. **Deployment & 100% Code Ownership:** Launch ke baad saara source code, intellectual property, aur access complete taur par aapke hawale kiya jata hai.\n\n` +
          `Direct rabta karne ke liye hamare Lead Engineer se WhatsApp (+92 316 1893004) par baat karein!`
      });
    }
    if (language === 'urdu') {
      return res.json({
        reply: `دیو اوربٹ ٹیک کا کسٹمر گائیڈنس اور پروجیکٹ مکمل کرنے کا 5 مرحلہ وار طریقہ کار:\n\n` +
          `1. **ابتدائی تجزیہ (Discovery):** کاروباری اہداف اور ضروریات کی مکمل فہم۔\n` +
          `2. **UI/UX ڈیزائن:** کوڈنگ سے پہلے فیگما پر کلک ایبل پروٹو ٹائپ کی تیاری۔\n` +
          `3. **ایجل ڈویلپمنٹ:** بغیر کسی ریڈی میڈ ٹیمپلیٹ کے جدید اور معیاری کسٹم کوڈنگ۔\n` +
          `4. **کوالٹی ٹیسٹنگ:** رفتار، سیکیورٹی اور موبائل مطابقت کی مکمل جانچ۔\n` +
          `5. **ڈپلائمنٹ اور سورس کوڈ کی منتقلی:** 100% ملکیتی حقوق اور مکمل سورس کوڈ کلائنٹ کے حوالے کرنا۔\n\n` +
          `آغاز کے لیے ہمارے واٹس ایپ (+92 316 1893004) پر رابطہ کریں۔`
      });
    }
    return res.json({
      reply: `Here is how Dev Orbit Tech guides and executes client projects across 5 phases:\n\n` +
        `1. **Discovery & Requirement Analysis:** We define your target audience, core features, and architectural roadmap.\n` +
        `2. **UI/UX Design & Prototyping:** We build interactive Figma prototypes so you can preview and validate the design before coding begins.\n` +
        `3. **Agile Engineering:** Clean, bespoke development (React/Next.js, Flutter, Node.js, Python) with transparent sprint updates and zero template bloat.\n` +
        `4. **QA & Performance Optimization:** Rigorous testing for sub-second load times, cross-device compatibility, and security.\n` +
        `5. **Deployment & 100% Source Code Ownership:** Full intellectual property and complete code ownership delivered upon milestone clearance.\n\n` +
        `To get started with an initial scoping session, reach out directly on WhatsApp at **+92 316 1893004** or via our contact form!`
    });
  }

  // Intent 3: Website Project Scoping
  if (lower.includes('website') || lower.includes('websote') || lower.includes('web site') || lower.includes('web development') || lower.includes('site banani')) {
    if (language === 'roman_urdu') {
      return res.json({ reply: "Zabardast! Ek high-performance aur modern website business ke liye bohot zaroori hai. Yeh website kis company ya business ke liye banwani hai?" });
    }
    if (language === 'urdu') {
      return res.json({ reply: "بہترین! ایک جدید اور تیز رفتار ویب سائٹ کاروبار کی پہچان کے لیے لازمی ہے۔ یہ ویب سائٹ کس کمپنی یا کاروبار کے لیے بنوانی ہے؟" });
    }
    return res.json({ reply: "Awesome! A tailored, high-performance website is essential for building authority and driving leads. What type of business or company is this website for?" });
  }

  // Intent 4: Mobile App Scoping
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
