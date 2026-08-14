# Güvenlik

## Açık bildirme

Güvenlik açığı bulduysan **herkese açık issue açma**. Bunun yerine GitHub'ın
[özel güvenlik bildirimi](https://github.com/bilalfarukozdemir/takipci-analiz/security/advisories/new)
formunu kullan.

Yanıt süresi: birkaç gün. Bu, tek kişilik bir hobi projesidir; ödül programı yoktur.

## Kapsam

Bu uygulamanın sunucusu yoktur; tüm veri ve işlem kullanıcının cihazındadır.
İlgilendiğimiz açık türleri:

- Instagram oturum çerezinin WebView dışına sızması
- Cihazdaki anlık görüntülerin (takipçi listeleri) başka uygulamalara açılması
- Kullanıcı adlarının veya profil verisinin üçüncü bir tarafa gitmesi
- Arşiv dosyası çözümlenirken (zip/json/html) kod çalıştırılmasına yol açan girdi
- İmzalama anahtarının depoya ya da derleme çıktısına sızması

**Kapsam dışı:** Instagram'ın kendi altyapısı. Instagram'da bir açık bulduysan
[Meta'nın bug bounty programına](https://www.facebook.com/whitehat) bildir.

## Bilinen riskler

Bunlar açık değil, tasarım gereği bilinen ödünleşmelerdir:

- **Canlı çekim Instagram kullanım şartlarına aykırıdır** ve hesaba geçici işlem
  engeli getirebilir. Uygulama bunu ekranda açıkça söyler ve isteklerin arasına
  gecikme koyar.
- **Instagram oturumu WebView'in çerez deposunda kalır.** Cihaza fiziksel erişimi
  olan biri bu oturumu kullanabilir — telefonunu kilitli tut.
- **Anlık görüntüler şifrelenmeden saklanır** (uygulamanın kendi özel alanında,
  Android sanal alanı içinde). Root'lu cihazlarda okunabilir.
- **Yedekleme açıktır** (`android:allowBackup="true"`). Cihaz yedeğine takipçi
  listelerinin girmesini istemiyorsan Android ayarlarından uygulama yedeğini kapat.

## İmzalama anahtarı

`credentials/` klasörü `.gitignore` ile depodan dışlanmıştır ve **hiçbir zaman**
commit edilmemelidir. Ayrıntı: [`credentials/README.md`](credentials/README.md).

Yayınlanan APK'ların imza parmak izini
[Releases](https://github.com/bilalfarukozdemir/takipci-analiz/releases) sayfasında
bulabilirsin; başka bir yerden indirdiğin APK'yı kurmadan önce karşılaştır:

```bash
apksigner verify --print-certs takipci-analiz.apk
```
