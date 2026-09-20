
const VERSION="gassien-v2.0.0";
const STATIC=["./","./index.html","./styles.css","./app.js","./config.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(STATIC)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.mode==="navigate" || u.pathname.endsWith("/index.html") || u.pathname.endsWith("/app.js") || u.pathname.endsWith("/styles.css") || u.pathname.endsWith("/config.js")){
   e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
 }else{
   e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
 }
});
