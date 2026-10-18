// Projects page: category filter
(function () {
  var grid = document.getElementById('workGrid');
  var empty = document.getElementById('workEmpty');
  var chips = document.querySelectorAll('.filter-chip');
  if (!grid || !chips.length) return;

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shown = 0;
      grid.querySelectorAll('.work-card').forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(/\s+/);
        var match = filter === 'all' || cats.indexOf(filter) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  });
})();
