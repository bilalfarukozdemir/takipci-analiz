import {
  ErrorCode,
  type Product,
  type Purchase,
  finishTransaction as expoFinishTransaction,
  fetchProducts,
  getAvailablePurchases as expoGetAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';

export type { Product, Purchase };
export { ErrorCode };

/**
 * `purchaseErrorListener`'ın beklediği tam parametre tipi. expo-iap 'expo-iap'
 * paketinden iki farklı `PurchaseError` tipi dışa açıyor (types.ts'teki
 * `code: ErrorCode` zorunlu sürüm ile errorMapping.ts'teki `code?: ErrorCode`
 * opsiyonel sürüm) — bunlardan yanlışını import edip tip uyuşmazlığı almamak
 * için gerçek fonksiyon imzasından türetiyoruz.
 */
export type PurchaseError = Parameters<Parameters<typeof purchaseErrorListener>[0]>[0];

/**
 * expo-iap sarmalayıcısı. Google Play Billing üzerinden Android'deki
 * tek seferlik reklam kaldırma ürününü yönetir; abonelik yoktur.
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

/** Kullanıcının sahip olduğu tüketilmeyen ürünleri (ör. reklamları kaldır) sorgular. */
export async function satinAlmalariGetir(): Promise<Purchase[]> {
  return expoGetAvailablePurchases();
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
 * Satın almayı tamamlar. Reklam kaldırma gibi tek seferlik haklar
 * tüketilmeden Play'de sahipli kalır.
 */
export async function satinAlmayiTamamla(purchase: Purchase, tuketilebilir: boolean): Promise<void> {
  await expoFinishTransaction({ purchase, isConsumable: tuketilebilir });
}

export function satinAlmaGuncellendiDinle(dinleyici: (purchase: Purchase) => void) {
  return purchaseUpdatedListener(dinleyici);
}

export function satinAlmaHatasiDinle(dinleyici: (hata: PurchaseError) => void) {
  return purchaseErrorListener(dinleyici);
}
