/**
 * Release derlemesinin ayarları:
 *
 * - Yalnızca gerçek telefonların kullandığı ARM mimarileri derlenir. x86 / x86_64
 *   sadece emülatörler içindir ve APK'ya ~30 MB ekler.
 *   Emülatörde çalıştırmak gerekirse:
 *     cd android && gradlew.bat assembleRelease -PreactNativeArchitectures=x86_64
 *
 * - R8 (kod küçültme + karartma) ve kullanılmayan kaynakları atma açık. Play
 *   Console "DEX kodu optimizasyonu eşiğin altında — kod karartma %1" diyerek bunu
 *   bellek kullanımında "kötü davranış" sayıyor (son tarih Şubat 2027). R8
 *   kullanılmayan sınıfları attığı için uygulama daha az bellek kullanır; eşleme
 *   dosyası (mapping.txt) AAB'nin içine girer, Play çökme raporlarını onunla çözer.
 */
const { withGradleProperties } = require('expo/config-plugins');

const AYARLAR = {
  reactNativeArchitectures: 'armeabi-v7a,arm64-v8a',
  'android.enableMinifyInReleaseBuilds': 'true',
  'android.enableShrinkResourcesInReleaseBuilds': 'true',
};

module.exports = function withBuildTuning(config) {
  return withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(AYARLAR)) {
      const i = cfg.modResults.findIndex((it) => it.type === 'property' && it.key === key);
      const item = { type: 'property', key, value };
      if (i >= 0) cfg.modResults[i] = item;
      else cfg.modResults.push(item);
    }
    return cfg;
  });
};
