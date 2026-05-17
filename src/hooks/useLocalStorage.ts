import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((val: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = val instanceof Function ? val(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        console.warn('localStorage write failed');
      }
      return next;
    });
  }, [key]);

  const remove = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setStoredValue, remove] as const;
}
