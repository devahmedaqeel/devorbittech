// Navbar behaviour for subpages: compact-on-scroll header + accessible mobile menu
(function () {
  var navbar = document.getElementById('navbar');
  var btn = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');

  if (navbar) {
    var onScroll = function () { navbar.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!btn || !links) return;

  function setOpen(open, returnFocus) {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
    if (!open && returnFocus) btn.focus();
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!links.classList.contains('open'));
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', function (e) {
    if (links.classList.contains('open') && !e.target.closest('.navbar')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) setOpen(false, true);
  });
  if (navbar) {
    navbar.addEventListener('focusout', function (e) {
      if (links.classList.contains('open') && e.relatedTarget && !navbar.contains(e.relatedTarget)) setOpen(false);
    });
  }
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (mq) {
    if (mq.matches) setOpen(false);
  });
})();
