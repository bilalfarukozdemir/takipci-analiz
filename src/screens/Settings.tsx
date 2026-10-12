import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { changeLanguagePreference, getLanguagePreference, type LanguagePreference } from '../i18n';
import { avatarCacheSize, clearAvatarCache } from '../lib/avatars';
import { reklamGizliligiSecenekleriniAc } from '../lib/ads';
import { sayi } from '../lib/fmt';
import { C, S } from '../theme';
import { Btn, Card, Header, Row } from '../ui/kit';
import { PremiumButton } from '../ui/PremiumButton';

type Props = { markedCount: number; onClearMarks: () => void; onClearAll: () => void;
  avatarsOn: boolean; onToggleAvatars: (value: boolean) => void;
  onPremium: () => void; premiumActive: boolean; };

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

export function SettingsScreen({ markedCount, onClearMarks, onClearAll, avatarsOn,
  onToggleAvatars, onPremium, premiumActive }: Props) {
  const { t } = useTranslation();
  const [cacheMb, setCacheMb] = useState(0);
  const olcCache = useCallback(() => {
    setCacheMb(Math.round((avatarCacheSize() / (1024 * 1024)) * 10) / 10);
  }, []);
  useEffect(olcCache, [olcCache]);
  const openPrivacy = async () => {
    try {
      const opened = await reklamGizliligiSecenekleriniAc();
      if (!opened) Alert.alert(t('ads.privacyUnavailable.title'), t('ads.privacyUnavailable.desc'));
    } catch {
      Alert.alert(t('ads.privacyUnavailable.title'), t('ads.privacyUnavailable.desc'));
    }
  };
  return (
    <View style={{ flex: 1 }}>
      <Header title={t('settings.title')} subtitle={t('settings.subtitle')}
        right={<PremiumButton onPress={onPremium} active={premiumActive} />} />
      <ScrollView contentContainerStyle={{ padding: S.pad, paddingBottom: 40, gap: S.gap }}>
        <LanguageCard />
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

        <Card>
          <Text style={st.infoTitle}>{t('settings.privacyTitle')}</Text>
          <Text style={st.infoTxt}>{t('settings.privacyDesc')}</Text>
          <View style={{ height: 12 }} />
          <Btn label={t('ads.privacyButton')} kind="ghost" onPress={() => { void openPrivacy(); }} />
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
  roleBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  roleTxt: { fontSize: 12.5, fontWeight: '800' },
});
