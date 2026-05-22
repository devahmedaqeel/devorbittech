const API_BASE = window.location.hostname.includes('github.io')
  ? 'https://devorbittech-email.vercel.app'
  : '';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Background (Three.js particles) ── */
  (function initBackground() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const COUNT = 1200;
    const pos   = new Float32Array(COUNT * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 30;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo,
      new THREE.PointsMaterial({ color: 0x1d8cf8, size: 0.03, transparent: true, opacity: 0.7 })
    );
    scene.add(stars);

    const torusGeo = new THREE.TorusGeometry(2, 0.02, 16, 100);
    const ring1 = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: 0x1d8cf8, transparent: true, opacity: 0.15 }));
    const ring2 = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.15 }));
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring1, ring2);

    let targetX = 0, targetY = 0;
    document.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth  - 0.5) * 0.5;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    });

    (function animate() {
      requestAnimationFrame(animate);
      stars.rotation.y += 0.0003;
      stars.rotation.x += 0.0001;
      ring1.rotation.z += 0.002;  ring1.rotation.x += 0.001;
      ring2.rotation.z -= 0.0015; ring2.rotation.y += 0.001;
      camera.position.x += (targetX  - camera.position.x) * 0.02;
      camera.position.y += (-targetY - camera.position.y) * 0.02;
      renderer.render(scene, camera);
    })();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  })();


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
      if (e.target.closest('a, button, .service-card, .why-card, input, select, textarea, .pill')) {
        dot.style.width = '20px'; dot.style.height = '20px';
        trail.style.width = '48px'; trail.style.height = '48px';
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .service-card, .why-card, input, select, textarea, .pill')) {
        dot.style.width = '12px'; dot.style.height = '12px';
        trail.style.width = '32px'; trail.style.height = '32px';
      }
    });
  })();


  /* ── Navbar ── */
  (function initNavbar() {
    const navbar    = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    const links     = document.querySelectorAll('.nav-link');
    const sections  = document.querySelectorAll('section[id]');

    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
      let current = '';
      sections.forEach((s) => { if (window.scrollY >= s.offsetTop - 140) current = s.id; });
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    links.forEach((l) => l.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }));
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
    });
  });


  /* ── Hero typewriter ── */
  (function initTypewriter() {
    const el = document.getElementById('typeCode');
    if (!el) return;

    const lines = [
      `<span style="color:#7dd3fc">const</span> <span style="color:#a5f3fc">dot</span> = {`,
      `&nbsp;&nbsp;name:    <span style="color:#86efac">"Dev Orbit Tech"</span>,`,
      `&nbsp;&nbsp;mission: <span style="color:#86efac">"Empower Students"</span>,`,
      `&nbsp;&nbsp;skills:  [<span style="color:#86efac">"AI"</span>, <span style="color:#86efac">"Web"</span>, <span style="color:#86efac">"Apps"</span>],`,
      `&nbsp;&nbsp;launch:  () => 🚀`,
      `}`,
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
    setTimeout(tick, 2200);
  })();


  /* ── Scroll reveal ── */
  (function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const ms = parseInt(entry.target.dataset.delay || 0);
        setTimeout(() => entry.target.classList.add('visible'), ms);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
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


  /* ── 3D card tilt ── */
  (function initTilt() {
    const MAX = 8;
    function applyTilt(card, e) {
      const r  = card.getBoundingClientRect();
      const rx =  ((e.clientY - r.top  - r.height / 2) / (r.height / 2)) * MAX;
      const ry = -((e.clientX - r.left - r.width  / 2) / (r.width  / 2)) * MAX;
      card.style.transform = `translateY(-10px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    }
    document.querySelectorAll('.service-card, .why-card').forEach((card) => {
      card.addEventListener('mousemove',  (e) => applyTilt(card, e));
      card.addEventListener('mouseleave', ()  => { card.style.transform = ''; });
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

      const payload = {
        name:    document.getElementById('f-name').value.trim(),
        email:   document.getElementById('f-email').value.trim(),
        phone:   document.getElementById('f-phone').value.trim(),
        service,
        message: document.getElementById('f-message').value.trim(),
      };

      submitBtn.disabled      = true;
      btnText.style.display   = 'none';
      btnLoader.style.display = 'inline';

      try {
        const res  = await fetch(`${API_BASE}/api/submit-contact`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          form.reset();
          otherGroup.style.display = 'none';
          showSuccessPopup();
          loadCounter();
        } else {
          throw new Error(data.error || 'Something went wrong.');
        }
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
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
      const res  = await fetch(`${API_BASE}/api/get-stats`);
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

});
