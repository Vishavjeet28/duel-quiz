// Settings index — redirects to profile settings view
import { Redirect } from 'expo-router';

export default function SettingsIndex() {
  return <Redirect href="/(tabs)/profile" />;
}
