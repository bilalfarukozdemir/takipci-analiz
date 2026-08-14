/** Instagram veri çıktısındaki tek bir hesap. */
export type IgUser = {
  /** kullanıcı adı (göründüğü hali) */
  u: string;
  /** unix saniye — takip başlangıç zamanı (veri arşivinde var, canlı çekimde yok) */
  t?: number;
  /** görünen ad (canlı çekimde var, veri arşivinde yok) */
  n?: string;
  /** profil fotoğrafı adresi — imzalıdır, kısa ömürlüdür; indirilip önbelleğe alınır */
  p?: string;
};

/** Veri çıktısındaki dosya türleri. */
export type Bucket =
  | 'followers'
  | 'following'
  | 'pendingSent'
  | 'requestsReceived'
  | 'recentlyUnfollowed'
  | 'closeFriends'
  | 'blocked';

export type SnapshotData = Record<Bucket, IgUser[]>;

export type SnapshotMeta = {
  id: string;
  /** içe aktarma zamanı (unix ms) */
  createdAt: number;
  /** seçilen dosyanın adı */
  source: string;
  followers: number;
  following: number;
};

export const EMPTY_DATA = (): SnapshotData => ({
  followers: [],
  following: [],
  pendingSent: [],
  requestsReceived: [],
  recentlyUnfollowed: [],
  closeFriends: [],
  blocked: [],
});

export type CatKey =
  | 'notFollowingBack'
  | 'fans'
  | 'mutual'
  | 'lostFollowers'
  | 'newFollowers'
  | 'stoppedFollowing'
  | 'startedFollowing'
  | 'pendingSent'
  | 'requestsReceived'
  | 'recentlyUnfollowed'
  | 'closeFriends'
  | 'blocked'
  | 'followers'
  | 'following';

export type Category = {
  key: CatKey;
  title: string;
  desc: string;
  icon: string;
  color: string;
  /** iki anlık görüntü karşılaştırması gerektirir */
  needsDiff?: boolean;
  /** zaman damgası "ne zamandan beri" mi yoksa "takip etti" mi */
  tsLabel?: string;
};
