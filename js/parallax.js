// Dezenter Parallax-Effekt für Bilder und Videos in .parallax-Rahmen.
// Das Medium ist etwas höher als sein Rahmen und verschiebt sich beim
// Scrollen langsamer als die Seite. Aus bei "Bewegung reduzieren".
document.addEventListener('DOMContentLoaded', function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var frames = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
  if (!frames.length) return;

  var STRENGTH = 0.12;   // Anteil der Rahmenhöhe, um den das Medium wandert
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    frames.forEach(function (frame) {
      var media = frame.firstElementChild;
      if (!media) return;
      if (reduce.matches) { media.style.transform = ''; return; }
      var r = frame.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      // -1 (Rahmen unten im Bild) bis 1 (Rahmen oben aus dem Bild)
      var progress = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
      var shift = -progress * r.height * STRENGTH;
      media.style.transform = 'translate3d(0,' + shift.toFixed(1) + 'px,0)';
    });
  }

  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  reduce.addEventListener('change', update);
  update();
});
