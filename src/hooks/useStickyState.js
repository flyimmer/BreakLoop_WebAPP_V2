import { useEffect, useRef, useState } from "react";

// Persisted state helper with optional persistence toggle
export function useStickyState(key, defaultValue, options = {}) {
  const { disablePersistence = false } = options;
  const defaultRef = useRef(defaultValue);

  const [value, setValue] = useState(() => {
    if (disablePersistence || typeof window === "undefined") {
      return defaultRef.current;
    }
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultRef.current;
  });

  useEffect(() => {
    if (disablePersistence || typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, disablePersistence]);

  useEffect(() => {
    if (disablePersistence) {
      setValue(defaultRef.current);
      return;
    }
    if (typeof window === "undefined") return;
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      try {
        setValue(JSON.parse(stickyValue));
      } catch (e) {
        setValue(defaultRef.current);
      }
    } else {
      setValue(defaultRef.current);
    }
  }, [disablePersistence, key]);

  return [value, setValue];
}

