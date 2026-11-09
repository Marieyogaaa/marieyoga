// Bildgalerien in den Retreat-Zeilen: Bilder gleiten seitlich weiter,
// darunter Zähler (01 / 05) und zwei Pfeile. Klick aufs Bild oder Wischen
// blättert ebenfalls. Kein automatischer Wechsel.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.raum-galerie').forEach(function (galerie) {
    var track = galerie.querySelector('.raum-galerie-track');
    var bilder = track.children;
    var anzahl = bilder.length;
    if (anzahl < 2) return;
    var index = 0;

    var leiste = document.createElement('div');
    leiste.className = 'raum-galerie-leiste';
    leiste.innerHTML =
      '<span class="raum-galerie-zahl" aria-live="polite"></span>' +
      '<span class="raum-galerie-pfeile">' +
        '<button type="button" class="raum-pfeil" aria-label="Vorheriges Bild">&#8592;</button>' +
        '<button type="button" class="raum-pfeil" aria-label="Nächstes Bild">&#8594;</button>' +
      '</span>';
    galerie.appendChild(leiste);
    var zahl = leiste.querySelector('.raum-galerie-zahl');
    var pfeile = leiste.querySelectorAll('.raum-pfeil');

    function zweistellig(n) { return (n < 10 ? '0' : '') + n; }

    function zeige(i) {
      index = (i + anzahl) % anzahl;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      zahl.textContent = zweistellig(index + 1) + ' / ' + zweistellig(anzahl);
      Array.prototype.forEach.call(bilder, function (b, n) {
        b.setAttribute('aria-hidden', n === index ? 'false' : 'true');
        // nächstes Bild schon laden, damit das Gleiten nicht ins Leere geht
        if (n === (index + 1) % anzahl) b.loading = 'eager';
      });
    }

    pfeile[0].addEventListener('click', function () { zeige(index - 1); });
    pfeile[1].addEventListener('click', function () { zeige(index + 1); });
    track.addEventListener('click', function () { zeige(index + 1); });

    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) zeige(index + (dx < 0 ? 1 : -1));
      startX = null;
    });

    zeige(0);
  });
});
