// Duel Result placeholder
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';

export default function DuelResultScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.text}>Duel Result</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.btnText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: 16 },
  text: { fontSize: 24, color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold },
  btn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: BorderRadius.lg },
  btnText: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold, fontSize: 16 },
});
