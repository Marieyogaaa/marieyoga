// Instagram-Feed über Behold (feeds.behold.so).
// Lädt erst nach Zustimmung: entweder "Alle akzeptieren" im Cookie-Banner
// oder Klick auf "Beiträge laden" direkt im Feed.

var IG_FEED_URL = 'https://feeds.behold.so/Obnzxd1GsCsK3oDGQv4c';
var IG_POST_COUNT = 6;

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.querySelector('.ig-feed-grid');
  if (!grid) return;

  if (localStorage.getItem('cookie-consent') === 'all') {
    loadInstagramFeed(grid);
    return;
  }

  var notice = document.createElement('div');
  notice.className = 'ig-consent';
  notice.innerHTML =
    '<p>Beim Laden der Beiträge werden Bilder von Instagram über den Dienst Behold abgerufen. ' +
    'Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
    '<button type="button" class="btn btn-outline">Beiträge laden</button>';
  grid.parentNode.insertBefore(notice, grid.nextSibling);

  notice.querySelector('button').onclick = function () {
    notice.remove();
    loadInstagramFeed(grid);
  };

  document.addEventListener('cookie-consent-all', function () {
    if (notice.isConnected) {
      notice.remove();
      loadInstagramFeed(grid);
    }
  });
});

function loadInstagramFeed(grid) {
  if (grid.dataset.loaded) return;
  grid.dataset.loaded = 'true';

  fetch(IG_FEED_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('Feed nicht erreichbar');
      return res.json();
    })
    .then(function (data) {
      var posts = (data.posts || []).slice(0, IG_POST_COUNT);
      if (!posts.length) return;

      grid.innerHTML = '';
      posts.forEach(function (post) {
        var img = post.sizes && post.sizes.medium ? post.sizes.medium.mediaUrl
                : (post.thumbnailUrl || post.mediaUrl);
        var caption = (post.prunedCaption || post.caption || '').split('\n')[0];

        var tile = document.createElement('a');
        tile.className = 'ig-tile';
        tile.href = post.permalink;
        tile.target = '_blank';
        tile.rel = 'noopener';

        var image = document.createElement('img');
        image.src = img;
        image.alt = caption || 'Instagram-Beitrag von @marieyogaaa';
        image.loading = 'lazy';
        tile.appendChild(image);

        if (post.mediaType === 'VIDEO' || post.mediaType === 'CAROUSEL_ALBUM') {
          var badge = document.createElement('span');
          badge.className = 'ig-badge';
          badge.textContent = post.mediaType === 'VIDEO' ? '▶' : '❐';
          badge.setAttribute('aria-hidden', 'true');
          tile.appendChild(badge);
        }

        grid.appendChild(tile);
      });
    })
    .catch(function () {
      // Bei Fehlern bleiben die Platzhalter-Kacheln mit Link zu Instagram stehen.
      delete grid.dataset.loaded;
    });
}
