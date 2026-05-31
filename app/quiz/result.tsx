// SCR-012 + SCR-013: Quiz Complete + Results & Rank Screen
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { useQuizStore } from '../../stores/quizStore';
import { useWalletStore } from '../../stores/walletStore';
import { useAuthStore } from '../../stores/authStore';
import { checkStreakMilestone } from '../../utils/gameLogic';

export default function QuizResultScreen() {
  const router = useRouter();
  const {
    totalScore, correctCount, avgTimeTakenMs, answers, questions,
    setResults, rank, totalPlayers, duelPointsEarned,
    resetQuiz,
  } = useQuizStore();
  const { creditDuelPoints } = useWalletStore();
  const { user, updateUser } = useAuthStore();

  const [phase, setPhase] = useState<'score' | 'rank'>('score');
  const [displayedScore, setDisplayedScore] = useState(0);
  
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const rankAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  // Rank/results are already set by completeQuiz() via the API response
  useEffect(() => {
    // If API gave us real rank, use it — otherwise calculate percentile from what we have
    const duelPts = duelPointsEarned || (correctCount * 50 + (totalScore > 8000 ? 200 : 0));

    // Credit winnings locally (backend already updated DB)
    if (duelPts > 0) creditDuelPoints(duelPts, 'Quiz completed');

    // Sync user object from backend (streak + points already updated by API)
    // We update local cache to reflect server state
    const newStreak = (user?.streakCount || 0) + 1;
    updateUser({
      streakCount: newStreak,
      lastPlayedAt: new Date().toISOString(),
      totalPoints: (user?.totalPoints || 0) + totalScore,
    });

    // Score count-up animation
    Animated.timing(scoreAnim, {
      toValue: totalScore,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const listener = scoreAnim.addListener(({ value }) => {
      setDisplayedScore(Math.round(value));
    });

    // Transition to rank after 2.5s
    const rankTimer = setTimeout(() => {
      setPhase('rank');
      Animated.spring(rankAnim, {
        toValue: 1, tension: 60, friction: 8, useNativeDriver: true,
      }).start();
      Animated.spring(badgeScale, {
        toValue: 1, tension: 100, friction: 6, useNativeDriver: true, delay: 300,
      }).start();
    }, 2500);

    return () => {
      scoreAnim.removeListener(listener);
      clearTimeout(rankTimer);
    };
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `⚔️ I scored ${totalScore.toLocaleString()} pts on Duel Quiz!\n🏆 Rank #${rank} of ${totalPlayers}\n🔥 ${correctCount}/5 correct\n\nCan you beat me? Download Duel → https://duel.app`,
      });
    } catch {}
  };

  const handleGoHome = () => {
    resetQuiz();
    router.replace('/(tabs)/home');
  };

  const percentile = rank && totalPlayers ? Math.round((1 - rank / totalPlayers) * 100) : 0;
  const streakMilestone = checkStreakMilestone(user?.streakCount || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {phase === 'score' ? (
        /* Phase 1: Score Screen */
        <View style={styles.scorePhase}>
          <Text style={styles.completeTitle}>Quiz Complete!</Text>
          
          {/* Score counter */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{displayedScore.toLocaleString()}</Text>
            <Text style={styles.scoreLabel}>POINTS</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{correctCount}/5</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(avgTimeTakenMs / 1000).toFixed(1)}s</Text>
              <Text style={styles.statLabel}>Avg Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(correctCount / 5 * 100)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.loadingRank}>
            <Text style={styles.loadingText}>🏆 Calculating your rank...</Text>
          </View>
        </View>
      ) : (
        /* Phase 2: Rank Reveal */
        <View style={styles.rankPhase}>
          {/* Rank Reveal */}
          <Animated.View style={[styles.rankContainer, {
            opacity: rankAnim,
            transform: [{ 
              translateY: rankAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }],
          }]}>
            <Text style={styles.rankLabel}>YOUR RANK</Text>
            <Text style={styles.rankNumber}>#{rank}</Text>
            <Text style={styles.rankOf}>out of {totalPlayers} players</Text>
          </Animated.View>

          {/* Percentile Badge */}
          <Animated.View style={[styles.percentileBadge, { transform: [{ scale: badgeScale }] }]}>
            <Text style={styles.percentileText}>
              {percentile >= 85 ? '🏆 Champion!' :
               percentile >= 70 ? '🌟 Top 30%!' :
               percentile >= 50 ? '💪 Top 50%!' :
               '📈 Keep improving!'}
            </Text>
            <Text style={styles.percentileValue}>Top {percentile}%</Text>
          </Animated.View>

          {/* Score summary */}
          <View style={styles.scoreSummary}>
            <Text style={styles.summaryScore}>{totalScore.toLocaleString()} pts</Text>
            <Text style={styles.summaryAccuracy}>{correctCount}/5 Correct · Avg {(avgTimeTakenMs / 1000).toFixed(1)}s</Text>
          </View>

          {/* Prize / Points earned */}
          <View style={styles.earningsCard}>

            <View style={styles.earningRow}>
              <Text style={styles.earningIcon}>⭐</Text>
              <Text style={styles.earningLabel}>Duel Points</Text>
              <Text style={styles.earningValuePts}>+{duelPointsEarned}</Text>
            </View>
            <View style={styles.earningRow}>
              <Text style={styles.earningIcon}>🔥</Text>
              <Text style={styles.earningLabel}>Streak</Text>
              <Text style={styles.earningValueStreak}>{user?.streakCount || 1} days</Text>
            </View>
          </View>

          {/* Streak Milestone */}
          {streakMilestone && (
            <View style={styles.milestoneCard}>
              <Text style={styles.milestoneEmoji}>🎉</Text>
              <Text style={styles.milestoneTitle}>{streakMilestone.label}</Text>
              <Text style={styles.milestoneReward}>+{streakMilestone.points} bonus points</Text>
              {streakMilestone.badge && <Text style={styles.milestoneBadge}>Badge: {streakMilestone.badge}</Text>}
            </View>
          )}

          {/* Question Breakdown */}
          <Text style={styles.breakdownTitle}>Question Breakdown</Text>
          {answers.map((answer, i) => (
            <View key={i} style={styles.breakdownRow}>
              <Text style={styles.breakdownQ}>Q{i + 1}</Text>
              <Text style={[styles.breakdownResult, { color: answer.isCorrect ? Colors.success : Colors.error }]}>
                {answer.isCorrect ? '✓' : '✗'}
              </Text>
              <Text style={styles.breakdownTime}>{(answer.timeTakenMs / 1000).toFixed(1)}s</Text>
              <Text style={[styles.breakdownPts, { color: answer.score.questionScore > 0 ? Colors.gold : Colors.textMuted }]}>
                +{answer.score.questionScore}
              </Text>
              {answer.score.speedMultiplier >= 1.8 && (
                <Text style={styles.breakdownSpeed}>⚡</Text>
              )}
            </View>
          ))}

          {/* CTAs */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📤 Share Score Card</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/leaderboard')}>
              <Text style={styles.secondaryBtnText}>🏆 Leaderboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/challenges')}>
              <Text style={styles.secondaryBtnText}>⚔️ Duel a Friend</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
            <Text style={styles.homeBtnText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  contentContainer: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },

  // Score Phase
  scorePhase: { alignItems: 'center' },
  completeTitle: {
    fontSize: Typography.sizes['3xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
    marginBottom: 40,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.bgCard,
    borderWidth: 3,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Shadows.glow,
  },
  scoreNumber: {
    fontSize: Typography.sizes['4xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.gold,
  },
  scoreLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  statItem: { alignItems: 'center' },
  statValue: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  loadingRank: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },

  // Rank Phase
  rankPhase: { alignItems: 'center' },
  rankContainer: { alignItems: 'center', marginBottom: 20 },
  rankLabel: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  rankNumber: {
    fontSize: Typography.sizes['5xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.gold,
    marginVertical: 4,
  },
  rankOf: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  percentileBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginBottom: 24,
  },
  percentileText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  percentileValue: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginTop: 2,
  },
  scoreSummary: { alignItems: 'center', marginBottom: 24 },
  summaryScore: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
  },
  summaryAccuracy: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  earningsCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningIcon: { fontSize: 20 },
  earningLabel: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  earningValue: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.black,
    color: Colors.success,
  },
  earningValuePts: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondary,
  },
  earningValueStreak: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.streakFire,
  },
  milestoneCard: {
    width: '100%',
    backgroundColor: Colors.gold + '15',
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.gold + '30',
  },
  milestoneEmoji: { fontSize: 32, marginBottom: 4 },
  milestoneTitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gold,
  },
  milestoneReward: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  milestoneBadge: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
    marginTop: 4,
  },
  breakdownTitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 6,
    gap: 12,
  },
  breakdownQ: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    width: 30,
  },
  breakdownResult: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    width: 24,
  },
  breakdownTime: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    flex: 1,
  },
  breakdownPts: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  breakdownSpeed: {
    fontSize: 16,
  },
  shareBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: 24,
    ...Shadows.md,
  },
  shareBtnText: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  homeBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  homeBtnText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
});
