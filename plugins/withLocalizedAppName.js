/**
 * Android'de telefonun ana ekranında görünen uygulama adını dile göre ayarlar.
 *
 * Yedek dil İngilizce: desteklenmeyen her telefonda "Follower Analyzer"
 * (values/strings.xml); diğer diller values-<klasör>/strings.xml. Dil listesi
 * src/i18n/languages.ts ve app.json'daki expo-localization supportedLocales ile
 * aynı tutulmalı. app.json'daki "name" alanı Gradle proje adı olarak da
 * kullanıldığı için ASCII tutuluyor; ekranda görünen ad burada ayrıca yazılıyor.
 */
const fs = require('fs');
const path = require('path');

const { AndroidConfig, withDangerousMod, withStringsXml } = require('expo/config-plugins');

const YEDEK_AD = 'Follower Analyzer';

/** values-<klasör> → ad. Ana ekranda kesilmesin diye kısa tutuldu. */
const ADLAR = {
  tr: 'Takipçi Analiz',
  es: 'Analizar Seguidores',
  pt: 'Analisar Seguidores',
  fr: 'Analyse Abonnés',
  de: 'Follower Analyse',
  it: 'Analisi Follower',
  'b+id': 'Analisis Pengikut',
  vi: 'Phân Tích Follower',
  hi: 'फ़ॉलोअर विश्लेषक',
  ar: 'محلل المتابعين',
  fa: 'تحلیل فالوور',
  ja: 'フォロワー分析',
  ko: '팔로워 분석기',
};

const xmlKacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, "\\'");

module.exports = function withLocalizedAppName(config) {
  // 1) yedek (İngilizce) ad — values/strings.xml
  config = withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name' }, _: YEDEK_AD }],
      cfg.modResults
    );
    return cfg;
  });

  // 2) diğer diller — withStringsXml yalnızca values/ klasörünü düzenlediği için dosyalar elle yazılıyor
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const res = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res');
      for (const [klasor, ad] of Object.entries(ADLAR)) {
        const dir = path.join(res, `values-${klasor}`);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'strings.xml'),
          `<resources>\n  <string name="app_name">${xmlKacis(ad)}</string>\n</resources>\n`,
          'utf8'
        );
      }
      return cfg;
    },
  ]);
};
