import { useEffect } from 'react';
import { createBackup } from '../store/storage';

export function useAutoBackup() {
  useEffect(() => {
    // Backup immediately
    createBackup();

    // Then every hour
    const interval = setInterval(createBackup, 60 * 60 * 1000);

    // Also backup before page unload
    const beforeUnload = () => createBackup();
    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
}
