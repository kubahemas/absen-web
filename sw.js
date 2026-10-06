// Service worker sederhana: hanya menyimpan file halaman.
// Setiap kali kode halaman diubah, naikkan nomor VERSI_CACHE supaya HP memuat ulang file baru.
const VERSI_CACHE = 'absen-v21';

const FILE_HALAMAN = [
  './',
  'index.html',
  'config.js',
  'manifest.json',
  'assets/logo.png',
  'assets/logo-kuning.png',
  'assets/lambang.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSI_CACHE)
      .then(function (c) { return c.addAll(FILE_HALAMAN); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (nama) {
        return Promise.all(nama.filter(function (n) { return n !== VERSI_CACHE; })
          .map(function (n) { return caches.delete(n); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Panggilan ke Apps Script (dan apa pun di luar file halaman/font) tidak pernah di-cache.
  const hostFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !hostFont) return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (hostFont && res && (res.ok || res.type === 'opaque')) {
          const salinan = res.clone();
          caches.open(VERSI_CACHE).then(function (c) { c.put(req, salinan); });
        }
        return res;
      });
    })
  );
});
