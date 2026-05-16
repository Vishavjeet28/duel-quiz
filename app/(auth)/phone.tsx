// SCR-003: Phone Number Entry
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { api } from '../../services/api';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  const handleLogin = async () => {
    if (!isValid) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    
    try {
      // Direct login bypassing OTP screen
      const response = await api.post<{ user: any, token: string, isNewUser: boolean }>('/v1/auth/verify-otp', { phone, otp: '123456' });
      
      const { useAuthStore } = require('../../stores/authStore');
      const { login } = useAuthStore.getState();
      login(response.user, response.token);
      
      if (response.isNewUser || !response.user.username) {
        router.push('/(auth)/profile-setup');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to login. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <View style={styles.prefix}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, '')); setError(''); }}
            placeholder="Phone number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.privacy}>🔒 We never share your number with anyone</Text>

        <TouchableOpacity
          style={[styles.ctaBtn, !isValid && styles.ctaBtnDisabled]}
          onPress={handleLogin}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms & Conditions</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backBtn: {
    marginBottom: 32,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  prefixText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 2,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 8,
  },
  privacy: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 16,
    textAlign: 'center',
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: 32,
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.bgCardLight,
    opacity: 0.5,
  },
  ctaText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
  },
  terms: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
  },
});
