import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's generic default banner
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt intercepted and saved.');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Application was successfully installed.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      // Trigger native browser install prompt dialog
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the installation prompt.');
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('[PWA] User dismissed the installation prompt.');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    triggerInstall,
  };
}
