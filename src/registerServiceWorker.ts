/**
 * Service Worker Registration and Lifecycle Manager
 */

export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported by this browser.');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Service Worker successfully registered with scope:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[SW] New version available. Refresh to update.');
              } else {
                console.log('[SW] Content cached for offline use.');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[SW] Service Worker registration failed:', error);
      });
  });
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
