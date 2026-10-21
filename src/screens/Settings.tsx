import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import {
  changeLanguagePreference,
  getLanguagePreference,
  type LanguagePreference,
  resolveLanguage,
} from '../i18n';
import { LANGUAGES } from '../i18n/languages';
import { avatarCacheSize, clearAvatarCache } from '../lib/avatars';
import { reklamGizliligiSecenekleriniAc } from '../lib/ads';
import { sayi } from '../lib/fmt';
import { C, S } from '../theme';
import { Btn, Card, Header, Row } from '../ui/kit';
import { PremiumButton } from '../ui/PremiumButton';

type Props = { markedCount: number; onClearMarks: () => void; onClearAll: () => void;
  avatarsOn: boolean; onToggleAvatars: (value: boolean) => void;
  onPremium: () => void; premiumActive: boolean; };

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
          <Text style={st.infoTxt}>{t('history.marked.desc', { count: markedCount, n: sayi(markedCount) })}</Text>
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

/**
 * Dil / Language: seçili dili gösteren satır; dokununca tüm diller kendi
 * adlarıyla listelenir. Seçim src/lib/storage.ts'e kalıcı yazılır.
 */
function LanguageCard() {
  const { t } = useTranslation();
  const [pref, setPref] = useState<LanguagePreference>('system');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    getLanguagePreference().then((p) => {
      if (alive) setPref(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const adi = (p: LanguagePreference) => {
    if (p !== 'system') return LANGUAGES.find((l) => l.code === p)?.native ?? p;
    const sistemDili = LANGUAGES.find((l) => l.code === resolveLanguage('system'))?.native;
    return `${t('history.language.system')} · ${sistemDili}`;
  };

  const sec = (p: LanguagePreference) => {
    setOpen(false);
    setPref(p);
    changeLanguagePreference(p).catch(() => undefined);
  };

  const secenekler: LanguagePreference[] = ['system', ...LANGUAGES.map((l) => l.code)];

  return (
    <Card>
      <Text style={st.infoTitle}>{t('history.language.title')}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [st.langRow, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={st.langCurrent} numberOfLines={1}>
          {adi(pref)}
        </Text>
        <Text style={st.chev}>›</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={st.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={st.sheet} onPress={() => undefined}>
            <Text style={[st.infoTitle, { paddingHorizontal: 18, paddingTop: 16 }]}>
              {t('history.language.title')}
            </Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              {secenekler.map((p) => {
                const aktif = p === pref;
                return (
                  <Pressable
                    key={p}
                    onPress={() => sec(p)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: aktif }}
                    style={({ pressed }) => [
                      st.langOption,
                      { backgroundColor: pressed ? C.cardAlt : 'transparent' },
                    ]}>
                    <Text
                      style={[st.langOptionTxt, { color: aktif ? C.pink : C.text }]}
                      numberOfLines={1}>
                      {adi(p)}
                    </Text>
                    {aktif ? <Text style={st.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Card>
  );
}

const st = StyleSheet.create({
  infoTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginBottom: 6 },
  infoTxt: { color: C.sub, fontSize: 12.5, lineHeight: 19 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: S.radiusSm,
    borderWidth: 1,
    borderColor: C.border,
  },
  langCurrent: { flex: 1, color: C.text, fontSize: 14, fontWeight: '700' },
  chev: { color: C.dim, fontSize: 22, lineHeight: 22 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: C.card,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  langOptionTxt: { flex: 1, fontSize: 15, fontWeight: '600' },
  check: { color: C.pink, fontSize: 16, fontWeight: '800' },
});
