# Değişiklikler

Bu dosya [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) biçimini,
sürüm numaraları [Semantic Versioning](https://semver.org/lang/tr/) kurallarını
izler.

## [Yayınlanmamış]

## [1.3.5] – 2026-10-13

### Düzeltildi
- Instagram'a giriş yapıldıktan hemen sonra "Instagram arayüzü değişmiş olabilir"
  hatası çıkıp listelerin hiç çekilememesi düzeltildi. 1.3.4'te eklenen oturum
  kontrolü, Instagram'dan beklenmedik bir cevap gelince girişi engelliyordu; artık
  yalnız gerçek oturum, güvenlik doğrulaması ve hız sınırı cevaplarında duruyor.
- Liste çekimi beklenmedik bir hatayla durursa hata ekranında küçük bir teknik
  satır (durum kodu ve Instagram'ın mesajı) gösteriliyor; sorun tahmin edilmeden
  anlaşılabiliyor.

## [1.3.4] – 2026-10-04

### Düzeltildi
- Instagram'ın kapattığı oturumun eski `ds_user_id` çerezi yüzünden giriş yapılmış
  sayılması ve tekrar girişin aynı hesaba dönmesi düzeltildi. Sunucu doğrulaması,
  geçici WebView ve yeniden girişte yeni pencere kullanılıyor.
- Oturum ve güvenlik doğrulaması hataları artık liste çekimini durduruyor;
  güvenlik kontrolü ayrı açıklanıyor. Kısmi sonuçlar başarı olarak kaydedilmiyor.

### Değişti

- Banner üzerindeki Sponsorlu satırı, ekstra boşluk ve üst çizgi kaldırıldı; alan yalnız reklamın kendi boyutu kadar yer kaplar.
- Banner önceki küçük 320×50 boyuta geri döndü; ekranın altında fazla yer kaplamıyor.
- Dil, fotoğraf önbelleği, reklam gizliliği ve veri temizleme ayrı Ayarlar sekmesine taşındı. Geçmiş yalnız kayıtlara ayrıldı; header Premium düğmesi reklam kaldırma ve satın alımı geri yükleme ekranını açıyor.
- Reklam kaldırma satın alımı artık banner ve tam sayfa reklamları kapsıyor.
- Google Play Billing üzerinden doğrudan, dijital fayda sunmayan bağış seçeneği
  kaldırıldı; destek ödeme yolu politikaya uygun seçenek netleşene kadar bekliyor.
- Tam sayfa reklamlar başarılı analiz ve "Geri takip etmeyenler" listesine
  geçişte, sıklık sınırı uygulanarak gösterilebiliyor.

## [1.3.3] – 2026-09-24

### Değişti
- Reklam banner'ı Geçmiş kartından çıkarılıp uygulama ekranlarının altına
  sabitlendi; alt menü ve sistem güvenli alanı için yer ayrıldı.

## [1.3.1] – 2026-09-14

### Düzeltildi
- **İngilizce arayüzde uygulamanın adı Türkçe kalıyordu.** Ana ekranın başlığı
  ve ekranların altındaki not, uygulama İngilizce açıldığında da "Takipçi
  Analiz" yazıyordu; artık "Follower Analyzer".
- **Telefonun ana ekranındaki uygulama adı her dilde Türkçeydi.** Artık Türkçe
  telefonda "Takipçi Analiz", diğer bütün dillerde "Follower Analyzer".
  Android'in yedek dili İngilizce (`values/`), Türkçe ad `values-tr/` altında.

## [1.3.0] – 2026-08-29

### Eklendi
- **İngilizce dil desteği.** Arayüz artık Türkçe ve İngilizce; varsayılan
  cihazın sistem diline göre otomatik seçilir, Geçmiş sekmesindeki dil
  seçiciden elle de değiştirilebilir. Tercih cihazda kalıcı olarak saklanır.
- Play Store yayını için `PRIVACY.md` / `PRIVACY.en.md` gizlilik politikası
- **Geliştiriciyi Destekle** — Google Play Billing (`expo-iap`) üzerinden
  isteğe bağlı, tekrarlanabilir bağış (Bir kahve ısmarla / Bir öğün
  ısmarla / Cömert destek). Hiçbir özelliği kilitlemez; ödeme tamamen
  Google Play tarafından yürütülür, kart bilgisi uygulamaya hiç ulaşmaz.
  Geçmiş sekmesinde yeni bir kart olarak görünür.

## [1.2.2] – 2026-08-14

### Düzeltildi
- Ana ekranın üst yazısı canlı çekim eklendikten sonra güncellenmemişti;
  uygulamayı hâlâ yalnızca veri arşivi okuyormuş gibi tanıtıyordu. Ayrıca
  "şifre istemez" ifadesi, ana butonu "Instagram'a bağlan" olan bir ekranda
  yanıltıcıydı — şifre gerçekten uygulamaya girilmiyor ama bunu açıkça söylemek
  gerekiyordu.

## [1.2.1] – 2026-08-14

### Eklendi
- Ana sayfa ve Yardım ekranının altına, siteye bağlanan yapımcı künyesi
- Künyede uygulama sürümü ve "Instagram ile bağlantılı değildir" notu

## [1.2.0] – 2026-08-14

### Eklendi
- **Profil fotoğrafları.** Canlı çekimde gelen fotoğraflar, satır listede ilk
  göründüğünde cihaza indirilip kalıcı olarak saklanır. Instagram'ın imzalı
  adresleri birkaç gün içinde geçersiz olduğu için sadece adres saklamak yetmiyor.
- Aynı anda en fazla 4 indirme, en son görünen satır öncelikli; kaydırılmayan
  satırlar hiç indirilmez
- Geçmiş sekmesinde fotoğrafları kapatma anahtarı ve önbelleği (MB olarak) silme
- Fotoğraflar kullanıcı adına göre saklandığı için veri arşivinden yüklenen
  listelerde de görünür

## [1.1.0] – 2026-08-14

### Eklendi
- **Canlı çekim.** Instagram'ın kendi giriş sayfası uygulama içinde açılır; giriş
  sonrası takipçi ve takip listeleri doğrudan çekilir. Şifre uygulamaya girilmez,
  saklanmaz, gönderilmez.
- Çekim sırasında canlı ilerleme göstergesi ve durdurma
- Hız sınırı (`429`), oturum düşmesi (`401/403`) ve zaman aşımı için ayrı ayrı
  açıklayıcı hata ekranları
- Kişilerin görünen adları listelerde gösteriliyor ve aramaya dahil
- Yardım ekranı iki yöntemi karşılaştıracak şekilde yeniden yazıldı

### Değişti
- Ana sayfa ve Geçmiş ekranındaki tek "veri yükle" butonu, iki yöntem için iki
  butona ayrıldı

## [1.0.0] – 2026-08-14

İlk sürüm.

### Eklendi
- Instagram veri arşivini (`.zip`, `.json`, `.html`) okuma; modern JSON, çok
  parçalı `followers_1/2.json`, HTML çıktısı ve 2020 öncesi `connections.json`
  desteği
- Anlık görüntülerin cihazda saklanması ve iki kaydın karşılaştırılması
- 14 liste: takipten çıkanlar, geri takip etmeyenler, hayranlar, yeni takipçiler,
  karşılıklı takip, bekleyen istekler, gelen istekler, bırakılan/yeni takip
  edilenler, yakın arkadaşlar, engellenenler, tüm takipçi ve takip listesi
- Arama, sıralama (A→Z, Z→A, en yeni, en eski), kullanıcı adı kopyalama, listeyi
  `.txt` olarak paylaşma, profili Instagram'da açma
- ✓ ile işaretleyip listeden gizleme
- Geçmiş ekranı: kayıt silme, karşılaştırma seçimi, tüm verileri silme
- Türkçe arayüz, koyu tema, Android uyarlanabilir uygulama simgesi
- Kendi anahtarıyla imzalanmış release APK üretimi

1.2.1 öncesi sürümler yalnızca yerelde derlendi; ilk yayınlanan sürüm 1.2.1'dir.

[1.2.2]: https://github.com/bilalfarukozdemir/takipci-analiz/releases/tag/v1.2.2
[1.2.1]: https://github.com/bilalfarukozdemir/takipci-analiz/releases/tag/v1.2.1
