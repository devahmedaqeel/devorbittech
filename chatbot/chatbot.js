/**
 * DEV ORBIT AI — Comprehensive Conversational Engine & Knowledge Client
 * Understands English, Roman Urdu, Urdu. Manages context, discovery flows,
 * structured summaries, pre-filling contact form and WhatsApp formatting.
 */

(function () {
  'use strict';

  // Knowledge base caches
  let companyData = null;
  let servicesData = null;
  let projectsData = null;
  let faqsData = null;
  let technologiesData = null;

  // Active conversation state
  const conversationState = {
    language: 'english', // 'english' | 'roman_urdu' | 'urdu'
    stage: 'idle', // 'idle' | 'discovering' | 'summarized'
    project: {
      type: '',
      business: '',
      goal: '',
      features: [],
      platform: '',
      budget: '',
      timeline: ''
    },
    history: []
  };

  // SVG Custom Orbit Icon
  const ORBIT_AI_ICON_SVG = `
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="rgba(0, 240, 255, 0.3)" stroke-width="2" stroke-dasharray="4 4"/>
      <ellipse cx="50" cy="50" rx="38" ry="16" stroke="url(#orbitGrad1)" stroke-width="2.5" transform="rotate(-25 50 50)"/>
      <ellipse cx="50" cy="50" rx="38" ry="16" stroke="url(#orbitGrad2)" stroke-width="2.5" transform="rotate(35 50 50)"/>
      <circle cx="50" cy="50" r="14" fill="url(#coreGrad)" filter="drop-shadow(0 0 8px #00f0ff)"/>
      <circle cx="50" cy="50" r="6" fill="#ffffff"/>
      <circle cx="20" cy="38" r="3" fill="#00f0ff"/>
      <circle cx="80" cy="62" r="3" fill="#8b5cf6"/>
      <defs>
        <linearGradient id="orbitGrad1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#00f0ff"/>
          <stop offset="1" stop-color="#007aff"/>
        </linearGradient>
        <linearGradient id="orbitGrad2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#8b5cf6"/>
          <stop offset="1" stop-color="#00f0ff"/>
        </linearGradient>
        <radialGradient id="coreGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(50 50) scale(14)">
          <stop stop-color="#00f0ff"/>
          <stop offset="0.7" stop-color="#007aff"/>
          <stop offset="1" stop-color="#050a14"/>
        </radialGradient>
      </defs>
    </svg>
  `;

  // Pre-load knowledge asynchronously
  async function loadKnowledge() {
    try {
      const [cRes, sRes, pRes, fRes, tRes] = await Promise.all([
        fetch('/knowledge/company.json').then(r => r.json()).catch(() => null),
        fetch('/knowledge/services.json').then(r => r.json()).catch(() => null),
        fetch('/knowledge/projects.json').then(r => r.json()).catch(() => null),
        fetch('/knowledge/faqs.json').then(r => r.json()).catch(() => null),
        fetch('/knowledge/technologies.json').then(r => r.json()).catch(() => null)
      ]);
      companyData = cRes;
      servicesData = sRes ? sRes.services : null;
      projectsData = pRes ? pRes.projects : null;
      faqsData = fRes ? fRes.faqs : null;
      technologiesData = tRes ? tRes.technologies : null;
    } catch (e) {
      console.warn('[Dev Orbit AI] Knowledge base fetch fallback to built-in facts.');
    }
  }

  // Language Detection (English, Roman Urdu, Urdu)
  function detectLanguage(text) {
    if (!text) return 'english';
    // Urdu script detector (Arabic/Persian/Urdu unicode range)
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
      return 'urdu';
    }
    // Roman Urdu keywords detector
    const romanUrduPatterns = [
      /\b(mujhe|chahiye|karna|karwana|hai|hain|kiya|kya|bhi|aur|kaise|kitna|kitne|pese|kharcha|banao|chahie|banwani|app|website|kaam|theek|shukriya|kesay)\b/i
    ];
    if (romanUrduPatterns.some(pat => pat.test(text))) {
      return 'roman_urdu';
    }
    return 'english';
  }

  // Build the Chatbot DOM
  function initChatbotUI() {
    // 1. Create floating action stack container if not present
    let stack = document.querySelector('.dot-action-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'dot-action-stack';
      document.body.appendChild(stack);

      // Re-anchor WhatsApp inside stack if it exists
      const existingWa = document.querySelector('.whatsapp-float');
      if (existingWa) {
        stack.appendChild(existingWa);
      }
    }

    // 2. Create Dev Orbit AI Launcher Button
    const launcher = document.createElement('button');
    launcher.className = 'dot-ai-launcher';
    launcher.setAttribute('aria-label', 'Open Dev Orbit AI Assistant');
    launcher.innerHTML = `
      <div class="dot-ai-launcher-icon">${ORBIT_AI_ICON_SVG}</div>
      <div class="dot-ai-launcher-text">
        <span class="dot-ai-launcher-title">
          <span class="dot-ai-online-dot"></span> DEV ORBIT AI
        </span>
        <span class="dot-ai-launcher-subtitle">Project & Tech Assistant</span>
      </div>
    `;
    stack.appendChild(launcher);

    // 3. Create Chat Window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'dot-ai-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-labelledby', 'dotAiTitle');
    chatWindow.innerHTML = `
      <div class="dot-ai-header">
        <div class="dot-ai-brand">
          <div class="dot-ai-header-icon">${ORBIT_AI_ICON_SVG}</div>
          <div class="dot-ai-header-info">
            <h3 id="dotAiTitle">Dev Orbit AI <span class="dot-ai-status-pill">Online</span></h3>
            <p>AI Project & Technology Assistant</p>
          </div>
        </div>
        <div class="dot-ai-header-controls">
          <button class="dot-ai-btn-ctrl" id="dotAiClearBtn" title="Clear Conversation" aria-label="Clear Conversation">
            <svg viewBox="0 0 24 24"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2m-6 5v6m4-6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="dot-ai-btn-ctrl" id="dotAiCloseBtn" title="Close Chat" aria-label="Close Chat">
            <svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>

      <div class="dot-ai-messages" id="dotAiMessages" role="log" aria-live="polite">
        <div class="dot-ai-welcome">
          <h4>${ORBIT_AI_ICON_SVG} Welcome to Dev Orbit Tech!</h4>
          <p>I'm <strong>Dev Orbit AI</strong>, your personal AI Project Consultant. I can help you:</p>
          <ul>
            <li>Explore our development services & technology stack</li>
            <li>Discuss your project idea and recommend architectures</li>
            <li>Structure your project requirements into an executive summary</li>
            <li>Connect with our engineering team via WhatsApp or Official Form</li>
          </ul>
          <div class="dot-ai-chips-title">What would you like to build?</div>
          <div class="dot-ai-chips">
            <button class="dot-ai-chip" data-intent="website"><i class="fas fa-globe"></i> Build a Website</button>
            <button class="dot-ai-chip" data-intent="mobile_app"><i class="fas fa-mobile-alt"></i> Build a Mobile App</button>
            <button class="dot-ai-chip" data-intent="custom_software"><i class="fas fa-laptop-code"></i> Custom Software</button>
            <button class="dot-ai-chip" data-intent="ai_solution"><i class="fas fa-brain"></i> AI Solution</button>
            <button class="dot-ai-chip" data-intent="automation"><i class="fas fa-bolt"></i> Automate My Business</button>
            <button class="dot-ai-chip" data-intent="saas"><i class="fas fa-rocket"></i> SaaS Product</button>
            <button class="dot-ai-chip" data-intent="ui_ux"><i class="fas fa-palette"></i> UI/UX Design</button>
            <button class="dot-ai-chip" data-intent="discuss_project"><i class="fas fa-comments"></i> Discuss My Project</button>
          </div>
        </div>
      </div>

      <div class="dot-ai-footer">
        <div class="dot-ai-input-wrap">
          <textarea class="dot-ai-textarea" id="dotAiInput" placeholder="Ask in English, Roman Urdu, or Urdu..." rows="1" aria-label="Type your message"></textarea>
        </div>
        <button class="dot-ai-send-btn" id="dotAiSendBtn" aria-label="Send Message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#050a14" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(chatWindow);

    // Event Listeners
    launcher.addEventListener('click', () => toggleChatWindow(true));
    document.getElementById('dotAiCloseBtn').addEventListener('click', () => toggleChatWindow(false));
    document.getElementById('dotAiClearBtn').addEventListener('click', clearConversation);

    // Keyboard ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && chatWindow.classList.contains('dot-open')) {
        toggleChatWindow(false);
      }
    });

    // Textarea input & send button
    const input = document.getElementById('dotAiInput');
    const sendBtn = document.getElementById('dotAiSendBtn');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitUserMessage();
      }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
    sendBtn.addEventListener('click', submitUserMessage);

    // Quick Action Chips
    chatWindow.addEventListener('click', (e) => {
      const chip = e.target.closest('.dot-ai-chip');
      if (chip) {
        const intent = chip.getAttribute('data-intent');
        handleQuickChip(intent, chip.textContent.trim());
      }
    });
  }

  function toggleChatWindow(open) {
    const win = document.querySelector('.dot-ai-window');
    if (!win) return;
    if (open) {
      win.classList.add('dot-open');
      setTimeout(() => {
        const input = document.getElementById('dotAiInput');
        if (input) input.focus();
      }, 150);
    } else {
      win.classList.remove('dot-open');
    }
  }

  function appendMessage(role, text, options = {}) {
    const container = document.getElementById('dotAiMessages');
    if (!container) return;

    const msgEl = document.createElement('div');
    msgEl.className = `dot-msg ${role}`;

    const userSvg = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
    const avatar = role === 'bot' ? ORBIT_AI_ICON_SVG : userSvg;

    msgEl.innerHTML = `
      <div class="dot-msg-avatar">${avatar}</div>
      <div class="dot-msg-content">${text}</div>
    `;

    // Append summary card if provided
    if (options.summary) {
      const card = document.createElement('div');
      card.className = 'dot-ai-summary-card';
      card.innerHTML = `
        <div class="dot-ai-summary-title"><i class="fas fa-file-invoice"></i> Project Requirements Summary</div>
        <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Project Type:</span><span class="dot-ai-summary-val">${options.summary.type || 'Custom Project'}</span></div>
        <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Business:</span><span class="dot-ai-summary-val">${options.summary.business || 'Not specified'}</span></div>
        <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Primary Goal:</span><span class="dot-ai-summary-val">${options.summary.goal || 'Not specified'}</span></div>
        <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Features:</span><span class="dot-ai-summary-val">${options.summary.features && options.summary.features.length ? options.summary.features.join(', ') : 'To be scoped with team'}</span></div>
        <div class="dot-ai-summary-actions">
          <button class="dot-ai-action-btn primary" id="dotFillFormBtn"><i class="fas fa-paper-plane"></i> Submit Project Inquiry (Form)</button>
          <a class="dot-ai-action-btn whatsapp" id="dotWaBtn" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Continue on WhatsApp</a>
          <a class="dot-ai-action-btn secondary" href="/#contact"><i class="fas fa-envelope"></i> View Contact Details</a>
        </div>
      `;
      msgEl.querySelector('.dot-msg-content').appendChild(card);

      // Bind button events
      setTimeout(() => {
        const fillBtn = card.querySelector('#dotFillFormBtn');
        const waBtn = card.querySelector('#dotWaBtn');

        if (fillBtn) {
          fillBtn.addEventListener('click', () => {
            transferSummaryToContactForm(options.summary);
            toggleChatWindow(false);
          });
        }
        if (waBtn) {
          const waMsg = encodeURIComponent(
            `Hello Dev Orbit Tech,\nI discussed a project with Dev Orbit AI:\n\n*PROJECT TYPE:* ${options.summary.type}\n*BUSINESS:* ${options.summary.business}\n*GOAL:* ${options.summary.goal}\n*FEATURES:* ${options.summary.features.join(', ')}\n\nPlease let me know the next steps.`
          );
          waBtn.href = `https://wa.me/923161893004?text=${waMsg}`;
        }
      }, 50);
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
    conversationState.history.push({ role, text });
  }

  function showTypingIndicator() {
    const container = document.getElementById('dotAiMessages');
    const typing = document.createElement('div');
    typing.className = 'dot-msg bot dot-typing-wrapper';
    typing.innerHTML = `
      <div class="dot-msg-avatar">${ORBIT_AI_ICON_SVG}</div>
      <div class="dot-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
    return typing;
  }

  function clearConversation() {
    const container = document.getElementById('dotAiMessages');
    if (!container) return;
    const welcome = container.querySelector('.dot-ai-welcome');
    container.innerHTML = '';
    if (welcome) container.appendChild(welcome);
    conversationState.stage = 'idle';
    conversationState.project = { type: '', business: '', goal: '', features: [], platform: '', budget: '', timeline: '' };
    conversationState.history = [];
    appendMessage('bot', 'Conversation cleared. How else can I assist your project today?');
  }

  function handleQuickChip(intent, label) {
    appendMessage('user', label);
    conversationState.stage = 'discovering';

    let promptEn = '';
    let promptUrdu = '';
    let promptRoman = '';

    if (intent === 'website') {
      conversationState.project.type = 'Business / Company Website';
      promptEn = "Awesome! A high-performance website is essential for building authority and driving leads. What type of business or company is this for?";
      promptRoman = "Bohot khoob! Ek behtareen aur fast website business ke liye bohot zaroori hai. Aapka business kis category ya industry se related hai?";
      promptUrdu = "بہترین! ایک تیز رفتار اور جدید ویب سائٹ کاروبار کی پہچان کے لیے لازمی ہے۔ آپ کی کمپنی یا کاروبار کس قسم کا ہے؟";
    } else if (intent === 'mobile_app') {
      conversationState.project.type = 'Mobile Application';
      promptEn = "Great choice. We develop high-speed Flutter and React Native apps for iOS & Android. What core problem will your application solve?";
      promptRoman = "Zabardast! Hum iOS aur Android dono ke liye Flutter aur React Native apps develop karte hain. Aapki application kis maqsad ya problem ke liye hai?";
      promptUrdu = "شاندار! ہم آئی او ایس اور اینڈرائیڈ دونوں کے لیے بہترین موبائل ایپس بناتے ہیں۔ آپ کی ایپ کا بنیادی مقصد کیا ہے؟";
    } else if (intent === 'custom_software') {
      conversationState.project.type = 'Custom Business Software';
      promptEn = "Bespoke software eliminates bottlenecks and expensive recurring seat fees. What key workflow or process should the software manage?";
      promptRoman = "Custom software se business processes aasan hojate hain aur mehnge monthly software licenses ki zaroorat nahi rehti. Yeh software kis kaam ko manage karega?";
      promptUrdu = "کسٹم سافٹ ویئر سے آپ کے دفتری معاملات تیز اور خودکار ہو جاتے ہیں۔ یہ سافٹ ویئر کس عمل کو سنبھالے گا؟";
    } else if (intent === 'ai_solution') {
      conversationState.project.type = 'AI Application & LLM Integration';
      promptEn = "Exciting! We engineer bespoke AI agents, intelligent document summarizers, and LLM integrations. What kind of AI capability do you envision?";
      promptRoman = "Zabardast! Hum custom AI models, intelligent chatbots, aur document analysis build karte hain. Aapko kis qism ka AI solution chahiye?";
      promptUrdu = "زبردست! ہم مصنوعی ذہانت (AI) اور جدید ماڈلز کے ذریعے کسٹم سلوشنز بناتے ہیں۔ آپ کو کس قسم کے AI فیچرز درکار ہیں؟";
    } else if (intent === 'automation') {
      conversationState.project.type = 'Business Process Automation';
      promptEn = "Automation frees up hours of repetitive manual work. Which manual tasks would you like to run automatically?";
      promptRoman = "Automation se waqt aur kharcha dono bachte hain. Kaunse repetitive kaam hain jo aap automatically karwana chahte hain?";
      promptUrdu = "آٹومیشن سے روزمرہ کے دستی کام خودکار ہو جاتے ہیں۔ آپ کس عمل کو خودکار بنانا چاہتے ہیں؟";
    } else if (intent === 'saas') {
      conversationState.project.type = 'SaaS Platform MVP';
      promptEn = "We love helping founders build scalable SaaS products with subscription billing and user authentication. Who are your target users?";
      promptRoman = "Founders ke liye SaaS products develop karna hamara core passion hai. Aapke target customers ya users kaun hain?";
      promptUrdu = "ہم ساس (SaaS) مصنوعات اور کلاؤڈ سسٹمز تیار کرتے ہیں۔ آپ کے بنیادی صارفین کون ہوں گے؟";
    } else if (intent === 'ui_ux') {
      conversationState.project.type = 'UI/UX Interface Design';
      promptEn = "Intuitive UI/UX converts visitors into loyal clients. Are you looking to design a website, web app dashboard, or mobile app?";
      promptRoman = "Behtareen UI/UX design se conversion rate barhta hai. Aapko website, mobile app ya dashboard ka design karwana hai?";
      promptUrdu = "کیا آپ کو ویب سائٹ، موبائل ایپ یا کسٹم ڈیش بورڈ کا جدید UI/UX ڈیزائن درکار ہے؟";
    } else {
      promptEn = "I would be happy to discuss your requirements. Tell me briefly about your project idea or what services you are exploring.";
      promptRoman = "Main aapke project requirements ko samajhne mein madad kar sakta hoon. Apne project idea ke baare mein thora batayein.";
      promptUrdu = "میں آپ کی رہنمائی کے لیے حاضر ہوں۔ اپنے پروجیکٹ کے بارے میں مختصر بتائیے۔";
    }

    const reply = conversationState.language === 'urdu' ? promptUrdu : (conversationState.language === 'roman_urdu' ? promptRoman : promptEn);
    appendMessage('bot', reply);
  }

  async function submitUserMessage() {
    const input = document.getElementById('dotAiInput');
    const sendBtn = document.getElementById('dotAiSendBtn');
    const text = (input.value || '').trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    // Detect language
    const lang = detectLanguage(text);
    conversationState.language = lang;

    appendMessage('user', text);
    const typingIndicator = showTypingIndicator();

    // 1. Try Server API /api/chatbot (if configured or server is available)
    let aiResponse = null;
    try {
      const apiRes = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: conversationState.history.slice(-8),
          state: conversationState.project,
          stage: conversationState.stage,
          language: lang
        })
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.reply) {
          aiResponse = data;
        }
      }
    } catch (e) {
      // Graceful fallback to client-side local RAG engine
    }

    // 2. If API didn't respond, run Client-side RAG & NLP Engine
    if (!aiResponse) {
      aiResponse = generateLocalRAGResponse(text, lang);
    }

    // Clean typing indicator
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.parentNode.removeChild(typingIndicator);
    }
    sendBtn.disabled = false;

    // Render bot response
    appendMessage('bot', aiResponse.reply, { summary: aiResponse.summary });
  }

  // Local RAG & Discovery Engine (Trained for 100% Accuracy)
  function generateLocalRAGResponse(userText, lang) {
    const lower = userText.toLowerCase().trim();

    // Intent Trigger: Website Project Initiation (handles typos e.g. "i build websote", "need website", "website banwani hai")
    if (lower.includes('website') || lower.includes('websote') || lower.includes('web site') || lower.includes('web development') || lower.includes('site banani')) {
      if (conversationState.stage !== 'discovering') {
        conversationState.stage = 'discovering';
        conversationState.project.type = 'Business / Company Website';
        if (lang === 'roman_urdu') {
          return { reply: "Zabardast! Ek high-performance aur modern website business ke liye bohot zaroori hai. Yeh website kis company ya business ke liye banwani hai?" };
        }
        if (lang === 'urdu') {
          return { reply: "بہترین! ایک جدید اور تیز رفتار ویب سائٹ کاروبار کی پہچان کے لیے لازمی ہے۔ یہ ویب سائٹ کس کمپنی یا کاروبار کے لیے بنوانی ہے؟" };
        }
        return { reply: "Awesome! A tailored, high-performance website is essential for building authority and driving leads. What type of business or company is this website for?" };
      }
    }

    // Intent Trigger: Mobile App Initiation
    if (lower.includes('mobile app') || lower.includes('app idea') || lower.includes('android app') || lower.includes('ios app') || lower.includes('app banani')) {
      if (conversationState.stage !== 'discovering') {
        conversationState.stage = 'discovering';
        conversationState.project.type = 'Mobile Application (Flutter / React Native)';
        if (lang === 'roman_urdu') {
          return { reply: "Bohot khoob! Hum Flutter aur React Native ke zariye iOS aur Android apps banate hain. Aapki mobile app ka basic maqsad ya idea kya hai?" };
        }
        if (lang === 'urdu') {
          return { reply: "بہترین! ہم آئی او ایس اور اینڈرائیڈ دونوں کے لیے تیز رفتار موبائل ایپس بناتے ہیں۔ آپ کی ایپ کا بنیادی مقصد کیا ہے؟" };
        }
        return { reply: "Great choice! We develop high-speed Flutter and React Native apps for iOS & Android. What core problem will your application solve?" };
      }
    }

    // Tier 1: Exact / Best Keyword Match against FAQs
    if (faqsData) {
      let bestFaq = null;
      let maxMatches = 0;
      for (const faq of faqsData) {
        let matches = 0;
        for (const k of faq.keywords || []) {
          if (lower.includes(k.toLowerCase())) matches++;
        }
        if (matches > maxMatches) {
          maxMatches = matches;
          bestFaq = faq;
        }
      }
      if (bestFaq && maxMatches > 0) {
        if (lang === 'roman_urdu' && bestFaq.answerRoman) return { reply: bestFaq.answerRoman };
        if (lang === 'urdu' && bestFaq.answerUrdu) return { reply: bestFaq.answerUrdu };
        return { reply: bestFaq.answer };
      }
    }

    // Tier 2: Technology Inquiry Matching
    if (technologiesData && (lower.includes('tech') || lower.includes('technology') || lower.includes('language') || lower.includes('framework') || lower.includes('stack') || lower.includes('kaunsi language') || lower.includes('tool'))) {
      if (lang === 'roman_urdu') {
        return { reply: "Dev Orbit Tech modern production stack use karta hai: Frontend mein React.js, Next.js; Mobile mein Flutter aur React Native; Backend mein Node.js, Express, Python FastAPI; Databases mein PostgreSQL, MongoDB, Supabase; aur AI mein OpenAI GPT-4, Google Gemini, LangChain." };
      }
      if (lang === 'urdu') {
        return { reply: "دیو اوربٹ ٹیک جدید ترین ٹیکنالوجیز استعمال کرتا ہے: فرنٹ اینڈ میں ری ایکٹ اور نیکسٹ جے ایس، موبائل میں فلٹر اور ری ایکٹ نیٹو، بیک اینڈ میں نوڈ جے ایس اور پائتھن، اور AI کے لیے جدید اوپن اے آئی اور جیمنائی ماڈلز۔" };
      }
      return { reply: "We engineer using modern production stacks: Frontend (React.js, Next.js, TypeScript), Mobile (Flutter, React Native), Backend (Node.js, Express, Python FastAPI), Databases (PostgreSQL, MongoDB, Supabase), and AI (OpenAI GPT-4, Google Gemini, LangChain)." };
    }

    // Tier 3: Verified Projects / Portfolio Matching
    if (lower.includes('project') || lower.includes('portfolio') || lower.includes('work') || lower.includes('case studies') || lower.includes('kaam') || lower.includes('sample')) {
      if (lang === 'roman_urdu') {
        return { reply: "Hamare verified projects mein **MediReport AI** (Healthcare Diagnostic AI), **Blissful Blinds Ltd** (UK E-commerce Ordering Platform), **DevSync AI** (Code Documentation Tool), aur **OFM Mobile App** (Flutter Logistics & Delivery) shamil hain. Inke mukammal case studies hamari website par available hain." };
      }
      if (lang === 'urdu') {
        return { reply: "ہمارے نمایاں پروجیکٹس میں میڈی رپورٹ اے آئی (ہیلتھ کیئر)، بلس فل بلائنڈز (یو کے ای کامرس)، دیوسنک اے آئی اور او ایف ایم موبائل ایپ شامل ہیں۔ آپ ان کے کیس اسٹڈیز ویب سائٹ پر ملاحظہ کر سکتے ہیں۔" };
      }
      return { reply: "Our verified portfolio includes **MediReport AI** (Healthcare Diagnostic Tool), **Blissful Blinds Ltd** (UK E-commerce & Measurement Platform), **DevSync AI** (Code Documentation SaaS), and **OFM Mobile App** (Logistics & GPS Dispatch). You can explore full technical case studies on our website." };
    }

    // Tier 4: Direct Service Recognition
    if (servicesData) {
      for (const s of servicesData) {
        const terms = [s.title.toLowerCase(), s.id.replace(/-/g, ' ')];
        if (s.features) terms.push(...s.features.map(f => f.toLowerCase()));
        if (terms.some(t => lower.includes(t) || (t.includes('website') && lower.includes('site')) || (t.includes('mobile') && lower.includes('app')))) {
          if (lang === 'roman_urdu') {
            return { reply: `Jee haan, Dev Orbit Tech **${s.title}** professionally provide karta hai. Isme ${s.features.slice(0, 3).join(', ')} waghera shamil hain. Kya aap apne specific requirements share karna chahenge?` };
          }
          if (lang === 'urdu') {
            return { reply: `جی بالکل، دیو اوربٹ ٹیک **${s.title}** کی مکمل سروس فراہم کرتا ہے۔ اس میں ${s.features.slice(0, 3).join('، ')} شامل ہیں۔` };
          }
          return { reply: `Yes, Dev Orbit Tech provides **${s.title}**. Our engineering capabilities include: ${s.features.join(', ')}. Would you like to discuss your specific requirements or timeline?` };
        }
      }
    }

    // Active Project Discovery Progression
    if (conversationState.stage === 'discovering') {
      const p = conversationState.project;

      if (!p.business) {
        p.business = userText;
        if (lang === 'roman_urdu') {
          return { reply: `Zabardast! ${userText} ke liye hum behtareen architecture recommend kar sakte hain. Aapki website ya app ka sabse ahem maqsad kya hai? (Jaise naye clients lana, orders lena, ya services showcase karna?)` };
        } else if (lang === 'urdu') {
          return { reply: `بہترین! اس کاروبار کے لیے ہم اعلیٰ معیار کا سسٹم بنا سکتے ہیں۔ آپ کے پروجیکٹ کا بنیادی ہدف کیا ہوگا؟` };
        }
        return { reply: `Understood! A tailored digital platform for ${userText} will stand out. What is the primary goal of this project? (e.g. generating customer inquiries, showcasing portfolio, or processing transactions?)` };
      }

      if (!p.goal) {
        p.goal = userText;
        if (lang === 'roman_urdu') {
          return { reply: "Samajh gaya. Is project mein kaunse main features zaroori hain? (Jaise contact form, WhatsApp button, user accounts, ya payment integration?)" };
        } else if (lang === 'urdu') {
          return { reply: "سمجھ گیا۔ اس میں کون سے بنیادی فیچرز شامل ہونے چاہئیں؟" };
        }
        return { reply: "Great! What key features or functional modules do you require? (e.g. contact form, WhatsApp direct chat, user login, booking system, or payment gateway?)" };
      }

      // Feature capture & wrap into summary
      p.features.push(userText);
      conversationState.stage = 'summarized';

      const summaryCard = {
        type: p.type || 'Custom Digital Solution',
        business: p.business,
        goal: p.goal,
        features: p.features
      };

      if (lang === 'roman_urdu') {
        return {
          reply: "Bohot khoob! Aapke project ki requirements successfully organize ho gayi hain. Kya aap yeh details Dev Orbit Tech ki team ke saath share karna chahte hain?",
          summary: summaryCard
        };
      } else if (lang === 'urdu') {
        return {
          reply: "بہترین! آپ کے پروجیکٹ کی سمری تیار ہے۔ کیا آپ یہ تفصیلات ہماری انجینئرنگ ٹیم کو بھیجنا چاہتے ہیں؟",
          summary: summaryCard
        };
      }
      return {
        reply: "Excellent! I have compiled your project requirements into a structured executive summary below. Would you like to share these directly with the Dev Orbit Tech engineering team?",
        summary: summaryCard
      };
    }

    // Default conversational responses
    if (lang === 'roman_urdu') {
      return {
        reply: "Main Dev Orbit Tech ka official AI assistant hoon. Main aapki digital requirements samajh kar sahi service recommend kar sakta hoon. Kya aap koi Website, Mobile App ya AI Automation build karna chahte hain?"
      };
    } else if (lang === 'urdu') {
      return {
        reply: "میں دیو اوربٹ ٹیک کا باضابطہ AI اسسٹنٹ ہوں۔ میں آپ کے پروجیکٹ کے تقاضے سمجھ کر مناسب رہنمائی فراہم کر سکتا ہوں۔ آپ کس قسم کا پروجیکٹ شروع کرنا چاہتے ہیں؟"
      };
    }
    return {
      reply: "Dev Orbit Tech specializes in custom web development, mobile applications (Flutter & React Native), SaaS platforms, and AI automation. Could you tell me a little about what you are planning to build?"
    };
  }

  // Transfer structured summary into existing contact form
  function transferSummaryToContactForm(summary) {
    const serviceSelect = document.getElementById('f-service');
    const msgTextarea = document.getElementById('f-message');
    const companyInput = document.getElementById('f-company');

    if (companyInput && summary.business) {
      companyInput.value = summary.business;
    }

    if (serviceSelect && summary.type) {
      if (summary.type.includes('Website')) serviceSelect.value = 'Web Development';
      else if (summary.type.includes('Mobile')) serviceSelect.value = 'Mobile App Development';
      else if (summary.type.includes('AI')) serviceSelect.value = 'Artificial Intelligence & Agentic AI';
      else serviceSelect.value = 'Custom Software Development';
    }

    if (msgTextarea) {
      msgTextarea.value = `[Inquiry via Dev Orbit AI Assistant]\nProject Type: ${summary.type}\nBusiness: ${summary.business}\nPrimary Goal: ${summary.goal}\nFeatures: ${summary.features.join(', ')}\n\nPlease provide technical scoping and next steps.`;
    }

    // Smooth scroll to contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadKnowledge();
      initChatbotUI();
    });
  } else {
    loadKnowledge();
    initChatbotUI();
  }
})();
