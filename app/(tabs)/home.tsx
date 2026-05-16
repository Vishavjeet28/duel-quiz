// SCR-007: Home Screen & Dashboard — Main command center
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius, Shadows, DAILY_CATEGORIES } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useQuizStore } from '../../stores/quizStore';
import { useWalletStore } from '../../stores/walletStore';
import { getUserLevel } from '../../utils/gameLogic';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { hasPlayedToday, todayCategory, setTodayCategory, startQuiz } = useQuizStore();
  const { duelPoints } = useWalletStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const dayOfWeek = new Date().getDay();
  const category = DAILY_CATEGORIES[dayOfWeek];

  // Countdown to midnight
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    setTodayCategory(category?.name || 'Mixed');
    
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${mins}m`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for PLAY NOW button
  useEffect(() => {
    if (!hasPlayedToday) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [hasPlayedToday]);

  const handlePlayNow = () => {
    // startQuiz will be properly handled in play.tsx, here we just navigate
    router.push('/quiz/lobby');
  };

  const level = getUserLevel(user?.totalPoints || 0);
  const streakCount = user?.streakCount || 0;

  // Mock leaderboard data
  const topPlayers = [
    { rank: 1, name: 'Arjun_K', score: 11400, avatar: '🦁' },
    { rank: 2, name: 'Priya_S', score: 10800, avatar: '🦊' },
    { rank: 3, name: 'Ravi_M', score: 10200, avatar: '🐯' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/(tabs)/profile')}>
          <Text style={styles.avatarText}>{user?.avatarEmoji || '🦁'}</Text>
          <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
            <Text style={styles.levelText}>{level.level}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.logoText}>⚔️ DUEL</Text>

        <View style={styles.topRight}>
          <TouchableOpacity style={styles.walletBadge} onPress={() => router.push('/(tabs)/wallet')}>
            <Text style={styles.walletIcon}>⭐</Text>
            <Text style={styles.walletAmount}>{duelPoints}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bellBtn}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section — Today's Quiz */}
      <View style={styles.heroSection}>
        <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[styles.categoryName, { color: category.color }]}>{category.name}</Text>
        </View>

        <Text style={styles.heroTitle}>TODAY'S QUIZ</Text>
        <Text style={styles.heroSubtitle}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOfWeek]} Edition
        </Text>

        <View style={styles.tierSelector}>
          {/* Tiers removed for free-to-play mode */}
        </View>

        {/* PLAY NOW Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.playBtn, hasPlayedToday && styles.playBtnPlayed]}
            onPress={handlePlayNow}
            activeOpacity={0.8}
          >
            <Text style={styles.playBtnText}>
              {hasPlayedToday ? '✅ PLAYED TODAY' : '▶  PLAY NOW'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>🕐 Closes in {timeLeft}</Text>
          <Text style={styles.metaText}>👥 312 players</Text>
        </View>
      </View>

      {/* Streak Widget */}
      <View style={styles.streakWidget}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakFireIcon}>🔥</Text>
          <Text style={styles.streakCount}>{streakCount}-day streak</Text>
        </View>
        <View style={styles.streakCalendar}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.streakDay}>
              <Text style={styles.streakDayLabel}>{day}</Text>
              <View style={[
                styles.streakDot,
                i < (streakCount % 7) ? styles.streakDotFilled : styles.streakDotEmpty,
                i === dayOfWeek - 1 && !hasPlayedToday && styles.streakDotAtRisk,
              ]} />
            </View>
          ))}
        </View>
        {!hasPlayedToday && streakCount > 0 && (
          <Text style={styles.streakWarning}>⚠️ Play today to protect your streak!</Text>
        )}
      </View>

      {/* Game Mode Cards */}
      <Text style={styles.sectionTitle}>Game Modes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll} contentContainerStyle={styles.modeScrollContent}>
        <TouchableOpacity style={[styles.modeCard, { borderColor: Colors.primary }]} onPress={handlePlayNow}>
          <Text style={styles.modeEmoji}>📰</Text>
          <Text style={styles.modeTitle}>Daily Tournament</Text>
          <Text style={styles.modeDesc}>Prize pool growing</Text>
          <Text style={styles.modeMeta}>👥 312 players</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.modeCard, { borderColor: Colors.secondary }]} onPress={() => router.push('/(tabs)/challenges')}>
          <Text style={styles.modeEmoji}>⚔️</Text>
          <Text style={styles.modeTitle}>1v1 Duel</Text>
          <Text style={styles.modeDesc}>Challenge a friend</Text>
          <Text style={styles.modeMeta}>or random opponent</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modeCard, { borderColor: Colors.success }]} onPress={handlePlayNow}>
          <Text style={styles.modeEmoji}>🎯</Text>
          <Text style={styles.modeTitle}>Practice Mode</Text>
          <Text style={styles.modeDesc}>Always free</Text>
          <Text style={styles.modeMeta}>Improve your skills</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.modeCard, { borderColor: Colors.gold }]}>
          <Text style={styles.modeEmoji}>👑</Text>
          <Text style={styles.modeTitle}>Weekly Grand</Text>
          <Text style={styles.modeDesc}>Mega prize pool</Text>
          <Text style={styles.modeMeta}>⏱️ Starts Saturday</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Leaderboard Preview */}
      <View style={styles.leaderboardPreview}>
        <View style={styles.lbHeader}>
          <Text style={styles.sectionTitle}>Today's Leaders</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        {topPlayers.map(player => (
          <View key={player.rank} style={styles.lbRow}>
            <Text style={styles.lbRank}>
              {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}
            </Text>
            <Text style={styles.lbAvatar}>{player.avatar}</Text>
            <Text style={styles.lbName}>{player.name}</Text>
            <Text style={styles.lbScore}>{player.score.toLocaleString()} pts</Text>
          </View>
        ))}
      </View>

      {/* Referral Banner */}
      <TouchableOpacity style={styles.referralBanner}>
        <Text style={styles.referralEmoji}>🎁</Text>
        <View style={styles.referralContent}>
          <Text style={styles.referralTitle}>Invite Friends, Earn 500 Points</Text>
          <Text style={styles.referralDesc}>Share your code and earn Duel Points when they play</Text>
        </View>
        <Text style={styles.referralArrow}>→</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22 },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff',
  },
  logoText: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  walletIcon: { fontSize: 14 },
  walletAmount: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gold,
  },
  bellBtn: { position: 'relative' },
  bellIcon: { fontSize: 22 },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },

  // Hero Section
  heroSection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: 16,
  },
  categoryIcon: { fontSize: 16 },
  categoryName: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  heroTitle: {
    fontSize: Typography.sizes['3xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  // Entry Fee Tiers
  tierSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tierChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tierChipActive: {
    backgroundColor: Colors.bgCardLight,
  },
  tierLabel: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
  },

  // Play Button
  playBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.glow,
  },
  playBtnPlayed: {
    backgroundColor: Colors.success + '30',
    shadowOpacity: 0,
  },
  playBtnText: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
    color: Colors.textDark, // Dark text on Gold button
    letterSpacing: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },

  // Streak
  streakWidget: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  streakFireIcon: { fontSize: 24 },
  streakCount: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.streakFire,
  },
  streakCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakDay: { alignItems: 'center', gap: 6 },
  streakDayLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  streakDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  streakDotFilled: {
    backgroundColor: Colors.streakFire,
  },
  streakDotEmpty: {
    backgroundColor: Colors.bgCardLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  streakDotAtRisk: {
    borderColor: Colors.secondary, // Cyan warning
    borderWidth: 2,
  },
  streakWarning: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: 12,
  },

  // Game Mode Cards
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  modeScroll: { marginBottom: 8 },
  modeScrollContent: { paddingHorizontal: 20, gap: 12 },
  modeCard: {
    width: 150,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeEmoji: { fontSize: 32, marginBottom: 8 },
  modeTitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modeDesc: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modeMeta: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },

  // Leaderboard Preview
  leaderboardPreview: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  lbHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  lbRank: { fontSize: 20 },
  lbAvatar: { fontSize: 24 },
  lbName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  lbScore: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gold,
  },

  // Referral Banner
  referralBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 12,
  },
  referralEmoji: { fontSize: 32 },
  referralContent: { flex: 1 },
  referralTitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  referralDesc: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  referralArrow: {
    fontSize: 20,
    color: Colors.primary,
  },
});
