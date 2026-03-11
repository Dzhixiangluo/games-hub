const CACHE_NAME = 'games-hub-v1';
const urlsToCache = [
  'index.html',
  'snake.html',
  'snake.js',
  'tetris.html',
  'tetris.js',
  'match3.html',
  'match3.js',
  'minesweeper.html',
  'minesweeper.js',
  'gobang.html',
  'gobang.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// 安装 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
