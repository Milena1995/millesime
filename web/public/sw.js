// Service worker "basique" pour Millésime : permet de consulter la cave (et les photos déjà
// vues) même sans réseau, au lieu d'un écran d'erreur Safari. Ce n'est pas une synchro complète
// hors-ligne (l'ajout/édition de bouteilles nécessite toujours une connexion), juste un filet
// de sécurité pour la consultation en PWA.

const VERSION = "v1";
const PAGES_CACHE = `millesime-pages-${VERSION}`;
const ASSETS_CACHE = `millesime-assets-${VERSION}`;
const IMAGES_CACHE = `millesime-images-${VERSION}`;
const KNOWN_CACHES = [PAGES_CACHE, ASSETS_CACHE, IMAGES_CACHE];

const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/manifest.json"]))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => !KNOWN_CACHES.includes(key)).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isSupabaseImageRequest(url) {
  return url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname.startsWith("/apple-touch-icon")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Photos de bouteilles générées (Supabase Storage) : cache-first, pour revoir sa cave
  // hors-ligne avec les vraies photos déjà consultées.
  if (isSupabaseImageRequest(url)) {
    event.respondWith(
      caches.open(IMAGES_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Navigation (ouverture/rechargement d'une page) : réseau en priorité, on met à jour le
  // cache à chaque succès ; hors-ligne, on sert la dernière version connue de cette page,
  // sinon une page d'erreur "hors-ligne" dédiée plutôt que l'erreur générique de Safari.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const cached = await cache.match(request);
          return cached || cache.match(OFFLINE_URL);
        }
      })(),
    );
    return;
  }

  // Fichiers statiques Next.js (JS/CSS/polices, icônes) : cache-first pour que l'appli
  // continue de s'afficher correctement une fois hors-ligne.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      }),
    );
  }
});
