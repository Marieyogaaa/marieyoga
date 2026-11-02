/* ============================================
   Filter nach Kategorie (Angebote, Buchen, Retreats nach Jahr)
   ============================================ */
(function () {
  var buttons = document.querySelectorAll('.filter-btn');
  var items   = document.querySelectorAll('[data-category]');
  if (!buttons.length) return;

  var bar = document.querySelector('.angebote-filter');

  // Gleitender Hintergrund: folgt beim Hovern der Maus, sonst sitzt er auf dem aktiven Filter
  var indicator = document.createElement('span');
  indicator.className = 'filter-indicator no-anim';
  bar.prepend(indicator);
  bar.classList.add('has-indicator');

  function moveIndicator(target) {
    indicator.style.transform = 'translate(' + target.offsetLeft + 'px, ' + target.offsetTop + 'px)';
    indicator.style.width = target.offsetWidth + 'px';
    indicator.style.height = target.offsetHeight + 'px';
    buttons.forEach(function (btn) { btn.classList.toggle('is-highlighted', btn === target); });
  }

  function activeButton() { return bar.querySelector('.filter-btn.is-active') || buttons[0]; }

  function applyFilter(filter) {
    buttons.forEach(function (btn) {
      var active = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active);
    });
    items.forEach(function (item) {
      item.hidden = filter !== 'alle' && item.dataset.category !== filter;
    });
    moveIndicator(activeButton());
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); });
    btn.addEventListener('mouseenter', function () { moveIndicator(btn); });
    btn.addEventListener('focus', function () { moveIndicator(btn); });
  });
  bar.addEventListener('mouseleave', function () { moveIndicator(activeButton()); });
  bar.addEventListener('focusout', function (e) {
    if (!bar.contains(e.relatedTarget)) moveIndicator(activeButton());
  });
  window.addEventListener('resize', function () { moveIndicator(activeButton()); });

  // Startposition ohne Animation setzen, danach Animation einschalten
  moveIndicator(activeButton());
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { indicator.classList.remove('no-anim'); });
  });

  // Anker als Kategorie (z. B. buchen.html#retreats, retreats.html#2027) setzt den Filter direkt.
  // Zeigt ein Anker auf etwas Ausgeblendetes (z. B. retreats.html#juli), auf dessen Kategorie
  // umschalten und hinspringen.
  function revealTarget() {
    var hash = location.hash.slice(1);
    if (hash && bar.querySelector('.filter-btn[data-filter="' + hash + '"]')) {
      applyFilter(hash);
      bar.scrollIntoView();
      return;
    }
    var target = hash && document.getElementById(hash);
    var group = target && target.closest('[data-category]');
    if (group && group.hidden) {
      applyFilter(group.dataset.category);
      target.scrollIntoView();
    }
  }
  revealTarget();
  window.addEventListener('hashchange', revealTarget);

  // Nach dem Laden der Webfonts ändern sich die Button-Breiten
  if (document.fonts) document.fonts.ready.then(function () { moveIndicator(activeButton()); });
})();
