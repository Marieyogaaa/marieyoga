// Ausgewählte Inhalte blenden beim Scrollen ruhig ein: Überschriften-Blöcke,
// Kacheln, Listenzeilen und Bilder. Geschwister erscheinen leicht versetzt.
// Ohne JavaScript oder mit "Bewegung reduzieren" ist alles sofort sichtbar.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ZIELE = [
    '.sec-intro', '.offers-intro', '.offer-tile', '.event-card',
    '.retreat-text > h2', '.retreat-text > p', '.retreat-rows > a', '.retreat-ctas',
    '.about-img-wrap', '.about-text', '.testimonials-header', '.testimonials-verlauf .testimonials-grid',
    '.angebote-item', '.event-featured', '.date-card', '.price-row',
    '.raum-label', '.raum-inhalt', '.ig-feed-section h2', '.closing-cta .container > *', '.page-hero h1', '.page-hero p'
  ].join(',');

  var els = Array.prototype.slice.call(document.querySelectorAll(ZIELE));
  if (!els.length) return;
  document.documentElement.classList.add('reveal-an');

  els.forEach(function (el) {
    el.classList.add('reveal');
    // Versatz nach Position unter gleichartigen Geschwistern (max. 4 Stufen)
    var i = 0, sib = el.previousElementSibling;
    while (sib && i < 4) { if (sib.classList.contains('reveal')) i++; sib = sib.previousElementSibling; }
    if (i) el.style.transitionDelay = (i * 90) + 'ms';
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-sichtbar');
      io.unobserve(el);
      // Versatz danach entfernen, damit spätere Hover-Effekte nicht verzögern
      setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  els.forEach(function (el) { io.observe(el); });
})();
