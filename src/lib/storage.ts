import Storage from 'expo-sqlite/kv-store';

import { EMPTY_DATA, type SnapshotData, type SnapshotMeta } from '../types';

const K_INDEX = 'ig:index';
const K_SNAP = (id: string) => `ig:snap:${id}`;
const K_WHITELIST = 'ig:whitelist';
const K_SETTINGS = 'ig:settings';

export type Settings = {
  /** profil fotoğraflarını indir ve göster */
  avatars: boolean;
};

export const DEFAULT_SETTINGS: Settings = { avatars: true };

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await Storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Anlık görüntüler — en yeni en başta. */
export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const list = await readJson<SnapshotMeta[]>(K_INDEX, []);
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadSnapshot(id: string): Promise<SnapshotData | null> {
  const raw = await readJson<Partial<SnapshotData> | null>(K_SNAP(id), null);
  if (!raw) return null;
  return { ...EMPTY_DATA(), ...raw };
}

export async function saveSnapshot(data: SnapshotData, source: string): Promise<SnapshotMeta> {
  const meta: SnapshotMeta = {
    id: newId(),
    createdAt: Date.now(),
    source,
    followers: data.followers.length,
    following: data.following.length,
  };
  await Storage.setItem(K_SNAP(meta.id), JSON.stringify(data));
  const list = await readJson<SnapshotMeta[]>(K_INDEX, []);
  list.push(meta);
  await Storage.setItem(K_INDEX, JSON.stringify(list));
  return meta;
}

export async function deleteSnapshot(id: string): Promise<void> {
  const list = await readJson<SnapshotMeta[]>(K_INDEX, []);
  await Storage.setItem(K_INDEX, JSON.stringify(list.filter((s) => s.id !== id)));
  try {
    await Storage.removeItem(K_SNAP(id));
  } catch {
    // yoksa sorun değil
  }
}

export async function clearEverything(): Promise<void> {
  const list = await readJson<SnapshotMeta[]>(K_INDEX, []);
  for (const s of list) {
    try {
      await Storage.removeItem(K_SNAP(s.id));
    } catch {
      // yoksay
    }
  }
  await Storage.setItem(K_INDEX, '[]');
  await Storage.setItem(K_WHITELIST, '[]');
}

/** "Beyaz liste": listelerde işaretlenip gizlenen hesaplar. */
export async function getWhitelist(): Promise<string[]> {
  return readJson<string[]>(K_WHITELIST, []);
}

export async function setWhitelist(items: string[]): Promise<void> {
  await Storage.setItem(K_WHITELIST, JSON.stringify(items));
}

export async function getSettings(): Promise<Settings> {
  const kayitli = await readJson<Partial<Settings>>(K_SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...kayitli };
}

export async function saveSettings(s: Settings): Promise<void> {
  await Storage.setItem(K_SETTINGS, JSON.stringify(s));
}
