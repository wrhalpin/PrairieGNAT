import { openDB, type IDBPDatabase } from 'idb';
import type { Bundle } from '$lib/stix/types';

interface BundleRecord {
  id: string;
  name: string;
  bundle: Bundle;
  openedAt: number;
  source: 'file' | 'paste' | 'url' | 'taxii';
  sourceUrl?: string;
}

interface AppSettings {
  mode: 'standalone' | 'gnat';
  gnatInstanceUrl?: string;
  darkMode: 'auto' | 'light' | 'dark';
  lastSync?: number;
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

let db: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB('prairiegnat', 1, {
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
  });

  return db;
}

export async function saveBundleAsync(
  id: string,
  name: string,
  bundle: Bundle,
  source: 'file' | 'paste' | 'url' | 'taxii',
  sourceUrl?: string,
): Promise<void> {
  const idb = await getDb();
  await idb.put('bundles', {
    id,
    name,
    bundle,
    openedAt: Date.now(),
    source,
    sourceUrl,
  } as BundleRecord);
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
  await idb.delete('bundles', id);
  // Also clean up bookmarks and read state
  const bookmarks = await idb.getAllKeys('bookmarks');
  for (const key of bookmarks) {
    const [objId, bundleId] = key as string[];
    if (bundleId === id) {
      await idb.delete('bookmarks', key);
    }
  }
}

export async function saveSettingsAsync(settings: Partial<AppSettings>): Promise<void> {
  const idb = await getDb();
  const existing = (await idb.get('settings', 'app')) as AppSettings | undefined;
  await idb.put('settings', {
    key: 'app',
    ...existing,
    ...settings,
  });
}

export async function loadSettingsAsync(): Promise<AppSettings> {
  const idb = await getDb();
  const settings = (await idb.get('settings', 'app')) as AppSettings | undefined;
  return settings || {
    mode: 'standalone',
    darkMode: 'auto',
  };
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

export async function clearAllAsync(): Promise<void> {
  const idb = await getDb();
  await idb.clear('bundles');
  await idb.clear('bookmarks');
  await idb.clear('readState');
}
