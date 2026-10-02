// kt's goal report: keeps a copy of the page on the phone so it opens offline.
// her data never touches this file; it arrives in the link (#d=...) from the shortcut.
// bump the version when you deploy changes, so old copies get replaced.
const CACHE = "kt-report-v4";
const FILES = ["./", "./index.html", "./elephant.webp"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    // the page: try github first so updates show up, fall back to the saved copy
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // everything else (the elephant image): saved copy first, then github
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
