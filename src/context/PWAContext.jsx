import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext();

export const PWAProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [swRegistered, setSwRegistered] = useState(false);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const checkStandalone = () => {
      if (typeof window === 'undefined') return;
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandaloneMode);
    };
    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA: beforeinstallprompt captured, ready to install');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstallStatus('Installed successfully!');
      console.log('PWA: PharmaLink installed successfully');
    };

    // Listen for online / offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check service worker registration
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setSwRegistered(true);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstallStatus('Installation accepted');
          setIsInstalled(true);
          setIsInstallable(false);
        } else {
          setInstallStatus('Installation dismissed');
        }
        setDeferredPrompt(null);
        return choiceResult.outcome;
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
    }
    return 'manual_instructions';
  };

  const updateCache = async () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        setSwRegistered(true);
        return true;
      }
    }
    return false;
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        swRegistered,
        installStatus,
        triggerInstall,
        updateCache,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    return {
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      swRegistered: false,
      installStatus: '',
      triggerInstall: () => Promise.resolve('manual_instructions'),
      updateCache: () => Promise.resolve(false),
    };
  }
  return context;
};

export default PWAContext;
