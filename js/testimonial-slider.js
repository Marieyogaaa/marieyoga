/* ============================================
   Kundenstimmen als Slider: drei nebeneinander (Tablet zwei, Handy eine),
   Pfeile links/rechts, Punkte darunter, Wischen auf dem Handy
   ============================================ */
(function () {
  document.querySelectorAll('.testimonials-grid[data-slider]').forEach(function (track) {
    var cards = Array.prototype.slice.call(track.children);
    var index = 0;

    // Aufbau: [Pfeil] [Sichtfenster mit Kacheln] [Pfeil], darunter Punkte
    var slider = document.createElement('div');
    slider.className = 'testi-slider';
    var viewport = document.createElement('div');
    viewport.className = 'testi-viewport';
    var prev = arrow('prev', 'Vorherige Stimme', '←');
    var next = arrow('next', 'Nächste Stimme', '→');
    var dots = document.createElement('div');
    dots.className = 'testi-dots';

    track.parentNode.insertBefore(slider, track);
    viewport.appendChild(track);
    slider.appendChild(prev);
    slider.appendChild(viewport);
    slider.appendChild(next);
    slider.parentNode.insertBefore(dots, slider.nextSibling);
    track.classList.add('is-slider');

    function arrow(dir, label, sign) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'testi-arrow testi-arrow--' + dir;
      b.setAttribute('aria-label', label);
      b.innerHTML = '<span aria-hidden="true">' + sign + '</span>';
      return b;
    }

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    }
    function perView() { return Math.max(1, Math.round(viewport.clientWidth / step())); }
    function maxIndex() { return Math.max(0, cards.length - perView()); }

    function render() {
      index = Math.min(index, maxIndex());
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';

      var needed = maxIndex() + 1;
      if (dots.children.length !== needed) {
        dots.innerHTML = '';
        for (var i = 0; i < needed; i++) {
          var d = document.createElement('button');
          d.type = 'button';
          d.setAttribute('aria-label', 'Zu Stimme ' + (i + 1));
          d.addEventListener('click', go.bind(null, i));
          dots.appendChild(d);
        }
      }
      Array.prototype.forEach.call(dots.children, function (d, i) {
        d.classList.toggle('is-active', i === index);
      });

      var scrollable = maxIndex() > 0;
      slider.classList.toggle('is-static', !scrollable);
      dots.hidden = !scrollable;
    }

    function go(i) {
      var max = maxIndex();
      index = i > max ? 0 : i < 0 ? max : i;   // am Ende wieder von vorn
      render();
    }

    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });
    window.addEventListener('resize', render);

    // Wischen auf Touch-Geräten
    var startX = null;
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    render();
  });
})();
