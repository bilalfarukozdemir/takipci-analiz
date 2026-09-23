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
  satinAlmayiTamamla,
  satinAlmalariGetir,
  urunleriGetir,
} from '../lib/iap';

/** Play Console'daki tek seferlik, tüketilmeyen reklam kaldırma ürünü. */
export const REKLAMLARI_KALDIR_URUN_ID = 'remove_ads';

export type DestekDurumu =
  | 'yukleniyor'
  | 'hazir'
  | 'satin-aliniyor'
  | 'tesekkur'
  | 'hata'
  | 'magaza-yok';

/**
 * Reklam kaldırma ürününü yükler ve satın alımı yönetir. Satın alma tek
 * seferliktir; tüketilmez ve sonraki açılışlarda sahipliği yeniden sorgulanır.
 */
export function useDestek() {
  const [durum, setDurum] = useState<DestekDurumu>('yukleniyor');
  const [urunler, setUrunler] = useState<Product[]>([]);
  const [aktifUrunId, setAktifUrunId] = useState<string | null>(null);
  const [reklamsiz, setReklamsiz] = useState(false);
  const [satinAlmalarKontrolEdildi, setSatinAlmalarKontrolEdildi] = useState(false);
  const iptalRef = useRef(false);

  const urunleriYukle = useCallback(async () => {
    setDurum('yukleniyor');
    setSatinAlmalarKontrolEdildi(false);
    try {
      const baglantiAcik = await baglan();
      if (!baglantiAcik) {
        if (!iptalRef.current) setDurum('magaza-yok');
        return;
      }

      const [sonuc, satinAlmalar] = await Promise.all([
        urunleriGetir([REKLAMLARI_KALDIR_URUN_ID]),
        satinAlmalariGetir(),
      ]);
      if (iptalRef.current) return;

      const reklamKaldirmaAlinmis = satinAlmalar.some(
        (satinAlma) => satinAlma.productId === REKLAMLARI_KALDIR_URUN_ID,
      );
      setReklamsiz(reklamKaldirmaAlinmis);
      setSatinAlmalarKontrolEdildi(true);
      setUrunler(sonuc);
      setDurum('hazir');
    } catch {
      if (!iptalRef.current) setDurum('magaza-yok');
    }
  }, []);

  useEffect(() => {
    // Google Play Billing yalnızca Android'de çalışır.
    if (Platform.OS !== 'android') {
      setDurum('magaza-yok');
      return;
    }

    iptalRef.current = false;

    void urunleriYukle();

    const guncellemeAbonesi = satinAlmaGuncellendiDinle((purchase: Purchase) => {
      (async () => {
        try {
          if (purchase.purchaseState !== 'purchased') {
            if (!iptalRef.current) {
              setAktifUrunId(null);
              setDurum('hazir');
            }
            return;
          }
          const productId = purchase.productId ?? '';
          await satinAlmayiTamamla(purchase, false);
          if (!iptalRef.current) {
            if (productId === REKLAMLARI_KALDIR_URUN_ID) setReklamsiz(true);
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
  }, [urunleriYukle]);

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

  /** Mağaza ürünlerini ve önceki reklam kaldırma satın alımını yeniden sorgular. */
  const tekrarDene = useCallback(() => {
    iptalRef.current = false;
    void urunleriYukle();
  }, [urunleriYukle]);

  return {
    durum,
    urunler,
    aktifUrunId,
    reklamKaldirmaUrunu: urunler.find((urun) => urun.id === REKLAMLARI_KALDIR_URUN_ID),
    reklamsiz,
    reklamDurumuKontrolEdildi: satinAlmalarKontrolEdildi,
    satinAl,
    tekrarDene,
  };
}

export type DestekModel = ReturnType<typeof useDestek>;
