// Angebote auf dem Handy: Beim normalen Scrollen nach unten bleibt die
// Kachelreihe stehen und die nächsten Angebote gleiten seitlich herein.
// Ohne JavaScript oder mit "Bewegung reduzieren" bleibt sie wischbar.
document.addEventListener('DOMContentLoaded', function () {
  var scroller = document.querySelector('.offer-scroller');
  var sticky = document.querySelector('.offer-sticky');
  var track = document.querySelector('.offer-tiles');
  if (!scroller || !sticky || !track) return;

  var mobile = window.matchMedia('(max-width: 680px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var distance = 0;
  var ticking = false;

  function setup() {
    var active = mobile.matches && !reduce.matches;
    scroller.classList.toggle('is-pinned', active);
    track.style.transform = '';
    scroller.style.height = '';
    if (!active) return;
    distance = Math.max(0, track.scrollWidth - track.clientWidth);
    // Für jeden Pixel seitlich ein Pixel nach unten scrollen
    scroller.style.height = (sticky.offsetHeight + distance) + 'px';
    update();
  }

  function update() {
    ticking = false;
    if (!scroller.classList.contains('is-pinned')) return;
    var navH = parseFloat(getComputedStyle(sticky).top) || 0;
    var progress = Math.min(Math.max((navH - scroller.getBoundingClientRect().top) / Math.max(distance, 1), 0), 1);
    // Immer genau ein Angebot zeigen: zur nächstgelegenen Kachel springen
    var tiles = track.children;
    var step = tiles.length > 1 ? tiles[1].offsetLeft - tiles[0].offsetLeft : 0;
    var index = Math.round(progress * (tiles.length - 1));
    track.style.transform = 'translate3d(' + (-index * step) + 'px, 0, 0)';
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', setup);
  mobile.addEventListener('change', setup);
  reduce.addEventListener('change', setup);
  window.addEventListener('load', setup);
  setup();
});
