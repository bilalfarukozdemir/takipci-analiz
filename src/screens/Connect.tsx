import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { sayi } from '../lib/fmt';
import {
  HARVEST_JS,
  type LiveKind,
  LOGIN_URL,
  parseMessage,
  PROBE_JS,
  STOP_JS,
} from '../lib/igLive';
import { C, S } from '../theme';
import type { IgUser } from '../types';
import { Btn, Card, Header } from '../ui/kit';

/** İlerleme durmuşsa bu süre sonunda hata gösterilir. */
const WATCHDOG_MS = 75000;
const GITHUB_URL = 'https://github.com/bilalfarukozdemir/takipci-analiz';

type Phase = 'login' | 'ready' | 'working' | 'error';

type Props = {
  onBack: () => void;
  onFinish: (followers: IgUser[], following: IgUser[]) => void;
};

/** connect.errors.<kod>.title / .message anahtarlarına karşılık gelir (src/i18n/{tr,en}.json). */
const HATA_KODLARI = ['session', 'challenge', 'limit', 'http', 'timeout', 'cancel', 'unknown'] as const;

export function Connect({ onBack, onFinish }: Props) {
  const { t } = useTranslation();
  const web = useRef<WebView>(null);
  const followers = useRef(new Map<string, IgUser>());
  const following = useRef(new Map<string, IgUser>());
  const sonHareket = useRef(Date.now());
  const [loginGeneration, setLoginGeneration] = useState(0);
  const loginGenerationRef = useRef(0);
  const sessionInvalid = useRef(false);

  const [phase, setPhase] = useState<Phase>('login');
  const [hata, setHata] = useState<string>('unknown');
  const [hataDetay, setHataDetay] = useState('');
  const [totals, setTotals] = useState<{ followers: number | null; following: number | null }>({
    followers: null,
    following: null,
  });
  const [ilerleme, setIlerleme] = useState<{ kind: LiveKind; count: number } | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const yenidenGiris = useCallback(() => {
    web.current?.injectJavaScript(STOP_JS);
    followers.current.clear();
    following.current.clear();
    setTotals({ followers: null, following: null });
    setIlerleme(null);
    sessionInvalid.current = false;
    loginGenerationRef.current += 1;
    setLoginGeneration(loginGenerationRef.current);
    changePhase('login');
  }, [changePhase]);

  // ilerleme durursa kullanıcıyı bekletme
  useEffect(() => {
    if (phase !== 'working') return;
    const id = setInterval(() => {
      if (Date.now() - sonHareket.current > WATCHDOG_MS) {
        setHata('timeout');
        web.current?.injectJavaScript(STOP_JS);
        changePhase('error');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [phase, changePhase]);

  const basla = useCallback(() => {
    if (sessionInvalid.current) return;
    followers.current.clear();
    following.current.clear();
    setIlerleme(null);
    sonHareket.current = Date.now();
    changePhase('working');
    web.current?.injectJavaScript(HARVEST_JS);
  }, [changePhase]);

  const durdur = useCallback(() => {
    web.current?.injectJavaScript(STOP_JS);
    setHata('cancel');
    changePhase('error');
  }, [changePhase]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      if (loginGeneration !== loginGenerationRef.current) return;
      const m = parseMessage(e.nativeEvent.data);
      if (!m) return;
      if (sessionInvalid.current) return;
      if (['chunk', 'totals', 'progress', 'done'].includes(m.t) && phaseRef.current !== 'working') return;
      sonHareket.current = Date.now();

      switch (m.t) {
        case 'state':
          if (m.logged && phaseRef.current === 'login') changePhase('ready');
          else if (!m.logged && (phaseRef.current === 'ready' || phaseRef.current === 'working')) {
            sessionInvalid.current = true;
            web.current?.injectJavaScript(STOP_JS);
            setHata('session');
            changePhase('error');
          }
          break;

        case 'totals':
          setTotals({ followers: m.followers, following: m.following });
          break;

        case 'chunk': {
          const hedef = m.kind === 'followers' ? followers.current : following.current;
          for (const u of m.users) {
            const k = u.u.toLowerCase();
            if (hedef.has(k)) continue;
            const kayit: IgUser = { u: u.u };
            if (u.n) kayit.n = u.n;
            if (u.p) kayit.p = u.p;
            hedef.set(k, kayit);
          }
          break;
        }

        case 'progress':
          setIlerleme({ kind: m.kind, count: m.count });
          break;

        case 'done':
          onFinish([...followers.current.values()], [...following.current.values()]);
          break;

        case 'error':
          if (m.code === 'cancel') return; // durdurmayı zaten biz gösterdik
          web.current?.injectJavaScript(STOP_JS);
          if (m.code === 'session' || m.code === 'challenge') sessionInvalid.current = true;
          setHata(m.code);
          setHataDetay(m.detail ?? '');
          changePhase('error');
          break;
      }
    },
    [onFinish, loginGeneration, changePhase]
  );

  const toplam = ilerleme?.kind === 'followers' ? totals.followers : totals.following;
  const hataKodu = (HATA_KODLARI as readonly string[]).includes(hata) ? hata : 'unknown';

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={t('connect.headerTitle')}
        subtitle={
          phase === 'login'
            ? t('connect.subtitleLogin')
            : phase === 'working'
              ? t('connect.subtitleWorking')
              : undefined
        }
        onBack={onBack}
      />

      <View style={{ flex: 1 }}>
        <WebView
          key={loginGeneration}
          ref={web}
          source={{ uri: LOGIN_URL }}
          onMessage={onMessage}
          injectedJavaScript={PROBE_JS}
          incognito
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled={false}
          thirdPartyCookiesEnabled
          originWhitelist={['https://*']}
          setSupportMultipleWindows={false}
          style={{ flex: 1, backgroundColor: C.bg, opacity: phase === 'login' ? 1 : 0 }}
        />

        {phase !== 'login' ? (
          <View style={st.overlay}>
            {phase === 'ready' ? (
              <Card>
                <Text style={st.h}>{t('connect.ready.title')}</Text>
                <Text style={st.p}>{t('connect.ready.text')}</Text>
                <Text style={[st.p, { color: C.yellow, marginTop: 10 }]}>
                  {t('connect.ready.warning')}
                </Text>
                <View style={{ height: 16 }} />
                <Btn label={t('connect.ready.fetchButton')} icon="⬇️" onPress={basla} />
              </Card>
            ) : phase === 'working' ? (
              <Card>
                <View style={{ alignItems: 'center', gap: 14 }}>
                  <ActivityIndicator color={C.pink} size="large" />
                  <Text style={st.h}>
                    {ilerleme?.kind === 'following'
                      ? t('connect.working.fetchingFollowing')
                      : t('connect.working.fetchingFollowers')}
                  </Text>
                  <Text style={st.big}>
                    {sayi(ilerleme?.count ?? 0)}
                    {toplam ? <Text style={st.p}> / {sayi(toplam)}</Text> : null}
                  </Text>
                  <Text style={[st.p, { textAlign: 'center' }]}>
                    {t('connect.working.backgroundWarning')}
                  </Text>
                </View>
                <View style={{ height: 16 }} />
                <Btn label={t('connect.working.stopButton')} kind="ghost" onPress={durdur} />
              </Card>
            ) : (
              <Card>
                <Text style={st.h}>{t(`connect.errors.${hataKodu}.title`)}</Text>
                <Text style={st.p}>{t(`connect.errors.${hataKodu}.message`)}</Text>
                {hataDetay && (hata === 'http' || hata === 'unknown') ? (
                  <Text style={[st.p, { marginTop: 6, color: C.sub, fontSize: 12 }]}>{hataDetay}</Text>
                ) : null}
                {followers.current.size ? (
                  <Text style={[st.p, { marginTop: 10, color: C.sub }]}>
                    {t('connect.error.partialData', {
                      f: sayi(followers.current.size),
                      g: sayi(following.current.size),
                    })}
                  </Text>
                ) : null}
                <View style={{ height: 16 }} />
                <Btn
                  label={t(hata === 'session' || hata === 'challenge' ? 'connect.error.loginAgainButton' : 'connect.error.retryButton')}
                  onPress={yenidenGiris}
                />
                <View style={{ height: 8 }} />
                <Btn label={t('connect.error.backButton')} kind="ghost" onPress={onBack} />
              </Card>
            )}
          </View>
        ) : null}
      </View>

      {phase === 'login' ? (
        <View style={st.note}>
          <ScrollView
            style={st.noteScroll}
            contentContainerStyle={st.noteContent}
            accessibilityLabel={t('connect.disclosure.accessibilityLabel')}
          >
            <Text style={st.noteTxt}>
              {t('connect.disclosure.openSource')}
              <Text
                style={st.noteLink}
                accessibilityRole="link"
                onPress={() => {
                  void Linking.openURL(GITHUB_URL).catch(() => undefined);
                }}
              >
                {t('connect.disclosure.githubLink')}
              </Text>
              {'\n'}
              {t('connect.disclosure.login')}
              {'\n'}
              {t('connect.disclosure.localData')}
              {'\n'}
              {t('connect.disclosure.liveFetchRisk')}
              {'\n'}
              {t('connect.disclosure.archive')}
            </Text>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    justifyContent: 'center',
    padding: S.pad,
  },
  h: { color: C.text, fontSize: 17, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  p: { color: C.sub, fontSize: 13, lineHeight: 20 },
  big: { color: C.text, fontSize: 30, fontWeight: '900' },
  note: {
    backgroundColor: C.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    maxHeight: 205,
  },
  noteScroll: { flexGrow: 0 },
  noteContent: { padding: 12 },
  noteTxt: { color: C.sub, fontSize: 11.5, lineHeight: 16, textAlign: 'left' },
  noteLink: { color: C.pink, textDecorationLine: 'underline', fontWeight: '700' },
});
