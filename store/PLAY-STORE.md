# Play Store — Follower Analyzer

<!-- Play'de her değişiklikten sonra güncelle. Şablon: BilalOS .agents/skills/play-yayin/PLAY-STORE-sablon.md -->

- **Paket:** `com.bilal.takipcianaliz` (kalıcı) · Play uygulama kimliği `4975459333653540627` · hesap Vitrincim (`8567376206083240739`)
- **Mağaza adı:** "Follower Analyzer", varsayılan dil en-US, Uygulama, ücretsiz. Başlıkta "Instagram" **bilerek yok** (marka adı başlıkta ret sebebi; `tests/store.test.js` denetler).
- **Mağaza dilleri (2026-10-22 canlı okundu):** en-US (varsayılan), tr-TR. Telefon görüntüsü 4 adet (yalnız varsayılan dilde; çeviriler bunları miras alır).
- **Tek seferlik ürün:** `remove_ads` ("Remove ads") — banner ve tam sayfa reklamları kaldırır.
- **Gizlilik sayfası:** Play Console → Uygulama içeriği'nden okunup buraya yazılacak.

## Dosyalar

- `listings/<Play dil kodu>.json` — `title` (≤30), `short` (≤80), `full` (≤4000), `notes` (sürüm notu, ≤500). Sınırları `npm test` denetler.
- Diller: en-US, tr-TR, es-419, es-ES, pt-BR, fr-FR, de-DE, it-IT, id, vi, hi-IN, ar, fa, ja-JP, ko-KR.
- Uygulama içi dil listesi `src/i18n/languages.ts`; mağaza dili eklenince ikisi aynı kalmalı.

## Sürüm alma

Yükleme anahtarı `credentials/release.keystore` (git dışı). Sertifika SHA-256
`97:53:4B:E9:95:F8:10:72:90:80:52:43:89:1C:52:42:82:D6:EE:CE:EB:82:7C:62:2D:3E:48:49:19:70:3B:39`.

- Windows: `npm run apk` / `C:/rnb/...` aynası (AGENTS.md "Derleme").
- Linux Mint: `~/rnb/...` aynası, JDK 21, foojay 1.0.0 yaması (AGENTS.md "Derleme").
- Gerçek reklam kimlikleri `.env.local`'den gelir; test derlemesinde bu dosya aynaya kopyalanmaz.

Her sürümde `app.json` `versionCode` +1, `version` + `package.json` + `src/theme.ts` `APP_VERSION` güncellenir.

## Geçmiş

- 2026-10-22 — 1.3.9 (16): 12 yeni dil (uygulama + `listings/`), puan isteği. Yerelde hazır; Play'e girilmedi.
