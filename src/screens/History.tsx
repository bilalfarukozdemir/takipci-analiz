import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import {
  changeLanguagePreference,
  getLanguagePreference,
  type LanguagePreference,
} from '../i18n';
import { avatarCacheSize, clearAvatarCache } from '../lib/avatars';
import { goreceli, sayi, tarihSaat } from '../lib/fmt';
import { C, S } from '../theme';
import type { SnapshotMeta } from '../types';
import { Btn, Card, Empty, Header, Row } from '../ui/kit';

type Props = {
  snapshots: SnapshotMeta[];
  currentId: string | null;
  prevId: string | null;
  markedCount: number;
  onSelect: (role: 'current' | 'prev', id: string) => void;
  onDelete: (id: string) => void;
  onClearMarks: () => void;
  onClearAll: () => void;
  onImport: () => void;
  onConnect: () => void;
  busy: boolean;
  avatarsOn: boolean;
  onToggleAvatars: (v: boolean) => void;
};

function RoleBtn({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.roleBtn,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: active ? color : C.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text style={[st.roleTxt, { color: active ? '#0A0A0F' : C.sub }]}>{label}</Text>
    </Pressable>
  );
}

export function History({
  snapshots,
  currentId,
  prevId,
  markedCount,
  onSelect,
  onDelete,
  onClearMarks,
  onClearAll,
  onImport,
  onConnect,
  busy,
  avatarsOn,
  onToggleAvatars,
}: Props) {
  const { t } = useTranslation();
  const [cacheMb, setCacheMb] = useState(0);

  const olcCache = useCallback(() => {
    setCacheMb(Math.round((avatarCacheSize() / (1024 * 1024)) * 10) / 10);
  }, []);

  useEffect(olcCache, [olcCache]);

  return (
    <View style={{ flex: 1 }}>
      <Header title={t('history.title')} subtitle={t('history.recordCount', { count: snapshots.length })} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        <LanguageCard />

        {snapshots.length === 0 ? (
          <Empty icon="🗂️" title={t('history.empty.title')} desc={t('history.empty.desc')} />
        ) : (
          <>
            <Card>
              <Text style={st.infoTitle}>{t('history.howItWorks.title')}</Text>
              <Text style={st.infoTxt}>
                {t('history.howItWorks.pre')}
                <Text style={st.b}>{t('history.roleNew')}</Text>
                {t('history.howItWorks.mid')}
                <Text style={st.b}>{t('history.roleOld')}</Text>
                {t('history.howItWorks.post')}
              </Text>
            </Card>

            {snapshots.map((s, i) => {
              const older = snapshots[i + 1];
              const dFollowers = older ? s.followers - older.followers : null;
              return (
                <Card key={s.id}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={st.date}>{tarihSaat(s.createdAt)}</Text>
                      <Text style={st.rel}>{goreceli(s.createdAt)}</Text>
                    </View>
                    <Pressable
                      hitSlop={10}
                      onPress={() =>
                        Alert.alert(t('history.deleteRecord.title'), t('history.deleteRecord.message'), [
                          { text: t('common.cancel'), style: 'cancel' },
                          { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(s.id) },
                        ])
                      }>
                      <Text style={st.trash}>🗑️</Text>
                    </Pressable>
                  </Row>

                  <Text style={st.file} numberOfLines={1}>
                    {s.source}
                  </Text>

                  <Row style={{ gap: 16, marginTop: 10 }}>
                    <View>
                      <Text style={st.num}>{sayi(s.followers)}</Text>
                      <Text style={st.numLbl}>{t('common.followersLower')}</Text>
                    </View>
                    <View>
                      <Text style={st.num}>{sayi(s.following)}</Text>
                      <Text style={st.numLbl}>{t('common.followingLower')}</Text>
                    </View>
                    {dFollowers !== null ? (
                      <View>
                        <Text
                          style={[
                            st.num,
                            { color: dFollowers >= 0 ? C.green : C.red },
                          ]}>
                          {dFollowers >= 0 ? '+' : ''}
                          {sayi(dFollowers)}
                        </Text>
                        <Text style={st.numLbl}>{t('history.vsPrevious')}</Text>
                      </View>
                    ) : null}
                  </Row>

                  <Row style={{ gap: 8, marginTop: 14 }}>
                    <RoleBtn
                      label={t('history.roleNew')}
                      color={C.green}
                      active={currentId === s.id}
                      onPress={() => onSelect('current', s.id)}
                    />
                    <RoleBtn
                      label={t('history.roleOld')}
                      color={C.yellow}
                      active={prevId === s.id}
                      onPress={() => onSelect('prev', s.id)}
                    />
                  </Row>
                </Card>
              );
            })}
          </>
        )}

        <Btn label={t('common.connectInstagram')} icon="⚡" onPress={onConnect} />
        <Btn label={t('common.pickArchiveFile')} icon="📂" kind="ghost" onPress={onImport} busy={busy} />

        <Card>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.infoTitle}>{t('history.photos.title')}</Text>
              <Text style={st.infoTxt}>{t('history.photos.desc')}</Text>
            </View>
            <Switch
              value={avatarsOn}
              onValueChange={onToggleAvatars}
              trackColor={{ false: C.border, true: C.pink }}
              thumbColor="#fff"
            />
          </Row>
          <View style={{ height: 12 }} />
          <Btn
            label={
              cacheMb > 0
                ? t('history.photos.clearButton', { mb: cacheMb })
                : t('history.photos.emptyCache')
            }
            kind="ghost"
            disabled={cacheMb === 0}
            onPress={() =>
              Alert.alert(
                t('history.photos.confirmTitle'),
                t('history.photos.confirmMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                      clearAvatarCache();
                      olcCache();
                    },
                  },
                ]
              )
            }
          />
        </Card>

        <Card>
          <Text style={st.infoTitle}>{t('history.marked.title')}</Text>
          <Text style={st.infoTxt}>{t('history.marked.desc', { count: sayi(markedCount) })}</Text>
          <View style={{ height: 12 }} />
          <Btn
            label={t('history.marked.clearButton')}
            kind="ghost"
            onPress={() =>
              Alert.alert(t('history.marked.confirmTitle'), t('history.marked.confirmMessage'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.clear'), style: 'destructive', onPress: onClearMarks },
              ])
            }
            disabled={markedCount === 0}
          />
        </Card>

        <Btn
          label={t('history.clearAll.button')}
          kind="danger"
          icon="⚠️"
          onPress={() =>
            Alert.alert(t('history.clearAll.confirmTitle'), t('history.clearAll.confirmMessage'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('history.clearAll.confirmButton'), style: 'destructive', onPress: onClearAll },
            ])
          }
        />
      </ScrollView>
    </View>
  );
}

/** Dil / Language: Sistem, Türkçe, English arasında seçim. Seçim src/lib/storage.ts'e kalıcı yazılır. */
function LanguageCard() {
  const { t } = useTranslation();
  const [pref, setPref] = useState<LanguagePreference>('system');

  useEffect(() => {
    let alive = true;
    getLanguagePreference().then((p) => {
      if (alive) setPref(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const secenekler: { key: LanguagePreference; label: string }[] = [
    { key: 'system', label: t('history.language.system') },
    { key: 'tr', label: t('history.language.turkish') },
    { key: 'en', label: t('history.language.english') },
  ];

  return (
    <Card>
      <Text style={st.infoTitle}>{t('history.language.title')}</Text>
      <View style={{ height: 10 }} />
      <Row style={{ gap: 8 }}>
        {secenekler.map((s) => (
          <RoleBtn
            key={s.key}
            label={s.label}
            color={C.pink}
            active={pref === s.key}
            onPress={() => {
              setPref(s.key);
              changeLanguagePreference(s.key).catch(() => undefined);
            }}
          />
        ))}
      </Row>
    </Card>
  );
}

const st = StyleSheet.create({
  infoTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  infoTxt: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  b: { color: C.text, fontWeight: '700' },
  date: { color: C.text, fontSize: 15, fontWeight: '700' },
  rel: { color: C.dim, fontSize: 11.5, marginTop: 2 },
  file: { color: C.sub, fontSize: 11.5, marginTop: 6 },
  trash: { fontSize: 18 },
  num: { color: C.text, fontSize: 16, fontWeight: '800' },
  numLbl: { color: C.dim, fontSize: 10.5, marginTop: 2 },
  roleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  roleTxt: { fontSize: 12.5, fontWeight: '800' },
});
