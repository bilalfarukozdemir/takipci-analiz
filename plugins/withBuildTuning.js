/**
 * APK boyutunu küçültür: yalnızca gerçek telefonların kullandığı ARM mimarileri
 * derlenir. x86 / x86_64 sadece emülatörler içindir ve APK'ya ~30 MB ekler.
 *
 * Emülatörde çalıştırmak gerekirse:
 *   cd android && gradlew.bat assembleRelease -PreactNativeArchitectures=x86_64
 */
const { withGradleProperties } = require('expo/config-plugins');

const MIMARILER = 'armeabi-v7a,arm64-v8a';

module.exports = function withBuildTuning(config) {
  return withGradleProperties(config, (cfg) => {
    const i = cfg.modResults.findIndex(
      (it) => it.type === 'property' && it.key === 'reactNativeArchitectures'
    );
    const item = { type: 'property', key: 'reactNativeArchitectures', value: MIMARILER };
    if (i >= 0) cfg.modResults[i] = item;
    else cfg.modResults.push(item);
    return cfg;
  });
};
