// Startup and PWA recovery status; no personal data collected.
(function(){
 var ready=false,registration=null,updating=false,status=document.getElementById('bootStatus'),banner=document.getElementById('updateStatus');
 function fail(){if(ready)return;status.hidden=false;status.textContent='Le moteur ne s’est pas initialisé. Ouvrez cette page dans un navigateur récent ou utilisez le dépannage. ';var a=document.createElement('a');a.href='./recover.html';a.textContent='Réparer le cache';status.appendChild(a);}
 window.addEventListener('vibes-ready',function(){ready=true;status.hidden=true;});
 window.addEventListener('error',function(e){if(!ready&&(e.message||e.target&&e.target.tagName==='SCRIPT'))fail();},true);
 window.addEventListener('unhandledrejection',function(){if(!ready)fail();});
 setTimeout(fail,15000);
 if(!('serviceWorker' in navigator)||location.protocol==='file:'||new URLSearchParams(location.search).has('safe'))return;
 function announce(){if(registration&&registration.waiting&&navigator.serviceWorker.controller)banner.hidden=false;}
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(function(reg){registration=reg;announce();reg.addEventListener('updatefound',function(){var w=reg.installing;if(w)w.addEventListener('statechange',announce);});reg.update().catch(function(){});}).catch(function(){});
 document.getElementById('applyUpdate').onclick=function(){if(!registration||!registration.waiting)return;if(!window.confirm('Actualiser maintenant ? Les sessions non exportées seront perdues.'))return;updating=true;registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});};
 navigator.serviceWorker.addEventListener('controllerchange',function(){if(updating)location.reload();});
})();