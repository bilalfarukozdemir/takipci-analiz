import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

const bannerUnitId = __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID;
const interstitialUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;

let requestPermission: Promise<boolean> | null = null;
let interstitialAd: InterstitialAd | null = null;
let interstitialLoading = false;
let interstitialLoaded = false;
let interstitialShowing = false;
let interstitialListeners: (() => void)[] = [];
let userActionsSinceInterstitial = 0;

const MIN_USER_ACTIONS_BETWEEN_INTERSTITIALS = 2;

export function bannerReklamiAcik(): boolean {
  return Platform.OS === 'android' && Boolean(bannerUnitId);
}

export function bannerReklamBirimId(): string | null {
  return bannerReklamiAcik() ? bannerUnitId ?? null : null;
}

export function tamSayfaReklamiAcik(): boolean {
  return Platform.OS === 'android' && Boolean(interstitialUnitId);
}

export function reklamlarAcik(): boolean {
  return bannerReklamiAcik() || tamSayfaReklamiAcik();
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

/** Her dokunma reklam sıklığı sınırı için kullanıcı etkileşimi sayılır. */
export function reklamKullaniciEtkilesimiKaydet(): void {
  userActionsSinceInterstitial = Math.min(
    MIN_USER_ACTIONS_BETWEEN_INTERSTITIALS,
    userActionsSinceInterstitial + 1
  );
}

function interstitialiTemizle(ad: InterstitialAd): void {
  if (interstitialAd !== ad) return;

  interstitialListeners.forEach((kaldir) => kaldir());
  interstitialListeners = [];
  ad.removeAllListeners();
  interstitialAd = null;
  interstitialLoading = false;
  interstitialLoaded = false;
  interstitialShowing = false;
}

/** Consent verildikten sonra tam sayfa reklamı önceden yükler. */
export function tamSayfaReklamiHazirla(): void {
  if (!tamSayfaReklamiAcik() || interstitialAd || interstitialLoading) return;

  interstitialLoading = true;
  void reklamIcinIzinAl().then((allowed) => {
    if (!allowed || !interstitialUnitId) {
      interstitialLoading = false;
      return;
    }

    if (interstitialAd) {
      interstitialLoading = false;
      return;
    }

    try {
      const ad = InterstitialAd.createForAdRequest(interstitialUnitId);
      interstitialAd = ad;
      interstitialListeners = [
        ad.addAdEventListener(AdEventType.LOADED, () => {
          if (interstitialAd !== ad) return;
          interstitialLoaded = true;
          interstitialLoading = false;
        }),
        ad.addAdEventListener(AdEventType.OPENED, () => {
          if (interstitialAd !== ad) return;
          interstitialShowing = true;
          userActionsSinceInterstitial = 0;
        }),
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          interstitialiTemizle(ad);
          tamSayfaReklamiHazirla();
        }),
        ad.addAdEventListener(AdEventType.ERROR, () => {
          interstitialiTemizle(ad);
        }),
      ];

      ad.load();
    } catch {
      if (interstitialAd) interstitialiTemizle(interstitialAd);
      else interstitialLoading = false;
    }
  }).catch(() => {
    interstitialLoading = false;
  });
}

/**
 * Başarılı analiz ve geri takip etmeyenler ekranı gibi doğal geçişlerde gösterir.
 * Bir tam ekran reklamdan sonra en az iki kullanıcı etkileşimi bekler.
 */
export async function tamSayfaReklamiGoster(reklamGosterilebilir: boolean): Promise<boolean> {
  if (!reklamGosterilebilir || !tamSayfaReklamiAcik()) return false;

  if (userActionsSinceInterstitial < MIN_USER_ACTIONS_BETWEEN_INTERSTITIALS) {
    tamSayfaReklamiHazirla();
    return false;
  }

  if (!interstitialAd || !interstitialLoaded || interstitialShowing) {
    tamSayfaReklamiHazirla();
    return false;
  }

  try {
    interstitialShowing = true;
    await interstitialAd.show();
    return true;
  } catch {
    interstitialShowing = false;
    return false;
  }
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
