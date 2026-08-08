// Service worker for Prashasti Sanchaya — makes the app installable and
// usable offline once a page has been visited once online.
//
// Regenerate the PRECACHE_URLS list (via the same script used to write this
// file) whenever an award is added or a data file changes, and bump
// CACHE_VERSION so returning visitors actually pick up the new files instead
// of continuing to serve a stale cache indefinitely.

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `prashasti-shell-${CACHE_VERSION}`;
const DATA_CACHE = `prashasti-data-${CACHE_VERSION}`;
const RUNTIME_CACHE = `prashasti-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "sources.html",
  "css/style.css",
  "js/i18n.js",
  "js/app.js",
  "js/map.js",
  "js/wikidraft.js",
  "js/representation.js",
  "js/sources.js",
  "manifest.json",
  "img/favicon-32x32.png",
  "img/android-chrome-192x192.png",
  "img/icon-512.png",
  "img/icon-512-maskable.png",
  "img/logo.png",
  "data/awards.json",
  "data/awards/akkamahadevi-award.json",
  "data/awards/akkamahadevi-award_district_counts.json",
  "data/awards/arjuna-award-karnataka.json",
  "data/awards/arjuna-award-karnataka_district_counts.json",
  "data/awards/attimabbe-award.json",
  "data/awards/basava-puraskara-award.json",
  "data/awards/basava-puraskara_district_counts.json",
  "data/awards/bharat-ratna-kannadiga.json",
  "data/awards/dronacharya-award-karnataka.json",
  "data/awards/dronacharya-award-karnataka_district_counts.json",
  "data/awards/ganayogi-gawai-award.json",
  "data/awards/ganayogi-gawai-award_district_counts.json",
  "data/awards/jakanachari-award.json",
  "data/awards/jakanachari-award_district_counts.json",
  "data/awards/jnanpith-kannada.json",
  "data/awards/kanakashree-award.json",
  "data/awards/kanakashree-award_district_counts.json",
  "data/awards/karnataka-ratna.json",
  "data/awards/karnataka-state-film-award-best-film.json",
  "data/awards/kempegowda-award.json",
  "data/awards/kempegowda-award_district_counts.json",
  "data/awards/khel-ratna-karnataka.json",
  "data/awards/khel-ratna-karnataka_district_counts.json",
  "data/awards/nadoja.json",
  "data/awards/national-film-award-best-kannada-film.json",
  "data/awards/padma-awards-karnataka.json",
  "data/awards/pampa-award.json",
  "data/awards/rajyotsava-prashasti.json",
  "data/awards/sahitya-akademi-kannada.json",
  "data/awards/sangolli-rayanna-award.json",
  "data/awards/sangolli-rayanna-award_district_counts.json",
  "data/awards/t-chowdaiah-award.json",
  "data/awards/t-chowdaiah-award_district_counts.json",
  "data/awards/varnashilpi-venkatappa-award.json",
  "data/awards/varnashilpi-venkatappa-award_district_counts.json",
  "data/district_counts.json",
  "data/karnataka-districts.geojson",
  "data/karnataka-state.geojson",
  "data/representation.json",
  "data/sources.json"
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // addAll aborts entirely if any single request fails (e.g. offline
    // first install, or a stale filename after a rename) -- fall back to
    // best-effort per-file caching so one bad entry doesn't sink the rest.
    await Promise.allSettled(
      PRECACHE_URLS.map(url => cache.add(url).catch(() => {}))
    );
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, DATA_CACHE, RUNTIME_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter(n => !keep.has(n)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

function isDataRequest(url) {
  return url.pathname.includes('/data/') &&
    (url.pathname.endsWith('.json') || url.pathname.endsWith('.geojson'));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Recipient/award/source data: prefer the network (so an online visitor
  // always sees the latest data), fall back to whatever was last cached
  // when there's no connection.
  if (sameOrigin && isDataRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await cache.match(req);
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  // App shell (HTML/CSS/JS/icons): cache-first for instant loads, quietly
  // refreshing the cache in the background on every successful fetch.
  if (sameOrigin) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) {
        network; // refresh in background, don't block on it
        return cached;
      }
      const res = await network;
      if (res) return res;
      // Offline, nothing cached for this exact URL, and it's a page
      // navigation -- serve the shell so the app still boots.
      if (req.mode === 'navigate') {
        const fallback = await cache.match('index.html');
        if (fallback) return fallback;
      }
      return new Response('Offline and not cached yet.', { status: 503, statusText: 'Offline' });
    })());
    return;
  }

  // Cross-origin (Google Fonts, Leaflet's CDN, CARTO map tiles): best-effort
  // runtime caching so a page someone has already loaded once keeps working
  // offline, without trying to pre-download an entire tile set up front.
  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(req);
    if (cached) {
      fetch(req).then(res => { if (res) cache.put(req, res.clone()); }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res) cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (cached) return cached;
      throw err;
    }
  })());
});
