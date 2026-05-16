// Duel Play — Reuses quiz play logic for 1v1 context
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

export default function DuelPlayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚔️ Duel mode coming soon!</Text>
      <Text style={styles.sub}>1v1 head-to-head quiz battles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold },
  sub: { fontSize: 14, color: Colors.textMuted, fontFamily: Typography.fontFamily.regular, marginTop: 8 },
});
