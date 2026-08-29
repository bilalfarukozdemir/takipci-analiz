import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
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

type Phase = 'login' | 'ready' | 'working' | 'error';

type Props = {
  onBack: () => void;
  onFinish: (followers: IgUser[], following: IgUser[]) => void;
};

/** connect.errors.<kod>.title / .message anahtarlarına karşılık gelir (src/i18n/{tr,en}.json). */
const HATA_KODLARI = ['session', 'limit', 'http', 'timeout', 'cancel', 'unknown'] as const;

export function Connect({ onBack, onFinish }: Props) {
  const { t } = useTranslation();
  const web = useRef<WebView>(null);
  const followers = useRef(new Map<string, IgUser>());
  const following = useRef(new Map<string, IgUser>());
  const sonHareket = useRef(Date.now());

  const [phase, setPhase] = useState<Phase>('login');
  const [hata, setHata] = useState<string>('unknown');
  const [totals, setTotals] = useState<{ followers: number | null; following: number | null }>({
    followers: null,
    following: null,
  });
  const [ilerleme, setIlerleme] = useState<{ kind: LiveKind; count: number } | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // ilerleme durursa kullanıcıyı bekletme
  useEffect(() => {
    if (phase !== 'working') return;
    const id = setInterval(() => {
      if (Date.now() - sonHareket.current > WATCHDOG_MS) {
        setHata('timeout');
        setPhase('error');
      }
    }, 5000);
    return () => clearInterval(id);
  }, [phase]);

  const basla = useCallback(() => {
    followers.current.clear();
    following.current.clear();
    setIlerleme(null);
    sonHareket.current = Date.now();
    setPhase('working');
    web.current?.injectJavaScript(HARVEST_JS);
  }, []);

  const durdur = useCallback(() => {
    web.current?.injectJavaScript(STOP_JS);
    setHata('cancel');
    setPhase('error');
  }, []);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      const m = parseMessage(e.nativeEvent.data);
      if (!m) return;
      sonHareket.current = Date.now();

      switch (m.t) {
        case 'state':
          if (m.logged && phaseRef.current === 'login') setPhase('ready');
          else if (!m.logged && phaseRef.current === 'ready') setPhase('login');
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
          setHata(m.code);
          setPhase('error');
          break;
      }
    },
    [onFinish]
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
          ref={web}
          source={{ uri: LOGIN_URL }}
          onMessage={onMessage}
          injectedJavaScript={PROBE_JS}
          onLoadEnd={() => {
            // sayfa yenilenirse çekmeyi kaldığı yerden yeniden başlat
            if (phaseRef.current === 'working') web.current?.injectJavaScript(HARVEST_JS);
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
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
                  label={t('connect.error.retryButton')}
                  onPress={() => {
                    if (hata === 'session') {
                      setPhase('login');
                      web.current?.reload();
                    } else {
                      basla();
                    }
                  }}
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
          <Text style={st.noteTxt}>{t('connect.loginNote')}</Text>
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
    padding: 12,
  },
  noteTxt: { color: C.sub, fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
});
