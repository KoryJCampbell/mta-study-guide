// Offline cache for the MTA study guide, the Practice page and the Diamond Run game.
// Page: network first, fall back to cache. Fonts: cache first. Audio goes straight to the network,
// since phones stream it in pieces (range requests) and the cache can't store those.
var CACHE = 'mta-la-v9';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './game.html', './game.js', './game-data.js', './vendor/three.module.min.js',
  './practice.html', './practice.js', './crossword-data.js', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

  if (isFont) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }

  if (url.origin !== location.origin) return;
  if (/\.mp3$/.test(url.pathname) || req.headers.has('range')) return;

  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
  }));
});
