import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  // Determine effective offline state (real offline or simulated)
  const isEffectiveOffline = !isOnline || isSimulatedOffline;

  // Active ping function to test real server/internet connectivity
  const testConnectivity = useCallback(async () => {
    if (isSimulatedOffline) {
      return false;
    }
    try {
      // Test connectivity by pinging health endpoint or lightweight product query with cache-busting
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`/api/products?limit=1&_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => {
        // Fallback to fetch if HEAD isn't permitted
        return fetch(`/api/products?limit=1&_t=${Date.now()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal
        });
      });

      clearTimeout(timeoutId);
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }, [isSimulatedOffline]);

  // Retry action when user clicks "Try Again"
  const retryConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    setConnectionError('');

    if (isSimulatedOffline) {
      // If simulated offline is active, explain to user
      setTimeout(() => {
        setIsCheckingConnection(false);
        setConnectionError('Simulation active: Click "Turn Online" or toggle test mode to reconnect.');
      }, 700);
      return;
    }

    const connected = await testConnectivity();
    setIsCheckingConnection(false);

    if (connected) {
      setIsOnline(true);
      setConnectionError('');
      setShowReconnectedToast(true);
      setTimeout(() => setShowReconnectedToast(false), 4000);
      // Reload product data or re-sync
      window.location.reload();
    } else {
      setIsOnline(false);
      setConnectionError('Still unable to connect. Please verify your Wi-Fi or mobile data.');
    }
  }, [isSimulatedOffline, testConnectivity]);

  // Toggle simulated offline for demonstration & testing
  const toggleSimulatedOffline = useCallback((forceState) => {
    setIsSimulatedOffline(prev => {
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      if (!next) {
        // Reconnecting
        setShowReconnectedToast(true);
        setTimeout(() => setShowReconnectedToast(false), 4000);
      }
      return next;
    });
    setConnectionError('');
  }, []);

  // Listen to browser network events
  useEffect(() => {
    const handleOnline = async () => {
      const trulyOnline = await testConnectivity();
      if (trulyOnline && !isSimulatedOffline) {
        setIsOnline(true);
        setConnectionError('');
        setShowReconnectedToast(true);
        setTimeout(() => setShowReconnectedToast(false), 4000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Custom app-level event dispatched by Axios interceptor if network fails
    const handleAppNetworkError = () => {
      if (!isSimulatedOffline) {
        setIsOnline(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('app:network-error', handleAppNetworkError);

    // Initial check if navigator says offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('app:network-error', handleAppNetworkError);
    };
  }, [isSimulatedOffline, testConnectivity]);

  return (
    <NetworkContext.Provider value={{
      isOnline: !isEffectiveOffline,
      isOffline: isEffectiveOffline,
      isSimulatedOffline,
      isCheckingConnection,
      connectionError,
      showReconnectedToast,
      retryConnection,
      toggleSimulatedOffline,
      setIsSimulatedOffline
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
