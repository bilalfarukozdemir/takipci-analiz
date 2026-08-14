import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const HATA_METNI: Record<string, { baslik: string; metin: string }> = {
  session: {
    baslik: 'Oturum kapandı',
    metin: 'Instagram oturumu düştü. Tekrar giriş yapman gerekiyor.',
  },
  limit: {
    baslik: 'Instagram hız sınırı koydu',
    metin:
      'Çok fazla istek gitti ve Instagram geçici olarak durdurdu. 15–30 dakika bekleyip tekrar dene. Hesabında bir sorun yok, engel kendiliğinden kalkar.',
  },
  http: {
    baslik: 'Instagram beklenmedik cevap verdi',
    metin:
      'Instagram arayüzü değişmiş olabilir. Biraz sonra tekrar dene; sorun sürerse dosya yükleme yöntemini kullan.',
  },
  timeout: {
    baslik: 'Yanıt gelmedi',
    metin: 'Instagram uzun süre cevap vermedi. Bağlantını kontrol edip tekrar dene.',
  },
  cancel: { baslik: 'Durduruldu', metin: 'İşlemi sen durdurdun.' },
  unknown: {
    baslik: 'Bir şeyler ters gitti',
    metin: 'İşlem tamamlanamadı. Tekrar dene ya da dosya yükleme yöntemini kullan.',
  },
};

export function Connect({ onBack, onFinish }: Props) {
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

  return (
    <View style={{ flex: 1 }}>
      <Header
        title="Instagram'a bağlan"
        subtitle={
          phase === 'login'
            ? 'Instagram’ın kendi giriş sayfası'
            : phase === 'working'
              ? 'Listeler çekiliyor'
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
                <Text style={st.h}>Giriş yapıldı ✓</Text>
                <Text style={st.p}>
                  Takipçi ve takip listen Instagram’dan sayfa sayfa çekilecek. Hesap engeli riskini
                  düşürmek için istekler arasında 1–2 saniye bekleniyor; büyük hesaplarda birkaç
                  dakika sürebilir.
                </Text>
                <Text style={[st.p, { color: C.yellow, marginTop: 10 }]}>
                  Bu yöntem Instagram’ın kullanım şartlarına aykırıdır. Çok sık tekrarlarsan
                  hesabına geçici işlem engeli gelebilir. Günde bir kereden fazla çekmeni önermem.
                </Text>
                <View style={{ height: 16 }} />
                <Btn label="Listeleri çek" icon="⬇️" onPress={basla} />
              </Card>
            ) : phase === 'working' ? (
              <Card>
                <View style={{ alignItems: 'center', gap: 14 }}>
                  <ActivityIndicator color={C.pink} size="large" />
                  <Text style={st.h}>
                    {ilerleme?.kind === 'following' ? 'Takip ettiklerin' : 'Takipçilerin'} çekiliyor
                  </Text>
                  <Text style={st.big}>
                    {sayi(ilerleme?.count ?? 0)}
                    {toplam ? <Text style={st.p}> / {sayi(toplam)}</Text> : null}
                  </Text>
                  <Text style={[st.p, { textAlign: 'center' }]}>
                    Uygulamayı arka plana alma, işlem durur.
                  </Text>
                </View>
                <View style={{ height: 16 }} />
                <Btn label="Durdur" kind="ghost" onPress={durdur} />
              </Card>
            ) : (
              <Card>
                <Text style={st.h}>{(HATA_METNI[hata] ?? HATA_METNI.unknown).baslik}</Text>
                <Text style={st.p}>{(HATA_METNI[hata] ?? HATA_METNI.unknown).metin}</Text>
                {followers.current.size ? (
                  <Text style={[st.p, { marginTop: 10, color: C.sub }]}>
                    O ana kadar {sayi(followers.current.size)} takipçi,{' '}
                    {sayi(following.current.size)} takip çekilmişti. Eksik veri kaydedilmez.
                  </Text>
                ) : null}
                <View style={{ height: 16 }} />
                <Btn
                  label="Tekrar dene"
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
                <Btn label="Geri dön" kind="ghost" onPress={onBack} />
              </Card>
            )}
          </View>
        ) : null}
      </View>

      {phase === 'login' ? (
        <View style={st.note}>
          <Text style={st.noteTxt}>
            🔒 Bu, Instagram’ın kendi giriş sayfası. Şifren uygulamaya girilmiyor, kaydedilmiyor ve
            hiçbir yere gönderilmiyor.
          </Text>
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
