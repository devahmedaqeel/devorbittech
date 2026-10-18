// Two-way scroll reveal: elements slide in from the side they sit on (left / right) or rise up,
// every time they enter the screen — scrolling down they come from below, scrolling up from above.
// Uses the CSS `translate` property + keyframes, so it never fights the elements' own hover transforms.
// Progressive enhancement: nothing is hidden unless this script runs.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Phones/tablets: a light one-way reveal. No layout reads (they force every section to lay out,
  // defeating content-visibility), start just before an element scrolls in so it is never seen blank,
  // short fade-up (see .rv-lite in style.css), and no hide/re-animate cycle while scrolling.
  var LITE = window.matchMedia('(max-width: 991px), (pointer: coarse)').matches;

  var GROUPS = [
    '.about-grid', '.contact-split', '.contact-layout', '.mentor-layout', '.vm-grid', '.stack-layout',
    '.services-grid', '.projects-grid', '.process-grid', '.techstack-grid', '.testimonials-grid', '.why-grid',
    '.about-stats', '.work-grid', '.svc-grid', '.core-grid', '.detail-grid-3', '.cs-list', '.steps',
    '.pillars-grid', '.related-grid', '.stat-row', '.svc-cat-head', '.os-legend', '.sf-top', '.timeline-container',
    '.services-grid-mini', '.svc-link-grid', '.tech-pills-row', '.faq-grid'
  ];
  var SINGLES = ['.section-header', '.detail-header', '.subpage-cta-box', '.cta-banner-content', '.article-header',
    '.highlight-box', '.answer-card', '.section-heading', '.work-toolbar', '.founder-intro'];

  var items = [];
  function add(el, side, delay) {
    if (!el || el.__rv) return;
    el.__rv = { side: side, delay: delay || 0 };
    el.classList.add('rv');
    el.style.setProperty('--rv-delay', (delay || 0) + 'ms');
    items.push(el);
  }
  function sideOf(el, parent) {
    var r = el.getBoundingClientRect(), p = parent.getBoundingClientRect();
    if (!p.width || r.width > p.width * 0.8) return 'mid';
    var c = (r.left + r.width / 2 - p.left) / p.width;
    return c < 0.42 ? 'left' : c > 0.58 ? 'right' : 'mid';
  }

  // The hero (homepage and subpages) is already on screen at first paint: never hide it on phones
  if (!LITE) {
    add(document.querySelector('.hero-content'), 'left', 100);
    add(document.querySelector('.hero-visual'), 'right', 250);
    var subHero = document.querySelector('.subpage-hero .container');
    if (subHero) [].forEach.call(subHero.children, function (el, i) { add(el, 'left', 80 + i * 90); });
  }

  GROUPS.forEach(function (sel) {
    [].forEach.call(document.querySelectorAll(sel), function (group) {
      if (LITE) {
        // cards side by side on tablets get a tiny stagger; phones show one column, no stagger needed
        [].forEach.call(group.children, function (el, i) { add(el, 'mid', (i % 2) * 70); });
        return;
      }
      var rowTop = null, idx = 0;
      [].forEach.call(group.children, function (el) {
        if (el.offsetParent === null) return;
        var top = el.getBoundingClientRect().top;
        if (rowTop === null || Math.abs(top - rowTop) > 8) { rowTop = top; idx = 0; }
        add(el, sideOf(el, group), Math.min(idx, 4) * 90);
        idx++;
      });
    });
  });
  SINGLES.forEach(function (sel) { [].forEach.call(document.querySelectorAll(sel), function (el) { add(el, 'mid', 0); }); });
  if (!items.length) return;
  document.documentElement.classList.add('rv-ready');
  if (LITE) document.documentElement.classList.add('rv-lite');

  var ANIMS = ['rv-in-left', 'rv-in-right', 'rv-in-up', 'rv-in-down'];
  function show(el, fromAbove) {
    if (el.__rvShown) return;
    el.__rvShown = true;
    var s = el.__rv.side;
    el.classList.remove.apply(el.classList, ANIMS);
    el.classList.add(s === 'left' ? 'rv-in-left' : s === 'right' ? 'rv-in-right' : fromAbove ? 'rv-in-down' : 'rv-in-up');
  }
  function hide(el) {
    if (!el.__rvShown) return;
    el.__rvShown = false;
    el.classList.remove.apply(el.classList, ANIMS);
  }

  if (LITE) {
    // start the fade while the element is still half a screen below the bottom edge; reveal once
    var ioLite = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target, false);
        ioLite.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 50% 0px' });
    items.forEach(function (el) { ioLite.observe(el); });
    window.addEventListener('beforeprint', function () { items.forEach(function (el) { show(el, false); }); });
    return;
  }

  // show when 10% is on screen
  var ioShow = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.1) return;
      var rootH = entry.rootBounds ? entry.rootBounds.height : window.innerHeight;
      show(entry.target, entry.boundingClientRect.top < rootH / 2);
    });
  }, { threshold: 0.1 });
  // reset only once the element is well clear of the screen (150px > the 56px an entrance moves it),
  // so an element at the edge can never flicker between hidden and shown
  var ioHide = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { if (!entry.isIntersecting) hide(entry.target); });
  }, { threshold: 0, rootMargin: '150px 0px 150px 0px' });
  items.forEach(function (el) { ioShow.observe(el); ioHide.observe(el); });

  // Safety net (timer-based): anything on screen is always shown, even if the observer missed it
  var timer = null;
  function sweep() {
    timer = null;
    var h = window.innerHeight;
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!el.__rvShown && r.bottom > 0 && r.top < h) show(el, r.top < h / 2);
    });
  }
  window.addEventListener('scroll', function () { if (!timer) timer = setTimeout(sweep, 150); }, { passive: true });
  window.addEventListener('load', function () { setTimeout(sweep, 300); });
  setTimeout(sweep, 1200);

  window.addEventListener('beforeprint', function () { items.forEach(function (el) { show(el, false); }); });
})();
