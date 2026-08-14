import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { analyze, timestampIndex } from './src/lib/analyze';
import { clearAvatarCache, loadAvatarIndex } from './src/lib/avatars';
import { BUYUK_DOSYA, pickFiles } from './src/lib/importer';
import { dedupe, parseFiles, ZipContentError } from './src/lib/parse';
import {
  clearEverything,
  DEFAULT_SETTINGS,
  deleteSnapshot,
  getSettings,
  getWhitelist,
  listSnapshots,
  loadSnapshot,
  saveSettings,
  saveSnapshot,
  type Settings,
  setWhitelist,
} from './src/lib/storage';
import { Connect } from './src/screens/Connect';
import { Help } from './src/screens/Help';
import { History } from './src/screens/History';
import { Home } from './src/screens/Home';
import { ListScreen } from './src/screens/ListScreen';
import { C } from './src/theme';
import {
  type CatKey,
  EMPTY_DATA,
  type IgUser,
  type SnapshotData,
  type SnapshotMeta,
} from './src/types';

type Tab = 'home' | 'history' | 'help';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'Analiz', icon: '📊' },
  { key: 'history', label: 'Geçmiş', icon: '🗂️' },
  { key: 'help', label: 'Yardım', icon: '❓' },
];

function onay(title: string, message: string, okText = 'Devam et'): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Vazgeç', style: 'cancel', onPress: () => resolve(false) },
        { text: okText, onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
}

function sorTur(name: string): Promise<'followers' | 'following' | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Bu dosya hangisi?',
      `“${name}” dosyasının türü anlaşılamadı. İçindeki hesaplar neyi ifade ediyor?`,
      [
        { text: 'Takipçilerim', onPress: () => resolve('followers') },
        { text: 'Takip ettiklerim', onPress: () => resolve('following') },
        { text: 'Atla', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: false }
    );
  });
}

function Main() {
  const insets = useSafeAreaInsets();

  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [openCat, setOpenCat] = useState<CatKey | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);

  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<SnapshotData | null>(null);
  const [prevData, setPrevData] = useState<SnapshotData | null>(null);

  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // ---- ilk yükleme ----
  useEffect(() => {
    (async () => {
      SystemUI.setBackgroundColorAsync(C.bg).catch(() => undefined);
      loadAvatarIndex();
      const [list, wl, ayarlar] = await Promise.all([
        listSnapshots(),
        getWhitelist(),
        getSettings(),
      ]);
      setSnapshots(list);
      setCurrentId(list[0]?.id ?? null);
      setPrevId(list[1]?.id ?? null);
      setMarked(new Set(wl));
      setSettings(ayarlar);
      setReady(true);
    })();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!currentId) {
      setCurrentData(null);
      return;
    }
    loadSnapshot(currentId).then((d) => {
      if (alive) setCurrentData(d);
    });
    return () => {
      alive = false;
    };
  }, [currentId]);

  useEffect(() => {
    let alive = true;
    if (!prevId) {
      setPrevData(null);
      return;
    }
    loadSnapshot(prevId).then((d) => {
      if (alive) setPrevData(d);
    });
    return () => {
      alive = false;
    };
  }, [prevId]);

  // ---- geri tuşu ----
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (connectOpen) {
        setConnectOpen(false);
        return true;
      }
      if (openCat) {
        setOpenCat(null);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [openCat, tab, connectOpen]);

  const analysis = useMemo(
    () => (currentData ? analyze(currentData, prevData) : null),
    [currentData, prevData]
  );

  const tsFor = useMemo(
    () => timestampIndex(currentData ?? EMPTY_DATA()),
    [currentData]
  );

  const currentMeta = useMemo(
    () => snapshots.find((s) => s.id === currentId) ?? null,
    [snapshots, currentId]
  );
  const prevMeta = useMemo(() => snapshots.find((s) => s.id === prevId) ?? null, [snapshots, prevId]);

  /** Yeni anlık görüntüyü kaydeder ve karşılaştırma için seçer. */
  const kaydet = useCallback(
    async (data: SnapshotData, kaynak: string, mesaj: string) => {
      const meta = await saveSnapshot(data, kaynak);
      const list = await listSnapshots();
      setSnapshots(list);
      setCurrentId(meta.id);
      setPrevId(list.find((s) => s.id !== meta.id)?.id ?? null);
      setTab('home');
      setOpenCat(null);
      setConnectOpen(false);
      showToast(mesaj);
    },
    [showToast]
  );

  // ---- Instagram'dan canlı çekim ----
  const canliBitti = useCallback(
    async (followers: IgUser[], following: IgUser[]) => {
      if (!followers.length && !following.length) {
        setConnectOpen(false);
        Alert.alert(
          'Liste boş geldi',
          'Instagram hiçbir hesap döndürmedi. Biraz sonra tekrar dene ya da veri arşivi yöntemini kullan.'
        );
        return;
      }
      await kaydet(
        { ...EMPTY_DATA(), followers, following },
        'Instagram (canlı çekim)',
        `${followers.length} takipçi, ${following.length} takip çekildi`
      );
    },
    [kaydet]
  );

  // ---- içe aktarma ----
  const doImport = useCallback(async () => {
    if (busy) return;
    let files;
    try {
      files = await pickFiles();
    } catch (e) {
      Alert.alert('Dosya açılamadı', 'Dosya seçilirken bir sorun oldu. Tekrar dener misin?');
      return;
    }
    if (!files || !files.length) return;

    const toplam = files.reduce((a, f) => a + f.size, 0);
    if (toplam > BUYUK_DOSYA) {
      const devam = await onay(
        'Dosya çok büyük',
        'Seçtiğin arşiv çok büyük görünüyor; muhtemelen tüm Instagram verini indirdin. Uygulama takılabilir.\n\nDaha sağlıklısı: Instagram’dan yalnızca “Takipçiler ve takip edilenler” verisini indirmek.',
        'Yine de dene'
      );
      if (!devam) return;
    }

    setBusy(true);
    // yükleniyor göstergesinin çizilmesi için bir tur bekle
    await new Promise((r) => setTimeout(r, 60));

    try {
      const res = parseFiles(files);

      // adı tanınmayan dosyalar için kullanıcıya sor
      for (const bilinmeyen of res.unknown) {
        const tur = await sorTur(bilinmeyen.name);
        if (!tur) continue;
        res.data[tur] = dedupe(res.data[tur].concat(bilinmeyen.users));
      }

      const fCount = res.data.followers.length;
      const gCount = res.data.following.length;

      if (fCount === 0 && gCount === 0) {
        Alert.alert(
          'Takipçi verisi bulunamadı',
          'Seçtiğin dosyada followers / following listesi yok.\n\nInstagram’dan “Takipçiler ve takip edilenler” bölümünü JSON formatında indirip gelen .zip dosyasını seçtiğinden emin ol. Yardım sekmesinde adım adım anlatıyorum.'
        );
        return;
      }

      if (fCount === 0 || gCount === 0) {
        const eksik = fCount === 0 ? 'takipçi listesi' : 'takip edilenler listesi';
        const devam = await onay(
          'Eksik liste',
          `Dosyada ${eksik} bulunamadı. Karşılaştırmalar eksik çıkacak.\n\nYine de kaydedeyim mi?`,
          'Kaydet'
        );
        if (!devam) return;
      }

      const kaynak = files.length === 1 ? files[0].name : `${files.length} dosya`;
      await kaydet(res.data, kaynak, `${fCount} takipçi, ${gCount} takip yüklendi`);
    } catch (e) {
      if (e instanceof ZipContentError) {
        Alert.alert(
          'Zip içinde takipçi verisi yok',
          'Seçtiğin arşivde followers / following dosyaları bulunamadı.\n\nInstagram’dan indirirken “Takipçiler ve takip edilenler” kutusunu işaretlediğinden emin ol.'
        );
      } else {
        Alert.alert(
          'Dosya okunamadı',
          'Dosya bozuk olabilir ya da beklenen biçimde değil. Zip’i açıp içindeki followers_1.json ve following.json dosyalarını doğrudan seçmeyi dene.'
        );
      }
    } finally {
      setBusy(false);
    }
  }, [busy, kaydet]);

  // ---- işaretleme ----
  const toggleMark = useCallback((username: string) => {
    setMarked((prev) => {
      const next = new Set(prev);
      const k = username.toLowerCase();
      if (next.has(k)) next.delete(k);
      else next.add(k);
      setWhitelist([...next]).catch(() => undefined);
      return next;
    });
  }, []);

  const clearMarks = useCallback(() => {
    setMarked(new Set());
    setWhitelist([]).catch(() => undefined);
  }, []);

  // ---- geçmiş işlemleri ----
  const selectRole = useCallback(
    (role: 'current' | 'prev', id: string) => {
      const secilen = snapshots.find((s) => s.id === id);
      if (!secilen) return;
      if (role === 'current') {
        setCurrentId(id);
        // eski kayıt artık geçersizse otomatik olarak bir öncekini seç
        const p = snapshots.find((s) => s.id === prevId);
        if (!p || p.createdAt >= secilen.createdAt) {
          setPrevId(snapshots.find((s) => s.createdAt < secilen.createdAt)?.id ?? null);
        }
        showToast('Yeni kayıt olarak seçildi');
      } else {
        if (id === prevId) {
          setPrevId(null);
          return;
        }
        if (id === currentId) {
          showToast('Aynı kayıt hem yeni hem eski olamaz');
          return;
        }
        const c = snapshots.find((s) => s.id === currentId);
        if (c && secilen.createdAt >= c.createdAt) {
          showToast('Eski kayıt, yeni kayıttan önceki bir tarih olmalı');
          return;
        }
        setPrevId(id);
        showToast('Eski kayıt olarak seçildi');
      }
    },
    [snapshots, currentId, prevId, showToast]
  );

  const removeSnapshot = useCallback(
    async (id: string) => {
      await deleteSnapshot(id);
      const list = await listSnapshots();
      setSnapshots(list);

      const yeniCurrent = currentId === id ? list[0]?.id ?? null : currentId;
      const cur = list.find((s) => s.id === yeniCurrent);
      let yeniPrev = prevId === id ? null : prevId;
      const pv = list.find((s) => s.id === yeniPrev);
      // eski kayıt silinmişse ya da artık yeni kayıttan sonra geliyorsa yenisini seç
      if (!pv || !cur || pv.createdAt >= cur.createdAt) {
        yeniPrev = cur ? list.find((s) => s.createdAt < cur.createdAt)?.id ?? null : null;
      }

      setCurrentId(yeniCurrent);
      setPrevId(yeniPrev);
      showToast('Kayıt silindi');
    },
    [currentId, prevId, showToast]
  );

  const avatarlariAyarla = useCallback((v: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, avatars: v };
      saveSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  const wipe = useCallback(async () => {
    await clearEverything();
    clearAvatarCache();
    setSnapshots([]);
    setCurrentId(null);
    setPrevId(null);
    setCurrentData(null);
    setPrevData(null);
    setMarked(new Set());
    setTab('home');
    setOpenCat(null);
    showToast('Tüm veriler silindi');
  }, [showToast]);

  if (!ready) {
    return (
      <View style={[st.root, st.center]}>
        <ActivityIndicator color={C.pink} size="large" />
      </View>
    );
  }

  const tabBarVisible = !openCat && !connectOpen;

  return (
    <View style={st.root}>
      {connectOpen ? (
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <Connect onBack={() => setConnectOpen(false)} onFinish={canliBitti} />
        </View>
      ) : openCat && analysis ? (
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <ListScreen
            catKey={openCat}
            users={analysis[openCat]}
            tsFor={tsFor}
            marked={marked}
            onToggleMark={toggleMark}
            onBack={() => setOpenCat(null)}
            onToast={showToast}
            bottomInset={insets.bottom}
            showAvatars={settings.avatars}
          />
        </View>
      ) : tab === 'home' ? (
        <Home
          topInset={insets.top}
          meta={currentMeta}
          prevMeta={prevMeta}
          analysis={analysis}
          busy={busy}
          onImport={doImport}
          onConnect={() => setConnectOpen(true)}
          onOpenCat={(k) => setOpenCat(k)}
          onHelp={() => setTab('help')}
        />
      ) : tab === 'history' ? (
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <History
            snapshots={snapshots}
            currentId={currentId}
            prevId={prevId}
            markedCount={marked.size}
            onSelect={selectRole}
            onDelete={removeSnapshot}
            onClearMarks={clearMarks}
            onClearAll={wipe}
            onImport={doImport}
            onConnect={() => setConnectOpen(true)}
            busy={busy}
            avatarsOn={settings.avatars}
            onToggleAvatars={avatarlariAyarla}
          />
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <Help onImport={doImport} onConnect={() => setConnectOpen(true)} />
        </View>
      )}

      {tabBarVisible ? (
        <View style={[st.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  setTab(t.key);
                  setOpenCat(null);
                }}
                style={({ pressed }) => [st.tab, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[st.tabIcon, !active && { opacity: 0.45 }]}>{t.icon}</Text>
                <Text style={[st.tabLabel, active && { color: C.text, fontWeight: '800' }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {busy ? (
        <View style={st.overlay} pointerEvents="auto">
          <View style={st.overlayCard}>
            <ActivityIndicator color={C.pink} size="large" />
            <Text style={st.overlayTxt}>Dosya okunuyor…</Text>
          </View>
        </View>
      ) : null}

      {toast ? (
        <View
          style={[st.toast, { bottom: (tabBarVisible ? 78 : 24) + Math.max(insets.bottom, 8) }]}
          pointerEvents="none">
          <Text style={st.toastTxt}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Main />
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bgAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 19 },
  tabLabel: { color: C.dim, fontSize: 11, fontWeight: '600' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 34,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  overlayTxt: { color: C.text, fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#26262F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  toastTxt: { color: C.text, fontSize: 13, textAlign: 'center', fontWeight: '600' },
});
