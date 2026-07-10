import { useState, useEffect } from 'react';
import { getDarkMode, setDarkMode } from '../store/storage';

export function useDarkMode() {
  const [dark, setDark] = useState(getDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    setDarkMode(dark);
  }, [dark]);

  return [dark, setDark] as const;
}
