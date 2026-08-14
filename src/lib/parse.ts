import { strFromU8, unzipSync } from 'fflate';

import { type Bucket, EMPTY_DATA, type IgUser, type SnapshotData } from '../types';

/** Dosya adından hangi kovaya ait olduğunu bulan eşleşmeler. */
const MATCHERS: { re: RegExp; bucket: Bucket }[] = [
  { re: /^followers(_\d+)?\.(json|html)$/, bucket: 'followers' },
  { re: /^following(_\d+)?\.(json|html)$/, bucket: 'following' },
  { re: /^pending_follow_requests(_\d+)?\.(json|html)$/, bucket: 'pendingSent' },
  { re: /^follow_requests_you.?ve_received(_\d+)?\.(json|html)$/, bucket: 'requestsReceived' },
  { re: /^recently_unfollowed_(profiles|accounts)(_\d+)?\.(json|html)$/, bucket: 'recentlyUnfollowed' },
  { re: /^close_friends(_\d+)?\.(json|html)$/, bucket: 'closeFriends' },
  { re: /^blocked_(profiles|accounts)(_\d+)?\.(json|html)$/, bucket: 'blocked' },
];

/** connections.json (2020 öncesi çıktılar) */
const LEGACY_CONNECTIONS = /^connections\.json$/;

/** instagram.com/... altında kullanıcı adı olmayan yollar */
const NOT_USERNAMES = new Set([
  'p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'directory', 'about',
  'legal', 'developer', 'privacy', 'terms', 'help', 'direct', 'tv', 's', 'web',
  'challenge', 'oauth', 'graphql', 'emails', 'download',
]);

export type ParseResult = {
  data: SnapshotData;
  /** hangi kovalar gerçekten dosyadan geldi */
  found: Bucket[];
  /** adından tür anlaşılamayan dosyalar — kullanıcıya sorulur */
  unknown: { name: string; users: IgUser[] }[];
  /** taranan dosya adları (hata ayıklama / bilgi) */
  scanned: string[];
};

const basename = (p: string) => {
  const clean = p.replace(/\\/g, '/');
  const i = clean.lastIndexOf('/');
  return (i === -1 ? clean : clean.slice(i + 1)).toLowerCase();
};

const bucketFor = (name: string): Bucket | null => {
  const b = basename(name);
  for (const m of MATCHERS) if (m.re.test(b)) return m.bucket;
  return null;
};

const isInteresting = (name: string) => {
  const b = basename(name);
  if (b.startsWith('.') || b.startsWith('__macosx')) return false;
  return bucketFor(name) !== null || LEGACY_CONNECTIONS.test(b);
};

const usernameFromHref = (href: unknown): string => {
  if (typeof href !== 'string') return '';
  const m = href.match(/instagram\.com\/([^/?#"'\s]+)/i);
  if (!m) return '';
  const name = decodeURIComponent(m[1]);
  return NOT_USERNAMES.has(name.toLowerCase()) ? '' : name;
};

const cleanUsername = (raw: unknown): string => {
  if (typeof raw !== 'string') return '';
  const v = raw.trim().replace(/^@/, '');
  if (!v || v.length > 60) return '';
  // Instagram kullanıcı adı: harf, rakam, nokta, alt çizgi
  return /^[A-Za-z0-9._]+$/.test(v) ? v : '';
};

/** Instagram JSON çıktısındaki tek bir kayıt -> IgUser */
function entryToUser(e: any): IgUser | null {
  if (typeof e === 'string') {
    const u = cleanUsername(e);
    return u ? { u } : null;
  }
  if (!e || typeof e !== 'object') return null;

  const sld = Array.isArray(e.string_list_data) ? e.string_list_data : null;
  if (sld && sld.length) {
    const first = sld[0] ?? {};
    const u =
      cleanUsername(first.value) || usernameFromHref(first.href) || cleanUsername(e.title);
    if (u) {
      const t = typeof first.timestamp === 'number' && first.timestamp > 0 ? first.timestamp : undefined;
      return { u, t };
    }
  }
  const fromTitle = cleanUsername(e.title);
  if (fromTitle) return { u: fromTitle };
  const fromHref = usernameFromHref(e.href);
  if (fromHref) return { u: fromHref };
  return null;
}

/** Bir JSON gövdesinden hesap listesi çıkarır (dizi ya da relationships_* sarmalayıcı). */
function extractUsers(json: any): IgUser[] {
  if (Array.isArray(json)) return json.map(entryToUser).filter(Boolean) as IgUser[];
  if (json && typeof json === 'object') {
    // relationships_following / relationships_followers / ...
    const keys = Object.keys(json);
    const relKey = keys.find((k) => k.startsWith('relationships_') && Array.isArray(json[k]));
    if (relKey) return extractUsers(json[relKey]);
    const anyArray = keys.find((k) => Array.isArray(json[k]));
    if (anyArray) return extractUsers(json[anyArray]);
  }
  return [];
}

/** 2020 öncesi connections.json: { followers: {kullanici: tarih}, following: {...} } */
function parseLegacyConnections(json: any, into: SnapshotData, found: Set<Bucket>) {
  const map: Record<string, Bucket> = {
    followers: 'followers',
    following: 'following',
    close_friends: 'closeFriends',
    blocked_users: 'blocked',
    follow_requests_sent: 'pendingSent',
  };
  for (const [key, bucket] of Object.entries(map)) {
    const node = json?.[key];
    if (!node) continue;
    const users: IgUser[] = [];
    if (Array.isArray(node)) {
      for (const v of node) {
        const u = cleanUsername(v);
        if (u) users.push({ u });
      }
    } else if (typeof node === 'object') {
      for (const [name, date] of Object.entries(node)) {
        const u = cleanUsername(name);
        if (!u) continue;
        const ms = typeof date === 'string' ? Date.parse(date) : NaN;
        users.push({ u, t: Number.isNaN(ms) ? undefined : Math.floor(ms / 1000) });
      }
    }
    if (users.length) {
      into[bucket] = into[bucket].concat(users);
      found.add(bucket);
    }
  }
}

/** HTML çıktısından kullanıcı adlarını toplar. */
function parseHtmlUsers(html: string): IgUser[] {
  const out: IgUser[] = [];
  const seen = new Set<string>();
  const re = /href=["']https?:\/\/(?:www\.)?instagram\.com\/([^"'/?#]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let name = '';
    try {
      name = decodeURIComponent(m[1]);
    } catch {
      name = m[1];
    }
    const u = cleanUsername(name);
    if (!u || NOT_USERNAMES.has(u.toLowerCase())) continue;
    const k = u.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ u });
  }
  return out;
}

type RawFile = { name: string; bytes: Uint8Array };

const sniff = (name: string, bytes: Uint8Array): 'zip' | 'json' | 'html' | 'unknown' => {
  const n = name.toLowerCase();
  if (n.endsWith('.zip')) return 'zip';
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) return 'zip';
  if (n.endsWith('.json')) return 'json';
  if (n.endsWith('.html') || n.endsWith('.htm')) return 'html';
  // ilk boşluk olmayan karakter
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    const c = bytes[i];
    if (c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d || c === 0xef || c === 0xbb || c === 0xbf) continue;
    if (c === 0x7b || c === 0x5b) return 'json'; // { veya [
    if (c === 0x3c) return 'html'; // <
    break;
  }
  return 'unknown';
};

/** Seçilen dosyalardan tek bir anlık görüntü üretir. */
export function parseFiles(files: RawFile[]): ParseResult {
  const data = EMPTY_DATA();
  const found = new Set<Bucket>();
  const unknown: { name: string; users: IgUser[] }[] = [];
  const scanned: string[] = [];

  const addText = (name: string, text: string, kind: 'json' | 'html') => {
    scanned.push(name);
    const bucket = bucketFor(name);
    if (kind === 'html') {
      const users = parseHtmlUsers(text);
      if (!users.length) return;
      if (bucket) {
        data[bucket] = data[bucket].concat(users);
        found.add(bucket);
      } else {
        unknown.push({ name, users });
      }
      return;
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }
    if (LEGACY_CONNECTIONS.test(basename(name))) {
      parseLegacyConnections(json, data, found);
      return;
    }
    // dosya adı bilinmiyorsa gövdedeki anahtardan çıkar
    let target = bucket;
    if (!target && json && typeof json === 'object' && !Array.isArray(json)) {
      const k = Object.keys(json).find((x) => x.startsWith('relationships_'));
      if (k === 'relationships_followers') target = 'followers';
      else if (k === 'relationships_following') target = 'following';
      else if (k === 'relationships_follow_requests_sent') target = 'pendingSent';
      else if (k === 'relationships_follow_requests_received') target = 'requestsReceived';
      else if (k === 'relationships_unfollowed_users') target = 'recentlyUnfollowed';
      else if (k === 'relationships_close_friends') target = 'closeFriends';
      else if (k === 'relationships_blocked_users') target = 'blocked';
    }
    const users = extractUsers(json);
    if (!users.length) return;
    if (target) {
      data[target] = data[target].concat(users);
      found.add(target);
    } else {
      unknown.push({ name, users });
    }
  };

  for (const f of files) {
    const kind = sniff(f.name, f.bytes);
    if (kind === 'zip') {
      const entries = unzipSync(f.bytes, { filter: (e) => isInteresting(e.name) });
      const names = Object.keys(entries);
      if (!names.length) {
        throw new ZipContentError(f.name);
      }
      for (const name of names) {
        const b = basename(name);
        const k: 'json' | 'html' = b.endsWith('.html') || b.endsWith('.htm') ? 'html' : 'json';
        addText(name, strFromU8(entries[name]), k);
      }
    } else if (kind === 'json' || kind === 'html') {
      addText(f.name, strFromU8(f.bytes), kind);
    } else {
      scanned.push(f.name);
    }
  }

  // her kovada tekilleştir
  for (const key of Object.keys(data) as Bucket[]) data[key] = dedupe(data[key]);

  return { data, found: [...found], unknown, scanned };
}

export class ZipContentError extends Error {
  constructor(public fileName: string) {
    super('zip-content');
  }
}

/** Aynı kullanıcı adını teke indirir, en eski zaman damgasını korur. */
export function dedupe(users: IgUser[]): IgUser[] {
  const map = new Map<string, IgUser>();
  for (const u of users) {
    const k = u.u.toLowerCase();
    const prev = map.get(k);
    if (!prev) map.set(k, u);
    else if (u.t && (!prev.t || u.t < prev.t)) map.set(k, { ...prev, t: u.t });
  }
  return [...map.values()];
}
