/**
 * Release APK'sını `credentials/release.keystore` ile imzalar.
 *
 * `npx expo prebuild` her çalıştığında android/ klasörü yeniden üretildiği için
 * imzalama ayarı burada, config plugin olarak tutuluyor.
 * credentials/ klasörü yoksa hiçbir şey yapmaz; derleme debug anahtarına düşer.
 */
const fs = require('fs');
const path = require('path');

const { withAppBuildGradle, withDangerousMod, withGradleProperties } = require('expo/config-plugins');

const KEYSTORE = 'release.keystore';

function readCredentials(projectRoot) {
  try {
    const file = path.join(projectRoot, 'credentials', 'keystore.json');
    if (!fs.existsSync(file)) return null;
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!json.storePassword || !json.keyAlias || !json.keyPassword) return null;
    if (!fs.existsSync(path.join(projectRoot, 'credentials', KEYSTORE))) return null;
    return json;
  } catch {
    return null;
  }
}

module.exports = function withReleaseSigning(config) {
  // 1) keystore dosyasını android/app içine kopyala
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'credentials', KEYSTORE);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(cfg.modRequest.platformProjectRoot, 'app', KEYSTORE));
      }
      return cfg;
    },
  ]);

  // 2) parolaları gradle.properties'e yaz
  config = withGradleProperties(config, (cfg) => {
    const cred = readCredentials(cfg.modRequest.projectRoot);
    if (!cred) return cfg;
    const set = (key, value) => {
      const item = { type: 'property', key, value: String(value) };
      const i = cfg.modResults.findIndex((it) => it.type === 'property' && it.key === key);
      if (i >= 0) cfg.modResults[i] = item;
      else cfg.modResults.push(item);
    };
    set('TA_STORE_FILE', KEYSTORE);
    set('TA_STORE_PASSWORD', cred.storePassword);
    set('TA_KEY_ALIAS', cred.keyAlias);
    set('TA_KEY_PASSWORD', cred.keyPassword);
    return cfg;
  });

  // 3) build.gradle'a release imzalama yapılandırmasını ekle
  config = withAppBuildGradle(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes('signingConfigs.release')) return cfg;

    // önce release buildType'ındaki imzayı değiştir (signingConfigs bloğu eklenmeden)
    src = src.replace(
      /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig project.hasProperty('TA_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
    );

    // sonra release signingConfig'i tanımla
    src = src.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        release {
            if (project.hasProperty('TA_STORE_FILE')) {
                storeFile file(TA_STORE_FILE)
                storePassword TA_STORE_PASSWORD
                keyAlias TA_KEY_ALIAS
                keyPassword TA_KEY_PASSWORD
            }
        }`
    );

    cfg.modResults.contents = src;
    return cfg;
  });

  return config;
};
