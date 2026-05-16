// SCR-005: Profile Setup — Avatar, Display Name, Username, Language
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius, AVATARS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const login = useAuthStore(s => s.login);
  
  const [avatar, setAvatar] = useState('🦁');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('en');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndContinue = async () => {
    const errs: Record<string, string> = {};
    if (displayName.length < 3) errs.displayName = 'Minimum 3 characters';
    if (displayName.length > 20) errs.displayName = 'Maximum 20 characters';
    if (username.length < 3) errs.username = 'Minimum 3 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) errs.username = 'Only letters, numbers, and underscore';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const updates = {
        username: username.toLowerCase(),
        displayName,
        avatarEmoji: avatar,
        language,
      };
      
      const updatedUser = await api.patch<any>('/v1/users/me', updates);
      useAuthStore.getState().updateUser(updatedUser);
      router.push('/(tabs)/home');
    } catch (e: any) {
      setErrors({ username: e.message || 'Failed to update profile' });
    }
  };

  const handleUsernameChange = async (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setErrors(e => ({ ...e, username: '' }));
    
    if (clean.length >= 3) {
      try {
        const res = await api.get<{ available: boolean }>(`/v1/users/check-username?username=${clean}`);
        setUsernameAvailable(res.available);
      } catch (e) {
        setUsernameAvailable(null);
      }
    } else {
      setUsernameAvailable(null);
    }
  };

  const isValid = displayName.length >= 3 && username.length >= 3 && usernameAvailable !== false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Choose your avatar and display name</Text>

      {/* Avatar selector */}
      <Text style={styles.sectionLabel}>Choose Avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[styles.avatarItem, avatar === emoji && styles.avatarSelected]}
            onPress={() => setAvatar(emoji)}
          >
            <Text style={styles.avatarEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Display Name */}
      <Text style={styles.sectionLabel}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={(t) => { setDisplayName(t); setErrors(e => ({ ...e, displayName: '' })); }}
        placeholder="Enter your name"
        placeholderTextColor={Colors.textMuted}
        maxLength={20}
      />
      {errors.displayName ? <Text style={styles.errorText}>{errors.displayName}</Text> : null}

      {/* Username */}
      <Text style={styles.sectionLabel}>Username</Text>
      <View style={styles.usernameContainer}>
        <Text style={styles.atSign}>@</Text>
        <TextInput
          style={styles.usernameInput}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="username"
          placeholderTextColor={Colors.textMuted}
          maxLength={20}
          autoCapitalize="none"
        />
        {usernameAvailable !== null && (
          <Text style={usernameAvailable ? styles.checkmark : styles.crossmark}>
            {usernameAvailable ? '✓' : '✗'}
          </Text>
        )}
      </View>
      {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
      {usernameAvailable === false && <Text style={styles.errorText}>Username is taken</Text>}

      {/* Language */}
      <Text style={styles.sectionLabel}>Preferred Language</Text>
      <View style={styles.langGrid}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.langChip, language === lang.code && styles.langChipActive]}
            onPress={() => setLanguage(lang.code)}
          >
            <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue */}
      <TouchableOpacity
        style={[styles.ctaBtn, !isValid && styles.ctaBtnDisabled]}
        onPress={validateAndContinue}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  contentContainer: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  avatarItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  avatarEmoji: { fontSize: 28 },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  atSign: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 16,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
  },
  checkmark: { color: Colors.success, fontSize: 20, fontFamily: Typography.fontFamily.bold },
  crossmark: { color: Colors.error, fontSize: 20, fontFamily: Typography.fontFamily.bold },
  errorText: {
    color: Colors.error,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 4,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  langText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  langTextActive: {
    color: Colors.primary,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: 40,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
  },
});
