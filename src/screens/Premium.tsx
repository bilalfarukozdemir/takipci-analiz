import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import type { DestekModel } from '../hooks/useDestek';
import { C, S } from '../theme';
import { DestekKarti } from '../ui/DestekKarti';
import { Btn, Card, Header } from '../ui/kit';

export function PremiumScreen({ destek, onBack }: { destek: DestekModel; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <Header title={t('premium.title')} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        <Card style={st.hero}>
          <Text style={st.star}>✦</Text>
          <Text style={st.title}>{t('premium.headline')}</Text>
          <Text style={st.desc}>{t('premium.desc')}</Text>
          <Text style={st.note}>{t('premium.note')}</Text>
        </Card>
        <DestekKarti destek={destek} />
        <Btn label={t('premium.restore')} kind="ghost" busy={destek.durum === 'yukleniyor'}
          disabled={destek.durum === 'satin-aliniyor'} onPress={destek.tekrarDene} />
        <Text style={st.desc}>{t('premium.restoreDesc')}</Text>
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  hero: { borderColor: '#E9C46A', alignItems: 'center', paddingVertical: 26 },
  star: { color: '#F4D58D', fontSize: 38, marginBottom: 12 },
  title: { color: C.text, fontSize: 23, fontWeight: '800', textAlign: 'center' },
  desc: { color: C.sub, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  note: { color: '#F4D58D', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
});
