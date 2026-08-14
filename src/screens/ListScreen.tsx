import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { CATEGORY_BY_KEY } from '../lib/analyze';
import { sayi, tarih } from '../lib/fmt';
import { copyUsernames, openProfile, shareUsernames } from '../lib/ig';
import { C, ROW_HEIGHT, S } from '../theme';
import type { CatKey, IgUser } from '../types';
import { Empty, Header, Pill } from '../ui/kit';
import { UserRow } from '../ui/UserRow';

type Sort = 'az' | 'za' | 'yeni' | 'eski';

type Props = {
  catKey: CatKey;
  users: IgUser[];
  tsFor: (u: IgUser, cat: CatKey) => number | undefined;
  marked: Set<string>;
  onToggleMark: (username: string) => void;
  onBack: () => void;
  onToast: (msg: string) => void;
  bottomInset: number;
  showAvatars: boolean;
};

export function ListScreen({
  catKey,
  users,
  tsFor,
  marked,
  onToggleMark,
  onBack,
  onToast,
  bottomInset,
  showAvatars,
}: Props) {
  const cat = CATEGORY_BY_KEY[catKey];
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('az');
  const [hideMarked, setHideMarked] = useState(true);

  const enriched = useMemo(
    () => users.map((u) => ({ u: u.u, n: u.n, p: u.p, t: tsFor(u, catKey) })),
    [users, tsFor, catKey]
  );

  const data = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = enriched;
    if (query) {
      list = list.filter(
        (x) => x.u.toLowerCase().includes(query) || (x.n && x.n.toLowerCase().includes(query))
      );
    }
    if (hideMarked && marked.size) list = list.filter((x) => !marked.has(x.u.toLowerCase()));
    const arr = [...list];
    arr.sort((a, b) => {
      switch (sort) {
        case 'az':
          return a.u.toLowerCase().localeCompare(b.u.toLowerCase());
        case 'za':
          return b.u.toLowerCase().localeCompare(a.u.toLowerCase());
        case 'yeni':
          return (b.t ?? 0) - (a.t ?? 0);
        case 'eski':
          return (a.t ?? Number.MAX_SAFE_INTEGER) - (b.t ?? Number.MAX_SAFE_INTEGER);
      }
    });
    return arr;
  }, [enriched, q, sort, hideMarked, marked]);

  const hasTimestamps = useMemo(() => enriched.some((x) => !!x.t), [enriched]);

  const handlePress = useCallback((u: string) => {
    openProfile(u);
  }, []);

  const handleLongPress = useCallback(
    async (u: string) => {
      await copyUsernames([u]);
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
      onToast(`@${u} kopyalandı`);
    },
    [onToast]
  );

  const handleMark = useCallback(
    (u: string) => {
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => undefined);
      onToggleMark(u);
    },
    [onToggleMark]
  );

  const markedCount = useMemo(
    () => enriched.filter((x) => marked.has(x.u.toLowerCase())).length,
    [enriched, marked]
  );

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={cat.title}
        subtitle={`${sayi(data.length)} hesap${
          markedCount && hideMarked ? ` · ${markedCount} gizli` : ''
        }`}
        onBack={onBack}
      />

      <View style={st.tools}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Kullanıcı adı ara…"
          placeholderTextColor={C.dim}
          style={st.search}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <View style={st.pillRow}>
          <Pill label="A → Z" active={sort === 'az'} onPress={() => setSort('az')} />
          <Pill label="Z → A" active={sort === 'za'} onPress={() => setSort('za')} />
          {hasTimestamps ? (
            <>
              <Pill label="En yeni" active={sort === 'yeni'} onPress={() => setSort('yeni')} />
              <Pill label="En eski" active={sort === 'eski'} onPress={() => setSort('eski')} />
            </>
          ) : null}
        </View>
        <Pressable onPress={() => setHideMarked((v) => !v)} style={st.checkRow} hitSlop={6}>
          <View style={[st.checkBox, hideMarked && { backgroundColor: C.pink, borderColor: C.pink }]}>
            {hideMarked ? <Text style={st.checkTick}>✓</Text> : null}
          </View>
          <Text style={st.checkTxt}>İşaretlediklerimi gizle</Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.u}
        renderItem={({ item }) => (
          <UserRow
            username={item.u}
            sub={item.t && cat.tsLabel ? `${cat.tsLabel}: ${tarih(item.t)}` : item.n}
            pic={item.p}
            showAvatars={showAvatars}
            marked={marked.has(item.u.toLowerCase())}
            onPress={handlePress}
            onLongPress={handleLongPress}
            onToggleMark={handleMark}
          />
        )}
        getItemLayout={(_, index) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        initialNumToRender={14}
        maxToRenderPerBatch={20}
        windowSize={11}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={
          data.length ? { paddingBottom: 90 + bottomInset } : { flexGrow: 1 }
        }
        ListEmptyComponent={
          <Empty
            icon={q ? '🔍' : '✨'}
            title={q ? 'Eşleşme yok' : 'Bu listede kimse yok'}
            desc={q ? 'Farklı bir kullanıcı adı dene.' : cat.desc}
          />
        }
      />

      {data.length ? (
        <View style={[st.bottomBar, { bottom: bottomInset + 16 }]}>
          <Pressable
            style={({ pressed }) => [st.barBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={async () => {
              await copyUsernames(data.map((d) => d.u));
              onToast(`${data.length} kullanıcı adı kopyalandı`);
            }}>
            <Text style={st.barTxt}>📋  Kopyala</Text>
          </Pressable>
          <View style={st.barSep} />
          <Pressable
            style={({ pressed }) => [st.barBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => shareUsernames(cat.title, data.map((d) => d.u))}>
            <Text style={st.barTxt}>📤  Paylaş</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  tools: {
    paddingHorizontal: S.pad,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  search: {
    height: 44,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTick: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkTxt: { color: C.sub, fontSize: 12.5 },
  bottomBar: {
    position: 'absolute',
    left: S.pad,
    right: S.pad,
    height: 54,
    borderRadius: 16,
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  barSep: { width: 1, height: '55%', backgroundColor: C.border },
  barTxt: { color: C.text, fontSize: 14, fontWeight: '700' },
});
