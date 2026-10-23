/* CPR : coque hors ligne seulement. Aucune réponse Supabase/API n’est stockée. */
const CACHE='cpr-shell-2026-10-23-v3';
const STATIC=['./','./index.html','./styles.css','./app.js','./auth.js','./config.js','./register-sw.js','./manifest.webmanifest','./vendor/supabase.min.js','./vendor/native-bridge.js','./assets/logo-cpr.png','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const path=new URL(event.request.url).pathname;
  if(!STATIC.some(resource=>path.endsWith(resource.replace(/^\.\//,''))) && !path.endsWith('/'))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
