// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.nav-burger');
  const links  = document.querySelector('.nav-links');
  const nav    = document.querySelector('.nav');

  if (!burger || !links) return;

  burger.addEventListener('click', function (e) {
    e.stopPropagation();
    const open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', false);
    }
  });

  // Close on nav link click
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      burger.classList.remove('open');
    });
  });

  // Mark active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  links.querySelectorAll('a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
});
