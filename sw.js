// OrganizO Service Worker v1.0
// Enables offline support and PWA installation

const CACHE_NAME = 'organizo-v1.0';
const CORE_ASSETS = [
    '/',
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

// Install: cache all core assets
self.addEventListener('install', event => {
    console.log('[OrganizO SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CORE_ASSETS);
        }).then(() => {
            console.log('[OrganizO SW] All assets cached.');
            return self.skipWaiting();
        })
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    console.log('[OrganizO SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests and browser extension requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // For Google Fonts and external resources, use network-first strategy
    if (event.request.url.includes('fonts.googleapis.com') ||
        event.request.url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // For everything else, cache-first strategy
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Cache valid responses
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // Offline fallback
                return caches.match('/app.html');
            });
        })
    );
});
