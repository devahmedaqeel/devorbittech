// Contact page form — same validation and /api/submit-contact backend as the homepage form
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var submitBtn = $('submitBtn'), btnText = $('btnText'), btnLoader = $('btnLoader');
  var errorEl = $('formErrorMsg'), successEl = $('formSuccess');
  var serviceSelect = $('f-service'), otherGroup = $('otherServiceGroup'), otherInput = $('f-other');
  var val = function (id) { var el = $(id); return el ? el.value.trim() : ''; };

  if (serviceSelect && otherGroup) {
    serviceSelect.addEventListener('change', function () {
      var show = serviceSelect.value === 'Other Services';
      otherGroup.style.display = show ? 'flex' : 'none';
      if (!show && otherInput) otherInput.value = '';
    });
  }

  // Arriving from an Enroll button (/contact?program=web): turn this form into that program's enrollment form
  (function initEnrollment() {
    var PROGRAMS = {
      web: { name: 'Web Development', duration: '1 Month', fee: 'Rs. 5,000' },
      app: { name: 'App Development', duration: '2 Months', fee: 'Rs. 8,000' },
      marketing: { name: 'Digital Marketing', duration: '1 Month', fee: 'Rs. 4,000' }
    };
    var key = new URLSearchParams(window.location.search).get('program');
    if (!key || !Object.prototype.hasOwnProperty.call(PROGRAMS, key)) return;
    var program = PROGRAMS[key];

    // This value is what appears in the email subject and body
    serviceSelect.value = program.name + ' Program Enrollment (' + program.duration + ', ' + program.fee + ')';

    var title = $('contact-form-title');
    if (title) title.textContent = 'Enroll in ' + program.name;
    var legend = serviceSelect.closest('fieldset').querySelector('legend');
    if (legend) legend.lastChild.textContent = ' Your enrollment';
    var messageLabel = form.querySelector('label[for="f-message"]');
    if (messageLabel) messageLabel.firstChild.textContent = 'Message ';

    var message = $('f-message');
    message.placeholder = 'Add anything you would like us to know.';
    // defaultValue so the text comes back after form.reset()
    message.defaultValue = 'I would like to enroll in the ' + program.name + ' program.';

    if (btnText && btnText.firstChild) btnText.firstChild.textContent = 'Send enrollment request ';

    var card = document.createElement('div');
    card.className = 'cf-program';
    var info = document.createElement('div');
    var label = document.createElement('span');
    label.className = 'cf-program-label';
    label.textContent = 'Selected program';
    var name = document.createElement('strong');
    name.textContent = program.name;
    var meta = document.createElement('span');
    meta.className = 'cf-program-meta';
    meta.textContent = program.duration + ' · ' + program.fee + ' · Completion certificate';
    info.appendChild(label);
    info.appendChild(name);
    info.appendChild(meta);
    var change = document.createElement('a');
    change.href = '/programs';
    change.textContent = 'Change';
    card.appendChild(info);
    card.appendChild(change);
    serviceSelect.parentNode.insertBefore(card, serviceSelect);
  })();

  function setError(fieldId, errId, msg) {
    var f = $(fieldId), e = $(errId);
    if (!f || !e) return;
    f.classList.toggle('invalid', !!msg);
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    e.textContent = msg || '';
  }

  function validate() {
    var ok = true;
    if (val('f-name').length < 2) { setError('f-name', 'err-name', 'Name must be at least 2 characters.'); ok = false; }
    else setError('f-name', 'err-name', '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('f-email'))) { setError('f-email', 'err-email', 'Please enter a valid email address.'); ok = false; }
    else setError('f-email', 'err-email', '');
    if (!val('f-service')) { setError('f-service', 'err-service', 'Please select a service.'); ok = false; }
    else setError('f-service', 'err-service', '');
    if (val('f-service') === 'Other Services' && !val('f-other')) { setError('f-other', 'err-other', 'Please describe the service you need.'); ok = false; }
    else setError('f-other', 'err-other', '');
    if (val('f-message').length < 10) { setError('f-message', 'err-message', 'Message must be at least 10 characters.'); ok = false; }
    else setError('f-message', 'err-message', '');
    return ok;
  }

  ['f-name', 'f-email', 'f-service', 'f-other', 'f-message'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('blur', validate);
  });

  function setBusy(busy) {
    if (submitBtn) submitBtn.disabled = busy;
    if (btnText) btnText.style.display = busy ? 'none' : 'inline';
    if (btnLoader) btnLoader.style.display = busy ? 'inline' : 'none';
  }

  function showSuccess() {
    form.reset();
    if (otherGroup) otherGroup.style.display = 'none';
    if (successEl) { successEl.style.display = 'block'; successEl.setAttribute('tabindex', '-1'); successEl.focus(); }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
    if (!validate()) {
      var firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var payload = {
      name: val('f-name'), email: val('f-email'), phone: val('f-phone'),
      company: val('f-company'), country: val('f-country'), budget: val('f-budget'), timeline: val('f-timeline'),
      service: val('f-service') === 'Other Services' ? 'Other: ' + val('f-other') : val('f-service'),
      message: val('f-message'), website_hp: val('f-website-hp'),
    };

    setBusy(true);
    try {
      var res = await fetch('/api/submit-contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      var data = res.ok ? await res.json() : null;
      if (data && data.success) { showSuccess(); return; }
      throw new Error('API unavailable');
    } catch (err) {
      // Same fallback as the homepage: hand the enquiry to WhatsApp so it is never lost
      var extra = '';
      if (payload.company) extra += '\nCompany: ' + payload.company;
      if (payload.country) extra += '\nCountry: ' + payload.country;
      if (payload.budget) extra += '\nBudget: ' + payload.budget;
      if (payload.timeline) extra += '\nTimeline: ' + payload.timeline;
      var text = encodeURIComponent('Hello Dev Orbit Tech! My name is ' + payload.name + '.\nEmail: ' + payload.email +
        '\nPhone: ' + (payload.phone || 'N/A') + extra + '\nService Needed: ' + payload.service + '\nMessage: ' + payload.message);
      window.open('https://wa.me/923161893004?text=' + text, '_blank');
      showSuccess();
    } finally {
      setBusy(false);
    }
  });
})();
