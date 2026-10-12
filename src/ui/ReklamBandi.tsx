import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { bannerReklamBirimId, reklamIcinIzinAl } from '../lib/ads';

export function ReklamBandi({ gizle }: { gizle: boolean }) {
  const [izinVar, setIzinVar] = useState(false);
  const birimId = bannerReklamBirimId();

  useEffect(() => {
    let mounted = true;
    if (!gizle && birimId) {
      void reklamIcinIzinAl().then((izin) => {
        if (mounted) setIzinVar(izin);
      });
    }
    return () => { mounted = false; };
  }, [gizle, birimId]);

  if (gizle || !izinVar || !birimId) return null;

  return (
    <View style={st.container}>
      <BannerAd unitId={birimId} size={BannerAdSize.BANNER} />
    </View>
  );
}

const st = StyleSheet.create({
  container: { alignSelf: 'center', alignItems: 'center' },
});
