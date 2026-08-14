# Katkı rehberi

Katkılar açıktır. Hata bildirimi, çeviri, yeni arşiv biçimi desteği, kod — hepsi
işe yarar. Küçük düzeltmeler için doğrudan PR açabilirsin; büyük değişikliklerden
önce bir issue açıp konuşalım.

## Geliştirme ortamı

| Gereken | Sürüm |
| --- | --- |
| Node | 20+ |
| JDK | 17 |
| Android SDK | API 36, build-tools 36.x |

```bash
git clone https://github.com/bilalfarukozdemir/takipci-analiz.git
cd takipci-analiz
npm install
npm start
```

Native modül eklemediğin sürece Expo geliştirme derlemesiyle çalışabilirsin:

```bash
npm run android
```

## Göndermeden önce

```bash
npm run typecheck
npm test
```

İkisi de temiz olmalı. CI zaten bunları çalıştırır ama yerelde görmek daha hızlı.

## Kod tarzı

- **TypeScript**, `strict` açık. `any` kullanman gerekiyorsa nedenini yorumla.
- Değişken ve fonksiyon adları **Türkçe ya da İngilizce olabilir** ama bir dosya
  içinde tutarlı olsun. Kullanıcıya görünen tüm metinler Türkçedir.
- Yorumlar **neden** olduğunu anlatsın, ne yaptığını değil. Kod zaten ne yaptığını
  söylüyor.
- Yeni bağımlılık eklemeden önce iki kez düşün; uygulama bilerek yalın tutuluyor.
  Expo modülleri için `npx expo install <paket>` kullan (SDK ile uyumlu sürümü seçer).
- Stil tanımları dosyanın altında `StyleSheet.create` içinde; satır içi stil sadece
  hesaplanan değerler için.

## Nereye ne eklenir

| Değişiklik | Dosya |
| --- | --- |
| Yeni arşiv dosyası biçimi | `src/lib/parse.ts` (`MATCHERS` + `extractUsers`) |
| Yeni liste/kategori | `src/lib/analyze.ts` (`analyze()` + `CATEGORIES`) |
| Canlı çekim davranışı | `src/lib/igLive.ts` |
| Ekran/arayüz | `src/screens/`, ortak parçalar `src/ui/` |
| Android derleme ayarı | `plugins/` altında bir config plugin |

`android/` klasörü **elle düzenlenmez** — `expo prebuild` her seferinde yeniden
üretir. Native tarafta kalıcı bir değişiklik gerekiyorsa `plugins/` altına bir
config plugin yaz.

## Testler

Çözümleyici testleri `tests/parse.test.js` içinde; bağımlılıksız, düz Node.
Yeni bir arşiv biçimi desteklediysen oraya bir bölüm ekle:

```js
section('8) Yeni biçim');
{
  const r = parseFiles([{ name: 'ornek.json', bytes: strToU8(...), size: 1 }]);
  check('beklenen sonuç', r.data.followers.length === 2, r.data.followers);
}
```

`npm test` önce `src/lib/*.ts` dosyalarını `.testbuild/` altına derler, sonra
testleri çalıştırır.

## Hata bildirirken

Gerçek kullanıcı adları veya profil bağlantıları **paylaşma**. Arşiv dosyası
ekleyeceksen kullanıcı adlarını `kullanici1`, `kullanici2` gibi değiştir.

Şunları yaz:

- Android sürümü ve cihaz
- Uygulama sürümü (Yardım sekmesinin altında yazar)
- Hangi yöntem: canlı çekim mi, veri arşivi mi
- Beklediğin ve gördüğün davranış

## Yapmayacağımız şeyler

Bunlar bilinçli kararlar; PR açmadan önce bilmen zaman kazandırır:

- **Toplu takipten çıkarma / takip etme.** Hesap engeli yemenin en hızlı yolu.
- **Sunucu, hesap sistemi, bulut yedekleme.** Uygulamanın tek gerçek güvencesi
  verinin cihazdan çıkmaması.
- **Analitik, reklam, takip kodu.**
- **Şifreyi uygulama içinde isteyen giriş formu.** Giriş her zaman Instagram'ın
  kendi sayfasında yapılır.

## Lisans

Katkıda bulunarak, katkının [MIT lisansı](LICENSE) altında yayınlanmasını kabul
etmiş olursun.
