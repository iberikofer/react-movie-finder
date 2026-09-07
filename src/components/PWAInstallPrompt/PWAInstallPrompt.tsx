import React, { useState, useEffect } from 'react';
import css from './PWAInstallPrompt.module.css';

export const PWAInstallPrompt: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className={css.pwaContainer}>
      <div
        className={css.offlineBadge}
        role="status"
        aria-live="polite"
        title="Offline mode: viewing cached watchlist and movies"
      >
        <span className={css.offlineDot} aria-hidden="true" />
        <span>Offline Mode</span>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
