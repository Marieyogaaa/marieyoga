document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var links  = document.querySelector('.nav-links');
  var nav    = document.querySelector('.nav');

  // Transparent → cream scroll effect
  function updateNavBg() {
    if (window.scrollY > 40) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }
  updateNavBg();
  window.addEventListener('scroll', updateNavBg, { passive: true });

  if (!burger || !links) return;

  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  // Mega-menu: tap/click to toggle on touch/mobile, hover handled by CSS on desktop
  document.querySelectorAll('.nav-item.has-dropdown').forEach(function (item) {
    var trigger = item.querySelector('a');

    // Desktop: kleine Verzögerung beim Schließen, damit man das Dropdown erreicht
    var closeTimer;
    item.addEventListener('mouseenter', function () {
      clearTimeout(closeTimer);
    });
    item.addEventListener('mouseleave', function () {
      closeTimer = setTimeout(function () {
        item.classList.remove('open');
      }, 120);
    });

    // Touch/Mobile: Click öffnet/schließt
    trigger.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.nav-item').forEach(function (i) { i.classList.remove('open'); });
        if (!wasOpen) item.classList.add('open');
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', false);
      document.querySelectorAll('.nav-item').forEach(function (i) { i.classList.remove('open'); });
    }
  });

  // Close on dropdown link click
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.innerWidth <= 768 && !this.closest('.nav-dropdown')) return;
      links.classList.remove('open');
      burger.classList.remove('open');
    });
  });

  // Mark active nav link
  var path = window.location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
});
