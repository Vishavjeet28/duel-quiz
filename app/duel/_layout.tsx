import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function DuelLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.bgPrimary },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="play" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
