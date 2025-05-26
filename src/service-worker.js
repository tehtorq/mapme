import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const RUNTIME_CACHE = 'runtime-cache';

const ASSETS = [
	...build,
	...files,
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE && key !== RUNTIME_CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// Serve build files from cache
		if (ASSETS.includes(url.pathname)) {
			const match = await cache.match(url.pathname);
			if (match) return match;
		}

		// Try the network first for API requests
		if (url.pathname.startsWith('/api/')) {
			try {
				const response = await fetch(event.request);
				return response;
			} catch {
				// Offline - return a custom response
				return new Response(JSON.stringify({ error: 'Offline' }), {
					status: 503,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		// For everything else, try cache first, then network
		const cachedResponse = await caches.match(event.request);
		if (cachedResponse) {
			return cachedResponse;
		}

		try {
			const response = await fetch(event.request);
			const runtimeCache = await caches.open(RUNTIME_CACHE);
			
			// Cache successful responses for tiles and other resources
			if (response.ok && (url.hostname.includes('tile') || url.hostname.includes('openstreetmap'))) {
				runtimeCache.put(event.request, response.clone());
			}
			
			return response;
		} catch {
			// Offline fallback
			if (event.request.destination === 'document') {
				return cache.match('/');
			}
			
			// Return a 503 Service Unavailable for other requests
			return new Response('Service Unavailable', { status: 503 });
		}
	}

	event.respondWith(respond());
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});