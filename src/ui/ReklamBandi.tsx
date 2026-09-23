import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { bannerReklamBirimId, reklamIcinIzinAl } from '../lib/ads';
import { C } from '../theme';

export function ReklamBandi({ gizle }: { gizle: boolean }) {
  const { t } = useTranslation();
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
      <Text style={st.label}>{t('ads.label')}</Text>
      <BannerAd unitId={birimId} size={BannerAdSize.BANNER} />
    </View>
  );
}

const st = StyleSheet.create({
  container: { alignItems: 'center', gap: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border },
  label: { color: C.sub, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
});
