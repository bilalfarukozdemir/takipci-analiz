import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { goreceli, sayi, tarihSaat } from '../lib/fmt';
import { C, S } from '../theme';
import type { SnapshotMeta } from '../types';
import { PremiumButton } from '../ui/PremiumButton';
import { Btn, Card, Empty, Header, Row } from '../ui/kit';

type Props = {
  snapshots: SnapshotMeta[];
  currentId: string | null;
  prevId: string | null;
  onSelect: (role: 'current' | 'prev', id: string) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
  onConnect: () => void;
  busy: boolean;
  onPremium: () => void;
  premiumActive: boolean;
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
  onSelect,
  onDelete,
  onImport,
  onConnect,
  busy,
  onPremium,
  premiumActive,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1 }}>
      <Header title={t('history.title')} subtitle={t('history.recordCount', { count: snapshots.length })}
        right={<PremiumButton onPress={onPremium} active={premiumActive} />} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
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

      </ScrollView>
    </View>
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
