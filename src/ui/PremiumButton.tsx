import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

export function PremiumButton({ onPress, active = false }: { onPress: () => void; active?: boolean }) {
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t(active ? 'premium.activeLabel' : 'premium.openLabel')}
      onPress={onPress} style={({ pressed }) => [st.button, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={st.icon}>✦</Text>
      <Text style={st.label}>{t(active ? 'premium.active' : 'premium.button')}</Text>
    </Pressable>
  );
}
const st = StyleSheet.create({
  button: { minHeight: 44, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#241E13',
    borderColor: '#E9C46A', borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { color: '#F4D58D', fontSize: 16 },
  label: { color: '#F4D58D', fontSize: 12, fontWeight: '800' },
});
