// OrganizO Service Worker v2.0
// Smart caching: always-fresh for logic, offline-ready for assets

const CACHE_VERSION = 'organizo-v2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Core app shell — cached on install
const CORE_ASSETS = [
    '/index.html',
    '/app.html',
    '/app.js',
    '/script.js',
    '/styles.css',
    '/app-styles.css',
    '/responsive.css',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/icon-512.png',
];

// These patterns use network-first so users ALWAYS get the latest version
const NETWORK_FIRST_PATTERNS = [
    /\.html$/,
    /\.js$/,
    /\.css$/,
    /manifest\.json$/,
];

// Install: pre-cache core assets
self.addEventListener('install', event => {
    console.log('[OrganizO SW v2] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(CORE_ASSETS);
        }).then(() => {
            console.log('[OrganizO SW v2] Core assets cached.');
            return self.skipWaiting();
        })
    );
});

// Activate: delete ALL old caches from previous versions
self.addEventListener('activate', event => {
    console.log('[OrganizO SW v2] Activating, pruning old caches...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => !key.startsWith(CACHE_VERSION))
                    .map(key => {
                        console.log('[OrganizO SW v2] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: smart strategy per resource type
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    const url = event.request.url;

    // External fonts — network-first, no offline fallback needed
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // App logic files (HTML/JS/CSS) — NETWORK-FIRST
    // Users always get the latest version; cache is fallback for offline only
    const isAppFile = NETWORK_FIRST_PATTERNS.some(p => p.test(url));
    if (isAppFile) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then(cached => cached || caches.match('/app.html'));
                })
        );
        return;
    }

    // Static assets (images, icons) — CACHE-FIRST for performance
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match('/app.html'));
        })
    );
});
