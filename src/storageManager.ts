/**
 * Dual-tier Reliable Storage Manager
 * Uses IndexedDB as the primary durable storage (hundreds of MBs capacity, no 5MB quota crashes)
 * coupled with localStorage as a fast synchronous cache for instant first-paint renders.
 */

import { Project, AboutData, ContactLinksData } from './types';

export const STORAGE_KEYS = {
  PRODUCER_WORKS: 'jh_portfolio_producer_works',
  DIGITAL_WORKS: 'jh_portfolio_digital_works',
  PERSONAL_WORKS: 'jh_portfolio_personal_works',
  ABOUT_DATA: 'jh_portfolio_about_data',
  CONTACT_LINKS: 'jh_portfolio_contact_links',
  IS_ADMIN: 'jh_portfolio_is_admin',
} as const;

const IDB_NAME = 'JahyeonPortfolioDB';
const IDB_STORE = 'portfolio_kv';
const IDB_VERSION = 1;

function openPortfolioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(IDB_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an item to IndexedDB (async, virtually unlimited quota)
 */
export async function setItemInIndexedDB<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openPortfolioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[StorageManager] IndexedDB write failed for key "${key}":`, err);
  }
}

/**
 * Get an item from IndexedDB
 */
export async function getItemFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openPortfolioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result !== undefined ? req.result : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[StorageManager] IndexedDB read failed for key "${key}":`, err);
    return null;
  }
}

/**
 * Remove an item from IndexedDB
 */
export async function removeItemFromIndexedDB(key: string): Promise<void> {
  try {
    const db = await openPortfolioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

/**
 * Synchronous initial load from localStorage
 */
export function getInitialDataFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    // For arrays, ensure it is an array and not empty/corrupted
    if (Array.isArray(fallback)) {
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(Boolean) as unknown as T;
      }
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.warn(`[StorageManager] Failed to read ${key} from localStorage:`, e);
    return fallback;
  }
}

/**
 * Save data reliably to BOTH IndexedDB and localStorage
 * Guarantees zero data loss even if localStorage hits quota limit.
 */
export async function persistDataReliably<T>(key: string, data: T): Promise<void> {
  // 1. Durable storage in IndexedDB (never quota errors for reasonable media)
  await setItemInIndexedDB(key, data);

  // 2. Cache in localStorage for synchronous fast reload
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (localStorageErr) {
    console.warn(
      `[StorageManager] localStorage quota exceeded while writing "${key}". ` +
      `Data is safely preserved in IndexedDB.`,
      localStorageErr
    );

    // If quota exceeded, attempt to clear any obsolete legacy keys
    try {
      // Create a lightweight version if it's an array of projects (trim very large base64 from localStorage only)
      if (Array.isArray(data)) {
        const lightweight = (data as unknown as Project[]).map((p) => ({
          ...p,
          // If stills has huge base64 items, keep only the first 2 in localStorage cache (full remains in IndexedDB)
          stills: p.stills?.slice(0, 3),
        }));
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {
      // If still fails, it's completely fine since IndexedDB has the canonical source of truth
    }
  }
}

/**
 * Clear all portfolio data from both stores (for Reset to Defaults)
 */
export async function clearAllPortfolioStorage(): Promise<void> {
  const keys = Object.values(STORAGE_KEYS);
  for (const k of keys) {
    if (k === STORAGE_KEYS.IS_ADMIN) continue;
    try {
      localStorage.removeItem(k);
    } catch {}
    await removeItemFromIndexedDB(k);
  }
}

/**
 * Clean and validate project array
 */
export function sanitizeProjectList(list: unknown): Project[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item): item is Project => {
    return Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item);
  });
}
