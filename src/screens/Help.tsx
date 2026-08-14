import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { openUrl } from '../lib/ig';
import { C, S } from '../theme';
import { Footer } from '../ui/Credit';
import { Btn, Card, Header } from '../ui/kit';

const ADIMLAR: { t: string; d: string }[] = [
  {
    t: 'Instagram’da Hesap Merkezi’ni aç',
    d: 'Profil → sağ üstteki ☰ menü → “Ayarlar ve gizlilik” → en üstteki “Hesap Merkezi”.',
  },
  {
    t: 'Bilgilerini indir bölümüne gir',
    d: '“Bilgileriniz ve izinleriniz” → “Bilgilerini indir” → “Bilgileri indir”.',
  },
  {
    t: 'Sadece takipçi verisini seç',
    d: 'Hesabını seç → “Bilgilerinin bir kısmını seç” → listeden yalnızca “Takipçiler ve takip edilenler”i işaretle. Tümünü seçersen arşiv günler sürer ve yüzlerce MB olur.',
  },
  {
    t: 'Formatı JSON yap',
    d: 'Tarih aralığı: “Tüm zamanlar”. Format: “JSON”. Sonra “Dosya oluştur”. Sadece takipçi verisi seçildiğinde genelde dakikalar içinde hazır olur.',
  },
  {
    t: 'Zip dosyasını buraya yükle',
    d: 'İndirdiğin .zip dosyasını “Veri arşivi dosyası seç” ile aç. Zip’i açtıysan followers_1.json ve following.json dosyalarını birlikte de seçebilirsin.',
  },
];

const SSS: { s: string; c: string }[] = [
  {
    s: 'Takipten çıkanları neden ilk seferde göremiyorum?',
    c: 'Instagram hiçbir yöntemle “kim seni takipten çıktı” bilgisini vermiyor — ne arşivde ne de arayüzünde böyle bir kayıt var. Bunu bulmanın tek yolu iki farklı zamandaki takipçi listeni karşılaştırmak. İlk çekim başlangıç noktan olur; ikinciden itibaren takipten çıkanlar listelenir.',
  },
  {
    s: 'Şifrem uygulamada saklanıyor mu?',
    c: 'Hayır. “Instagram’a bağlan” dediğinde açılan sayfa Instagram’ın kendi giriş sayfası. Şifreni doğrudan Instagram’a giriyorsun; uygulama şifreyi görmüyor, kaydetmiyor, hiçbir yere göndermiyor. Sadece oluşan oturum çerezi telefonda kalıyor.',
  },
  {
    s: 'Canlı çekim hesabımı riske atar mı?',
    c: 'Bu yöntem Instagram’ın kullanım şartlarına aykırıdır. İstekler yavaş ve aralıklı atılıyor ama çok sık tekrarlarsan Instagram geçici “işlem engeli” koyabilir (genelde birkaç saatte kalkar). Günde birden fazla çekme; çok büyük hesaplarda haftada bir yeterli. Riski sıfırlamak istersen veri arşivi yöntemini kullan.',
  },
  {
    s: 'Hesabım açık, neden yine de giriş gerekiyor?',
    c: 'Çıkış yapmış haldeyken açık bir profilde sadece takipçi sayısını görebilirsin; listeye tıklayınca Instagram giriş ister. Listeyi döndüren uçlar açık hesaplarda bile oturum çerezi istiyor. Bu Instagram’ın tercihi, uygulamanın kısıtı değil.',
  },
  {
    s: 'İki yöntemin farkı ne?',
    c: 'Canlı çekim anında sonuç verir; görünen adları ve profil fotoğraflarını da getirir, ama takip tarihi yoktur ve ToS’a aykırıdır. Veri arşivi yavaştır ama tamamen kurallara uygundur ve “bu kişiyi ne zamandan beri takip ediyorum” bilgisini içerir; fotoğraf içermez. İkisini karışık da kullanabilirsin; kayıtlar aynı listede birikir.',
  },
  {
    s: 'Profil fotoğrafları nereden geliyor?',
    c: 'Canlı çekimde Instagram fotoğraf adreslerini de veriyor ama bu adresler imzalı ve kısa ömürlü — birkaç gün sonra ölüyorlar. Bu yüzden fotoğraf listede ilk göründüğünde telefona indirilip saklanıyor; sonrasında internet olmadan da görünüyor ve eski kayıtlarda kaybolmuyor. Sadece kaydırdığın kadarı iniyor, hepsi birden değil. Geçmiş sekmesinden kapatabilir ya da indirilenleri silebilirsin.',
  },
  {
    s: 'Verilerim bir yere gönderiliyor mu?',
    c: 'Hayır. Tüm işlem telefonunda yapılır. Uygulamayı silersen kayıtlar da silinir.',
  },
  {
    s: 'Uygulamadan takipten çıkabilir miyim?',
    c: 'Hayır, bilerek eklenmedi — toplu takipten çıkma, hesap engeli yemenin en hızlı yoludur. Listedeki bir hesaba dokununca profili Instagram’da açılır, oradan elle çıkabilirsin. Hallettiklerini ✓ ile işaretleyip listeden gizleyebilirsin.',
  },
];

export function Help({ onImport, onConnect }: { onImport: () => void; onConnect: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Header title="Nasıl kullanılır?" subtitle="İki yöntem, aynı sonuç" />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        <Card>
          <Text style={st.h}>⚡ Instagram’a bağlan (hızlı)</Text>
          <Text style={st.p}>
            Instagram’ın kendi giriş sayfasında oturum açarsın, listeler birkaç dakikada çekilir.
            Anında sonuç verir; kişilerin görünen adlarını ve profil fotoğraflarını da getirir.
          </Text>
          <Text style={[st.p, { color: C.yellow, marginTop: 8 }]}>
            Instagram’ın kullanım şartlarına aykırıdır; sık kullanırsan geçici işlem engeli riski
            vardır.
          </Text>
          <View style={{ height: 14 }} />
          <Btn label="Instagram’a bağlan" icon="⚡" onPress={onConnect} />
        </Card>

        <Card>
          <Text style={st.h}>📂 Veri arşivi (kurallara uygun)</Text>
          <Text style={st.p}>
            Instagram’ın kendi verdiği arşivi okur. Hiçbir risk yoktur ve “bu kişiyi ne zamandan beri
            takip ediyorum” bilgisini de içerir. Dosyanın hazırlanmasını beklemen gerekir.
          </Text>
          {ADIMLAR.map((a, i) => (
            <View key={a.t} style={st.step}>
              <View style={st.stepNo}>
                <Text style={st.stepNoTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.stepT}>{a.t}</Text>
                <Text style={st.stepD}>{a.d}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 14 }} />
          <Btn
            label="İndirme sayfasını aç"
            icon="🌐"
            kind="ghost"
            onPress={() => openUrl('https://accountscenter.instagram.com/info_and_permissions/dyi/')}
          />
          <View style={{ height: 8 }} />
          <Btn label="Veri arşivi dosyası seç" icon="📂" kind="ghost" onPress={onImport} />
        </Card>

        <Text style={st.section}>Sık sorulanlar</Text>
        {SSS.map((f) => (
          <Card key={f.s}>
            <Text style={st.q}>{f.s}</Text>
            <Text style={st.a}>{f.c}</Text>
          </Card>
        ))}

        <View style={{ height: 4 }} />
        <Footer />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  h: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  p: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  step: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNoTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  stepT: { color: C.text, fontSize: 14, fontWeight: '700' },
  stepD: { color: C.sub, fontSize: 12.5, lineHeight: 19, marginTop: 3 },
  section: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  q: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  a: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
});
