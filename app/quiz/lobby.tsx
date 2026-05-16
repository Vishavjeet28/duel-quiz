// SCR-009: Quiz Lobby — Loading screen with tips
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, DAILY_CATEGORIES } from '../../constants/theme';
import { useQuizStore } from '../../stores/quizStore';
import { useWalletStore } from '../../stores/walletStore';
import { api } from '../../services/api';

const TIPS = [
  '⚡ Tip: Speed matters! Faster correct answers score higher.',
  '🎯 Tip: 5 consecutive correct answers give 1.2× combo bonus.',
  '🔥 Tip: Your streak is your most valuable asset. Don\'t break it!',
  '💡 Tip: Even partial knowledge helps — eliminate wrong options first.',
  '🏆 Tip: Top 30% of players win bonus Duel Points!',
];

export default function QuizLobbyScreen() {
  const router = useRouter();
  const { startQuiz } = useQuizStore();
  const [currentTip, setCurrentTip] = useState(0);
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const dayOfWeek = new Date().getDay();
  const category = DAILY_CATEGORIES[dayOfWeek] || DAILY_CATEGORIES[0];

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Dot bounce animation
    dotAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, { toValue: -10, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    });

    // Cycle tips
    const tipInterval = setInterval(() => {
      setCurrentTip(t => (t + 1) % TIPS.length);
    }, 2500);

    const fetchQuestions = async () => {
      try {
        const data = await api.get<{ questions: any[], category: string, totalPlayers: number }>('/v1/quiz/today');
        
        // Wait at least 2.5s for the animation effect
        setTimeout(() => {
          startQuiz(data.questions);
          router.replace('/quiz/play');
        }, 2500);
      } catch (e) {
        console.error("Failed to fetch questions", e);
        // Fallback for demo purposes if backend fails, wait 2.5s then go back
        setTimeout(() => router.back(), 2500);
      }
    };

    fetchQuestions();

    return () => {
      clearInterval(tipInterval);
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Category Animation */}
      <Animated.View style={[styles.iconContainer, { transform: [{ rotate: spin }] }]}>
        <View style={styles.iconInner}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
        </View>
      </Animated.View>

      <Text style={styles.loadingText}>Loading today's questions...</Text>

      {/* Bouncing dots */}
      <View style={styles.dotsContainer}>
        {dotAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: anim }] }]}
          />
        ))}
      </View>

      {/* Entry info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{category.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Players</Text>
          <Text style={styles.infoValue}>👥 312 in this round</Text>
        </View>
      </View>

      {/* Rotating tip */}
      <Text style={styles.tipText}>{TIPS[currentTip]}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: { fontSize: 48 },
  loadingText: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
