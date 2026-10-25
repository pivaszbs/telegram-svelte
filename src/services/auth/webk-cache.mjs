// Telegram Web K style persistent IndexedDB + in-memory Blob URL cache
// Caches:
// 1. Binary media blobs (peer avatars, stripped thumbs, full-size message photos)
// 2. Bootstrap state (folders, dialog list, archived summary, meProfile)
// 3. Per-chat message history snapshots for instant 0ms chat switching & reload

const DB_NAME = 'telegram-webk-cache-v1';
const DB_VERSION = 1;
const STORE_STATE = 'state';
const STORE_BLOBS = 'blobs';

const memoryState = new Map();
const memoryBlobs = new Map();
const blobUrlCache = new Map();

let dbPromise = null;

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE);
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export function bytesToCachedBlobUrl(key, bytes, mime = 'image/jpeg') {
  if (!bytes || !(bytes instanceof Uint8Array) || bytes.length === 0) return '';
  if (key && blobUrlCache.has(key)) {
    return blobUrlCache.get(key);
  }
  if (typeof URL === 'undefined') return '';
  try {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    if (key) {
      blobUrlCache.set(key, url);
      memoryBlobs.set(key, bytes);
    }
    return url;
  } catch {
    return '';
  }
}

export async function getCachedBlobUrl(key, mime = 'image/jpeg') {
  if (!key) return '';
  if (blobUrlCache.has(key)) {
    return blobUrlCache.get(key);
  }
  if (memoryBlobs.has(key)) {
    return bytesToCachedBlobUrl(key, memoryBlobs.get(key), mime);
  }
  const db = await openDb();
  if (!db) return '';
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const req = tx.objectStore(STORE_BLOBS).get(key);
      req.onsuccess = () => {
        const val = req.result;
        if (val instanceof Uint8Array && val.length > 0) {
          resolve(bytesToCachedBlobUrl(key, val, mime));
        } else if (val instanceof ArrayBuffer && val.byteLength > 0) {
          resolve(bytesToCachedBlobUrl(key, new Uint8Array(val), mime));
        } else {
          resolve('');
        }
      };
      req.onerror = () => resolve('');
    } catch {
      resolve('');
    }
  });
}

export async function putCachedBlob(key, bytes, mime = 'image/jpeg') {
  if (!key || !bytes || !(bytes instanceof Uint8Array) || bytes.length === 0) return '';
  // Force update if upgrading from a tiny thumb to hi-res
  if (blobUrlCache.has(key)) {
    const prev = memoryBlobs.get(key);
    if (!prev || bytes.length > prev.length) {
      try {
        const nextUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        blobUrlCache.set(key, nextUrl);
      } catch {}
    }
  }
  const url = bytesToCachedBlobUrl(key, bytes, mime);
  memoryBlobs.set(key, bytes);
  const db = await openDb();
  if (db) {
    try {
      const tx = db.transaction(STORE_BLOBS, 'readwrite');
      tx.objectStore(STORE_BLOBS).put(bytes, key);
    } catch {}
  }
  return url;
}

export async function getCachedState(key) {
  if (memoryState.has(key)) {
    return memoryState.get(key);
  }
  const db = await openDb();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE_STATE, 'readonly');
      const req = tx.objectStore(STORE_STATE).get(key);
      req.onsuccess = () => {
        if (req.result) memoryState.set(key, req.result);
        resolve(req.result || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putCachedState(key, value) {
  memoryState.set(key, value);
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_STATE, 'readwrite');
    tx.objectStore(STORE_STATE).put(value, key);
  } catch {}
}

export async function clearWebkCache() {
  memoryState.clear();
  memoryBlobs.clear();
  for (const url of blobUrlCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  blobUrlCache.clear();
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction([STORE_STATE, STORE_BLOBS], 'readwrite');
    tx.objectStore(STORE_STATE).clear();
    tx.objectStore(STORE_BLOBS).clear();
  } catch {}
}
