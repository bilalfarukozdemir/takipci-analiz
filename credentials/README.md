# İmzalama anahtarı

Bu klasördeki `release.keystore` ve `keystore.json` **depoya girmez** (`.gitignore`
ile engellenir). Release APK'sı bu anahtarla imzalanır.

## Kendi anahtarını oluştur

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore credentials/release.keystore \
  -alias takipci -keyalg RSA -keysize 2048 -validity 10950 \
  -dname "CN=Takipci Analiz, O=Adin, C=TR"
```

Ardından `keystore.example.json` dosyasını `keystore.json` adıyla kopyalayıp
parolaları gir:

```bash
cp credentials/keystore.example.json credentials/keystore.json
```

`plugins/withReleaseSigning.js` bu dosyayı okur ve `npx expo prebuild` sırasında
Gradle'a bağlar. Klasör yoksa derleme sorunsuz devam eder; APK yalnızca Android'in
varsayılan debug anahtarıyla imzalanır (kişisel kullanım için yeterli, mağaza için
değil).

## Dikkat

- Anahtarı **yedekle**. Kaybedersen aynı uygulamanın güncellemesini yayınlayamazsın;
  kullanıcıların uygulamayı silip yeniden kurması gerekir.
- Anahtarı **paylaşma**. Anahtara sahip olan herkes senin uygulamanmış gibi görünen
  paketler imzalayabilir.
- Depoya yanlışlıkla eklediysen anahtarı iptal edip yenisini üret; geçmişten silmek
  tek başına yeterli değildir.

## CI'da imzalama

GitHub Actions'ın release iş akışı, ayarlanmışsa şu secret'ları kullanır:

| Secret | İçerik |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 credentials/release.keystore` çıktısı |
| `ANDROID_KEYSTORE_PASSWORD` | store parolası |
| `ANDROID_KEY_ALIAS` | anahtar takma adı |
| `ANDROID_KEY_PASSWORD` | anahtar parolası |

Secret yoksa iş akışı debug anahtarıyla imzalanmış APK üretir ve bunu adında
belirtir.
