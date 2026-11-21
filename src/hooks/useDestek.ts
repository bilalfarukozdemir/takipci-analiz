import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

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
import { onaylanmamislariOnayla, sahiplikVarMi, taramaZamaniGeldiMi } from '../lib/satinAlmaOnay';

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
  const sonTaramaRef = useRef(0);

  /** Onaylanmamış PURCHASED alımları onaylar; hata loglanır, sonraki taramada tekrar denenir. */
  const onaylaTumunu = useCallback(
    (satinAlmalar: Purchase[]) =>
      onaylanmamislariOnayla(satinAlmalar, REKLAMLARI_KALDIR_URUN_ID, (s) => satinAlmayiTamamla(s, false)),
    [],
  );

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

      sonTaramaRef.current = Date.now();
      setReklamsiz(sahiplikVarMi(satinAlmalar, REKLAMLARI_KALDIR_URUN_ID));
      void onaylaTumunu(satinAlmalar);
      setSatinAlmalarKontrolEdildi(true);
      setUrunler(sonuc);
      setDurum('hazir');
    } catch {
      if (!iptalRef.current) setDurum('magaza-yok');
    }
  }, [onaylaTumunu]);

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
          // Para alındı: ürün önce verilir, onay hatası kullanıcıyı etkilemez;
          // onaylanmamış alım bir sonraki taramada (açılış / ön plan) yeniden denenir.
          if (!iptalRef.current) {
            if (productId === REKLAMLARI_KALDIR_URUN_ID) setReklamsiz(true);
            setAktifUrunId(null);
            setDurum('tesekkur');
          }
          try {
            await satinAlmayiTamamla(purchase, false);
          } catch (hata) {
            console.warn('[iap] satın alma onayı başarısız, sonraki taramada denenecek', hata);
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

    // Uygulama ön plana dönünce (en çok dakikada bir) onaylanmamış alımları yeniden tara.
    const appDurumuAbonesi = AppState.addEventListener('change', (durumu) => {
      if (durumu !== 'active' || iptalRef.current) return;
      if (!taramaZamaniGeldiMi(Date.now(), sonTaramaRef.current)) return;
      sonTaramaRef.current = Date.now();
      (async () => {
        try {
          const satinAlmalar = await satinAlmalariGetir();
          if (iptalRef.current) return;
          if (sahiplikVarMi(satinAlmalar, REKLAMLARI_KALDIR_URUN_ID)) setReklamsiz(true);
          await onaylaTumunu(satinAlmalar);
        } catch (hata) {
          console.warn('[iap] ön plan taraması başarısız', hata);
        }
      })();
    });

    return () => {
      iptalRef.current = true;
      appDurumuAbonesi.remove();
      guncellemeAbonesi.remove();
      hataAbonesi.remove();
    };
  }, [urunleriYukle, onaylaTumunu]);

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
