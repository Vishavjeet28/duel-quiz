// SCR-002: Welcome Screen — Landing page with Google & Apple Sign-In
import { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(logoAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

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

  return (
    <View style={styles.container}>
      {/* Animated background orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Logo area */}
      <Animated.View style={[styles.logoArea, {
        opacity: fadeAnim,
        transform: [{ scale: logoAnim }],
      }]}>
        <Text style={styles.logoEmoji}>⚔️</Text>
        <Text style={styles.logoText}>DUEL</Text>
        <Text style={styles.tagline}>Knowledge is Power. Speed is Money.</Text>
      </Animated.View>

      {/* Feature highlights */}
      <Animated.View style={[styles.features, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        {[
          { icon: '🏆', text: 'Compete in daily quizzes' },
          { icon: '⚡', text: 'Speed-based scoring system' },
          { icon: '🔥', text: 'Build streaks & earn rewards' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Auth buttons */}
      <Animated.View style={[styles.authButtons, {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }]}>
        {/* Google Sign-In */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => router.push('/(auth)/social-login' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.googleBtnIcon}>🌐</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Apple Sign-In — iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleBtn}
            onPress={() => router.push('/(auth)/social-login' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.appleBtnIcon}></Text>
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}
        {/* Terms and Privacy policy statement */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink} onPress={handleOpenTerms}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={handleOpenPrivacy}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  orb1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary,
    opacity: 0.07,
    top: -60,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.secondary,
    opacity: 0.06,
    bottom: 100,
    left: -60,
  },

  logoArea: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoEmoji: { fontSize: 72, marginBottom: 12 },
  logoText: {
    fontSize: 56,
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
    marginTop: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  features: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: { fontSize: 22 },
  featureText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },

  authButtons: {
    gap: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleBtnIcon: { fontSize: 20 },
  googleBtnText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#1A1A1A',
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    gap: 10,
  },
  appleBtnIcon: { fontSize: 20, color: '#fff' },
  appleBtnText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#ffffff',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.medium,
  },
  phoneBtn: {
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneBtnText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
  },
  terms: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  termsLink: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
});
