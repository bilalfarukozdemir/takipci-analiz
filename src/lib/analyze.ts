import type { CatKey, Category, IgUser, SnapshotData } from '../types';
import { C } from '../theme';

const key = (u: IgUser) => u.u.toLowerCase();

const toMap = (list: IgUser[]) => {
  const m = new Map<string, IgUser>();
  for (const u of list) m.set(key(u), u);
  return m;
};

/** a içinde olup b içinde olmayanlar */
const diff = (a: IgUser[], b: IgUser[]) => {
  const bs = new Set(b.map(key));
  return a.filter((u) => !bs.has(key(u)));
};

const intersect = (a: IgUser[], b: IgUser[]) => {
  const bs = new Set(b.map(key));
  return a.filter((u) => bs.has(key(u)));
};

export type Analysis = Record<CatKey, IgUser[]>;

export function analyze(current: SnapshotData, previous?: SnapshotData | null): Analysis {
  const followers = current.followers;
  const following = current.following;

  const prevFollowers = previous?.followers ?? [];
  const prevFollowing = previous?.following ?? [];

  return {
    notFollowingBack: diff(following, followers),
    fans: diff(followers, following),
    mutual: intersect(followers, following),
    lostFollowers: previous ? diff(prevFollowers, followers) : [],
    newFollowers: previous ? diff(followers, prevFollowers) : [],
    stoppedFollowing: previous ? diff(prevFollowing, following) : [],
    startedFollowing: previous ? diff(following, prevFollowing) : [],
    pendingSent: current.pendingSent,
    requestsReceived: current.requestsReceived,
    recentlyUnfollowed: current.recentlyUnfollowed,
    closeFriends: current.closeFriends,
    blocked: current.blocked,
    followers,
    following,
  };
}

/** Kullanıcı adı -> takip zamanı eşlemesi (liste ekranında tarih göstermek için). */
export function timestampIndex(data: SnapshotData) {
  const followers = toMap(data.followers);
  const following = toMap(data.following);
  return (u: IgUser, cat: CatKey): number | undefined => {
    if (u.t) return u.t;
    const k = key(u);
    if (cat === 'fans' || cat === 'newFollowers' || cat === 'followers' || cat === 'mutual') {
      return followers.get(k)?.t;
    }
    return following.get(k)?.t ?? followers.get(k)?.t;
  };
}

export const CATEGORIES: Category[] = [
  {
    key: 'lostFollowers',
    title: 'Takipten çıkanlar',
    desc: 'Önceki yüklemede seni takip ediyordu, artık etmiyor',
    icon: '💔',
    color: C.red,
    needsDiff: true,
  },
  {
    key: 'notFollowingBack',
    title: 'Geri takip etmeyenler',
    desc: 'Sen takip ediyorsun, o seni etmiyor',
    icon: '➡️',
    color: C.orange,
    tsLabel: 'Takip başlangıcı',
  },
  {
    key: 'fans',
    title: 'Hayranların',
    desc: 'Seni takip ediyor, sen onu etmiyorsun',
    icon: '⭐',
    color: C.yellow,
    tsLabel: 'Seni takip ettiği tarih',
  },
  {
    key: 'newFollowers',
    title: 'Yeni takipçiler',
    desc: 'Son yüklemeden bu yana seni takibe başlayanlar',
    icon: '🎉',
    color: C.green,
    needsDiff: true,
    tsLabel: 'Seni takip ettiği tarih',
  },
  {
    key: 'mutual',
    title: 'Karşılıklı takip',
    desc: 'İkiniz de birbirinizi takip ediyorsunuz',
    icon: '🤝',
    color: C.teal,
    tsLabel: 'Seni takip ettiği tarih',
  },
  {
    key: 'pendingSent',
    title: 'Bekleyen isteklerin',
    desc: 'Takip isteği gönderdin, henüz onaylanmadı',
    icon: '⏳',
    color: C.blue,
  },
  {
    key: 'requestsReceived',
    title: 'Sana gelen istekler',
    desc: 'Seni takip etmek isteyip beklemede olanlar',
    icon: '📥',
    color: C.blue,
  },
  {
    key: 'stoppedFollowing',
    title: 'Senin bıraktıkların',
    desc: 'Son yüklemeden bu yana takibi bıraktığın hesaplar',
    icon: '🚪',
    color: C.pink,
    needsDiff: true,
  },
  {
    key: 'startedFollowing',
    title: 'Yeni takip ettiklerin',
    desc: 'Son yüklemeden bu yana takibe başladığın hesaplar',
    icon: '➕',
    color: C.purple,
    needsDiff: true,
  },
  {
    key: 'recentlyUnfollowed',
    title: 'Yakında bıraktıkların',
    desc: "Instagram'ın kaydettiği, son zamanlarda takipten çıktığın hesaplar",
    icon: '🕘',
    color: C.dim,
  },
  {
    key: 'closeFriends',
    title: 'Yakın arkadaşlar',
    desc: 'Yakın arkadaş listendeki hesaplar',
    icon: '💚',
    color: C.green,
  },
  {
    key: 'blocked',
    title: 'Engellediklerin',
    desc: 'Engellediğin hesaplar',
    icon: '🚫',
    color: C.red,
  },
  {
    key: 'followers',
    title: 'Tüm takipçilerin',
    desc: 'Seni takip eden herkes',
    icon: '👥',
    color: C.blue,
    tsLabel: 'Seni takip ettiği tarih',
  },
  {
    key: 'following',
    title: 'Tüm takip ettiklerin',
    desc: 'Senin takip ettiğin herkes',
    icon: '👤',
    color: C.purple,
    tsLabel: 'Takip başlangıcı',
  },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CatKey,
  Category
>;
