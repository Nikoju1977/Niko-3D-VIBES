// V7.5.2: preserve the online application independently of the offline worker.
// Activate only after an update is accepted, or when previous clients close.
self.addEventListener('install',()=>{});
self.addEventListener('message',e=>{if(e.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('synapse-')||key.startsWith('niko-3d-vibes-'))await caches.delete(key);
 await self.clients.claim();
})()));
// Deliberately no fetch handler: online resources always follow the browser/network cache policy.
