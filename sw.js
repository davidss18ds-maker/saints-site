/* Saints ERP - funciona offline. Mude a versão ao publicar uma atualização. */
var CACHE = 'saints-erp-v27';
var CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  /* Páginas: tenta a rede (pega atualizações) e cai para o cache se estiver offline */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      if (/\/(index\.html)?$/.test(url.pathname)) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put('./index.html', cp); }); } return r;
    }).catch(function () { return caches.match(/\/(index\.html)?$/.test(url.pathname) ? './index.html' : req).then(function (h) { return h || caches.match('./index.html'); }); }));
    return;
  }
  /* Fonte do Google e arquivos do app: cache primeiro */
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (r) {
        if (r && (r.ok || r.type === 'opaque')) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
        return r;
      });
    }));
  }
});
