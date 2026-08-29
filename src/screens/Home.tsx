import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <Text style={st.heroTitle}>{t('home.title')}</Text>
        <Text style={st.heroSub}>{t('home.subtitle')}</Text>

        {hasData ? (
          <View style={st.statRow}>
            <Stat label={t('home.stats.followers')} value={analysis.followers.length} color="#fff" />
            <Stat label={t('home.stats.following')} value={analysis.following.length} color="#fff" />
            <Stat label={t('home.stats.mutual')} value={analysis.mutual.length} color="#fff" />
            <Stat
              label={t('home.stats.notFollowingBack')}
              value={analysis.notFollowingBack.length}
              color="#fff"
            />
          </View>
        ) : null}
      </LinearGradient>

      <View style={{ padding: S.pad, gap: S.gap }}>
        {!hasData ? (
          <Card>
            <Text style={st.cardTitle}>{t('home.noData.title')}</Text>
            <Text style={st.cardText}>
              <Text style={st.bold}>{t('home.noData.fastLabel')}</Text>
              {t('home.noData.fastText')}
              {'\n'}
              <Text style={st.bold}>{t('home.noData.safeLabel')}</Text>
              {t('home.noData.safeText')}
            </Text>
            <View style={{ height: 14 }} />
            <Btn label={t('common.connectInstagram')} icon="⚡" onPress={onConnect} />
            <View style={{ height: 8 }} />
            <Btn
              label={t('common.pickArchiveFile')}
              icon="📂"
              kind="ghost"
              onPress={onImport}
              busy={busy}
            />
            <View style={{ height: 8 }} />
            <Btn label={t('home.noData.whatsTheDifference')} icon="❓" kind="ghost" onPress={onHelp} />
          </Card>
        ) : (
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.metaTitle}>{t('home.lastAnalysis')}</Text>
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
                {t('home.compareWith')}
                <Text style={st.bold}>{tarihSaat(prevMeta.createdAt)}</Text>
                {t('home.compareWithSuffix')}
              </Text>
            ) : (
              <Text style={st.compareTxt}>
                {t('home.needSecondUploadPre')}
                <Text style={st.bold}>{t('home.needSecondUploadBold')}</Text>
                {t('home.needSecondUploadPost')}
              </Text>
            )}
            <View style={{ height: 14 }} />
            <Btn label={t('common.connectInstagram')} icon="⚡" onPress={onConnect} />
            <View style={{ height: 8 }} />
            <Btn
              label={t('common.pickArchiveFile')}
              icon="📂"
              kind="ghost"
              onPress={onImport}
              busy={busy}
            />
          </Card>
        )}

        {hasData ? (
          <>
            <Text style={st.sectionTitle}>{t('home.highlights')}</Text>
            {ana.map((c) => (
              <CatCard
                key={c.key}
                icon={c.icon}
                title={t(c.titleKey)}
                desc={t(c.descKey)}
                color={c.color}
                count={analysis[c.key].length}
                locked={!!c.needsDiff && !prevMeta}
                onPress={() => onOpenCat(c.key)}
              />
            ))}

            <Text style={st.sectionTitle}>{t('home.otherLists')}</Text>
            {digerler
              .filter((c) => analysis[c.key].length > 0 || (!!c.needsDiff && !!prevMeta))
              .map((c) => (
                <CatCard
                  key={c.key}
                  icon={c.icon}
                  title={t(c.titleKey)}
                  desc={t(c.descKey)}
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
