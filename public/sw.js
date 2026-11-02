/**
 * Aura Perfume AI - Service Worker
 * Full lifecycle, Stale-While-Revalidate, Network-First API, Offline Fallback,
 * Background Sync and Web Push Notifications.
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `aura-static-${CACHE_VERSION}`;
const API_CACHE = `aura-api-${CACHE_VERSION}`;
const APP_SHELL_CACHE = `aura-shell-${CACHE_VERSION}`;

const APP_SHELL_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,400&display=swap'
];

// Offline Contingency Curated Data for API fallback
const OFFLINE_API_FALLBACK = {
  originalReference: "Club de Nuit Intense Man (Armaf) - Modo Local Offline",
  originalEstimatedPrice: 42,
  analysis: "Operando en modo sin conexión a internet. Mostrando alternativas recomendadas pre-almacenadas en la memoria local de tu dispositivo.",
  offlineFallback: true,
  recommendations: [
    {
      id: "zara-vibrant-leather",
      name: "Vibrant Leather Eau de Parfum",
      brand: "Zara",
      estimatedPrice: 22.95,
      savingsPercent: 45,
      matchScore: 92,
      olfactoryFamily: "Amaderado Cítrico Cuero",
      topNotes: ["Bergamota", "Limón"],
      heartNotes: ["Bambú", "Flor de azahar"],
      baseNotes: ["Cuero", "Pachulí"],
      longevityHours: "5 - 6 hrs",
      sillage: "Moderada / Cercana",
      bestOccasions: ["Oficina diaria", "Clima cálido", "Salidas casuales"],
      whyItMatches: "Disponible offline: El mismo ADN cítrico y cuero pero con una salida más limpia y económica.",
      pros: ["Económico", "Fresco y versátil", "Fácil de encontrar"],
      badge: "Opción Offline Guardada",
      vibeDescription: "Elegancia relajada con cítricos y cuero refinado."
    },
    {
      id: "lattafa-shaheen-silver",
      name: "Shaheen Silver",
      brand: "Lattafa Pride",
      estimatedPrice: 26.50,
      savingsPercent: 37,
      matchScore: 94,
      olfactoryFamily: "Cítrico Amaderado Especiado",
      topNotes: ["Bergamota", "Cassis"],
      heartNotes: ["Pachulí", "Rosa"],
      baseNotes: ["Musgo de roble", "Almizcle", "Ámbar"],
      longevityHours: "7 - 8 hrs",
      sillage: "Moderada a Fuerte",
      bestOccasions: ["Tardes", "Reuniones de trabajo"],
      whyItMatches: "Gran fijación con musgo de roble y pachulí que replica el secado ahumado distintivo.",
      pros: ["Presentación premium", "Excelente fijación", "Secado ahumado"],
      badge: "Mejor Fijación Offline",
      vibeDescription: "Aroma magnético y maduro con presencia envolvente."
    },
    {
      id: "afnan-supremacy-silver",
      name: "Supremacy Silver",
      brand: "Afnan",
      estimatedPrice: 32.00,
      savingsPercent: 24,
      matchScore: 96,
      olfactoryFamily: "Amaderado Floral Almizcle",
      topNotes: ["Manzana", "Bergamota", "Piña"],
      heartNotes: ["Rosa", "Abedul", "Jazmín"],
      baseNotes: ["Musgo de roble", "Almizcle", "Vainilla"],
      longevityHours: "8 - 10 hrs",
      sillage: "Fuerte",
      bestOccasions: ["Eventos formales", "Noches de fiesta"],
      whyItMatches: "La opción más refinada con notas de piña jugosa y humo de abedul.",
      pros: ["Aroma natural", "Proyección estelar", "Muy balanceado"],
      badge: "Calidad Superior",
      vibeDescription: "Proyección imponente con humo de abedul y notas frutales."
    }
  ]
};

// 1. INSTALL EVENT: Precache App Shell and immediately skipWaiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      // Use addAll with error resilience for external fonts
      return Promise.allSettled(
        APP_SHELL_RESOURCES.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Precache skipped for ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  const allowedCaches = [STATIC_CACHE, API_CACHE, APP_SHELL_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!allowedCaches.includes(cacheName)) {
            console.log(`[SW] Deleting obsolete cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Network with timeout
function fetchWithTimeout(request, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network request timed out'));
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// 3. FETCH EVENT: Stale-While-Revalidate for static & Network-First for API
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // A) Ignore non-HTTP(S) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // B) Dynamic API Endpoints: Network First with Fallback Offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          // Attempt network with 25s timeout for AI generation
          const networkResponse = await fetchWithTimeout(request.clone(), 25000);
          if (networkResponse && networkResponse.ok) {
            // Cache successful GET or POST clone for offline reuse
            if (request.method === 'GET' || request.method === 'POST') {
              const cache = await caches.open(API_CACHE);
              // For POST, use request url or custom cache key
              try {
                await cache.put(request.url, networkResponse.clone());
              } catch (e) {
                // Ignore POST caching errors in standard Cache API
              }
            }
            return networkResponse;
          }
          throw new Error('Network response not ok');
        } catch (error) {
          console.warn('[SW] API Network failed or timed out, evaluating offline fallback:', error);
          
          // Try matching cached API response
          const apiCache = await caches.open(API_CACHE);
          const cachedResponse = await apiCache.match(request.url);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return structured JSON fallback
          return new Response(JSON.stringify(OFFLINE_API_FALLBACK), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Aura-Offline-Fallback': 'true'
            }
          });
        }
      })()
    );
    return;
  }

  // C) HTML Page Navigations: Network First with Cache & Offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetchWithTimeout(request, 4000);
          return networkResponse;
        } catch (err) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const shellCache = await caches.open(APP_SHELL_CACHE);
          const offlinePage = await shellCache.match('/offline.html');
          if (offlinePage) return offlinePage;

          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // D) Static Assets (JS, CSS, Images, SVGs, Fonts): Stale-While-Revalidate
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      const fetchPromise = fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => null);

      // Return cached immediately if available, otherwise wait for network
      return cachedResponse || (await fetchPromise) || caches.match('/offline.html');
    })()
  );
});

// 4. BACKGROUND SYNC API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(processBackgroundSyncQueue());
  }
});

async function processBackgroundSyncQueue() {
  console.log('[SW] Processing background sync queue...');
  try {
    // Notify all active clients that background sync is triggered
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_TRIGGERED',
        timestamp: Date.now()
      });
    });
  } catch (err) {
    console.error('[SW] Background sync error:', err);
  }
}

// 5. PUSH NOTIFICATIONS API
self.addEventListener('push', (event) => {
  let data = {
    title: 'Aura Perfume AI',
    body: '¡Hay nuevas recomendaciones y dupes disponibles para tu presupuesto!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'explore', title: 'Explorar Dupes' },
      { action: 'close', title: 'Descartar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
