import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '../lib/analyze';
import type { Analysis } from '../lib/analyze';
import { goreceli, sayi, tarihSaat } from '../lib/fmt';
import { C, GRADIENT, S } from '../theme';
import type { CatKey, SnapshotMeta } from '../types';
import { Footer } from '../ui/Credit';
import { Btn, Card, Row } from '../ui/kit';

type Props = {
  topInset: number;
  meta: SnapshotMeta | null;
  prevMeta: SnapshotMeta | null;
  analysis: Analysis | null;
  busy: boolean;
  onImport: () => void;
  onConnect: () => void;
  onOpenCat: (k: CatKey) => void;
  onHelp: () => void;
};

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={st.stat}>
      <Text style={[st.statValue, { color }]}>{sayi(value)}</Text>
      <Text style={st.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function CatCard({
  icon,
  title,
  desc,
  count,
  color,
  onPress,
  locked,
}: {
  icon: string;
  title: string;
  desc: string;
  count: number;
  color: string;
  onPress: () => void;
  locked?: boolean;
}) {
  return (
    <Pressable
      onPress={locked ? undefined : onPress}
      style={({ pressed }) => [
        st.catCard,
        { opacity: locked ? 0.45 : pressed ? 0.75 : 1, borderColor: pressed ? color : C.border },
      ]}>
      <View style={[st.catIcon, { backgroundColor: `${color}22` }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.catTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={st.catDesc} numberOfLines={2}>
          {desc}
        </Text>
      </View>
      <View style={st.catRight}>
        <Text style={[st.catCount, { color }]}>{locked ? '–' : sayi(count)}</Text>
        <Text style={st.chev}>›</Text>
      </View>
    </Pressable>
  );
}

export function Home({
  topInset,
  meta,
  prevMeta,
  analysis,
  busy,
  onImport,
  onConnect,
  onOpenCat,
  onHelp,
}: Props) {
  const hasData = !!analysis && !!meta;
  const ana = CATEGORIES.filter((c) =>
    ['lostFollowers', 'notFollowingBack', 'fans', 'newFollowers', 'mutual'].includes(c.key)
  );
  const digerler = CATEGORIES.filter((c) => !ana.includes(c));

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[st.hero, { paddingTop: topInset + 26 }]}>
        <Text style={st.heroTitle}>Takipçi Analiz</Text>
        <Text style={st.heroSub}>
          Instagram veri arşivinden takipçi hareketlerini çıkarır. Şifre istemez, veri internete
          gitmez.
        </Text>

        {hasData ? (
          <View style={st.statRow}>
            <Stat label="Takipçi" value={analysis.followers.length} color="#fff" />
            <Stat label="Takip" value={analysis.following.length} color="#fff" />
            <Stat label="Karşılıklı" value={analysis.mutual.length} color="#fff" />
            <Stat label="Geri takip etmeyen" value={analysis.notFollowingBack.length} color="#fff" />
          </View>
        ) : null}
      </LinearGradient>

      <View style={{ padding: S.pad, gap: S.gap }}>
        {!hasData ? (
          <Card>
            <Text style={st.cardTitle}>Başlamak için listeni al</Text>
            <Text style={st.cardText}>
              <Text style={st.bold}>Hızlı yol:</Text> Instagram’a bağlan, listeler doğrudan çekilsin.
              {'\n'}
              <Text style={st.bold}>Güvenli yol:</Text> Instagram’dan “Takipçiler ve takip edilenler”
              verisini JSON olarak indirip .zip dosyasını burada seç.
            </Text>
            <View style={{ height: 14 }} />
            <Btn label="Instagram’a bağlan" icon="⚡" onPress={onConnect} />
            <View style={{ height: 8 }} />
            <Btn label="Veri arşivi dosyası seç" icon="📂" kind="ghost" onPress={onImport} busy={busy} />
            <View style={{ height: 8 }} />
            <Btn label="Aradaki fark ne?" icon="❓" kind="ghost" onPress={onHelp} />
          </Card>
        ) : (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.metaTitle}>Son analiz</Text>
                <Text style={st.metaLine}>{tarihSaat(meta.createdAt)}</Text>
                <Text style={st.metaFile} numberOfLines={1}>
                  {meta.source}
                </Text>
              </View>
              <View style={st.badge}>
                <Text style={st.badgeTxt}>{goreceli(meta.createdAt)}</Text>
              </View>
            </Row>
            <View style={st.sep} />
            {prevMeta ? (
              <Text style={st.compareTxt}>
                🔁 Karşılaştırma: <Text style={st.bold}>{tarihSaat(prevMeta.createdAt)}</Text>{' '}
                tarihli yükleme
              </Text>
            ) : (
              <Text style={st.compareTxt}>
                ⚠️ Takipten çıkanları görmek için <Text style={st.bold}>ikinci bir veri</Text>{' '}
                yüklemen gerekiyor. Bir süre sonra Instagram’dan yeni arşiv indirip tekrar yükle.
              </Text>
            )}
            <View style={{ height: 14 }} />
            <Btn label="Instagram’a bağlan" icon="⚡" onPress={onConnect} />
            <View style={{ height: 8 }} />
            <Btn label="Veri arşivi dosyası seç" icon="📂" kind="ghost" onPress={onImport} busy={busy} />
          </Card>
        )}

        {hasData ? (
          <>
            <Text style={st.sectionTitle}>Öne çıkanlar</Text>
            {ana.map((c) => (
              <CatCard
                key={c.key}
                icon={c.icon}
                title={c.title}
                desc={c.desc}
                color={c.color}
                count={analysis[c.key].length}
                locked={!!c.needsDiff && !prevMeta}
                onPress={() => onOpenCat(c.key)}
              />
            ))}

            <Text style={st.sectionTitle}>Diğer listeler</Text>
            {digerler
              .filter((c) => analysis[c.key].length > 0 || (!!c.needsDiff && !!prevMeta))
              .map((c) => (
                <CatCard
                  key={c.key}
                  icon={c.icon}
                  title={c.title}
                  desc={c.desc}
                  color={c.color}
                  count={analysis[c.key].length}
                  onPress={() => onOpenCat(c.key)}
                />
              ))}
          </>
        ) : null}

        <View style={{ height: 8 }} />
        <Footer />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  hero: { paddingBottom: 22, paddingHorizontal: S.pad },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 13, marginTop: 6, lineHeight: 18 },
  statRow: {
    flexDirection: 'row',
    marginTop: 18,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 14,
    paddingVertical: 12,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 19, fontWeight: '900' },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 13,
  },
  cardTitle: { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  cardText: { color: C.sub, fontSize: 13, lineHeight: 20 },
  bold: { color: C.text, fontWeight: '700' },
  metaTitle: { color: C.dim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  metaLine: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
  metaFile: { color: C.sub, fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: C.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  badgeTxt: { color: C.sub, fontSize: 11, fontWeight: '600' },
  sep: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  compareTxt: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  sectionTitle: {
    color: C.dim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 2,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  catDesc: { color: C.sub, fontSize: 11.5, marginTop: 3, lineHeight: 16 },
  catRight: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  catCount: { fontSize: 17, fontWeight: '900' },
  chev: { color: C.dim, fontSize: 22, marginTop: -2 },
});
