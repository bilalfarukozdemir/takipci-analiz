# Gizlilik Politikası

**Yürürlük tarihi: 2026-09-24**

Bu belge Takipçi Analiz uygulamasının Google Play üzerinde yayınlanması için
hazırlanmıştır. [English version](PRIVACY.en.md).

Kısa özet: **uygulama sunucusu ve hesap yok.** Reklam kimlikleri yapılandırılmış Android sürümünde
reklam izinleri uygunsa uygulama ekranlarının altında banner, başarılı analizden
sonra veya belirli listeye geçişte tam sayfa reklam gösterilebilir; tek seferlik
satın alımla tümü kaldırılabilir. Ayrı bir
analitik hizmeti kurulu değildir. Uygulama
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

Bu yöntem, Instagram'ın resmî olarak belgelenmiş bir geliştirici arayüzünü
değil, web arayüzünün kendi kullandığı uçları kullanır. Sık kullanımda
hesaba geçici işlem engeli gelebilir; uygulama bunu çekimden önce açıkça
uyarı olarak gösterir. Riski istemeyen kullanıcı veri arşivi yöntemini
kullanabilir.

## Veri nerede saklanıyor

- Anlık görüntüler (takipçi/takip listeleri), gizlenen hesap listesi ve
  ayarlar **cihazda**, `expo-sqlite/kv-store` (SQLite tabanlı yerel depo)
  ile saklanır (`src/lib/storage.ts`).
- Profil fotoğrafları, adresleri birkaç gün içinde geçersiz olduğu için
  cihazın dosya sistemine indirilip saklanır (`src/lib/avatars.ts`).
- Takipçi listeleri, analiz sonuçları ve uygulama kayıtları geliştiricinin
  sunucusuna yüklenmez ya da geliştiriciyle paylaşılmaz. Android sistem
  yedeklemesi açıktır; cihazın yedekleme ayarlarına bağlı olarak uygun uygulama
  verileri Google hesabına yedeklenebilir. Geliştirici bu yedeklere erişemez.
  Google Mobile Ads'in reklam için işleyebileceği cihaz/ağ verileri yukarıdaki
  ayrı bölümde anlatılır.

## Google reklamları ve reklam gizliliği

Gerçek AdMob kimlikleriyle yapılandırılmış Android sürümü, reklam izinleri
uygunsa uygulama ekranlarının altında Google Mobile Ads SDK aracılığıyla banner
reklamı gösterebilir. Ayrıca başarılı analizden sonra ve "Geri takip etmeyenler"
listesine geçerken tam sayfa reklam gösterebilir.
Tam sayfa reklamlar arasında en az iki kullanıcı etkileşimi olur. Geliştirme
sürümü Google'ın test reklamlarını kullanır. Reklam SDK'sı reklam sunumu,
ölçümü, kötüye kullanımı önleme ve ilgili gizlilik tercihleri için IP adresi,
reklam görüntüleme/etkileşim bilgileri, tanılama verileri ve Android reklam
kimliği ya da App Set ID gibi tanımlayıcıları otomatik olarak toplayabilir veya
işleyebilir. Bu verileri Google yönetir; reklam SDK'sına takipçi listeleri,
Instagram oturum çerezleri veya analiz sonuçları uygulama kodu tarafından
aktarılmaz.

Google'ın izin sistemi gerekli olduğunda uygulama reklamı istemeden önce
Google UMP onay formunu gösterir. Uygulama içindeki **Reklam gizliliği
seçenekleri** düğmesi Google'ın sunduğu ek tercih formunu açar. Bu SDK'nın veri
işlemesi hakkında ayrıntı için [Google Mobile Ads veri açıklamasına](https://developers.google.com/admob/android/privacy/play-data-disclosure)
ve [Google Gizlilik Politikası'na](https://policies.google.com/privacy) bakın.

Uygulamanın kendi kullanım analitiği veya çökme raporlama servisi yoktur.
Uygulama içindeki reklamlar Google Mobile Ads ile sınırlıdır.

## Hesap gerekmiyor

Uygulama kendi hesap sistemi kurmaz, e-posta ya da kimlik bilgisi istemez.
Canlı çekim için kullanılan tek "giriş" senin zaten sahip olduğun Instagram
hesabıdır.

## Reklamları kaldırma (Google Play Billing)

`remove_ads` adlı tek seferlik, tüketilmeyen Play satın alımı uygulama
banner ve tam sayfa reklamlarını kaldırır. Uygulama açılışında Play Billing
üzerinden bu satın alımın durumu sorgulanır; mağaza durumu doğrulanamazsa reklam
gösterilmez. Ödeme bilgileri uygulamaya ulaşmaz.

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
