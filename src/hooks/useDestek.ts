import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  ErrorCode,
  baglan,
  type Product,
  type Purchase,
  type PurchaseError,
  satinAlmaGuncellendiDinle,
  satinAlmaHatasiDinle,
  satinAlmayiBaslat,
  tamamlaVeTuket,
  urunleriGetir,
} from '../lib/iap';

/** Play Console'daki INAPP ürünleriyle birebir aynı ID'ler (PDF Kutusu ile ortak isimlendirme). */
export const DESTEK_URUN_IDLERI = ['destek_kahve', 'destek_ogun', 'destek_comert'] as const;
export type DestekUrunId = (typeof DESTEK_URUN_IDLERI)[number];

export type DestekDurumu =
  | 'yukleniyor'
  | 'hazir'
  | 'satin-aliniyor'
  | 'tesekkur'
  | 'hata'
  | 'magaza-yok';

/**
 * Bağış kartının durum makinesi. Mağaza bağlantısını açar, 3 sabit ürünün
 * fiyatını çeker ve satın alma akışını yönetir. Tüketilebilir (consumable)
 * ürünler olduğu için her satın alma sonrası otomatik tüketilir — bağış
 * dilendiği kadar tekrarlanabilir.
 */
export function useDestek() {
  const [durum, setDurum] = useState<DestekDurumu>('yukleniyor');
  const [urunler, setUrunler] = useState<Product[]>([]);
  const [aktifUrunId, setAktifUrunId] = useState<string | null>(null);
  const iptalRef = useRef(false);

  useEffect(() => {
    // Google Play Billing yalnızca Android'de çalışır.
    if (Platform.OS !== 'android') {
      setDurum('magaza-yok');
      return;
    }

    iptalRef.current = false;

    (async () => {
      try {
        await baglan();
        const sonuc = await urunleriGetir([...DESTEK_URUN_IDLERI]);
        if (iptalRef.current) return;
        if (sonuc.length === 0) {
          setDurum('magaza-yok');
          return;
        }
        setUrunler(sonuc);
        setDurum('hazir');
      } catch {
        if (!iptalRef.current) setDurum('magaza-yok');
      }
    })();

    const guncellemeAbonesi = satinAlmaGuncellendiDinle((purchase: Purchase) => {
      (async () => {
        try {
          await tamamlaVeTuket(purchase);
          if (!iptalRef.current) {
            setAktifUrunId(null);
            setDurum('tesekkur');
          }
        } catch {
          if (!iptalRef.current) {
            setAktifUrunId(null);
            setDurum('hata');
          }
        }
      })();
    });

    const hataAbonesi = satinAlmaHatasiDinle((hata: PurchaseError) => {
      if (iptalRef.current) return;
      setAktifUrunId(null);
      // Kullanıcı satın almayı kendi iptal ettiyse hata ekranı gösterme, listeye dön.
      setDurum(hata.code === ErrorCode.UserCancelled ? 'hazir' : 'hata');
    });

    return () => {
      iptalRef.current = true;
      guncellemeAbonesi.remove();
      hataAbonesi.remove();
    };
  }, []);

  const satinAl = useCallback(async (urunId: string) => {
    setAktifUrunId(urunId);
    setDurum('satin-aliniyor');
    try {
      await satinAlmayiBaslat(urunId);
    } catch {
      setAktifUrunId(null);
      setDurum('hata');
    }
  }, []);

  /** Hata ekranından "tekrar dene" — ürün listesi zaten elde varsa doğrudan hazır'a döner. */
  const tekrarDene = useCallback(() => {
    setDurum(urunler.length > 0 ? 'hazir' : 'yukleniyor');
  }, [urunler.length]);

  return { durum, urunler, aktifUrunId, satinAl, tekrarDene };
}
