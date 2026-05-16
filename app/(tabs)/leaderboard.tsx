// SCR-020: Leaderboard — Daily, Weekly, All-Time with Friends filter
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';

type TabKey = 'daily' | 'weekly' | 'allTime';

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'QuizMaster_IN', avatar: '🦁', score: 11800, earnings: '₹340', isFriend: false },
  { rank: 2, name: 'Arjun_K', avatar: '🐯', score: 11400, earnings: '₹240', isFriend: true },
  { rank: 3, name: 'Priya_S', avatar: '🦊', score: 10800, earnings: '₹180', isFriend: true },
  { rank: 4, name: 'NewsNerd21', avatar: '🦅', score: 10200, earnings: '₹120', isFriend: false },
  { rank: 5, name: 'RajQuiz', avatar: '🐺', score: 9800, earnings: '₹80', isFriend: false },
  { rank: 6, name: 'ScienceGuru', avatar: '🦉', score: 9600, earnings: '₹60', isFriend: true },
  { rank: 7, name: 'BollywoodBuff', avatar: '🐬', score: 9400, earnings: '₹40', isFriend: false },
  { rank: 8, name: 'CricketKing', avatar: '🦈', score: 9200, earnings: '₹30', isFriend: false },
  { rank: 9, name: 'FinanceWhiz', avatar: '🐘', score: 9000, earnings: '₹20', isFriend: true },
  { rank: 10, name: 'WorldWatcher', avatar: '🦚', score: 8800, earnings: '₹15', isFriend: false },
  { rank: 11, name: 'TechTitan', avatar: '🐲', score: 8600, earnings: '₹8', isFriend: false },
  { rank: 12, name: 'PolitiPro', avatar: '🦋', score: 8400, earnings: '₹5', isFriend: false },
];

export default function LeaderboardScreen() {
  const user = useAuthStore(s => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('daily');
  const [showFriends, setShowFriends] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>('/v1/leaderboard/daily');
        setLeaderboardData(data);
      } catch (e) {
        console.error('Failed to fetch leaderboard:', e);
        setLeaderboardData(MOCK_LEADERBOARD); // fallback
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'daily') {
      fetchLeaderboard();
    } else {
      setLeaderboardData(MOCK_LEADERBOARD);
    }
  }, [activeTab]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'This Week' },
    { key: 'allTime', label: 'All Time' },
  ];

  const filteredData = showFriends
    ? leaderboardData.filter(p => p.isFriend)
    : leaderboardData;

  const userRank = 47; // Simulated

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends filter */}
      <TouchableOpacity
        style={[styles.friendsFilter, showFriends && styles.friendsFilterActive]}
        onPress={() => setShowFriends(!showFriends)}
      >
        <Text style={[styles.friendsFilterText, showFriends && styles.friendsFilterTextActive]}>
          👥 Friends Only
        </Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top 3 Podium */}
        {!showFriends && (
          <View style={styles.podium}>
            {/* 2nd place */}
            <View style={[styles.podiumItem, styles.podiumSecond]}>
              <Text style={styles.podiumAvatar}>{filteredData[1]?.avatar}</Text>
              <Text style={styles.podiumName}>{filteredData[1]?.name}</Text>
              <Text style={styles.podiumScore}>{filteredData[1]?.score.toLocaleString()}</Text>
              <View style={[styles.podiumBar, { height: 60, backgroundColor: Colors.silver }]}>
                <Text style={styles.podiumRankText}>🥈</Text>
              </View>
            </View>
            {/* 1st place */}
            <View style={[styles.podiumItem, styles.podiumFirst]}>
              <Text style={styles.podiumCrown}>👑</Text>
              <Text style={styles.podiumAvatar}>{filteredData[0]?.avatar}</Text>
              <Text style={styles.podiumName}>{filteredData[0]?.name}</Text>
              <Text style={styles.podiumScore}>{filteredData[0]?.score.toLocaleString()}</Text>
              <View style={[styles.podiumBar, { height: 80, backgroundColor: Colors.gold }]}>
                <Text style={styles.podiumRankText}>🥇</Text>
              </View>
            </View>
            {/* 3rd place */}
            <View style={[styles.podiumItem, styles.podiumThird]}>
              <Text style={styles.podiumAvatar}>{filteredData[2]?.avatar}</Text>
              <Text style={styles.podiumName}>{filteredData[2]?.name}</Text>
              <Text style={styles.podiumScore}>{filteredData[2]?.score.toLocaleString()}</Text>
              <View style={[styles.podiumBar, { height: 40, backgroundColor: Colors.bronze }]}>
                <Text style={styles.podiumRankText}>🥉</Text>
              </View>
            </View>
          </View>
        )}

        {/* Full list */}
        {filteredData.slice(showFriends ? 0 : 3).map((player, i) => (
          <View key={player.rank} style={styles.listRow}>
            <Text style={styles.listRank}>#{player.rank}</Text>
            <Text style={styles.listAvatar}>{player.avatar}</Text>
            <View style={styles.listInfo}>
              <Text style={styles.listName}>
                {player.name}
                {player.isFriend && <Text style={styles.friendBadge}> 👥</Text>}
              </Text>
              <Text style={styles.listEarnings}>{player.earnings}</Text>
            </View>
            <Text style={styles.listScore}>{player.score.toLocaleString()}</Text>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Your rank sticky footer */}
      <View style={styles.yourRank}>
        <Text style={styles.yourRankLabel}>Your Rank</Text>
        <View style={styles.yourRankRow}>
          <Text style={styles.yourRankAvatar}>{user?.avatarEmoji || '🦁'}</Text>
          <Text style={styles.yourRankName}>{user?.username || 'You'}</Text>
          <Text style={styles.yourRankNumber}>#{userRank}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textMuted,
  },
  tabTextActive: { color: Colors.textPrimary },
  friendsFilter: {
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  friendsFilterActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  friendsFilterText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  friendsFilterTextActive: { color: Colors.primary },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginBottom: 0 },
  podiumSecond: { marginBottom: 0 },
  podiumThird: { marginBottom: 0 },
  podiumCrown: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: { fontSize: 32, marginBottom: 4 },
  podiumName: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  podiumScore: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gold,
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRankText: { fontSize: 20 },

  // List
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listRank: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textMuted,
    width: 36,
  },
  listAvatar: { fontSize: 24 },
  listInfo: { flex: 1 },
  listName: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  friendBadge: { fontSize: 12 },
  listEarnings: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success,
    marginTop: 2,
  },
  listScore: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gold,
  },

  // Your rank footer
  yourRank: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgModal, // Frosted glass footer
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28,
  },
  yourRankLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  yourRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yourRankAvatar: { fontSize: 24 },
  yourRankName: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  yourRankNumber: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
    color: Colors.primary,
  },
});
