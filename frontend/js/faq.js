// Accessible FAQ accordions on subpages (supports both .faq-question and .faq-toggle markup)
(function () {
  var items = document.querySelectorAll('.faq-item');
  items.forEach(function (item, i) {
    var btn = item.querySelector('.faq-question, .faq-toggle');
    var panel = item.querySelector('.faq-answer, .faq-content');
    if (!btn || !panel) return;
    var id = panel.id || 'faq-panel-' + (i + 1);
    panel.id = id;
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', id);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('active');
      item.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
