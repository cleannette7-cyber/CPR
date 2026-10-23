// Service worker uniquement sur l’application web PWA, jamais dans Android/Electron.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname)) && !(window.Capacitor?.isNativePlatform?.())) {
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
