import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openUrl } from '../lib/ig';
import { APP_VERSION, C, S, YAPIMCI_AD, YAPIMCI_URL } from '../theme';

/** Uygulamanın altındaki yapımcı künyesi — dokununca siteyi açar. */
export function Credit() {
  return (
    <Pressable
      onPress={() => openUrl(YAPIMCI_URL)}
      style={({ pressed }) => [st.card, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={st.icon}>
        <Text style={{ fontSize: 19 }}>🛍️</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={st.label}>Yapımcı</Text>
        <Text style={st.site} numberOfLines={1}>
          {YAPIMCI_AD}
        </Text>
      </View>
      <Text style={st.chev}>›</Text>
    </Pressable>
  );
}

/** Künye + sürüm + sorumluluk notu. Ekran altlarında kullanılır. */
export function Footer() {
  return (
    <View style={{ gap: 10 }}>
      <Credit />
      <Text style={st.note}>
        Takipçi Analiz v{APP_VERSION} · Bu uygulama Instagram veya Meta ile bağlantılı değildir.
        Tüm veriler yalnızca cihazında saklanır.
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: S.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${C.pink}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: C.dim, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  site: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 3 },
  chev: { color: C.dim, fontSize: 22, marginTop: -2 },
  note: { color: C.dim, fontSize: 11, textAlign: 'center', lineHeight: 17, paddingHorizontal: 8 },
});
