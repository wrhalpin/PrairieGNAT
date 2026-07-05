import { openDB, type IDBPDatabase } from 'idb';
import type { Bundle } from '$lib/stix/types';

interface BundleRecord {
  id: string;
  name: string;
  bundle: Bundle;
  openedAt: number;
  source: 'file' | 'paste' | 'url' | 'taxii' | 'share';
  sourceUrl?: string;
}

interface AppSettings {
  mode: 'standalone' | 'gnat';
  gnatInstanceUrl?: string;
  gnatApiKey?: string;
  darkMode: 'auto' | 'light' | 'dark';
  lastSync?: number;
  lastFeedSync?: number;
}

interface BookmarkRecord {
  objectId: string;
  bundleId: string;
  bookmarkedAt: number;
}

interface ReadStateRecord {
  objectId: string;
  bundleId: string;
  isRead: boolean;
}

// Cache the open *promise*, not the handle: concurrent first calls share one
// connection, and a terminated connection (iOS Safari kills IndexedDB when
// the PWA is backgrounded) transparently reopens on the next call.
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB('prairiegnat', 1, {
      upgrade(db) {
        // Bundles store
        if (!db.objectStoreNames.contains('bundles')) {
          const bundleStore = db.createObjectStore('bundles', { keyPath: 'id' });
          bundleStore.createIndex('openedAt', 'openedAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: ['objectId', 'bundleId'] });
        }

        // Read state store
        if (!db.objectStoreNames.contains('readState')) {
          db.createObjectStore('readState', { keyPath: ['objectId', 'bundleId'] });
        }
      },
      blocking() {
        // Another tab is upgrading to a newer version; close so it can.
        dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

export async function saveBundleAsync(
  id: string,
  name: string,
  bundle: Bundle,
  source: 'file' | 'paste' | 'url' | 'taxii' | 'share',
  sourceUrl?: string,
): Promise<void> {
  const idb = await getDb();
  try {
    await idb.put('bundles', {
      id,
      name,
      bundle,
      openedAt: Date.now(),
      source,
      sourceUrl,
    } as BundleRecord);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error('Storage is full — delete old bundles or free up device space, then retry');
    }
    throw e;
  }
}

export async function loadBundlesAsync(): Promise<BundleRecord[]> {
  const idb = await getDb();
  const allBundles = await idb.getAll('bundles');
  return allBundles.sort((a, b) => b.openedAt - a.openedAt);
}

export async function loadBundleAsync(id: string): Promise<BundleRecord | undefined> {
  const idb = await getDb();
  return idb.get('bundles', id);
}

export async function deleteBundleAsync(id: string): Promise<void> {
  const idb = await getDb();
  // Single transaction: the bundle, its bookmarks, and its read state go
  // together or not at all.
  const tx = idb.transaction(['bundles', 'bookmarks', 'readState'], 'readwrite');
  await tx.objectStore('bundles').delete(id);
  for (const storeName of ['bookmarks', 'readState'] as const) {
    const store = tx.objectStore(storeName);
    for (const key of await store.getAllKeys()) {
      const [, bundleId] = key as [string, string];
      if (bundleId === id) {
        await store.delete(key);
      }
    }
  }
  await tx.done;
}

export async function saveSettingsAsync(settings: Partial<AppSettings>): Promise<void> {
  const idb = await getDb();
  // Read-modify-write inside one transaction so concurrent saves (e.g. a feed
  // sync writing lastFeedSync while the user saves credentials) can't lose
  // each other's fields.
  const tx = idb.transaction('settings', 'readwrite');
  const existing = (await tx.store.get('app')) as AppSettings | undefined;
  await tx.store.put({
    ...existing,
    ...settings,
    key: 'app',
  });
  await tx.done;
}

export async function loadSettingsAsync(): Promise<AppSettings> {
  const idb = await getDb();
  const settings = (await idb.get('settings', 'app')) as AppSettings | undefined;
  return settings || {
    mode: 'standalone',
    darkMode: 'auto',
  };
}

export async function getGnatConfigAsync(): Promise<{ url: string; apiKey: string } | null> {
  const settings = await loadSettingsAsync();
  if (settings.mode === 'gnat' && settings.gnatInstanceUrl && settings.gnatApiKey) {
    return {
      url: settings.gnatInstanceUrl,
      apiKey: settings.gnatApiKey,
    };
  }
  return null;
}

export async function addBookmarkAsync(
  bundleId: string,
  objectId: string,
): Promise<void> {
  const idb = await getDb();
  await idb.put('bookmarks', {
    bundleId,
    objectId,
    bookmarkedAt: Date.now(),
  } as BookmarkRecord);
}

export async function removeBookmarkAsync(
  bundleId: string,
  objectId: string,
): Promise<void> {
  const idb = await getDb();
  await idb.delete('bookmarks', [objectId, bundleId]);
}

export async function getBookmarksAsync(
  bundleId: string,
): Promise<Set<string>> {
  const idb = await getDb();
  const allBookmarks = await idb.getAll('bookmarks');
  const bookmarked = new Set<string>();
  for (const bm of allBookmarks) {
    if (bm.bundleId === bundleId) {
      bookmarked.add(bm.objectId);
    }
  }
  return bookmarked;
}

export async function getAllBookmarkCountsAsync(): Promise<Record<string, number>> {
  const idb = await getDb();
  const allBookmarks = await idb.getAll('bookmarks');
  const counts: Record<string, number> = {};
  for (const bm of allBookmarks) {
    counts[bm.bundleId] = (counts[bm.bundleId] || 0) + 1;
  }
  return counts;
}

export async function setReadStateAsync(
  bundleId: string,
  objectId: string,
  isRead: boolean,
): Promise<void> {
  const idb = await getDb();
  await idb.put('readState', {
    bundleId,
    objectId,
    isRead,
  } as ReadStateRecord);
}

export async function getReadStateAsync(
  bundleId: string,
): Promise<Set<string>> {
  const idb = await getDb();
  const allReadStates = await idb.getAll('readState');
  const readObjects = new Set<string>();
  for (const state of allReadStates) {
    if (state.bundleId === bundleId && state.isRead) {
      readObjects.add(state.objectId);
    }
  }
  return readObjects;
}

export interface FeedCache {
  reports: unknown[];
  syncTime: string | null;
}

export async function saveFeedCacheAsync(reports: unknown[], syncTime: string): Promise<void> {
  const idb = await getDb();
  await idb.put('settings', { key: 'feed-cache', reports, syncTime });
}

export async function getFeedCacheAsync(): Promise<FeedCache | null> {
  const idb = await getDb();
  const cached = await idb.get('settings', 'feed-cache');
  if (!cached) return null;
  return { reports: cached.reports || [], syncTime: cached.syncTime || null };
}

export async function clearAllAsync(): Promise<void> {
  const idb = await getDb();
  await idb.clear('bundles');
  await idb.clear('bookmarks');
  await idb.clear('readState');
  await idb.delete('settings', 'feed-cache');
}
