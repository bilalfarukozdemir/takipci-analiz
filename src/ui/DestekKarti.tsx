import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

import {
  REKLAMLARI_KALDIR_URUN_ID,
  type DestekModel,
} from '../hooks/useDestek';
import { reklamlarAcik, reklamGizliligiSecenekleriniAc } from '../lib/ads';
import { C } from '../theme';
import { Btn, Card } from './kit';

/** Reklamları kaldıran tek seferlik Google Play satın alımı ve reklam gizliliği. */
export function DestekKarti({ destek }: { destek: DestekModel }) {
  const { t } = useTranslation();
  const {
    durum,
    aktifUrunId,
    reklamKaldirmaUrunu,
    reklamsiz,
    reklamDurumuKontrolEdildi,
    satinAl,
    tekrarDene,
  } = destek;

  const gizlilikSecenekleriniAc = async () => {
    const acildi = await reklamGizliligiSecenekleriniAc();
    if (!acildi) Alert.alert(t('ads.privacyUnavailable.title'), t('ads.privacyUnavailable.desc'));
  };

  return (
    <Card>
      <Text style={st.title}>{t('ads.title')}</Text>

      {durum === 'yukleniyor' && (
        <View style={st.loadingRow}>
          <ActivityIndicator color={C.pink} size="small" />
          <Text style={st.sub}>{t('ads.loading')}</Text>
        </View>
      )}

      {durum === 'magaza-yok' && (
        <>
          <Text style={st.desc}>{t('ads.storeUnavailable.title')}</Text>
          <Text style={st.sub}>{t('ads.storeUnavailable.desc')}</Text>
          <View style={st.actionGap} />
          <Btn label={t('ads.retryButton')} kind="ghost" onPress={tekrarDene} />
        </>
      )}

      {durum === 'hata' && (
        <>
          <Text style={st.desc}>{t('ads.purchaseError.title')}</Text>
          <Text style={st.sub}>{t('ads.purchaseError.desc')}</Text>
          <View style={st.actionGap} />
          <Btn label={t('ads.retryButton')} kind="ghost" onPress={tekrarDene} />
        </>
      )}

      {durum === 'tesekkur' && (
        <Text style={st.desc}>{t('ads.removed')}</Text>
      )}

      {(durum === 'hazir' || durum === 'satin-aliniyor') && (
        <>
          <Text style={st.desc}>{t('ads.desc')}</Text>
          <View style={st.tierList}>
            {reklamsiz ? (
              <Text style={st.sub}>{t('ads.removed')}</Text>
            ) : reklamKaldirmaUrunu && reklamlarAcik() ? (
              <>
                <Btn
                  label={`${t('ads.removeButton')} · ${reklamKaldirmaUrunu.displayPrice}`}
                  kind="primary"
                  busy={aktifUrunId === REKLAMLARI_KALDIR_URUN_ID && durum === 'satin-aliniyor'}
                  disabled={durum === 'satin-aliniyor'}
                  onPress={() => satinAl(REKLAMLARI_KALDIR_URUN_ID)}
                />
                <Text style={st.sub}>{t('ads.removeDesc')}</Text>
              </>
            ) : (
              <Text style={st.sub}>{t('ads.productUnavailable')}</Text>
            )}
          </View>
        </>
      )}

      {!reklamsiz && reklamDurumuKontrolEdildi && reklamlarAcik() && (
        <>
          <View style={st.actionGap} />
          <Btn label={t('ads.privacyButton')} kind="ghost" onPress={() => { void gizlilikSecenekleriniAc(); }} />
        </>
      )}
    </Card>
  );
}

const st = StyleSheet.create({
  title: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  desc: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  sub: { color: C.sub, fontSize: 12.5, lineHeight: 19, marginTop: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  tierList: { marginTop: 12, gap: 10 },
  actionGap: { height: 12 },
});
