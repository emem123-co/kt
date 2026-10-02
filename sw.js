// kt's goal report: keeps a copy of the page on the phone so it opens offline.
// her data never touches this file; it arrives in the link (#d=...) from the shortcut.
// bump the version when you deploy changes, so old copies get replaced.
const CACHE = "kt-report-v8";
const FILES = [
  "./", "./index.html",
  "./theme.css", "./report.css", "./sheet.css",
  "./elephant.webp", "./nodata-elephant.webp"
];

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

// online: always fetch the latest file from github and refresh the saved copy.
// offline: hand back the saved copy instead.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === "navigate" ? "./index.html" : req;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
        return res;
      })
      .catch(() => caches.match(key).then(r => r || caches.match("./")))
  );
});
