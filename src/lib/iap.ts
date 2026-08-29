import {
  ErrorCode,
  type Product,
  type Purchase,
  type PurchaseError,
  finishTransaction as expoFinishTransaction,
  fetchProducts,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';

export type { Product, Purchase, PurchaseError };
export { ErrorCode };

/**
 * expo-iap sarmalayıcısı. Sadece Google Play Billing (Android) ile
 * tüketilebilir (consumable) bağış ürünleriyle çalışır — abonelik yok.
 */

/** Mağaza bağlantısını açar. Başka bir IAP çağrısından önce bir kez çağrılmalı. */
export async function baglan(): Promise<boolean> {
  return initConnection();
}

/** Verilen ürün ID listesi için mağazadan fiyat/başlık bilgisini çeker. */
export async function urunleriGetir(idListesi: string[]): Promise<Product[]> {
  const sonuc = await fetchProducts({ skus: idListesi, type: 'in-app' });
  return Array.isArray(sonuc) ? (sonuc as Product[]) : [];
}

/**
 * Satın alma akışını başlatır. Sonuç `satinAlmaGuncellendiDinle` /
 * `satinAlmaHatasiDinle` üzerinden event olarak gelir — bu fonksiyonun
 * dönüş değeri gerçek sonucu temsil etmez.
 */
export async function satinAlmayiBaslat(urunId: string): Promise<void> {
  await requestPurchase({
    request: { google: { skus: [urunId] } },
    type: 'in-app',
  });
}

/**
 * Satın almayı tamamlar ve tüketir (consume) — bağış tekrar tekrar
 * yapılabilsin diye her zaman `isConsumable: true`.
 */
export async function tamamlaVeTuket(purchase: Purchase): Promise<void> {
  await expoFinishTransaction({ purchase, isConsumable: true });
}

export function satinAlmaGuncellendiDinle(dinleyici: (purchase: Purchase) => void) {
  return purchaseUpdatedListener(dinleyici);
}

export function satinAlmaHatasiDinle(dinleyici: (hata: PurchaseError) => void) {
  return purchaseErrorListener(dinleyici);
}
