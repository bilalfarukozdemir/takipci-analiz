import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const bannerUnitId = __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;
const rewardedUnitId = __DEV__ ? TestIds.REWARDED : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID;

/** Ödüllü reklamın sonucu: izlendi, yarıda kapatıldı ya da hiç gösterilemedi. */
export type OdulluSonuc = 'odul' | 'iptal' | 'yok';

let requestPermission: Promise<boolean> | null = null;
let rewardedAd: RewardedAd | null = null;
let rewardedLoading = false;
let rewardedLoaded = false;
let rewardedShowing = false;
let rewardedListeners: (() => void)[] = [];
let yuklenmeBekleyenler: ((yuklendi: boolean) => void)[] = [];

/** Kullanıcı karta dokunduğunda henüz yüklenen reklamı en fazla bu kadar bekler. */
const YUKLEME_BEKLEME_MS = 5000;

export function bannerReklamiAcik(): boolean {
  return Platform.OS === 'android' && Boolean(bannerUnitId);
}

export function bannerReklamBirimId(): string | null {
  return bannerReklamiAcik() ? bannerUnitId ?? null : null;
}

export function odulluReklamAcik(): boolean {
  return Platform.OS === 'android' && Boolean(rewardedUnitId);
}

export function reklamlarAcik(): boolean {
  return bannerReklamiAcik() || odulluReklamAcik();
}

/** UMP consent kararını alır; yalnızca izin veriliyorsa Mobile Ads SDK'yı başlatır. */
export function reklamIcinIzinAl(): Promise<boolean> {
  if (!reklamlarAcik()) return Promise.resolve(false);

  requestPermission ??= (async () => {
    try {
      const consent = await AdsConsent.gatherConsent();
      if (!consent.canRequestAds) return false;
      await mobileAds().initialize();
      return true;
    } catch {
      return false;
    }
  })().then((allowed) => {
    // Let an explicit retry recover from a temporary consent or network failure.
    if (!allowed) requestPermission = null;
    return allowed;
  });

  return requestPermission;
}

function yuklenmeyiBildir(yuklendi: boolean): void {
  const bekleyenler = yuklenmeBekleyenler;
  yuklenmeBekleyenler = [];
  bekleyenler.forEach((bildir) => bildir(yuklendi));
}

function odulluyuTemizle(ad: RewardedAd): void {
  if (rewardedAd !== ad) return;

  rewardedListeners.forEach((kaldir) => kaldir());
  rewardedListeners = [];
  ad.removeAllListeners();
  rewardedAd = null;
  rewardedLoading = false;
  rewardedLoaded = false;
  rewardedShowing = false;
}

/** Consent verildikten sonra ödüllü reklamı önceden yükler. */
export function odulluReklamiHazirla(): void {
  if (!odulluReklamAcik() || rewardedAd || rewardedLoading) return;

  rewardedLoading = true;
  void reklamIcinIzinAl().then((allowed) => {
    if (!allowed || !rewardedUnitId) {
      rewardedLoading = false;
      yuklenmeyiBildir(false);
      return;
    }

    if (rewardedAd) {
      rewardedLoading = false;
      return;
    }

    try {
      const ad = RewardedAd.createForAdRequest(rewardedUnitId);
      rewardedAd = ad;
      rewardedListeners = [
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (rewardedAd !== ad) return;
          rewardedLoaded = true;
          rewardedLoading = false;
          yuklenmeyiBildir(true);
        }),
        ad.addAdEventListener(AdEventType.ERROR, () => {
          // Gösterim sırasındaki hatayı odulluReklamGoster kendi dinleyicisiyle kapatır.
          if (rewardedShowing) return;
          odulluyuTemizle(ad);
          yuklenmeyiBildir(false);
        }),
      ];

      ad.load();
    } catch {
      if (rewardedAd) odulluyuTemizle(rewardedAd);
      else rewardedLoading = false;
      yuklenmeyiBildir(false);
    }
  }).catch(() => {
    rewardedLoading = false;
    yuklenmeyiBildir(false);
  });
}

function yuklenmeyiBekle(): Promise<boolean> {
  if (rewardedLoaded) return Promise.resolve(true);
  odulluReklamiHazirla();
  if (!rewardedLoading) return Promise.resolve(false);

  return new Promise((resolve) => {
    const zaman = setTimeout(() => {
      yuklenmeBekleyenler = yuklenmeBekleyenler.filter((b) => b !== bitir);
      resolve(false);
    }, YUKLEME_BEKLEME_MS);
    const bitir = (yuklendi: boolean) => {
      clearTimeout(zaman);
      resolve(yuklendi);
    };
    yuklenmeBekleyenler.push(bitir);
  });
}

/**
 * Kullanıcının dokunduğu liste sayfası için ödüllü reklamı gösterir.
 * Reklam kapanana kadar bekler; ödül sinyali geldiyse 'odul', yarıda
 * kapatıldıysa 'iptal', reklam hiç gösterilemediyse 'yok' döner.
 */
export async function odulluReklamGoster(): Promise<OdulluSonuc> {
  if (!odulluReklamAcik() || rewardedShowing) return 'yok';
  if (!(await yuklenmeyiBekle())) return 'yok';

  const ad = rewardedAd;
  if (!ad || !rewardedLoaded) return 'yok';

  return new Promise<OdulluSonuc>((resolve) => {
    let odulVerildi = false;
    let acildi = false;
    const kapat = (sonuc: OdulluSonuc) => {
      odulluyuTemizle(ad);
      odulluReklamiHazirla();
      resolve(sonuc);
    };
    rewardedListeners.push(
      ad.addAdEventListener(AdEventType.OPENED, () => {
        acildi = true;
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        odulVerildi = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        kapat(odulVerildi ? 'odul' : 'iptal');
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        // Gösterim sırasında hata: reklam açıldıysa ama ödül gelmediyse kullanıcı izleyemedi.
        kapat(odulVerildi ? 'odul' : acildi ? 'iptal' : 'yok');
      })
    );

    rewardedShowing = true;
    ad.show().catch(() => kapat('yok'));
  });
}

/** Kullanıcının Google UMP üzerinden reklam gizliliği tercihlerini açar. */
export async function reklamGizliligiSecenekleriniAc(): Promise<boolean> {
  try {
    const consent = await AdsConsent.getConsentInfo();
    if (consent.privacyOptionsRequirementStatus !== 'REQUIRED') return false;
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}
