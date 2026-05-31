// SCR-003: Social Login — Google & Apple Sign-In with Firebase
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { signInWithGoogle, signInWithApple, authenticateWithBackend } from '../../services/firebase';
import { useAuthStore } from '../../stores/authStore';import { Linking } from 'react-native';

export default function SocialAuthScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');

  const handleOpenTerms = () => {
    Linking.openURL('https://duel.app/terms').catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://duel.app/privacy').catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError('');
    try {
      const { idToken, user: googleUser } = await signInWithGoogle();

      const { user, token, isNewUser } = await authenticateWithBackend({
        provider: 'google',
        idToken,
        email: googleUser.email,
        name: googleUser.name,
        providerUid: googleUser.googleUid,
      });

      login(user, token);

      if (isNewUser || !user.username) {
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e: any) {
      if (e.message !== 'Sign in was cancelled') {
        setError(e.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading('apple');
    setError('');
    try {
      const { identityToken, user: appleUser } = await signInWithApple();

      const { user, token, isNewUser } = await authenticateWithBackend({
        provider: 'apple',
        idToken: identityToken,
        email: appleUser.email,
        name: appleUser.name,
        providerUid: appleUser.appleUid,
      });

      login(user, token);

      if (isNewUser || !user.username) {
        router.replace('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e: any) {
      if (e.message !== 'The operation couldn\'t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)') {
        setError(e.message || 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.emoji}>⚔️</Text>
        <Text style={styles.title}>Sign in to Duel</Text>
        <Text style={styles.subtitle}>Choose how you want to continue</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <View style={styles.buttons}>
        {/* Google */}
        <TouchableOpacity
          style={[styles.googleBtn, loading === 'google' && styles.btnLoading]}
          onPress={handleGoogleSignIn}
          disabled={!!loading}
          activeOpacity={0.85}
        >
          {loading === 'google' ? (
            <ActivityIndicator color="#1A1A1A" />
          ) : (
            <>
              <Text style={styles.googleIcon}>🌐</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.appleBtn, loading === 'apple' && styles.btnLoading]}
            onPress={handleAppleSignIn}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === 'apple' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleText}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to our{' '}
        <Text style={styles.termsLink} onPress={handleOpenTerms}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.termsLink} onPress={handleOpenPrivacy}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },
  backBtn: { marginBottom: 40 },
  backText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  header: { alignItems: 'center', marginBottom: 48 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
  buttons: { gap: 14 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
  },
  googleIcon: { fontSize: 22 },
  googleText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#1A1A1A',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    gap: 12,
    minHeight: 60,
  },
  appleIcon: { fontSize: 22, color: '#fff' },
  appleText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#ffffff',
  },
  btnLoading: { opacity: 0.7 },
  terms: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
});
