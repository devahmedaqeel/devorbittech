/**
 * DEV ORBIT AI — Comprehensive Conversational Engine & Knowledge Client
 * Features:
 * - Official Icons8 3D Fluency Robot Mascot with smooth floating animation & glowing platform
 * - Ultra-sleek branded floating launcher pill with radar pulse & live status
 * - 2x2 Bento service card track selector
 * - Fast multi-lingual NLP (English, Roman Urdu, Urdu)
 * - Gemini API integration with local verified RAG fallback
 * - Auto-transfer to contact form & formatted WhatsApp handoff
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

  // 3D Fluency Robot Mascot HTML Generator (Official Icons8 3D Fluency Robot)
  function getRobotHtml(type = 'launcher') {
    if (type === 'hero') {
      return `
        <div class="dot-ai-robot-hero">
          <img src="/images/icons8-robot-3d-fluency-512.png" alt="Dev Orbit AI Mascot" class="dot-ai-robot-img" width="80" height="80" />
          <div class="dot-ai-robot-platform"></div>
          <div class="dot-ai-robot-shadow"></div>
        </div>
      `;
    }
    if (type === 'mini') {
      return `
        <div class="dot-ai-robot-mini">
          <img src="/images/icons8-robot-3d-fluency-120.png" alt="Orbit Bot" class="dot-ai-robot-img" width="32" height="32" />
        </div>
      `;
    }
    // Default: launcher avatar
    return `
      <div class="dot-ai-robot-avatar">
        <img src="/images/icons8-robot-3d-fluency-120.png" alt="Dev Orbit Robot" class="dot-ai-robot-img" width="46" height="46" />
        <div class="dot-ai-robot-shadow"></div>
      </div>
    `;
  }

  // Pure Web Audio API micro-feedback sound
  function playAudioChime(type = 'send') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (type === 'send') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.07);
      } else {
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.09);
      }
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
  }

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
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) {
      return 'urdu';
    }
    const romanUrduPatterns = [
      /\b(mujhe|chahiye|karna|karwana|hai|hain|kiya|kya|bhi|aur|kaise|kitna|kitne|pese|kharcha|banao|chahie|banwani|app|website|kaam|theek|shukriya|kesay|bhai|kuch)\b/i
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

    // 2. Create Dev Orbit AI Clean 3D Robot Assistant Trigger (NO BOX)
    const launcher = document.createElement('button');
    launcher.className = 'dot-ai-launcher';
    launcher.setAttribute('aria-label', 'Open Dev Orbit AI Assistant');
    launcher.innerHTML = `
      <div class="dot-ai-robot-trigger">
        <img src="/images/icons8-robot-3d-fluency-512.png" alt="Dev Orbit AI Robot" class="dot-ai-robot-trigger-img" width="70" height="70" />
        <div class="dot-ai-robot-shadow"></div>
      </div>
      <span class="dot-ai-trigger-label">AI Assistant</span>
    `;
    stack.appendChild(launcher);

    // 3. Create Chat Window — Masterpiece Design with 3D Fluency Robot Hero
    const chatWindow = document.createElement('div');
    chatWindow.className = 'dot-ai-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-labelledby', 'dotAiTitle');
    chatWindow.innerHTML = `
      <div class="dot-ai-header">
        <div class="dot-ai-brand">
          <div class="dot-ai-header-avatar">
            ${getRobotHtml('mini')}
            <span class="dot-ai-header-online"></span>
          </div>
          <div class="dot-ai-header-info">
            <div class="dot-ai-header-title-row">
              <h3 id="dotAiTitle">Dev Orbit AI</h3>
              <span class="dot-ai-tag">PRO</span>
            </div>
            <p><span class="dot-ai-status-indicator"></span>Active Consultant · Online 24/7</p>
          </div>
        </div>
        <div class="dot-ai-header-actions">
          <button class="dot-ai-hdr-btn" id="dotAiClearBtn" title="Reset Conversation" aria-label="Reset Conversation">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 4v5h5M16 16v-5h-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6.5 15.5A7 7 0 105 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="dot-ai-hdr-btn dot-ai-hdr-close" id="dotAiCloseBtn" title="Minimize Chat" aria-label="Minimize Chat">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M15 5l-10 10M5 5l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="dot-ai-body" id="dotAiMessages" role="log" aria-live="polite">
        <div class="dot-ai-welcome">
          <div class="dot-ai-w-avatar">
            ${getRobotHtml('hero')}
          </div>
          <h4 class="dot-ai-w-greeting">How can we help your project? 👋</h4>
          <p class="dot-ai-w-intro">I'm <strong>Dev Orbit AI</strong>, your project consultant. Tell me what you're looking to build or pick a track below:</p>

          <!-- 2x2 Bento Service Cards Grid -->
          <div class="dot-ai-bento-grid">
            <button class="dot-ai-bento-card" data-intent="website">
              <div class="dot-ai-bento-icon"><i class="fas fa-globe"></i></div>
              <div class="dot-ai-bento-content">
                <div class="dot-ai-bento-title">Web Applications</div>
                <div class="dot-ai-bento-desc">SaaS, Portals &amp; Custom Web</div>
              </div>
              <span class="dot-ai-bento-arrow">→</span>
            </button>

            <button class="dot-ai-bento-card" data-intent="mobile_app">
              <div class="dot-ai-bento-icon"><i class="fas fa-mobile-alt"></i></div>
              <div class="dot-ai-bento-content">
                <div class="dot-ai-bento-title">Mobile Apps</div>
                <div class="dot-ai-bento-desc">Flutter &amp; React Native</div>
              </div>
              <span class="dot-ai-bento-arrow">→</span>
            </button>

            <button class="dot-ai-bento-card" data-intent="ai_solution">
              <div class="dot-ai-bento-icon"><i class="fas fa-brain"></i></div>
              <div class="dot-ai-bento-content">
                <div class="dot-ai-bento-title">AI &amp; Automation</div>
                <div class="dot-ai-bento-desc">LLMs, Agents &amp; RAG Pipelines</div>
              </div>
              <span class="dot-ai-bento-arrow">→</span>
            </button>

            <button class="dot-ai-bento-card" data-intent="custom_software">
              <div class="dot-ai-bento-icon"><i class="fas fa-laptop-code"></i></div>
              <div class="dot-ai-bento-content">
                <div class="dot-ai-bento-title">Custom Software</div>
                <div class="dot-ai-bento-desc">ERP, CRM &amp; Business Tools</div>
              </div>
              <span class="dot-ai-bento-arrow">→</span>
            </button>
          </div>

          <!-- Quick Action Chips -->
          <div class="dot-ai-quick-chips">
            <button class="dot-ai-chip" data-intent="cost_calculator"><i class="fas fa-calculator"></i> Estimate Cost</button>
            <button class="dot-ai-chip" data-intent="fyp_help"><i class="fas fa-graduation-cap"></i> FYP &amp; Thesis</button>
            <button class="dot-ai-chip" data-intent="tech_stack"><i class="fas fa-layer-group"></i> Tech Stack</button>
            <button class="dot-ai-chip" data-intent="whatsapp_team"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</button>
          </div>
        </div>
      </div>

      <div class="dot-ai-footer">
        <div class="dot-ai-input-wrapper">
          <span class="dot-ai-sparkle-icon" title="AI Assistant">✨</span>
          <textarea class="dot-ai-textarea" id="dotAiInput" placeholder="Ask about projects, pricing, tech stack..." rows="1" aria-label="Type your message"></textarea>
          <button class="dot-ai-send-btn" id="dotAiSendBtn" aria-label="Send Message" title="Send">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M3.5 10h13M10.5 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="dot-ai-footer-note">
          <span>⚡ Powered by Dev Orbit AI &amp; Gemini Engine</span>
        </div>
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

    // Click delegation for Bento Cards, Chips & Suggestions
    chatWindow.addEventListener('click', (e) => {
      const chip = e.target.closest('.dot-ai-chip');
      if (chip) {
        const intent = chip.getAttribute('data-intent');
        handleQuickChip(intent, chip.textContent.trim());
        return;
      }
      const bento = e.target.closest('.dot-ai-bento-card');
      if (bento) {
        const intent = bento.getAttribute('data-intent');
        const title = bento.querySelector('.dot-ai-bento-title');
        handleQuickChip(intent, title ? title.textContent.trim() : bento.textContent.trim());
        return;
      }
      const suggest = e.target.closest('.dot-ai-suggest');
      if (suggest) {
        const intent = suggest.getAttribute('data-intent');
        const title = suggest.querySelector('.dot-ai-suggest-title');
        handleQuickChip(intent, title ? title.textContent.trim() : suggest.textContent.trim());
      }
    });
  }

  function toggleChatWindow(open) {
    const win = document.querySelector('.dot-ai-window');
    if (!win) return;
    if (open) {
      win.classList.add('dot-open');
      playAudioChime('send');
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
    const avatar = role === 'bot' ? getRobotHtml('mini') : userSvg;

    msgEl.innerHTML = `
      <div class="dot-msg-avatar">${avatar}</div>
      <div class="dot-msg-content">${formatMarkdown(text)}</div>
    `;

    // Append structured summary card if provided
    if (options.summary) {
      const card = document.createElement('div');
      card.className = 'dot-ai-summary-card';
      card.innerHTML = `
        <div class="dot-ai-summary-header">
          <div class="dot-ai-summary-title"><i class="fas fa-file-invoice"></i> Project Requirements Summary</div>
        </div>
        <div class="dot-ai-summary-table">
          <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Project Type:</span><span class="dot-ai-summary-val">${options.summary.type || 'Custom Project'}</span></div>
          <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Business:</span><span class="dot-ai-summary-val">${options.summary.business || 'Not specified'}</span></div>
          <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Primary Goal:</span><span class="dot-ai-summary-val">${options.summary.goal || 'Not specified'}</span></div>
          <div class="dot-ai-summary-row"><span class="dot-ai-summary-label">Key Features:</span><span class="dot-ai-summary-val">${options.summary.features && options.summary.features.length ? options.summary.features.join(', ') : 'To be scoped with team'}</span></div>
        </div>
        <div class="dot-ai-summary-actions">
          <button class="dot-ai-action-btn primary" id="dotFillFormBtn"><i class="fas fa-paper-plane"></i> Submit Project Inquiry (Form)</button>
          <a class="dot-ai-action-btn whatsapp" id="dotWaBtn" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> Continue on WhatsApp</a>
          <button class="dot-ai-action-btn secondary" id="dotCopyScopeBtn"><i class="fas fa-copy"></i> Copy Project Brief</button>
        </div>
      `;
      msgEl.querySelector('.dot-msg-content').appendChild(card);

      // Bind button events
      setTimeout(() => {
        const fillBtn = card.querySelector('#dotFillFormBtn');
        const waBtn = card.querySelector('#dotWaBtn');
        const copyBtn = card.querySelector('#dotCopyScopeBtn');

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
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const brief = `[Dev Orbit Tech Project Brief]\nType: ${options.summary.type}\nBusiness: ${options.summary.business}\nGoal: ${options.summary.goal}\nFeatures: ${options.summary.features.join(', ')}`;
            navigator.clipboard.writeText(brief).then(() => {
              copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied to Clipboard!';
              setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Project Brief';
              }, 2000);
            });
          });
        }
      }, 50);
    }

    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
    conversationState.history.push({ role, text });
  }

  // Format basic markdown elements for elite typography
  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,240,255,0.1);color:#00f0ff;padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
      .replace(/\n/g, '<br/>');
  }

  function showTypingIndicator() {
    const container = document.getElementById('dotAiMessages');
    const typing = document.createElement('div');
    typing.className = 'dot-msg bot dot-typing-wrapper';
    typing.innerHTML = `
      <div class="dot-msg-avatar">${getRobotHtml('mini')}</div>
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
    appendMessage('bot', 'Conversation refreshed. How else can I assist your project today?');
  }

  function handleQuickChip(intent, label) {
    appendMessage('user', label);
    playAudioChime('send');
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
      promptUrdu = "کسٹم سافٹ ویئر سے آپ کے دفتری معاملات تیز اور خودکار ہو جاتے ہیں۔ یہ سافٹ ویئر کس عمل کو سنبھالے گیا؟";
    } else if (intent === 'ai_solution') {
      conversationState.project.type = 'AI Application & LLM Integration';
      promptEn = "Exciting! We engineer bespoke AI agents, intelligent document summarizers, and LLM integrations. What kind of AI capability do you envision?";
      promptRoman = "Zabardast! Hum custom AI models, intelligent chatbots, aur document analysis build karte hain. Aapko kis qism ka AI solution chahiye?";
      promptUrdu = "زبردست! ہم مصنوعی ذہانت (AI) اور جدید ماڈلز کے ذریعے کسٹم سلوشنز بناتے ہیں۔ آپ کو کس قسم کے AI فیچرز درکار ہیں؟";
    } else if (intent === 'cost_calculator') {
      promptEn = "Project estimates depend on scope, platforms (Web/Mobile), and timeline. What are you looking to build, and do you have a rough budget or timeline in mind?";
      promptRoman = "Project ka kharcha features aur platform par depend karta hai. Aap kis qism ka system build karwana chahte hain aur aapka approximate budget kya hai?";
      promptUrdu = "پروجیکٹ کی لاگت فیچرز اور مطلوبہ وقت پر منحصر ہوتی ہے۔ آپ کیا بنوانا چاہتے ہیں تاکہ ہم مناسب تخمینہ پیش کر سکیں؟";
    } else if (intent === 'fyp_help') {
      promptEn = "Under Engr Ahmed Aqeel's mentorship, Dev Orbit Tech guides students in cutting-edge Final Year Projects (AI, Healthcare, Web & Mobile Apps). What topic or domain is your FYP in?";
      promptRoman = "Engr Ahmed Aqeel ki zer-e-nigraani Dev Orbit Tech FYP students ko complete guidance aur development support deta hai. Aapka FYP topic ya domain kya hai?";
      promptUrdu = "انجینئر احمد عقیل کی رہنمائی میں دیو اوربٹ ٹیک طلباء کو ایف وائی پی (Final Year Projects) میں رہنمائی فراہم کرتا ہے۔ آپ کا پروجیکٹ کس شعبے سے متعلق ہے؟";
    } else if (intent === 'tech_stack') {
      promptEn = "We engineer using modern production stacks: **React.js, Next.js, Flutter, React Native, Node.js, Python FastAPI, PostgreSQL, Supabase**, and **Gemini/GPT-4 AI**. Which stack do you prefer?";
      promptRoman = "Hamara core production stack: React/Next.js, Flutter, Node.js, Python FastAPI, PostgreSQL, aur Gemini/GPT-4 AI hai. Kya aapko kisi specific technology mein kaam karwana hai?";
      promptUrdu = "ہمارا بنیادی اسٹیک ری ایکٹ، نیکسٹ جے ایس، فلٹر، نوڈ جے ایس، پائتھن، اور جدید AI ماڈلز پر مشتمل ہے۔";
    } else if (intent === 'whatsapp_team') {
      const waMsg = encodeURIComponent("Hello Dev Orbit Tech, I want to discuss a new software project.");
      window.open(`https://wa.me/923161893004?text=${waMsg}`, '_blank');
      promptEn = "Opening WhatsApp to connect directly with Engr Ahmed Aqeel! You can also continue chatting right here.";
      promptRoman = "WhatsApp open ho raha hai jahan aap direct Engr Ahmed Aqeel se rabta kar sakte hain. Aap yahan bhi sawal pooch sakte hain.";
      promptUrdu = "واٹس ایپ کھولا جا رہا ہے تاکہ آپ براہ راست بات چیت کر سکیں۔ آپ یہاں بھی رابطہ جاری رکھ سکتے ہیں۔";
    } else {
      promptEn = "I would be happy to discuss your requirements. Tell me briefly about your project idea or what services you are exploring.";
      promptRoman = "Main aapke project requirements ko samajhne mein madad kar sakta hoon. Apne project idea ke baare mein thora batayein.";
      promptUrdu = "میں آپ کی رہنمائی کے لیے حاضر ہوں۔ اپنے پروجیکٹ کے بارے میں مختصر بتائیے۔";
    }

    const reply = conversationState.language === 'urdu' ? promptUrdu : (conversationState.language === 'roman_urdu' ? promptRoman : promptEn);
    setTimeout(() => {
      appendMessage('bot', reply);
      playAudioChime('receive');
    }, 200);
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
    playAudioChime('send');
    const typingIndicator = showTypingIndicator();

    // 1. Try Server API /api/chatbot
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
    playAudioChime('receive');
  }

  // Local RAG & Discovery Engine
  function generateLocalRAGResponse(userText, lang) {
    const lower = userText.toLowerCase().trim();

    // Intent Trigger: Website Project Initiation
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
