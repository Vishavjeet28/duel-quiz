import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function QuizLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.bgPrimary },
      animation: 'slide_from_right',
      gestureEnabled: false,
    }}>
      <Stack.Screen name="lobby" />
      <Stack.Screen name="play" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
