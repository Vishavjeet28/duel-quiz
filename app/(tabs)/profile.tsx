// SCR-029 + SCR-031 + SCR-033: Profile, Settings, Referral — with real stats
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Share, Alert, Clipboard, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { getUserLevel } from '../../utils/gameLogic';
import { api } from '../../services/api';

interface UserStats {
  totalMatches: number;
  wins: number;
  winRate: number;
  accuracy: number;
  maxStreak: number;
}

interface ReferralInfo {
  referralCode: string;
  totalInvited: number;
  pointsEarned: number;
}

const DEFAULT_BADGES = [
  { id: '1', name: 'First Quiz', emoji: '🎯', earned: false },
  { id: '2', name: 'Speed Demon', emoji: '⚡', earned: false, criteria: 'Score 9000+ in a quiz' },
  { id: '3', name: 'Week Warrior', emoji: '🗓️', earned: false, criteria: '7-day streak' },
  { id: '4', name: 'Perfect Score', emoji: '💯', earned: false, criteria: 'Answer all 5 correct' },
  { id: '5', name: 'Unstoppable', emoji: '🔥', earned: false, criteria: '30-day streak' },
  { id: '6', name: 'Century Legend', emoji: '💎', earned: false, criteria: '100-day streak' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { duelPoints } = useWalletStore();

  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [badges, setBadges] = useState(DEFAULT_BADGES);
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifications, setNotifications] = useState({
    dailyQuiz: true,
    streakRisk: true,
    duelChallenge: true,
    promotional: false,
  });

  const level = getUserLevel(user?.totalPoints || 0);

  // Fetch real stats and referral info
  useEffect(() => {
    const fetchData = async () => {
      setLoadingStats(true);
      try {
        const [statsData, refData, achievementsData] = await Promise.all([
          api.get<UserStats>('/v1/users/me/stats'),
          api.get<ReferralInfo>('/v1/users/my-referrals'),
          api.get<any[]>('/v1/achievements'),
        ]);
        setStats(statsData);
        setReferralInfo(refData);
        setBadges(achievementsData.map(a => ({
          id: a.id,
          name: a.name,
          emoji: a.emoji,
          earned: a.earned,
          criteria: a.criteria,
        })));
      } catch (e) {
        // Use fallback values if API fails
        setStats({
          totalMatches: 0,
          wins: 0,
          winRate: 0,
          accuracy: 0,
          maxStreak: user?.streakCount || 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyReferral = () => {
    const code = referralInfo?.referralCode || user?.referralCode || '';
    if (code) {
      Clipboard.setString(code);
      Alert.alert('Copied!', 'Referral code copied to clipboard.');
    }
  };

  const handleShareReferral = async () => {
    const code = referralInfo?.referralCode || user?.referralCode || '';
    try {
      await Share.share({
        message: `Join me on Duel — India's #1 daily quiz challenge! Use my code ${code} and get 500 Duel Points bonus.\n\nDownload: https://duel.app/invite/${code}`,
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Call DELETE /v1/users/me API
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // SETTINGS VIEW
  // ─────────────────────────────────────────────
  if (showSettings) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>⚙️ Settings</Text>
          </View>

          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          {[
            { key: 'dailyQuiz', label: 'Daily quiz reminder', icon: '📰' },
            { key: 'streakRisk', label: 'Streak at risk alert', icon: '🔥' },
            { key: 'duelChallenge', label: 'Duel challenge received', icon: '⚔️' },
            { key: 'promotional', label: 'Promotional updates', icon: '📢' },
          ].map(item => (
            <View key={item.key} style={styles.settingRow}>
              <Text style={styles.settingIcon}>{item.icon}</Text>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Switch
                value={notifications[item.key as keyof typeof notifications]}
                onValueChange={(val) => setNotifications(n => ({ ...n, [item.key]: val }))}
                trackColor={{ false: Colors.bgCardLight, true: Colors.primary + '60' }}
                thumbColor={notifications[item.key as keyof typeof notifications] ? Colors.primary : Colors.textMuted}
              />
            </View>
          ))}

          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderColor: Colors.error + '30' }]} onPress={handleDeleteAccount}>
            <Text style={styles.menuIcon}>🗑️</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Delete Account</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Help', 'Email us at support@duel.app')}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuLabel}>Help Center & FAQ</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Report', 'Email bugs to bugs@duel.app')}>
            <Text style={styles.menuIcon}>🐛</Text>
            <Text style={styles.menuLabel}>Report a Bug</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ⚠️ Online gaming can be habit-forming. Play responsibly.{'\n'}
            Helpline: 1800-599-0019
          </Text>

          <Text style={styles.version}>Duel v1.0.0</Text>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // PROFILE VIEW
  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>👤 Profile</Text>
          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsBtn}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarEmoji}>{user?.avatarEmoji || '🦁'}</Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'Player'}</Text>
          <Text style={styles.username}>@{user?.username || 'username'}</Text>
          <View style={[styles.levelPill, { backgroundColor: level.color + '20', borderColor: level.color }]}>
            <Text style={[styles.levelTitle, { color: level.color }]}>
              Lv.{level.level} {level.title}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        {loadingStats ? (
          <View style={styles.statsLoading}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats?.totalMatches ?? 0}</Text>
              <Text style={styles.statTitle}>Matches</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats?.winRate ?? 0}%</Text>
              <Text style={styles.statTitle}>Win Rate</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats?.accuracy ?? 0}%</Text>
              <Text style={styles.statTitle}>Accuracy</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{stats?.maxStreak ?? user?.streakCount ?? 0}</Text>
              <Text style={styles.statTitle}>🔥 Streak</Text>
            </View>
          </View>
        )}

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Achievements</Text>
          <View style={styles.badgeGrid}>
            {badges.map(badge => (
              <View key={badge.id} style={[styles.badgeItem, !badge.earned && styles.badgeLocked]}>
                <Text style={[styles.badgeEmoji, !badge.earned && { opacity: 0.3 }]}>
                  {badge.emoji}
                </Text>
                <Text style={[styles.badgeName, !badge.earned && { color: Colors.textMuted }]}>
                  {badge.name}
                </Text>
                {!badge.earned && <Text style={styles.lockIcon}>🔒</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Referral Section */}
        <View style={styles.referralSection}>
          <Text style={styles.sectionTitle}>🎁 Invite & Earn</Text>
          <View style={styles.referralCard}>
            <Text style={styles.referralDesc}>
              Earn 500 Duel Points when your friend completes their first quiz!
            </Text>
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCode}>
                {referralInfo?.referralCode || user?.referralCode || '---'}
              </Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyReferral}>
                <Text style={styles.copyText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.inviteBtn} onPress={handleShareReferral}>
              <Text style={styles.inviteBtnText}>📤 Share via WhatsApp</Text>
            </TouchableOpacity>
            <View style={styles.referralStats}>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>{referralInfo?.totalInvited ?? 0}</Text>
                <Text style={styles.refStatLabel}>Invited</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>{referralInfo?.totalInvited ?? 0}</Text>
                <Text style={styles.refStatLabel}>Joined</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>{referralInfo?.pointsEarned ?? 0}</Text>
                <Text style={styles.refStatLabel}>Pts Earned</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8,
  },
  backText: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  title: { fontSize: Typography.sizes['2xl'], fontFamily: Typography.fontFamily.black, color: Colors.textPrimary },
  settingsBtn: { fontSize: 24 },

  profileCard: {
    alignItems: 'center', paddingVertical: 24, marginHorizontal: 20,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl, marginTop: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgCardLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 3, borderColor: Colors.primary,
  },
  avatarEmoji: { fontSize: 40 },
  displayName: { fontSize: Typography.sizes.xl, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  username: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, marginTop: 2 },
  levelPill: {
    marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  levelTitle: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.bold },

  statsLoading: { height: 80, justifyContent: 'center', alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 8,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: Typography.sizes.lg, fontFamily: Typography.fontFamily.black, color: Colors.textPrimary },
  statTitle: { fontSize: 9, fontFamily: Typography.fontFamily.medium, color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase' },

  section: { marginHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: Typography.sizes.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: {
    width: '30%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  badgeLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 9, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, textAlign: 'center' },
  lockIcon: { position: 'absolute', top: 4, right: 4, fontSize: 10 },

  referralSection: { marginHorizontal: 20, marginTop: 24 },
  referralCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl, padding: 20,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  referralDesc: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  referralCodeBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md, padding: 12, marginBottom: 16,
  },
  referralCode: { flex: 1, fontSize: Typography.sizes.xl, fontFamily: Typography.fontFamily.black, color: Colors.primary, letterSpacing: 3 },
  copyBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCardLight },
  copyText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  inviteBtn: {
    backgroundColor: Colors.success, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center', marginBottom: 16,
  },
  inviteBtnText: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.bold, color: Colors.textDark },
  referralStats: { flexDirection: 'row', justifyContent: 'space-around' },
  refStatItem: { alignItems: 'center' },
  refStatNum: { fontSize: Typography.sizes.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  refStatLabel: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, marginTop: 2 },

  sectionLabel: {
    fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12, marginHorizontal: 20,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 14, marginBottom: 6, gap: 12,
  },
  settingIcon: { fontSize: 18 },
  settingLabel: { flex: 1, fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 14, marginBottom: 6, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  menuArrow: { fontSize: 16, color: Colors.textMuted },
  disclaimer: {
    fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted,
    textAlign: 'center', marginTop: 24, marginHorizontal: 20, lineHeight: 18,
  },
  version: {
    fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted,
    textAlign: 'center', marginTop: 8,
  },
});
