const C = "burj-v8";
const FILES = ["/", "/index.html", "/style.css", "/app.js", "/art.js", "/img/c3-map.svg", "/img/c3-timeline.svg", "/img/c3-clue-lock.svg", "/img/c3-clue-camera.svg", "/img/c3-clue-frosting.svg", "/img/c3-clue-hook.svg", "/data.js", "/narrator"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(C).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
