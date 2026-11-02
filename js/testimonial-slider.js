/* ============================================
   Kundenstimmen: eine Stimme groß, die nächste blendet ruhig über.
   Darunter Zähler, feine Fortschrittslinien und zwei Pfeile.
   Läuft von allein weiter, hält beim Hovern und Fokus an,
   bei "Bewegung reduzieren" nur per Klick.
   ============================================ */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var DAUER = 8000;

  document.querySelectorAll('.testimonials-grid[data-slider]').forEach(function (track) {
    var cards = Array.prototype.slice.call(track.children);
    if (cards.length < 2) return;
    var index = 0;
    var timer = null;
    var paused = false;

    track.classList.add('is-stimmen');
    track.setAttribute('aria-live', 'polite');

    var controls = document.createElement('div');
    controls.className = 'stimmen-controls';
    var count = document.createElement('span');
    count.className = 'stimmen-count';
    var bars = document.createElement('div');
    bars.className = 'stimmen-bars';
    var prev = arrow('Vorherige Stimme', '←');
    var next = arrow('Nächste Stimme', '→');

    cards.forEach(function (card, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Zu Stimme ' + (i + 1));
      b.innerHTML = '<span></span>';
      b.addEventListener('click', function () { go(i); });
      bars.appendChild(b);
    });

    controls.appendChild(count);
    controls.appendChild(bars);
    controls.appendChild(prev);
    controls.appendChild(next);
    track.parentNode.insertBefore(controls, track.nextSibling);

    function arrow(label, sign) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stimmen-arrow';
      b.setAttribute('aria-label', label);
      b.innerHTML = '<span aria-hidden="true">' + sign + '</span>';
      return b;
    }

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function render() {
      cards.forEach(function (card, i) {
        var on = i === index;
        card.classList.toggle('is-active', on);
        card.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      Array.prototype.forEach.call(bars.children, function (b, i) {
        b.classList.toggle('is-done', i < index);
        b.classList.remove('is-running');
        b.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
      count.textContent = pad(index + 1) + ' / ' + pad(cards.length);
      start();
    }

    function go(i) {
      index = (i + cards.length) % cards.length;
      render();
    }

    // Fortschrittslinie der aktuellen Stimme füllt sich, danach weiter
    function start() {
      clearTimeout(timer);
      var bar = bars.children[index];
      if (reduce.matches || paused) return;
      void bar.offsetWidth;
      bar.classList.add('is-running');
      timer = setTimeout(function () { go(index + 1); }, DAUER);
    }

    function pause(on) {
      paused = on;
      controls.parentNode.classList.toggle('stimmen-pausiert', on);
      if (on) {
        clearTimeout(timer);
        bars.children[index].classList.remove('is-running');
      } else {
        start();
      }
    }

    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });

    var area = track.parentNode;
    area.addEventListener('mouseenter', function () { pause(true); });
    area.addEventListener('mouseleave', function () { pause(false); });
    area.addEventListener('focusin', function () { pause(true); });
    area.addEventListener('focusout', function (e) { if (!area.contains(e.relatedTarget)) pause(false); });

    // Wischen auf Touch-Geräten
    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    reduce.addEventListener('change', render);
    render();
  });
})();
