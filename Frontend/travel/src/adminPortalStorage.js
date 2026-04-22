import { useEffect, useMemo, useState } from "react";
import { getItem, setItem } from "./utils/memoryStorage";

const STORAGE_PREFIX = "admin_portal";

const toStorageKey = (key) => `${STORAGE_PREFIX}:${key}`;

const safeParse = (raw, fallback) => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const getStoredValue = (key, fallback) => {
  const raw = getItem(toStorageKey(key));
  return safeParse(raw, fallback);
};

export const setStoredValue = (key, value) => {
  setItem(toStorageKey(key), JSON.stringify(value));
};

export const useAdminStorage = (key, fallbackValue) => {
  const storageKey = useMemo(() => toStorageKey(key), [key]);
  const [value, setValue] = useState(() => getStoredValue(key, fallbackValue));

  useEffect(() => {
    setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue];
};

export const useAdminList = (key, fallbackList = []) => {
  const [list, setList] = useAdminStorage(key, fallbackList);

  const safeList = Array.isArray(list) ? list : [];

  const safeSetList = (nextValue) => {
    if (typeof nextValue === "function") {
      setList((previous) => {
        const normalized = Array.isArray(previous) ? previous : [];
        const computed = nextValue(normalized);
        return Array.isArray(computed) ? computed : normalized;
      });
      return;
    }

    setList(Array.isArray(nextValue) ? nextValue : safeList);
  };

  return [safeList, safeSetList];
};

export const getNextNumericId = (items, fallback = 1) => {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  const max = items.reduce((highest, item) => {
    const value = Number(item?.id);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);

  return max + 1;
};
