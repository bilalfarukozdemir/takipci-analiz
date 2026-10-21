import * as StoreReview from 'expo-store-review';

import { getReviewAskedAt, setReviewAskedAt } from './storage';

const ARALIK_MS = 30 * 24 * 60 * 60 * 1000;
const GECIKME_MS = 2500;

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
