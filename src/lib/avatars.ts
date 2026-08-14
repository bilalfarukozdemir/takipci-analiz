/**
 * Profil fotoğrafı önbelleği.
 *
 * Instagram'ın fotoğraf adresleri imzalıdır ve birkaç saat/gün içinde geçersiz
 * olur. Bu yüzden adresi saklamak yetmez: fotoğraf ilk görüldüğünde cihaza
 * indirilir ve bundan sonra hep yerelden okunur. Böylece eski kayıtlarda da
 * fotoğraflar durur ve internet gerekmez.
 *
 * İndirme tembeldir — sadece ekranda görünen satırlar için yapılır.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { useEffect, useState } from 'react';

const DIR = new Directory(Paths.document, 'avatars');

/** Aynı anda en fazla kaç indirme. */
const ES_ZAMANLI = 4;
/** Hızlı kaydırmada kuyruk şişmesin. */
const KUYRUK_SINIRI = 60;

const dosyaAdi = (username: string) => `${username.toLowerCase().replace(/[^a-z0-9._-]/g, '_')}.jpg`;

/** Diskteki dosya adları — her satırda disk okumamak için bellekte tutulur. */
let indeks: Set<string> | null = null;
const basarisiz = new Set<string>();
const isleniyor = new Set<string>();
let aktif = 0;
const kuyruk: (() => void)[] = [];

function klasoruHazirla() {
  try {
    if (!DIR.exists) DIR.create({ intermediates: true });
  } catch {
    // yoksay
  }
}

/** Uygulama açılışında bir kez çağrılır. */
export function loadAvatarIndex(): void {
  klasoruHazirla();
  try {
    indeks = new Set(DIR.list().map((f) => f.name));
  } catch {
    indeks = new Set();
  }
}

/** Diskte varsa yerel adresi döndürür, yoksa null. Senkron, disk okumaz. */
export function cachedAvatar(username: string): string | null {
  if (!indeks) return null;
  const ad = dosyaAdi(username);
  if (!indeks.has(ad)) return null;
  return new File(DIR, ad).uri;
}

function siradakiniCalistir() {
  while (aktif < ES_ZAMANLI && kuyruk.length) {
    const is = kuyruk.pop(); // LIFO: en son görünen satır önce
    if (is) is();
  }
}

function indir(username: string, url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const calis = () => {
      aktif++;
      const ad = dosyaAdi(username);
      const hedef = new File(DIR, ad);
      File.downloadFileAsync(url, hedef, { idempotent: true })
        .then(() => {
          indeks?.add(ad);
          resolve(hedef.uri);
        })
        .catch(() => {
          basarisiz.add(username.toLowerCase());
          resolve(null);
        })
        .then(() => {
          aktif--;
          isleniyor.delete(username.toLowerCase());
          siradakiniCalistir();
        });
    };

    if (aktif < ES_ZAMANLI) calis();
    else if (kuyruk.length < KUYRUK_SINIRI) kuyruk.push(calis);
    else {
      isleniyor.delete(username.toLowerCase());
      resolve(null); // kuyruk dolu — satır tekrar göründüğünde denenecek
    }
  });
}

/**
 * Satır ekranda görünürken profil fotoğrafını verir.
 * Önce disk önbelleği, yoksa (adres varsa) indirme.
 */
export function useAvatar(username: string, url?: string, enabled = true): string | null {
  const [uri, setUri] = useState<string | null>(() => (enabled ? cachedAvatar(username) : null));

  useEffect(() => {
    if (!enabled) {
      setUri(null);
      return;
    }
    const yerel = cachedAvatar(username);
    if (yerel) {
      setUri(yerel);
      return;
    }
    setUri(null);
    const k = username.toLowerCase();
    if (!url || basarisiz.has(k) || isleniyor.has(k)) return;

    let canli = true;
    isleniyor.add(k);
    indir(username, url).then((u) => {
      if (canli) setUri(u);
    });
    return () => {
      canli = false;
    };
  }, [username, url, enabled]);

  return uri;
}

/** Önbellekteki toplam boyut (bayt). */
export function avatarCacheSize(): number {
  try {
    if (!DIR.exists) return 0;
    return DIR.list().reduce((toplam, f) => toplam + (f instanceof File ? f.size ?? 0 : 0), 0);
  } catch {
    return 0;
  }
}

export function clearAvatarCache(): void {
  try {
    if (DIR.exists) DIR.delete();
  } catch {
    // yoksay
  }
  indeks = new Set();
  basarisiz.clear();
  klasoruHazirla();
}
