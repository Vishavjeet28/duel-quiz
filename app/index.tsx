// Index — Splash screen (SCR-001)
// Checks auth token and routes accordingly
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { Colors, Typography } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isOnboarded } = useAuthStore();
  
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    });

    // Navigate after 1.5s
    const timer = setTimeout(() => {
      if (isAuthenticated && isOnboarded) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isOnboarded]);

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <View style={styles.glowCircle} />
      
      <Animated.View style={[styles.logoContainer, {
        transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
        opacity: logoOpacity,
      }]}>
        <Text style={styles.logoEmoji}>⚔️</Text>
        <Text style={styles.logoText}>DUEL</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Knowledge is Power. Speed is Money.
      </Animated.Text>

      <View style={styles.loadingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>

      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  logoText: {
    fontSize: Typography.sizes.hero,
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  tagline: {
    marginTop: 16,
    fontSize: Typography.sizes.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  dot1: { opacity: 0.3 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 1 },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.regular,
  },
});
