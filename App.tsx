import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import { initI18n } from './src/i18n';
import { analyze, timestampIndex } from './src/lib/analyze';
import { clearAvatarCache, loadAvatarIndex } from './src/lib/avatars';
import { useDestek } from './src/hooks/useDestek';
import { BUYUK_DOSYA, pickFiles } from './src/lib/importer';
import {
  reklamKullaniciEtkilesimiKaydet,
  tamSayfaReklamiGoster,
  tamSayfaReklamiHazirla,
} from './src/lib/ads';
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

type T = (key: string, opts?: Record<string, unknown>) => string;

const TAB_KEYS: { key: Tab; labelKey: string; icon: string }[] = [
  { key: 'home', labelKey: 'tabs.home', icon: '📊' },
  { key: 'history', labelKey: 'tabs.history', icon: '🗂️' },
  { key: 'help', labelKey: 'tabs.help', icon: '❓' },
];

function onay(t: T, title: string, message: string, okText?: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: okText ?? t('common.continueBtn'), onPress: () => resolve(true) },
      ],
      { cancelable: false }
    );
  });
}

function sorTur(t: T, name: string): Promise<'followers' | 'following' | null> {
  return new Promise((resolve) => {
    Alert.alert(
      t('app.fileType.title'),
      t('app.fileType.message', { name }),
      [
        { text: t('app.fileType.followers'), onPress: () => resolve('followers') },
        { text: t('app.fileType.following'), onPress: () => resolve('following') },
        { text: t('common.skip'), style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: false }
    );
  });
}

function Main() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const destek = useDestek();
  const interstitialReklamiGosterilebilir =
    destek.reklamDurumuKontrolEdildi && !destek.reklamsiz;
  const notFollowingBackAcmaBekliyor = useRef(false);

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

  useEffect(() => {
    if (interstitialReklamiGosterilebilir) tamSayfaReklamiHazirla();
  }, [interstitialReklamiGosterilebilir]);

  // ---- ilk yükleme ----
  useEffect(() => {
    (async () => {
      SystemUI.setBackgroundColorAsync(C.bg).catch(() => undefined);
      loadAvatarIndex();
      await initI18n();
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
      void tamSayfaReklamiGoster(interstitialReklamiGosterilebilir);
    },
    [interstitialReklamiGosterilebilir, showToast]
  );

  // ---- Instagram'dan canlı çekim ----
  const canliBitti = useCallback(
    async (followers: IgUser[], following: IgUser[]) => {
      if (!followers.length && !following.length) {
        setConnectOpen(false);
        Alert.alert(t('app.alerts.emptyLive.title'), t('app.alerts.emptyLive.message'));
        return;
      }
      // Connect içindeki WebView etkileşimleri ana görünümün dokunma
      // sayacına ulaşmadığından başarılı dış akışı bir kullanıcı adımı say.
      reklamKullaniciEtkilesimiKaydet();
      await kaydet(
        { ...EMPTY_DATA(), followers, following },
        t('app.source.live'),
        t('app.messages.liveSaved', { f: followers.length, g: following.length })
      );
    },
    [kaydet, t]
  );

  // ---- içe aktarma ----
  const doImport = useCallback(async () => {
    if (busy) return;
    let files;
    try {
      files = await pickFiles();
    } catch (e) {
      Alert.alert(t('app.alerts.pickFailed.title'), t('app.alerts.pickFailed.message'));
      return;
    }
    if (!files || !files.length) return;
    // Sistem dosya seçicisindeki seçim ana görünümden ayrı bir etkileşimdir.
    reklamKullaniciEtkilesimiKaydet();
    const toplam = files.reduce((a, f) => a + f.size, 0);
    if (toplam > BUYUK_DOSYA) {
      const devam = await onay(
        t,
        t('app.alerts.tooLarge.title'),
        t('app.alerts.tooLarge.message'),
        t('app.alerts.tooLarge.confirm')
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
        const tur = await sorTur(t, bilinmeyen.name);
        if (!tur) continue;
        res.data[tur] = dedupe(res.data[tur].concat(bilinmeyen.users));
      }

      const fCount = res.data.followers.length;
      const gCount = res.data.following.length;

      if (fCount === 0 && gCount === 0) {
        Alert.alert(t('app.alerts.noFollowerData.title'), t('app.alerts.noFollowerData.message'));
        return;
      }

      if (fCount === 0 || gCount === 0) {
        const eksik = fCount === 0 ? t('app.list.followerList') : t('app.list.followingList');
        const devam = await onay(
          t,
          t('app.alerts.missingList.title'),
          t('app.alerts.missingList.message', { missing: eksik }),
          t('common.save')
        );
        if (!devam) return;
      }

      const kaynak = files.length === 1 ? files[0].name : t('app.source.multipleFiles', { count: files.length });
      await kaydet(res.data, kaynak, t('app.messages.importSaved', { f: fCount, g: gCount }));
    } catch (e) {
      if (e instanceof ZipContentError) {
        Alert.alert(t('app.alerts.zipNoData.title'), t('app.alerts.zipNoData.message'));
      } else {
        Alert.alert(t('app.alerts.fileUnreadable.title'), t('app.alerts.fileUnreadable.message'));
      }
    } finally {
      setBusy(false);
    }
  }, [busy, kaydet, t]);

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
        showToast(t('app.messages.selectedAsNew'));
      } else {
        if (id === prevId) {
          setPrevId(null);
          return;
        }
        if (id === currentId) {
          showToast(t('app.messages.sameRecordError'));
          return;
        }
        const c = snapshots.find((s) => s.id === currentId);
        if (c && secilen.createdAt >= c.createdAt) {
          showToast(t('app.messages.oldMustBeEarlier'));
          return;
        }
        setPrevId(id);
        showToast(t('app.messages.selectedAsOld'));
      }
    },
    [snapshots, currentId, prevId, showToast, t]
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
      showToast(t('app.messages.recordDeleted'));
    },
    [currentId, prevId, showToast, t]
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
    showToast(t('app.messages.allDataCleared'));
  }, [showToast, t]);

  const kategoriyiAc = useCallback(
    (key: CatKey) => {
      if (key !== 'notFollowingBack') {
        setOpenCat(key);
        return;
      }
      if (notFollowingBackAcmaBekliyor.current) return;
      notFollowingBackAcmaBekliyor.current = true;
      void tamSayfaReklamiGoster(interstitialReklamiGosterilebilir)
        .catch(() => false)
        .then(() => {
          setOpenCat(key);
          notFollowingBackAcmaBekliyor.current = false;
        });
    },
    [interstitialReklamiGosterilebilir]
  );

  if (!ready) {
    return (
      <View style={[st.root, st.center]}>
        <ActivityIndicator color={C.pink} size="large" />
      </View>
    );
  }

  const tabBarVisible = !openCat && !connectOpen;

  return (
    <View style={st.root} onTouchEndCapture={reklamKullaniciEtkilesimiKaydet}>
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
          onOpenCat={kategoriyiAc}
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
            destek={destek}
          />
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <Help onImport={doImport} onConnect={() => setConnectOpen(true)} />
        </View>
      )}

      {tabBarVisible ? (
        <View style={[st.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TAB_KEYS.map((tabItem) => {
            const active = tab === tabItem.key;
            return (
              <Pressable
                key={tabItem.key}
                onPress={() => {
                  setTab(tabItem.key);
                  setOpenCat(null);
                }}
                style={({ pressed }) => [st.tab, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[st.tabIcon, !active && { opacity: 0.45 }]}>{tabItem.icon}</Text>
                <Text style={[st.tabLabel, active && { color: C.text, fontWeight: '800' }]}>
                  {t(tabItem.labelKey)}
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
            <Text style={st.overlayTxt}>{t('common.loadingFile')}</Text>
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
