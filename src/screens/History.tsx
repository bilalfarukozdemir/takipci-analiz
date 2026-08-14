import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

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
  const [cacheMb, setCacheMb] = useState(0);

  const olcCache = useCallback(() => {
    setCacheMb(Math.round((avatarCacheSize() / (1024 * 1024)) * 10) / 10);
  }, []);

  useEffect(olcCache, [olcCache]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Geçmiş" subtitle={`${snapshots.length} kayıtlı yükleme`} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        {snapshots.length === 0 ? (
          <Empty
            icon="🗂️"
            title="Henüz kayıt yok"
            desc="Instagram veri arşivini yükledikçe her yükleme burada saklanır ve aralarındaki farkı görürsün."
          />
        ) : (
          <>
            <Card>
              <Text style={st.infoTitle}>Nasıl çalışır?</Text>
              <Text style={st.infoTxt}>
                Takipten çıkanlar iki yükleme karşılaştırılarak bulunur.{' '}
                <Text style={st.b}>Yeni</Text> olarak seçtiğin kayıt bugünkü durumu,{' '}
                <Text style={st.b}>Eski</Text> olarak seçtiğin kayıt geçmişteki durumu temsil eder.
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
                        Alert.alert('Kaydı sil', 'Bu yükleme kaydı silinsin mi?', [
                          { text: 'Vazgeç', style: 'cancel' },
                          { text: 'Sil', style: 'destructive', onPress: () => onDelete(s.id) },
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
                      <Text style={st.numLbl}>takipçi</Text>
                    </View>
                    <View>
                      <Text style={st.num}>{sayi(s.following)}</Text>
                      <Text style={st.numLbl}>takip</Text>
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
                        <Text style={st.numLbl}>bir öncekine göre</Text>
                      </View>
                    ) : null}
                  </Row>

                  <Row style={{ gap: 8, marginTop: 14 }}>
                    <RoleBtn
                      label="Yeni"
                      color={C.green}
                      active={currentId === s.id}
                      onPress={() => onSelect('current', s.id)}
                    />
                    <RoleBtn
                      label="Eski"
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

        <Btn label="Instagram’a bağlan" icon="⚡" onPress={onConnect} />
        <Btn label="Veri arşivi dosyası seç" icon="📂" kind="ghost" onPress={onImport} busy={busy} />

        <Card>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.infoTitle}>Profil fotoğrafları</Text>
              <Text style={st.infoTxt}>
                Canlı çekimde gelen fotoğraflar, listede ilk göründüklerinde cihaza indirilir.
                Instagram’ın adresleri kısa ömürlü olduğu için indirilmezse sonradan kaybolurlar.
              </Text>
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
            label={cacheMb > 0 ? `Fotoğrafları sil (${cacheMb} MB)` : 'Önbellek boş'}
            kind="ghost"
            disabled={cacheMb === 0}
            onPress={() =>
              Alert.alert(
                'Profil fotoğraflarını sil',
                'İndirilen tüm profil fotoğrafları silinecek. Listeler harf simgesine döner.',
                [
                  { text: 'Vazgeç', style: 'cancel' },
                  {
                    text: 'Sil',
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
          <Text style={st.infoTitle}>İşaretlediklerin</Text>
          <Text style={st.infoTxt}>
            Listelerde ✓ ile işaretlediğin {sayi(markedCount)} hesap var. İşaretlenenler varsayılan
            olarak listelerde gizlenir.
          </Text>
          <View style={{ height: 12 }} />
          <Btn
            label="İşaretleri temizle"
            kind="ghost"
            onPress={() =>
              Alert.alert('İşaretleri temizle', 'Tüm ✓ işaretleri kaldırılsın mı?', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Temizle', style: 'destructive', onPress: onClearMarks },
              ])
            }
            disabled={markedCount === 0}
          />
        </Card>

        <Btn
          label="Tüm verileri sil"
          kind="danger"
          icon="⚠️"
          onPress={() =>
            Alert.alert(
              'Tüm verileri sil',
              'Kayıtlı tüm yüklemeler ve işaretler silinecek. Bu geri alınamaz.',
              [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Hepsini sil', style: 'destructive', onPress: onClearAll },
              ]
            )
          }
        />
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
