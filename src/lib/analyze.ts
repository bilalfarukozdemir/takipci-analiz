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

/** Başlık/açıklama/tsLabel artık i18n anahtarı — gerçek metin src/i18n/{tr,en}.json içinde. */
export const CATEGORIES: Category[] = [
  {
    key: 'lostFollowers',
    titleKey: 'categories.lostFollowers.title',
    descKey: 'categories.lostFollowers.desc',
    icon: '💔',
    color: C.red,
    needsDiff: true,
  },
  {
    key: 'notFollowingBack',
    titleKey: 'categories.notFollowingBack.title',
    descKey: 'categories.notFollowingBack.desc',
    icon: '➡️',
    color: C.orange,
    tsLabelKey: 'categories.notFollowingBack.tsLabel',
  },
  {
    key: 'fans',
    titleKey: 'categories.fans.title',
    descKey: 'categories.fans.desc',
    icon: '⭐',
    color: C.yellow,
    tsLabelKey: 'categories.fans.tsLabel',
  },
  {
    key: 'newFollowers',
    titleKey: 'categories.newFollowers.title',
    descKey: 'categories.newFollowers.desc',
    icon: '🎉',
    color: C.green,
    needsDiff: true,
    tsLabelKey: 'categories.newFollowers.tsLabel',
  },
  {
    key: 'mutual',
    titleKey: 'categories.mutual.title',
    descKey: 'categories.mutual.desc',
    icon: '🤝',
    color: C.teal,
    tsLabelKey: 'categories.mutual.tsLabel',
  },
  {
    key: 'pendingSent',
    titleKey: 'categories.pendingSent.title',
    descKey: 'categories.pendingSent.desc',
    icon: '⏳',
    color: C.blue,
  },
  {
    key: 'requestsReceived',
    titleKey: 'categories.requestsReceived.title',
    descKey: 'categories.requestsReceived.desc',
    icon: '📥',
    color: C.blue,
  },
  {
    key: 'stoppedFollowing',
    titleKey: 'categories.stoppedFollowing.title',
    descKey: 'categories.stoppedFollowing.desc',
    icon: '🚪',
    color: C.pink,
    needsDiff: true,
  },
  {
    key: 'startedFollowing',
    titleKey: 'categories.startedFollowing.title',
    descKey: 'categories.startedFollowing.desc',
    icon: '➕',
    color: C.purple,
    needsDiff: true,
  },
  {
    key: 'recentlyUnfollowed',
    titleKey: 'categories.recentlyUnfollowed.title',
    descKey: 'categories.recentlyUnfollowed.desc',
    icon: '🕘',
    color: C.dim,
  },
  {
    key: 'closeFriends',
    titleKey: 'categories.closeFriends.title',
    descKey: 'categories.closeFriends.desc',
    icon: '💚',
    color: C.green,
  },
  {
    key: 'blocked',
    titleKey: 'categories.blocked.title',
    descKey: 'categories.blocked.desc',
    icon: '🚫',
    color: C.red,
  },
  {
    key: 'followers',
    titleKey: 'categories.followers.title',
    descKey: 'categories.followers.desc',
    icon: '👥',
    color: C.blue,
    tsLabelKey: 'categories.followers.tsLabel',
  },
  {
    key: 'following',
    titleKey: 'categories.following.title',
    descKey: 'categories.following.desc',
    icon: '👤',
    color: C.purple,
    tsLabelKey: 'categories.following.tsLabel',
  },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CatKey,
  Category
>;
