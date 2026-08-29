# Gizlilik Politikası

**Yürürlük tarihi: 2026-08-29**

Bu belge Takipçi Analiz uygulamasının Google Play üzerinde yayınlanması için
hazırlanmıştır. [English version](PRIVACY.en.md).

Kısa özet: **sunucu yok, hesap yok, reklam yok, analitik yok.** Uygulama
Instagram, Meta Platforms Inc. veya bağlı kuruluşlarıyla hiçbir ilişkisi
olmayan, bağımsız bir çalışmadır.

## Hangi veriler işleniyor

Uygulama iki yoldan biriyle takipçi/takip listeni alır:

1. **Veri arşivi** — Instagram'ın kendi "Bilgilerini indir" özelliğiyle
   ürettiğin `.zip`/`.json`/`.html` dosyasını sen seçip yüklersin
   (`src/lib/importer.ts`, `src/lib/parse.ts`).
2. **Canlı çekim** — bkz. aşağıdaki bölüm.

İşlenen veriler: kullanıcı adı, görünen ad ve (canlı çekimde) profil fotoğrafı
adresi. Bunlardan çıkarılan liste kategorileri (takipten çıkanlar, geri takip
etmeyenler vb.) cihazda hesaplanır.

Uygulama **konum, kişi listesi, kamera, mikrofon** gibi bir izin istemez.
`app.json` ve `plugins/withInstagramQuery.js` içinde tanımlı tek Android
özel girdisi, `instagram://` bağlantısının Instagram uygulamasında
açılabilmesi için gereken paket görünürlüğü (`<queries>`) kaydıdır — bu,
kullanıcıdan onay istenen bir çalışma zamanı izni değildir.

## Canlı çekim — dürüst anlatım

Canlı çekim özelliği "Instagram'a bağlan" ekranında bir WebView (uygulama
içi tarayıcı bileşeni) açar ve bu WebView doğrudan **Instagram'ın kendi
giriş sayfasını** (`https://www.instagram.com/accounts/login/`) yükler.
Şifreni Instagram'ın sayfasına girersin; uygulamanın kodu bu sayfanın
içeriğine erişmez, şifreyi görmez, saklamaz, hiçbir yere göndermez
(`src/screens/Connect.tsx`, `src/lib/igLive.ts`).

Giriş tamamlandıktan sonra, sayfanın **içine** enjekte edilen bir JavaScript
script'i çalışır (`src/lib/igLive.ts`). Bu script:

- Instagram'ın web arayüzünün kendisinin kullandığı uçlara istek atar:
  `GET /api/v1/users/{uid}/info/`,
  `GET /api/v1/friendships/{uid}/followers/`,
  `GET /api/v1/friendships/{uid}/following/`.
- Bu istekler `credentials: 'include'` ile, yani **kendi oturum çerezlerinle**
  ve **doğrudan Instagram'ın sunucularına** gider. Aradan geçen bir sunucu
  (geliştiricinin sunucusu ya da başka bir üçüncü taraf) yoktur — çünkü böyle
  bir sunucu hiç yok.
- Çerezler (`ds_user_id`, `csrftoken`) sadece bu script içinde, WebView'in
  kendi bağlamında okunur; script'in dışına, React tarafına ya da cihaz
  dışına çıkmaz. React tarafına `postMessage` ile sadece ayrıştırılmış
  kullanıcı listesi (`{kullanıcı adı, görünen ad, profil fotoğrafı adresi}`)
  ve ilerleme bilgisi geçer — ham çerez ya da oturum verisi değil.
- Oturum çerezinin kendisi, tarayıcı motorunun (Android sistem WebView'i)
  kendi çerez deposunda kalır; uygulamanın kendi kodu (`src/lib/storage.ts`)
  bu çerezi hiçbir zaman okumaz ya da kaydetmez.

Bu yöntem Instagram'ın kullanım şartlarına aykırıdır ve sık kullanımda
hesaba geçici işlem engeli getirebilir; uygulama bunu çekimden önce açıkça
uyarı olarak gösterir. Riski istemeyen kullanıcı veri arşivi yöntemini
kullanabilir.

## Veri nerede saklanıyor

- Anlık görüntüler (takipçi/takip listeleri), gizlenen hesap listesi ve
  ayarlar **cihazda**, `expo-sqlite/kv-store` (SQLite tabanlı yerel depo)
  ile saklanır (`src/lib/storage.ts`).
- Profil fotoğrafları, adresleri birkaç gün içinde geçersiz olduğu için
  cihazın dosya sistemine indirilip saklanır (`src/lib/avatars.ts`).
- Hiçbir veri bir sunucuya yüklenmez, yedeklenmez ya da geliştiriciyle ya da
  başka biriyle paylaşılmaz — çünkü uygulamanın buna hizmet eden bir sunucusu
  yoktur.

## Analitik, reklam, üçüncü taraf takip

Uygulamada analitik SDK'sı, çökme raporlama servisi, reklam ağı ya da başka
bir üçüncü taraf takip kodu **yoktur**. Bu iddia `package.json`'daki
bağımlılık listesine ve kod tabanında böyle bir SDK aranarak doğrulandı —
tek ağ trafiği canlı çekim sırasında Instagram'ın kendi sunucularına giden
isteklerdir.

## Hesap gerekmiyor

Uygulama kendi hesap sistemi kurmaz, e-posta ya da kimlik bilgisi istemez.
Canlı çekim için kullanılan tek "giriş" senin zaten sahip olduğun Instagram
hesabıdır.

## Bağış (Google Play Billing)

Uygulamaya isteğe bağlı bir "Geliştiriciyi Destekle" bağış özelliği
eklenecek. Bu özellik **Google Play'in kendi satın alma sistemi (Google Play
Billing)** üzerinden çalışacak:

- Ödeme tamamen Google Play tarafından yürütülür; kart numarası, fatura
  adresi ya da kimlik bilgisi uygulamaya hiçbir zaman ulaşmaz.
- Bağış tamamen isteğe bağlıdır ve hiçbir özelliği kilitlemez ya da açmaz —
  bağış yapmayan kullanıcı uygulamanın tüm işlevlerine aynı şekilde erişir.
- Google Play Billing'in kendi veri işleme kuralları Google'ın gizlilik
  politikasına tabidir; bu bölüm sadece uygulamanın bu sistemi nasıl
  kullandığını anlatır.

> Not: Bu özellik bu belgenin yazıldığı tarihte henüz koda eklenmemiştir;
> yukarıdaki açıklama planlanan davranışı anlatır. Özellik yayınlandığında
> bu belge, gerçek uygulamayla eşleştiği doğrulanarak gözden geçirilecektir.

## Verini silme

- Geçmiş sekmesindeki **"Tüm verileri sil"** seçeneği; tüm anlık görüntüleri,
  gizlenen hesap listesini ve profil fotoğrafı önbelleğini cihazdan siler
  (`App.tsx` içindeki `wipe()`, `clearEverything()` ve `clearAvatarCache()`
  fonksiyonlarını çağırır).
- Uygulamayı telefonundan kaldırmak (uninstall) da aynı sonucu verir; tüm
  yerel veri Android tarafından silinir.
- Dil tercihi gibi bazı ayarlar bu "tümünü sil" işleminden ayrı, ama yine
  sadece cihazda tutulan, kişisel olmayan tercihlerdir.

## İletişim

Sorular, hata bildirimleri ya da bu politikayla ilgili endişeler için:
[GitHub Issues](https://github.com/bilalfarukozdemir/takipci-analiz/issues).

## Değişiklikler

Bu politika değiştiğinde bu dosya güncellenir ve yürürlük tarihi yukarıda
belirtilir. Uygulamanın [CHANGELOG.md](CHANGELOG.md) dosyasından önemli
değişiklikleri takip edebilirsin.
