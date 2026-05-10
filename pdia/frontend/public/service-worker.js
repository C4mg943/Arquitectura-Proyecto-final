/* global self, caches, fetch */

// Bump este número cuando quieras invalidar las cachés activas.
const CACHE_VERSION = 'v2'
const APP_SHELL_CACHE = `pdia-shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `pdia-runtime-${CACHE_VERSION}`
const API_CACHE = `pdia-api-${CACHE_VERSION}`

// Recursos mínimos para que la app arranque offline.
// El bundle de Vite se cachea dinámicamente la primera vez que se visita online
// (stale-while-revalidate), de modo que no dependemos del hash del build.
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/')
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.woff2') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.ico'))
  )
}

// Network-first con fallback a caché — útil para GETs de la API:
// intenta siempre traer fresco, y si no hay red usa la última copia vista.
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone()).catch(() => undefined)
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    throw new Error('offline-and-not-cached')
  }
}

// Stale-while-revalidate: responde con caché (rápido) y actualiza en background.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone()).catch(() => undefined)
      }
      return response
    })
    .catch(() => undefined)

  return cached || (await fetchPromise) || Response.error()
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Ignorar otros orígenes (fuentes, etc.) para no interceptarlos sin necesidad.
  if (url.origin !== self.location.origin) return

  // Navegaciones (HTML): intentar network, caer a index.html para la SPA offline
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => undefined)
          return response
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html')
          return cachedIndex || caches.match('/')
        }),
    )
    return
  }

  // Peticiones GET a la API: network-first con fallback a caché
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // Assets estáticos y bundle Vite: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
    return
  }

  // Fallback general: intentar caché, luego red
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => Response.error())),
  )
})
