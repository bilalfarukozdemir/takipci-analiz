import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { openUrl } from '../lib/ig';
import { C, S } from '../theme';
import { Footer } from '../ui/Credit';
import { Btn, Card, Header } from '../ui/kit';

type Adim = { title: string; desc: string };
type Faq = { q: string; a: string };

export function Help({ onImport, onConnect }: { onImport: () => void; onConnect: () => void }) {
  const { t } = useTranslation();
  const adimlar = t('help.steps', { returnObjects: true }) as Adim[];
  const sss = t('help.faq', { returnObjects: true }) as Faq[];

  return (
    <View style={{ flex: 1 }}>
      <Header title={t('help.title')} subtitle={t('help.subtitle')} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        <Card>
          <Text style={st.h}>{t('help.connect.title')}</Text>
          <Text style={st.p}>{t('help.connect.text')}</Text>
          <Text style={[st.p, { color: C.yellow, marginTop: 8 }]}>{t('help.connect.warning')}</Text>
          <View style={{ height: 14 }} />
          <Btn label={t('common.connectInstagram')} icon="⚡" onPress={onConnect} />
        </Card>

        <Card>
          <Text style={st.h}>{t('help.archive.title')}</Text>
          <Text style={st.p}>{t('help.archive.text')}</Text>
          {adimlar.map((a, i) => (
            <View key={a.title} style={st.step}>
              <View style={st.stepNo}>
                <Text style={st.stepNoTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.stepT}>{a.title}</Text>
                <Text style={st.stepD}>{a.desc}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 14 }} />
          <Btn
            label={t('help.archive.openDownloadPage')}
            icon="🌐"
            kind="ghost"
            onPress={() => openUrl('https://accountscenter.instagram.com/info_and_permissions/dyi/')}
          />
          <View style={{ height: 8 }} />
          <Btn label={t('common.pickArchiveFile')} icon="📂" kind="ghost" onPress={onImport} />
        </Card>

        <Text style={st.section}>{t('help.faqSectionTitle')}</Text>
        {sss.map((f) => (
          <Card key={f.q}>
            <Text style={st.q}>{f.q}</Text>
            <Text style={st.a}>{f.a}</Text>
          </Card>
        ))}

        <View style={{ height: 4 }} />
        <Footer />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  h: { color: C.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  p: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  step: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stepNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNoTxt: { color: '#fff', fontSize: 13, fontWeight: '900' },
  stepT: { color: C.text, fontSize: 14, fontWeight: '700' },
  stepD: { color: C.sub, fontSize: 12.5, lineHeight: 19, marginTop: 3 },
  section: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
  },
  q: { color: C.text, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  a: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
});
