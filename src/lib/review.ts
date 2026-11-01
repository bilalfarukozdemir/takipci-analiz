import * as StoreReview from 'expo-store-review';
import { AppState, Linking } from 'react-native';

import { getReviewAskedAt, setReviewAskedAt } from './storage';

const ARALIK_MS = 30 * 24 * 60 * 60 * 1000;
const GECIKME_MS = 2500;
/** Pencere gerçekten açılırsa kullanıcı kapatana kadar sürer; kota dolunca hemen biter. */
const ACILDI_SAYILIR_MS = 2000;
const PAKET = 'com.bilal.takipcianaliz';

/**
 * Başarılı bir analizden sonra Google Play'in kendi puan penceresini ister.
 * Sonuç ekranı görünsün diye kısa bekler; 30 günde en fazla bir kez sorar.
 * Pencerenin gerçekten çıkıp çıkmayacağına Play kendi kotasıyla karar verir.
 */
export function puanIsteginiPlanla(): void {
  setTimeout(() => {
    puanIste().catch(() => undefined);
  }, GECIKME_MS);
}

async function puanIste(): Promise<void> {
  if (Date.now() - (await getReviewAskedAt()) < ARALIK_MS) return;
  if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
  await setReviewAskedAt(Date.now());
  await StoreReview.requestReview();
}

/**
 * "Bizi değerlendir" dokunuşu: önce Play'in kendi puan penceresi.
 * Play kota dolunca pencereyi sessizce atlar ve bunu bildirmez; o yüzden
 * uygulama arka plana düşmediyse ve akış hemen bittiyse mağaza sayfası açılır.
 */
export async function puanVer(): Promise<void> {
  await setReviewAskedAt(Date.now()).catch(() => undefined);
  let ayrildi = false;
  const subs = [
    AppState.addEventListener('change', (d) => {
      if (d !== 'active') ayrildi = true;
    }),
    AppState.addEventListener('blur', () => {
      ayrildi = true;
    }),
  ];
  const basla = Date.now();
  let acildi = false;
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      acildi = ayrildi || Date.now() - basla >= ACILDI_SAYILIR_MS;
    }
  } catch {
    // mağazaya düş
  } finally {
    subs.forEach((s) => s.remove());
  }
  if (!acildi) await magazayiAc();
}

async function magazayiAc(): Promise<void> {
  try {
    await Linking.openURL(`market://details?id=${PAKET}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${PAKET}`).catch(() => undefined);
  }
}
