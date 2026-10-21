import Storage from 'expo-sqlite/kv-store';

import { isLangCode, type LangCode } from '../i18n/languages';
import { EMPTY_DATA, type SnapshotData, type SnapshotMeta } from '../types';

const K_INDEX = 'ig:index';
const K_SNAP = (id: string) => `ig:snap:${id}`;
const K_WHITELIST = 'ig:whitelist';
const K_SETTINGS = 'ig:settings';
const K_LANGUAGE = 'ig:language';
const K_REVIEW = 'ig:reviewAskedAt';
const K_RTL_RELOAD = 'ig:rtlReloadAt';

/** Dil tercihi: 'system' cihaz diline uyar, dil kodu manuel zorlamadır. */
export type LanguagePreference = 'system' | LangCode;

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

/** Kullanıcının manuel dil seçimi. Varsayılan 'system' (cihaz diline uy). */
export async function getLanguagePreference(): Promise<LanguagePreference> {
  const raw = await Storage.getItem(K_LANGUAGE);
  if (raw === 'system' || isLangCode(raw)) return raw;
  return 'system';
}

export async function setLanguagePreference(pref: LanguagePreference): Promise<void> {
  await Storage.setItem(K_LANGUAGE, pref);
}

/** Play puan penceresinin en son istendiği zaman (ms); hiç istenmediyse 0. */
export async function getReviewAskedAt(): Promise<number> {
  const raw = Number(await Storage.getItem(K_REVIEW));
  return Number.isFinite(raw) ? raw : 0;
}

export async function setReviewAskedAt(ms: number): Promise<void> {
  await Storage.setItem(K_REVIEW, String(ms));
}

/** Yön değişimi için son yeniden yükleme zamanı (ms); döngüye girmemek için. */
export async function getRtlReloadAt(): Promise<number> {
  const raw = Number(await Storage.getItem(K_RTL_RELOAD));
  return Number.isFinite(raw) ? raw : 0;
}

export async function setRtlReloadAt(ms: number): Promise<void> {
  await Storage.setItem(K_RTL_RELOAD, String(ms));
}
