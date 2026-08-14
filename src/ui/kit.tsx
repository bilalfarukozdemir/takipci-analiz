import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { C, S } from '../theme';

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[st.card, style]}>{children}</View>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  icon?: string;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = kind === 'primary' ? C.pink : kind === 'danger' ? '#3A1720' : C.cardAlt;
  const fg = kind === 'danger' ? C.red : C.text;
  const off = disabled || busy;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        st.btn,
        { backgroundColor: bg, opacity: off ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[st.btnText, { color: fg }]} numberOfLines={1}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        st.pill,
        {
          backgroundColor: active ? C.pink : C.cardAlt,
          borderColor: active ? C.pink : C.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}>
      <Text style={[st.pillText, { color: active ? '#fff' : C.sub }]}>{label}</Text>
    </Pressable>
  );
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={st.header}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={st.backBtn}>
          <Text style={st.backTxt}>‹</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={st.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Empty({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <View style={st.empty}>
      <Text style={{ fontSize: 44, marginBottom: 12 }}>{icon}</Text>
      <Text style={st.emptyTitle}>{title}</Text>
      {desc ? <Text style={st.emptyDesc}>{desc}</Text> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

const st = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.pad,
  },
  btn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
  },
  btnText: { fontSize: 15, fontWeight: '700' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.pad,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { color: C.text, fontSize: 26, lineHeight: 30, marginTop: -4, fontWeight: '600' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  headerSub: { color: C.sub, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: 64 },
  emptyTitle: { color: C.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDesc: {
    color: C.sub,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
});
