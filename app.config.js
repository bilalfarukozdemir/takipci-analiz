const TEST_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const TEST_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = ({ config }) => {
  const androidAppId = process.env.ADMOB_ANDROID_APP_ID || TEST_ANDROID_APP_ID;
  const iosAppId = process.env.ADMOB_IOS_APP_ID || TEST_IOS_APP_ID;

  if (
    (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID) &&
    !process.env.ADMOB_ANDROID_APP_ID
  ) {
    throw new Error('A real ADMOB_ANDROID_APP_ID is required when enabling production ads.');
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ['react-native-google-mobile-ads', { androidAppId, iosAppId }],
    ],
  };
};
