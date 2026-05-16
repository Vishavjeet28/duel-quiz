// SCR-029 + SCR-031 + SCR-033: Profile, Settings, Referral
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { getUserLevel } from '../../utils/gameLogic';

const BADGES = [
  { id: '1', name: 'First Quiz', emoji: '🎯', earned: true },
  { id: '2', name: 'Speed Demon', emoji: '⚡', earned: true },
  { id: '3', name: 'Week Warrior', emoji: '🗓️', earned: true },
  { id: '4', name: 'Perfect Score', emoji: '💯', earned: false },
  { id: '5', name: 'Cricket Expert', emoji: '🏏', earned: false },
  { id: '6', name: 'Finance Guru', emoji: '💹', earned: false },
  { id: '7', name: 'Social Butterfly', emoji: '🦋', earned: false },
  { id: '8', name: 'Unstoppable', emoji: '🔥', earned: false },
  { id: '9', name: 'Century Legend', emoji: '💎', earned: false },
  { id: '10', name: 'Champion', emoji: '👑', earned: false },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { duelPoints } = useWalletStore();
  
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState({
    dailyQuiz: true,
    streakRisk: true,
    duelChallenge: true,
    promotional: false,
  });

  const level = getUserLevel(user?.totalPoints || 0);
  const referralCode = `DUEL${user?.username?.toUpperCase().slice(0, 4) || 'USER'}${Math.floor(Math.random() * 1000)}`;

  const handleShareReferral = async () => {
    try {
      await Share.share({
        message: `Join me on Duel — India's #1 daily quiz challenge! Use my code ${referralCode} and get 500 Duel Points bonus.\n\nDownload: https://duel.app/invite/${referralCode}`,
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  // Stats
  const stats = {
    matches: 47,
    winRate: 68,
    accuracy: 76,
    maxStreak: user?.streakCount || 12,
  };

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

          {/* Notifications */}
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

          {/* Privacy */}
          <Text style={styles.sectionLabel}>PRIVACY</Text>
          {[
            { label: 'Show profile publicly', icon: '👤' },
            { label: 'Show on leaderboard', icon: '🏆' },
            { label: 'Allow friend requests', icon: '👥' },
          ].map((item, i) => (
            <View key={i} style={styles.settingRow}>
              <Text style={styles.settingIcon}>{item.icon}</Text>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Switch
                value={true}
                trackColor={{ false: Colors.bgCardLight, true: Colors.primary + '60' }}
                thumbColor={Colors.primary}
              />
            </View>
          ))}


          {/* Account */}
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={styles.menuLabel}>Change phone number</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderColor: Colors.error + '30' }]}>
            <Text style={styles.menuIcon}>🗑️</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Delete Account</Text>
          </TouchableOpacity>

          {/* Support */}
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuLabel}>Help Center & FAQ</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🐛</Text>
            <Text style={styles.menuLabel}>Report a Bug</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuLabel}>Contact Support</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ⚠️ Online gaming can be habit-forming. Play responsibly.{'\n'}
            Helpline: 1800-599-0019
          </Text>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

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
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.matches}</Text>
            <Text style={styles.statTitle}>Matches</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.winRate}%</Text>
            <Text style={styles.statTitle}>Win Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.accuracy}%</Text>
            <Text style={styles.statTitle}>Accuracy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.maxStreak}</Text>
            <Text style={styles.statTitle}>Max Streak</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏅 Achievements</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map(badge => (
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
              <Text style={styles.referralCode}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn}>
                <Text style={styles.copyText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.inviteBtn} onPress={handleShareReferral}>
              <Text style={styles.inviteBtnText}>📤 Invite via WhatsApp</Text>
            </TouchableOpacity>
            <View style={styles.referralStats}>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>3</Text>
                <Text style={styles.refStatLabel}>Invited</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>2</Text>
                <Text style={styles.refStatLabel}>Joined</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatNum}>1000</Text>
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

  // Profile Card
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
  verifiedBadge: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.medium, color: Colors.success, marginTop: 8 },

  // Stats
  statsGrid: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 16, gap: 8,
  },
  statBox: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: Typography.sizes.lg, fontFamily: Typography.fontFamily.black, color: Colors.textPrimary },
  statTitle: { fontSize: 9, fontFamily: Typography.fontFamily.medium, color: Colors.textMuted, marginTop: 4, textTransform: 'uppercase' },

  // Section
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

  // Referral
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

  // Settings
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
});
