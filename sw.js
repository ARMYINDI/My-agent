const V = 'my-agent-v2';
const SHELL = ['./agent.html', './manifest.json', './icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin files aur jsdelivr (wllama library): cache se do, saath mein update karo.
// Model file (HuggingFace) ko wllama khud sambhalta hai, yahan nahi chhedte.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin && u.hostname !== 'cdn.jsdelivr.net') return;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request)
        .then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const r = await net;
      return r || new Response('offline', { status: 503 });
    })
  );
});
