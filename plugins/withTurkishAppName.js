/**
 * Android'de uygulama adını Türkçe karakterlerle ayarlar.
 *
 * app.json'daki "name" alanı Gradle proje adı olarak da kullanıldığı için ASCII
 * tutuluyor; ekranda görünen isim burada strings.xml üzerinden düzeltiliyor.
 */
const { AndroidConfig, withStringsXml } = require('expo/config-plugins');

const GORUNEN_AD = 'Takipçi Analiz';

module.exports = function withTurkishAppName(config) {
  return withStringsXml(config, (cfg) => {
    cfg.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: 'app_name', translatable: 'false' }, _: GORUNEN_AD }],
      cfg.modResults
    );
    return cfg;
  });
};
