const CACHE_NAME = 'focus-pwa-v4'
const STATIC_FILES = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    // Cache the actual Vite-generated entry HTML and its hashed JS/CSS.
    // These requests may have run before the new worker took control.
    const response = await fetch('/index.html', { cache: 'no-store' })
    if (!response.ok) throw new Error('Cannot cache the FOCUS offline entry')
    await cache.put('/index.html', response.clone())
    const html = await response.text()
    const entryAssets = Array.from(
      html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
      (match) => match[1],
    )
    await Promise.allSettled(
      [...STATIC_FILES, ...new Set(entryAssets)].map(async (path) => {
        const asset = await fetch(path)
        if (asset.ok) await cache.put(path, asset)
      }),
    )
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names
      .filter((name) => name.startsWith('focus-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put('/index.html', response.clone())
        }
        return response
      } catch {
        return (await caches.match('/index.html')) ||
          Response.error()
      }
    })())
    return
  }

  // Cache only public app assets. Never persist same-origin API/user data
  // (and do not intercept cross-origin Supabase requests).
  const isAsset = url.pathname.startsWith('/assets/') ||
    STATIC_FILES.includes(url.pathname)
  if (!isAsset) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached
    const response = await fetch(request)
    if (response.ok) await cache.put(request, response.clone())
    return response
  })())
})

/**
 * Real server-delivered Web Push. A backgrounded iPhone cannot run timers or
 * schedule local notifications, but an installed PWA service worker can wake
 * briefly on receipt of a remote push from APNs.
 */
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('FOCUS · Session finished', {
      body: 'Your focus session is complete. Great work! Time for a break.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'focus-session-complete',
      data: { url: '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        return client.focus()
      }
    }
    return self.clients.openWindow('/')
  })())
})
