/**
 * Web Push and Notification API Service for Aura Perfume AI
 */

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[Push] Notifications are not supported in this environment');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Notification permission granted status:', permission);
    return permission;
  } catch (err) {
    console.error('[Push] Error requesting notification permission:', err);
    return 'denied';
  }
}

export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await requestNotificationPermission();

  if (permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const defaultOptions: NotificationOptions = {
      body: 'Nuevos dupes y ofertas exclusivas disponibles en Aura.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: '/?action=search' },
      ...options,
    };

    if (registration.showNotification) {
      await registration.showNotification(title, defaultOptions);
      return true;
    } else {
      new Notification(title, defaultOptions);
      return true;
    }
  } catch (err) {
    console.error('[Push] Error triggering notification:', err);
    return false;
  }
}

export async function triggerSamplePerfumeAlert(): Promise<boolean> {
  return sendLocalNotification('¡Alerta de Dupe Encontrado! 🌟', {
    body: 'Vibrant Leather (Zara) está disponible como alternativa directa a Club de Nuit por solo 22.95€ (-45% ahorro).',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: '/?action=club_de_nuit' },
  });
}
