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
- **Sunucu, hesap sistemi, analitik, reklam yok.** Veri cihazdan çıkmaz.
- **Uygulama içinde şifre isteyen giriş formu yok.** Giriş her zaman WebView
  içinde Instagram'ın kendi sayfasında yapılır; kod şifreyi hiç görmez.
- **Kullanıcıya görünen tüm metinler Türkçe.**

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
| `withTurkishAppName.js` | `strings.xml`'de Türkçe uygulama adı (Gradle proje adı ASCII kalsın diye) |
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
