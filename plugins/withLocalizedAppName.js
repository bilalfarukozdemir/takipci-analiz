/**
 * Android'de telefonun ana ekranında görünen uygulama adını dile göre ayarlar.
 *
 * Yedek dil İngilizce: Türkçe olmayan her telefonda "Follower Analyzer"
 * (values/strings.xml), Türkçe telefonda "Takipçi Analiz" (values-tr/strings.xml).
 * app.json'daki "name" alanı Gradle proje adı olarak da kullanıldığı için ASCII
 * tutuluyor; ekranda görünen ad burada ayrıca yazılıyor.
 */
const fs = require('fs');
const path = require('path');

const { AndroidConfig, withDangerousMod, withStringsXml } = require('expo/config-plugins');

const YEDEK_AD = 'Follower Analyzer';
const TURKCE_AD = 'Takipçi Analiz';

module.exports = function withLocalizedAppName(config) {
  // 1) yedek (İngilizce) ad — values/strings.xml
  config = withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name' }, _: YEDEK_AD }],
      cfg.modResults
    );
    return cfg;
  });

  // 2) Türkçe ad — withStringsXml yalnızca values/ klasörünü düzenlediği için dosya elle yazılıyor
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const klasor = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/values-tr');
      fs.mkdirSync(klasor, { recursive: true });
      fs.writeFileSync(
        path.join(klasor, 'strings.xml'),
        `<resources>\n  <string name="app_name">${TURKCE_AD}</string>\n</resources>\n`,
        'utf8'
      );
      return cfg;
    },
  ]);
};
