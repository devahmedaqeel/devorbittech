const API_BASE = '';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Background (Three.js 3D Cyber Globe & Floating Constellation) ──
     Decorative only, so it starts after the page has painted and the main thread is idle;
     WebGL setup and shader compilation would otherwise delay the first screen on phones. */
  function startWhenIdle(fn) {
    const go = () => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 200);
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }
  startWhenIdle(function initBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas || !window.THREE) return;

    // Phones/tablets get a lighter scene: fewer particles, 1x resolution, no antialiasing, 30fps cap
    const isMobile = window.matchMedia('(max-width: 991px), (pointer: coarse)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: isMobile ? 'low-power' : 'default' });
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    // 1. 3D Particle Constellation
    const COUNT = isMobile ? 600 : 1800;
    const pos   = new Float32Array(COUNT * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 35;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo,
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.035, transparent: true, opacity: 0.75 })
    );
    scene.add(stars);

    // 2. 3D Cyber Globe (Wireframe Sphere + Vertex Nodes)
    const globeGeo = new THREE.IcosahedronGeometry(2.4, isMobile ? 2 : 3);
    const globeMat = new THREE.MeshBasicMaterial({ color: 0x007aff, wireframe: true, transparent: true, opacity: 0.12 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    const pointsMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.04, transparent: true, opacity: 0.6 });
    const globePoints = new THREE.Points(globeGeo, pointsMat);
    scene.add(globePoints);

    // 3. Dual 3D Torus Orbit Rings
    const torusGeo1 = new THREE.TorusGeometry(3.2, 0.015, 16, 100);
    const ring1 = new THREE.Mesh(torusGeo1, new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25 }));
    
    const torusGeo2 = new THREE.TorusGeometry(4.0, 0.015, 16, 100);
    const ring2 = new THREE.Mesh(torusGeo2, new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.2 }));
    ring2.rotation.x = Math.PI / 2.5;

    scene.add(ring1, ring2);

    let targetX = 0, targetY = 0;
    if (!isMobile) {
      document.addEventListener('mousemove', (e) => {
        targetX = (e.clientX / window.innerWidth  - 0.5) * 0.8;
        targetY = (e.clientY / window.innerHeight - 0.5) * 0.8;
      }, { passive: true });
    }

    // Rotation speeds are per 60fps frame; scale by elapsed time so a 30fps cap keeps the same speed
    const frameMs = isMobile ? 1000 / 30 : 0;
    let last = 0, rafId = 0;
    function step(k) {
      stars.rotation.y += 0.0004 * k;
      stars.rotation.x += 0.0002 * k;
      globe.rotation.y += 0.0015 * k;
      globe.rotation.x += 0.0008 * k;
      globePoints.rotation.y += 0.0015 * k;
      globePoints.rotation.x += 0.0008 * k;
      ring1.rotation.z += 0.002 * k;  ring1.rotation.x += 0.001 * k;
      ring2.rotation.z -= 0.0015 * k; ring2.rotation.y += 0.0012 * k;
      camera.position.x += (targetX  - camera.position.x) * 0.04;
      camera.position.y += (-targetY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    function animate(now) {
      rafId = requestAnimationFrame(animate);
      if (frameMs && now - last < frameMs - 2) return;
      const k = last ? Math.min((now - last) / (1000 / 60), 4) : 1;
      last = now;
      step(k);
    }
    function start() { if (!rafId && !reduceMotion) { last = 0; rafId = requestAnimationFrame(animate); } }
    function stop()  { cancelAnimationFrame(rafId); rafId = 0; }

    step(1); // draw one frame immediately (and the only frame when reduced motion is on)
    canvas.classList.add('is-ready'); // fades in (see #bgCanvas in style.css)
    start();
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    // Mobile browsers fire resize when the address bar shows/hides; only re-size on real width changes
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      if (isMobile && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if (!rafId) step(0);
    });
  });


  /* ── Custom cursor (desktop only) ── */
  (function initCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const dot   = document.getElementById('cursor');
    const trail = document.getElementById('cursorTrail');
    if (!dot || !trail) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top  = my + 'px';
    });

    (function tickTrail() {
      tx += (mx - tx) * 0.12;
      ty += (my - ty) * 0.12;
      trail.style.left = tx + 'px';
      trail.style.top  = ty + 'px';
      requestAnimationFrame(tickTrail);
    })();

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .service-card, .why-card, .project-card, .process-card, .tech-card, .testimonial-card, input, select, textarea, .pill')) {
        dot.style.width = '20px'; dot.style.height = '20px';
        trail.style.width = '48px'; trail.style.height = '48px';
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .service-card, .why-card, .project-card, .process-card, .tech-card, .testimonial-card, input, select, textarea, .pill')) {
        dot.style.width = '12px'; dot.style.height = '12px';
        trail.style.width = '32px'; trail.style.height = '32px';
      }
    });
  })();


  /* ── Navbar & Mobile Hamburger Menu ── */
  let lastMobileMenuToggle = 0;
  window.toggleMobileMenu = function(e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastMobileMenuToggle < 300) return; // Prevent double-triggering on mobile touch
    lastMobileMenuToggle = now;

    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    if (!navLinks || !hamburger) return;

    window.setMobileMenu(!navLinks.classList.contains('open'));
  };

  // Single source of truth for the mobile menu state (class, ARIA, scroll lock)
  window.setMobileMenu = function(open, returnFocus) {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    if (!navLinks || !hamburger) return;
    navLinks.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
    if (!open && returnFocus) hamburger.focus();
  };

  (function initNavbar() {
    const navbar    = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    const links     = document.querySelectorAll('.nav-link');
    const sections  = document.querySelectorAll('section[id]');

    // Section offsets are cached (reading offsetTop on every scroll forces layout); refreshed on resize/load
    let offsets = [];
    function measure() { offsets = Array.from(sections, (s) => [s.id, s.offsetTop]); }
    let lastCurrent = null, ticking = false;
    function update() {
      ticking = false;
      const y = window.scrollY;
      if (navbar) navbar.classList.toggle('scrolled', y > 40);
      let current = '';
      for (const [id, top] of offsets) if (y >= top - 140) current = id;
      if (current === lastCurrent) return;
      lastCurrent = current;
      links.forEach((l) => {
        const isCurrent = l.getAttribute('href') === `#${current}`;
        l.classList.toggle('active', isCurrent);
        if (isCurrent) l.setAttribute('aria-current', 'location');
        else l.removeAttribute('aria-current');
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    function remeasure() { measure(); lastCurrent = null; update(); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', remeasure);
    let rt = 0; // content that loads later (GitHub projects, images) changes section offsets
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(remeasure, 150); }).observe(document.body);
    else window.addEventListener('resize', remeasure, { passive: true });
    measure();
    update();

    if (hamburger) {
      hamburger.addEventListener('click', function(e) {
        window.toggleMobileMenu(e);
      });
      hamburger.addEventListener('touchstart', function(e) {
        window.toggleMobileMenu(e);
      }, { passive: true });
    }

    links.forEach((l) => {
      l.addEventListener('click', () => window.setMobileMenu(false));
    });

    document.addEventListener('click', function(e) {
      if (navLinks && navLinks.classList.contains('open') && !e.target.closest('.navbar')) {
        window.setMobileMenu(false);
      }
    });

    // Escape closes the menu and returns focus to the toggle
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
        window.setMobileMenu(false, true);
      }
    });

    // Tabbing out of the open menu closes it
    if (navbar) {
      navbar.addEventListener('focusout', function(e) {
        if (navLinks && navLinks.classList.contains('open') && e.relatedTarget && !navbar.contains(e.relatedTarget)) {
          window.setMobileMenu(false);
        }
      });
    }

    // Leaving the mobile breakpoint with the menu open must not keep the page scroll-locked
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function(mq) {
      if (mq.matches) window.setMobileMenu(false);
    });
  })();


  /* ── Scroll hint (auto-hide) ── */
  (function initScrollHint() {
    const hint = document.getElementById('scrollHint');
    if (!hint) return;
    function check() { hint.classList.toggle('hide', window.scrollY > 80); }
    window.addEventListener('scroll', check, { passive: true });
    check();
  })();


  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      // Sections below the fold use content-visibility, so the ones passed on the way render during the
      // scroll and can shift the target slightly; once scrolling stops, line it up exactly.
      const settle = () => {
        const want = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (Math.abs(target.getBoundingClientRect().top - want) > 4) target.scrollIntoView({ behavior: 'instant' });
      };
      if ('onscrollend' in window) window.addEventListener('scrollend', settle, { once: true });
      else setTimeout(settle, 900);
    });
  });


  /* ── Hero typewriter ── */
  (function initTypewriter() {
    const el = document.getElementById('typeCode');
    if (!el) return;

    const lines = [
      `<span style="color:#7dd3fc">const</span> <span style="color:#a5f3fc">devOrbitTech</span> = {`,
      `&nbsp;&nbsp;company:  <span style="color:#86efac">"Dev Orbit Tech"</span>,`,
      `&nbsp;&nbsp;founder:  <span style="color:#86efac">"Engr. Ahmed Aqeel"</span>,`,
      `&nbsp;&nbsp;services: [<span style="color:#86efac">"AI"</span>, <span style="color:#86efac">"Web"</span>, <span style="color:#86efac">"Mobile Apps"</span>],`,
      `&nbsp;&nbsp;mission:  <span style="color:#86efac">"Empower Innovators"</span>,`,
      `&nbsp;&nbsp;status:   <span style="color:#fde047">"🚀 Code. Create. Innovate."</span>`,
      `};`,
    ];

    const done = [];
    let li = 0, ci = 0;

    function strip(html) { return html.replace(/<[^>]+>/g, ''); }
    function sliceHTML(html, n) {
      let vis = 0, out = '', i = 0;
      while (i < html.length && vis < n) {
        if (html[i] === '<') {
          const e = html.indexOf('>', i);
          if (e === -1) break;
          out += html.slice(i, e + 1); i = e + 1;
        } else { out += html[i++]; vis++; }
      }
      return out;
    }

    function tick() {
      if (li >= lines.length) return;
      const line  = lines[li];
      const total = strip(line).length;
      if (ci <= total) {
        el.innerHTML = [...done, sliceHTML(line, ci) + '<span class="cursor-blink">|</span>'].join('<br>');
        ci++;
        setTimeout(tick, 30);
      } else {
        done.push(line); li++; ci = 0;
        setTimeout(tick, 200);
      }
    }
    setTimeout(tick, 200);
  })();


  /* ── Scroll reveal ── */
  (function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 150) {
        el.classList.add('visible');
      }
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const ms = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), ms);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.02 });
    reveals.forEach((el) => io.observe(el));
  })();


  /* ── Animated counters ── */
  (function initCounters() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        let cur = 0;
        const step  = target / 50;
        const timer = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = Math.round(cur);
          if (cur >= target) clearInterval(timer);
        }, 30);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-num').forEach((el) => io.observe(el));
  })();


  /* ── Pause the tech orbit while it is off-screen (it recalculates styles every frame) ── */
  (function initOrbitPause() {
    const orbits = document.querySelectorAll('.orbit-system');
    if (!orbits.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting));
    }, { rootMargin: '100px 0px' });
    orbits.forEach((o) => { o.classList.add('is-offscreen'); io.observe(o); });
  })();


  /* ── 3D card tilt ── */
  (function initTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // touch screens: taps fire mousemove, tilt only janks
    const MAX = 8;
    function applyTilt(card, e) {
      const r  = card.getBoundingClientRect();
      const rx =  ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * MAX;
      const ry = -((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * MAX;
      card.style.transform = `translateY(-10px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    }
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.service-card, .why-card, .project-card, .process-card, .tech-card, .testimonial-card');
      if (card) applyTilt(card, e);
    });
    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.service-card, .why-card, .project-card, .process-card, .tech-card, .testimonial-card');
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
        card.style.transform = '';
      }
    });
  })();

  /* ── 8. FAQ ACCORDION HANDLER ── */
  (function initFAQ() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-question');
      if (!btn) return;
      const item = btn.closest('.faq-item');
      if (!item) return;

      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  })();

  /* ── 9. CLICK RIPPLE EFFECT ── */
  (function initRipple() {
    document.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = e.clientX + 'px';
      ripple.style.top = e.clientY + 'px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  })();



  /* ── Success popup ── */
  function showSuccessPopup() {
    const existing = document.getElementById('successPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'successPopup';
    popup.innerHTML = `
      <div class="popup-card">
        <div class="popup-check">
          <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="26" cy="26" r="24" stroke="#10b981" stroke-width="2"/>
            <path d="M14 27l8 8 16-16" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3 class="popup-title">Message Sent Successfully!</h3>
        <p class="popup-body">
          Thank you for reaching out to <strong>Dev Orbit Tech</strong>.<br/>
          Our team will review your message and contact you <strong>within 24 hours</strong>.
        </p>
        <button class="popup-btn" onclick="document.getElementById('successPopup').remove()">
          Got It &mdash; Thank You!
        </button>
        <div class="popup-progress"></div>
      </div>
    `;

    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('show'));
    setTimeout(() => {
      popup.classList.remove('show');
      setTimeout(() => popup.remove(), 400);
    }, 5000);
  }


  /* ── Contact form ── */
  (function initContact() {
    const form          = document.getElementById('contactForm');
    const submitBtn     = document.getElementById('submitBtn');
    const btnText       = document.getElementById('btnText');
    const btnLoader     = document.getElementById('btnLoader');
    const errorEl       = document.getElementById('formErrorMsg');
    const serviceSelect = document.getElementById('f-service');
    const otherGroup    = document.getElementById('otherServiceGroup');
    const otherInput    = document.getElementById('f-other');

    if (!form) return;

    serviceSelect.addEventListener('change', () => {
      const show = serviceSelect.value === 'Other Services';
      otherGroup.style.display = show ? 'flex' : 'none';
      if (!show) otherInput.value = '';
    });

    function setError(fieldId, errId, msg) {
      const f = document.getElementById(fieldId);
      const e = document.getElementById(errId);
      if (!f || !e) return;
      f.classList.toggle('invalid', !!msg);
      e.textContent = msg || '';
    }

    function validate() {
      let ok = true;
      const name = document.getElementById('f-name').value.trim();
      if (name.length < 2) { setError('f-name', 'err-name', 'Name must be at least 2 characters.'); ok = false; }
      else { setError('f-name', 'err-name', ''); }

      const email = document.getElementById('f-email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('f-email', 'err-email', 'Please enter a valid email address.'); ok = false; }
      else { setError('f-email', 'err-email', ''); }

      if (!serviceSelect.value) { setError('f-service', 'err-service', 'Please select a service.'); ok = false; }
      else { setError('f-service', 'err-service', ''); }

      if (serviceSelect.value === 'Other Services' && !otherInput.value.trim()) {
        setError('f-other', 'err-other', 'Please describe the service you need.'); ok = false;
      } else { setError('f-other', 'err-other', ''); }

      const msg = document.getElementById('f-message').value.trim();
      if (msg.length < 10) { setError('f-message', 'err-message', 'Message must be at least 10 characters.'); ok = false; }
      else { setError('f-message', 'err-message', ''); }

      return ok;
    }

    ['f-name', 'f-email', 'f-service', 'f-other', 'f-message'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('blur', validate);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      if (!validate()) return;

      const service = serviceSelect.value === 'Other Services'
        ? `Other: ${otherInput.value.trim()}`
        : serviceSelect.value;

      const company = document.getElementById('f-company') ? document.getElementById('f-company').value.trim() : '';
      const country = document.getElementById('f-country') ? document.getElementById('f-country').value.trim() : '';
      const budget  = document.getElementById('f-budget') ? document.getElementById('f-budget').value.trim() : '';
      const timeline= document.getElementById('f-timeline') ? document.getElementById('f-timeline').value.trim() : '';

      const payload = {
        name:       document.getElementById('f-name').value.trim(),
        email:      document.getElementById('f-email').value.trim(),
        phone:      document.getElementById('f-phone').value.trim(),
        company,
        country,
        budget,
        timeline,
        service,
        message:    document.getElementById('f-message').value.trim(),
        website_hp: document.getElementById('f-website-hp') ? document.getElementById('f-website-hp').value.trim() : '',
      };

      submitBtn.disabled      = true;
      btnText.style.display   = 'none';
      btnLoader.style.display = 'inline';

      try {
        const res  = await fetch('/api/submit-contact', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            form.reset();
            otherGroup.style.display = 'none';
            showSuccessPopup();
            loadCounter();
            return;
          }
        }
        throw new Error('API unavailable, redirecting to direct chat...');
      } catch (err) {
        console.warn('Contact Form Server Fallback:', err);
        // Fallback: Show success popup + launch pre-filled WhatsApp chat
        showSuccessPopup();
        let detailLines = '';
        if (payload.company)  detailLines += `\nCompany: ${payload.company}`;
        if (payload.country)  detailLines += `\nCountry: ${payload.country}`;
        if (payload.budget)   detailLines += `\nBudget: ${payload.budget}`;
        if (payload.timeline) detailLines += `\nTimeline: ${payload.timeline}`;

        const waText = encodeURIComponent(
          `Hello Dev Orbit Tech! My name is ${payload.name}.\nEmail: ${payload.email}\nPhone: ${payload.phone || 'N/A'}${detailLines}\nService Needed: ${payload.service}\nMessage: ${payload.message}`
        );
        window.open(`https://wa.me/923161893004?text=${waText}`, '_blank');
        form.reset();
        if (otherGroup) otherGroup.style.display = 'none';
      } finally {
        submitBtn.disabled      = false;
        btnText.style.display   = 'inline';
        btnLoader.style.display = 'none';
      }
    });
  })();


  /* ── Live message counter ── */
  async function loadCounter() {
    const el = document.getElementById('msgCounter');
    if (!el) return;
    try {
      const res  = await fetch('/api/get-stats');
      const data = await res.json();
      if (typeof data.count === 'number' && data.count !== null) {
        el.textContent = `${data.count} message${data.count !== 1 ? 's' : ''} received`;
      } else {
        el.style.display = 'none';
      }
    } catch (_) {
      const el2 = document.getElementById('msgCounter');
      if (el2) el2.style.display = 'none';
    }
  }
  loadCounter();


  /* ── Footer year ── */
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Image retry on error ── */
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      if (!this.dataset.retried) {
        this.dataset.retried = '1';
        const src = this.src;
        this.src = '';
        setTimeout(() => { this.src = src; }, 500);
      }
    });
  });

  /* ── Interactive Button Ripple Wave Effect ── */
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn-primary, .ripple-btn, #submitBtn');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.className = 'btn-ripple-wave';

    const existing = btn.querySelector('.btn-ripple-wave');
    if (existing) existing.remove();

    btn.appendChild(circle);
  });

  /* ── GitHub Projects Live Stats Sync ── */
  (function initProjects() {
    const GITHUB_USERNAME = 'devahmedaqeel';
    const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

    async function loadGitHubProjects() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(r => {
            if (!r.name) return;
            const repoName = r.name.toLowerCase();
            const cards = document.querySelectorAll('.project-card');
            cards.forEach(card => {
              const link = card.querySelector('a.repo-btn');
              if (link && link.href.toLowerCase().includes(repoName)) {
                const starEl = card.querySelector('[title="Stars"]');
                const forkEl = card.querySelector('[title="Forks"]');
                if (starEl && r.stargazers_count !== undefined) starEl.textContent = `⭐ ${r.stargazers_count}`;
                if (forkEl && r.forks_count !== undefined) forkEl.textContent = `🍴 ${r.forks_count}`;
              }
            });
          });
        }
      } catch (err) {
        console.warn('GitHub stats sync active:', err.message);
      }
    }

    loadGitHubProjects();
  })();

});

