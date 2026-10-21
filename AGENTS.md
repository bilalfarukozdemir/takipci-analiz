# Ajanlar için proje notları

## Expo sürümü

Bu proje **Expo SDK 56 / React Native 0.85** kullanıyor. Expo API'leri sık
değişiyor — kod yazmadan önce sürüme özel dokümanı oku:
<https://docs.expo.dev/versions/v56.0.0/>

Özellikle `expo-file-system` yeni `File` / `Directory` / `Paths` API'sini kullanır;
eski `readAsStringAsync` tarzı çağrılar `expo-file-system/legacy` altındadır.

## Değişmeyecek kararlar

Bunlar bilinçli tercihler, "eksik" değil:

- **Toplu takipten çıkarma/takip etme yok.** Hesap engeli yemenin en hızlı yolu.
- **Sunucu ve hesap sistemi yok.** Takipçi verileri cihazda kalır. Geçmiş
  sekmesinde isteğe bağlı Google Mobile Ads banner'ı gösterilebilir; Google'ın
  SDK'sı reklam sunumu için cihaz/ağ tanımlayıcıları ve reklam etkileşimi gibi
  verileri işleyebilir. Dolu bir liste sayfası ilk kez açılırken
  ödüllü reklam (rewarded) gösterilir; izlenirse liste o analiz boyunca açık
  kalır, yarıda kapatılırsa açılmaz, reklam gelmezse liste yine açılır.
  `remove_ads` tek seferlik Play satın alımı banner ve tam sayfa reklamları
  kalıcı olarak kaldırır. Gerçek AdMob kimlikleri yapılandırılmış Android
  build'inde reklam istenir; geliştirme build'i Google'ın test reklamlarını
  kullanır. Play Billing uygulamada yalnızca reklam kaldırma satın alımı içindir.
- **Uygulama içinde şifre isteyen giriş formu yok.** Giriş her zaman WebView
  içinde Instagram'ın kendi sayfasında yapılır; kod şifreyi hiç görmez.
- **Yedek dil İngilizce; uygulama 14 dili destekler (i18n).** Dil listesinin tek
  kaynağı `src/i18n/languages.ts`; telefonun tercih ettiği diller arasında
  desteklenen ilki seçilir, yoksa İngilizce. Yeni kullanıcı metinleri her dilin
  `src/i18n/<kod>.json` dosyasına eklenir, koda hardcoded yazılmaz.
  `tests/i18n.test.js` anahtar, `{{değişken}}`, dizi uzunluğu ve CLDR çoğul
  biçimlerinin (`_one`, `_few`…) tüm dillerde eşit olduğunu denetler. Sayı geçen
  metinde `count` sayı olmalı; biçimli gösterim için ayrıca `n` verilir.
  Arapça/Farsça sağdan soladır: yön `I18nManager` ile yazılır, değişirse
  uygulama `reloadAppAsync` ile yeniden yüklenir. Yeni dil eklemek:
  `languages.ts` + `<kod>.json` + `src/i18n/index.ts` + `src/i18n/plurals.ts`
  + `app.json` supportedLocales + `withLocalizedAppName.js` + `store/listings/`.

## Yapı

`parse.ts` (veri arşivi) ve `igLive.ts` (canlı çekim) aynı `SnapshotData` tipini
üretir. Oradan sonrası ortaktır: `storage.ts` cihaza yazar, `analyze.ts` iki anlık
görüntüyü karşılaştırıp 14 kategoriyi çıkarır, ekranlar bunu gösterir.

Yeni bir veri kaynağı eklemek = `SnapshotData` üreten bir modül yazmak. Analiz ve
arayüz tarafına dokunmaya gerek yok.

## android/ klasörü

Elle düzenlenmez — `expo prebuild` her seferinde yeniden üretir ve `.gitignore`
içindedir. Native tarafta kalıcı bir değişiklik gerekiyorsa `plugins/` altına bir
config plugin yaz. Mevcut olanlar:

| Plugin | İş |
| --- | --- |
| `withLocalizedAppName.js` | Ana ekrandaki uygulama adı: `values/strings.xml` İngilizce (yedek), diğer 13 dil `values-<kod>/strings.xml` (Gradle proje adı ASCII kalsın diye `app.json`'dan ayrı) |
| `withInstagramQuery.js` | `instagram://` için `<queries>` paket görünürlüğü |
| `withBuildTuning.js` | `reactNativeArchitectures` sadece ARM; release'de R8 + kaynak küçültme açık (Play bellek/DEX uyarısı) |
| `withReleaseSigning.js` | `credentials/` klasöründen release imzalama |

## Derleme

Windows'ta proje yolu uzunsa ya da boşluk içeriyorsa Android NDK'nın CMake/ninja
adımı native modülleri derleyemez ve **derlemenin sonunda** patlar
(`ninja: error: manifest 'build.ninja' still dirty after 100 tries`). Bu yüzden
`npm run apk`, `scripts/build-apk.ps1` üzerinden kaynağı kısa bir yola aynalayıp
orada derler. `cd android && gradlew assembleRelease` demeden önce bunu hatırla.

Linux Mint'te de aynı sebeple boşluksuz kısa bir aynada derlenir (`~/rnb/...`,
`JAVA_HOME` JDK 21). Gradle 9.3.1 ile `@react-native/gradle-plugin`'in
sabitlediği `foojay-resolver-convention` 0.5.0 açılışta "JvmVendorSpec
IBM_SEMERU" hatası verir; aynadaki `node_modules/@react-native/gradle-plugin/
settings.gradle.kts` içinde sürüm 1.0.0 yapılınca derlenir.

## Doğrulama

```bash
npm run typecheck
npm test
```

`tests/i18n.test.js` dil dosyalarını, `tests/store.test.js` `store/listings/`
altındaki Play mağaza metinlerinin karakter sınırlarını denetler.
`tests/parse.test.js` bağımlılıksız düz Node'dur; `pretest` betiği `src/lib/*.ts`
dosyalarını `.testbuild/` altına derler. Çözümleyiciye dokunduysan mutlaka çalıştır —
gerçek arşiv biçimleriyle 33 kontrol var.

## Asla commit edilmeyecek

`credentials/` klasörü (imzalama anahtarı ve parolalar) ve üretilen `*.apk`
dosyaları. `.gitignore` engelliyor; `git add -A` sonrası yine de kontrol et.
