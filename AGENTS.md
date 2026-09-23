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
  verileri işleyebilir. Başarılı analiz ve geri takip etmeyenler ekranına
  geçişte, AdMob sıklık sınırına uyan tam sayfa reklam da gösterilebilir.
  `remove_ads` tek seferlik Play satın alımı banner ve tam sayfa reklamları
  kalıcı olarak kaldırır. Gerçek AdMob kimlikleri yapılandırılmış Android
  build'inde reklam istenir; geliştirme build'i Google'ın test reklamlarını
  kullanır. Play Billing uygulamada yalnızca reklam kaldırma satın alımı içindir.
- **Uygulama içinde şifre isteyen giriş formu yok.** Giriş her zaman WebView
  içinde Instagram'ın kendi sayfasında yapılır; kod şifreyi hiç görmez.
- **Yedek dil İngilizce; uygulama Türkçe ve İngilizce'yi destekler (i18n).**
  Telefonun dili Türkçe değilse hem arayüz hem ana ekrandaki uygulama adı
  İngilizcedir ("Follower Analyzer"); Türkçe telefonda "Takipçi Analiz". Yeni
  kullanıcı metinleri `src/i18n/tr.json` ve `en.json`'a eklenir, koda hardcoded
  yazılmaz.

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
| `withLocalizedAppName.js` | Ana ekrandaki uygulama adı: `values/strings.xml` İngilizce (yedek), `values-tr/strings.xml` Türkçe (Gradle proje adı ASCII kalsın diye `app.json`'dan ayrı) |
| `withInstagramQuery.js` | `instagram://` için `<queries>` paket görünürlüğü |
| `withBuildTuning.js` | `reactNativeArchitectures` sadece ARM |
| `withReleaseSigning.js` | `credentials/` klasöründen release imzalama |

## Derleme

Windows'ta proje yolu uzunsa ya da boşluk içeriyorsa Android NDK'nın CMake/ninja
adımı native modülleri derleyemez ve **derlemenin sonunda** patlar
(`ninja: error: manifest 'build.ninja' still dirty after 100 tries`). Bu yüzden
`npm run apk`, `scripts/build-apk.ps1` üzerinden kaynağı kısa bir yola aynalayıp
orada derler. `cd android && gradlew assembleRelease` demeden önce bunu hatırla.

## Doğrulama

```bash
npm run typecheck
npm test
```

`tests/parse.test.js` bağımlılıksız düz Node'dur; `pretest` betiği `src/lib/*.ts`
dosyalarını `.testbuild/` altına derler. Çözümleyiciye dokunduysan mutlaka çalıştır —
gerçek arşiv biçimleriyle 33 kontrol var.

## Asla commit edilmeyecek

`credentials/` klasörü (imzalama anahtarı ve parolalar) ve üretilen `*.apk`
dosyaları. `.gitignore` engelliyor; `git add -A` sonrası yine de kontrol et.
