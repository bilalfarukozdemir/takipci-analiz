/**
 * Satın alma onayı (acknowledge) ve sahiplik kararı için saf yardımcılar.
 * Google Play, 3 gün içinde onaylanmayan/tüketilmeyen alımı otomatik iade eder.
 * Alan adları expo-iap 5.4.1 `PurchaseAndroid` tipinden: `purchaseState`
 * ('purchased' | 'pending' | ...), `isAcknowledgedAndroid`, `productId`.
 */

export interface OnayAdayi {
  productId?: string | null;
  purchaseState?: string | null;
  isAcknowledgedAndroid?: boolean | null;
}

/** Sahiplik yalnızca Play'in PURCHASED bildirdiği alımdan gelir (PENDING ürün vermez). */
export function sahiplikVarMi(satinAlmalar: readonly OnayAdayi[], urunId: string): boolean {
  return satinAlmalar.some((s) => s.productId === urunId && s.purchaseState === 'purchased');
}

/**
 * Onaylanmamış PURCHASED alımları onaylar. Hata sessizce yutulmaz: loglanır ve
 * sonraki taramada (açılış / ön plana dönüş) yeniden denenir. Başarılı sayıyı döner.
 */
export async function onaylanmamislariOnayla<T extends OnayAdayi>(
  satinAlmalar: readonly T[],
  urunId: string,
  onayla: (satinAlma: T) => Promise<void>,
  hataLogla: (hata: unknown) => void = (hata) => console.warn('[iap] onay başarısız, sonra denenecek', hata),
): Promise<number> {
  let basarili = 0;
  for (const s of satinAlmalar) {
    if (s.productId !== urunId || s.purchaseState !== 'purchased') continue;
    if (s.isAcknowledgedAndroid === true) continue;
    try {
      await onayla(s);
      basarili += 1;
    } catch (hata) {
      hataLogla(hata);
    }
  }
  return basarili;
}

/** Ön plana dönüşlerde taramayı en çok `aralikMs`'de bir yapmak için. */
export function taramaZamaniGeldiMi(simdi: number, sonTarama: number, aralikMs = 60_000): boolean {
  return sonTarama === 0 || simdi - sonTarama >= aralikMs;
}
