import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAvatar } from '../lib/avatars';
import { C, ROW_HEIGHT, S } from '../theme';

const AVATAR_COLORS = ['#E1306C', '#8A3AB9', '#F77737', '#4F86F7', '#25C2A0', '#FCAF45', '#FF4D5A'];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

type Props = {
  username: string;
  /** altta gösterilecek satır: takip tarihi ya da görünen ad */
  sub?: string;
  /** profil fotoğrafı adresi (canlı çekimden) */
  pic?: string;
  showAvatars?: boolean;
  marked?: boolean;
  onPress: (u: string) => void;
  onLongPress: (u: string) => void;
  onToggleMark: (u: string) => void;
};

function UserRowBase({
  username,
  sub,
  pic,
  showAvatars = true,
  marked,
  onPress,
  onLongPress,
  onToggleMark,
}: Props) {
  const letter = (username[0] || '?').toUpperCase();
  const uri = useAvatar(username, pic, showAvatars);
  const [bozuk, setBozuk] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(username)}
      onLongPress={() => onLongPress(username)}
      style={({ pressed }) => [st.row, { backgroundColor: pressed ? C.cardAlt : 'transparent' }]}>
      {uri && !bozuk ? (
        <Image source={{ uri }} style={st.avatar} onError={() => setBozuk(true)} />
      ) : (
        <View style={[st.avatar, { backgroundColor: colorFor(username) }]}>
          <Text style={st.avatarTxt}>{letter}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[st.name, marked && st.nameMarked]} numberOfLines={1}>
          @{username}
        </Text>
        {sub ? (
          <Text style={st.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => onToggleMark(username)}
        hitSlop={10}
        style={({ pressed }) => [
          st.mark,
          {
            backgroundColor: marked ? C.green : C.cardAlt,
            borderColor: marked ? C.green : C.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <Text style={{ color: marked ? '#04220F' : C.dim, fontSize: 15, fontWeight: '900' }}>✓</Text>
      </Pressable>
    </Pressable>
  );
}

export const UserRow = React.memo(UserRowBase);

const st = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.pad,
    gap: 12,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  name: { color: C.text, fontSize: 15, fontWeight: '600' },
  nameMarked: { color: C.dim, textDecorationLine: 'line-through' },
  sub: { color: C.sub, fontSize: 12, marginTop: 3 },
  mark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
