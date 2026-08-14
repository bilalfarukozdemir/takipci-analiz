/**
 * Android 11+ paket görünürlüğü: `instagram://` bağlantısının Instagram
 * uygulamasında açılabilmesi için manifest'e <queries> girdisi ekler.
 * Bu olmadan sistem uygulamayı "görmez" ve profil tarayıcıda açılır.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const PAKETLER = ['com.instagram.android', 'com.instagram.lite'];

module.exports = function withInstagramQuery(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (!Array.isArray(manifest.queries) || manifest.queries.length === 0) {
      manifest.queries = [{}];
    }
    const q = manifest.queries[0];
    if (!Array.isArray(q.package)) q.package = [];
    for (const paket of PAKETLER) {
      const varMi = q.package.some((p) => p?.$?.['android:name'] === paket);
      if (!varMi) q.package.push({ $: { 'android:name': paket } });
    }
    return cfg;
  });
};
