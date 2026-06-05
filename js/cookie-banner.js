(function () {
  if (localStorage.getItem('cookie-ok')) return;

  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML =
    '<p>Diese Website verwendet technisch notwendige Verbindungen (Hosting, Google Fonts). ' +
    'Es werden keine Tracking-Cookies gesetzt. ' +
    '<a href="datenschutz.html">Mehr erfahren</a></p>' +
    '<button id="cookie-ok">Verstanden</button>';
  document.body.appendChild(banner);

  document.getElementById('cookie-ok').addEventListener('click', function () {
    localStorage.setItem('cookie-ok', '1');
    banner.remove();
  });
})();
