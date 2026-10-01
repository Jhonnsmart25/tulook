const CACHE = "tulook-v3";
const ARCHIVOS = ["./","./index.html","./manifest.json","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
self.addEventListener("install",(e)=>{e.waitUntil(caches.open(CACHE).then((c)=>c.addAll(ARCHIVOS)));self.skipWaiting()});
self.addEventListener("activate",(e)=>{e.waitUntil(caches.keys().then((ks)=>Promise.all(ks.filter((k)=>k!==CACHE).map((k)=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",(e)=>{
  if(e.request.method!=="GET")return;
  if(new URL(e.request.url).origin!==location.origin)return; // deja pasar llamadas al backend de Stripe sin cachearlas
  e.respondWith(caches.match(e.request).then((r)=>r||fetch(e.request).catch(()=>caches.match("./index.html"))));
});
