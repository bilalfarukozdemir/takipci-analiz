import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { DESTEK_URUN_IDLERI, useDestek } from '../hooks/useDestek';
import { C } from '../theme';
import { Btn, Card } from './kit';

/**
 * "Geliştiriciyi destekle" bağış kartı — Google Play Billing üzerinden
 * tüketilebilir (tekrarlanabilir) bağış. Fiyatlar mağazadan çekilir,
 * kodda hardcoded değildir; Play kullanıcının yerel para birimini gösterir.
 */
export function DestekKarti() {
  const { t } = useTranslation();
  const { durum, urunler, aktifUrunId, satinAl, tekrarDene } = useDestek();

  if (durum === 'magaza-yok') {
    return (
      <Card>
        <Text style={st.title}>{t('destek.title')}</Text>
        <Text style={st.desc}>{t('destek.unavailable.title')}</Text>
        <Text style={st.sub}>{t('destek.unavailable.desc')}</Text>
      </Card>
    );
  }

  if (durum === 'yukleniyor') {
    return (
      <Card>
        <Text style={st.title}>{t('destek.title')}</Text>
        <View style={st.loadingRow}>
          <ActivityIndicator color={C.pink} size="small" />
          <Text style={st.sub}>{t('destek.loading')}</Text>
        </View>
      </Card>
    );
  }

  if (durum === 'hata') {
    return (
      <Card>
        <Text style={st.title}>{t('destek.title')}</Text>
        <Text style={st.desc}>{t('destek.error.title')}</Text>
        <Text style={st.sub}>{t('destek.error.desc')}</Text>
        <View style={{ height: 12 }} />
        <Btn label={t('destek.error.retryButton')} kind="ghost" onPress={tekrarDene} />
      </Card>
    );
  }

  if (durum === 'tesekkur') {
    return (
      <Card>
        <Text style={st.title}>{t('destek.thanks.title')}</Text>
        <Text style={st.desc}>{t('destek.thanks.desc')}</Text>
        <View style={{ height: 12 }} />
        <Btn label={t('destek.thanks.backButton')} kind="ghost" onPress={tekrarDene} />
      </Card>
    );
  }

  // durum === 'hazir' | 'satin-aliniyor'
  return (
    <Card>
      <Text style={st.title}>{t('destek.title')}</Text>
      <Text style={st.desc}>{t('destek.desc')}</Text>
      <View style={st.tierList}>
        {DESTEK_URUN_IDLERI.map((urunId) => {
          const urun = urunler.find((u) => u.id === urunId);
          const etiket = t(`destek.tiers.${urunId}`);
          const fiyat = urun?.displayPrice;
          return (
            <Btn
              key={urunId}
              label={fiyat ? `${etiket} · ${fiyat}` : etiket}
              kind="ghost"
              busy={aktifUrunId === urunId && durum === 'satin-aliniyor'}
              disabled={!urun || (durum === 'satin-aliniyor' && aktifUrunId !== urunId)}
              onPress={() => satinAl(urunId)}
            />
          );
        })}
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  title: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  desc: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  sub: { color: C.sub, fontSize: 12.5, lineHeight: 19, marginTop: 4 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  tierList: { marginTop: 12, gap: 10 },
});
