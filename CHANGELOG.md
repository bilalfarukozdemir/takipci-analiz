# Değişiklikler

Bu dosya [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) biçimini,
sürüm numaraları [Semantic Versioning](https://semver.org/lang/tr/) kurallarını
izler.

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

[1.2.1]: https://github.com/bilalfarukozdemir/takipci-analiz/releases/tag/v1.2.1
