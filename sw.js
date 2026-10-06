const CACHE = 'rpn-financial-v2';
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'src/algebraic.js', 'src/bonds.js', 'src/calc.js', 'src/cashflow.js', 'src/dates.js',
  'src/depreciation.js', 'src/errors.js', 'src/format.js', 'src/keys.js', 'src/ops.js',
  'src/stats.js', 'src/tvm.js', 'src/ui.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    });
    if (hit) { network.catch(() => {}); return hit; }
    return network;
  }));
});
