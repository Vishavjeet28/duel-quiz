// SCR-015: Duel Mode Home — Challenges tab
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

const MOCK_PENDING = [
  { id: '1', challenger: 'Arjun_K', avatar: '🐯', category: 'Cricket', fee: 20, expiresIn: '18h' },
  { id: '2', challenger: 'Priya_S', avatar: '🦊', category: 'Finance', fee: 10, expiresIn: '6h' },
];

const MOCK_HISTORY = [
  { id: '1', opponent: 'Arjun_K', avatar: '🐯', result: 'won', amount: 17, date: '2 hours ago', category: 'Cricket' },
  { id: '2', opponent: 'Ravi_M', avatar: '🦁', result: 'lost', amount: -10, date: 'Yesterday', category: 'Politics' },
  { id: '3', opponent: 'Priya_S', avatar: '🦊', result: 'won', amount: 8.5, date: '2 days ago', category: 'Science' },
  { id: '4', opponent: 'NewsNerd', avatar: '🦅', result: 'lost', amount: -20, date: '3 days ago', category: 'Finance' },
];

const CATEGORIES = ['Any', 'Cricket', 'Politics', 'Finance', 'Science', 'Bollywood'];
const DUEL_FEES = [10, 20, 50];

export default function ChallengesScreen() {
  const user = useAuthStore(s => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Any');
  const [selectedFee, setSelectedFee] = useState(20);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const showComingSoonAlert = () => {
    Alert.alert(
      '⚔️ 1v1 Duel Arena',
      'This feature is coming soon in the next update! Play the Daily Tournament in the meantime to boost your rank.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleAccept = (id: string) => {
    showComingSoonAlert();
  };

  const handleDecline = (id: string) => {
    showComingSoonAlert();
  };

  const wins = MOCK_HISTORY.filter(d => d.result === 'won').length;
  const losses = MOCK_HISTORY.filter(d => d.result === 'lost').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>⚔️ Duel Arena</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wins}</Text>
            <Text style={[styles.statLabel, { color: Colors.success }]}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{losses}</Text>
            <Text style={[styles.statLabel, { color: Colors.error }]}>Losses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0}%</Text>
            <Text style={[styles.statLabel, { color: Colors.primary }]}>Win Rate</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.challengeBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.challengeBtnIcon}>🎯</Text>
            <Text style={styles.challengeBtnText}>Challenge a Friend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.randomBtn} onPress={showComingSoonAlert}>
            <Text style={styles.randomBtnIcon}>🎲</Text>
            <Text style={styles.randomBtnText}>Random</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending ({MOCK_PENDING.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'pending' ? (
          MOCK_PENDING.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚔️</Text>
              <Text style={styles.emptyText}>No pending challenges</Text>
              <Text style={styles.emptySubtext}>Challenge a friend to start a duel!</Text>
            </View>
          ) : (
            MOCK_PENDING.map(challenge => (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeAvatar}>{challenge.avatar}</Text>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeName}>{challenge.challenger}</Text>
                    <Text style={styles.challengeMeta}>
                      {challenge.category} · ₹{challenge.fee} · Expires in {challenge.expiresIn}
                    </Text>
                  </View>
                </View>
                <View style={styles.challengeActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(challenge.id)}
                  >
                    <Text style={styles.acceptText}>Accept & Play</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDecline(challenge.id)}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          MOCK_HISTORY.map(duel => (
            <View key={duel.id} style={styles.historyRow}>
              <Text style={styles.historyAvatar}>{duel.avatar}</Text>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>vs {duel.opponent}</Text>
                <Text style={styles.historyMeta}>{duel.category} · {duel.date}</Text>
              </View>
              <View style={styles.historyResult}>
                <Text style={[styles.historyResultText, {
                  color: duel.result === 'won' ? Colors.success : Colors.error,
                }]}>
                  {duel.result === 'won' ? 'WON' : 'LOST'}
                </Text>
                <Text style={[styles.historyAmount, {
                  color: duel.amount > 0 ? Colors.success : Colors.error,
                }]}>
                  {duel.amount > 0 ? '+' : ''}₹{Math.abs(duel.amount)}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Duel Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Duel Challenge</Text>

            <Text style={styles.fieldLabel}>Search Opponent</Text>
            <TextInput
              style={styles.searchInput}
              value={opponentSearch}
              onChangeText={setOpponentSearch}
              placeholder="Search by username..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.catChipText, selectedCategory === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Entry Fee</Text>
            <View style={styles.feeRow}>
              {DUEL_FEES.map(fee => (
                <TouchableOpacity
                  key={fee}
                  style={[styles.feeChip, selectedFee === fee && styles.feeChipActive]}
                  onPress={() => setSelectedFee(fee)}
                >
                  <Text style={[styles.feeText, selectedFee === fee && styles.feeTextActive]}>
                    ₹{fee}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.stakesInfo}>
              <Text style={styles.stakesText}>
                Winner gets ₹{Math.round(selectedFee * 2 * 0.85)} (₹{selectedFee * 2} pool - 15% fee)
              </Text>
            </View>

            <TouchableOpacity style={styles.sendBtn} onPress={() => { setShowCreate(false); showComingSoonAlert(); }}>
              <Text style={styles.sendBtnText}>Send Challenge ⚔️</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontFamily: Typography.fontFamily.black,
    color: Colors.textPrimary,
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  statValue: { fontSize: Typography.sizes.xl, fontFamily: Typography.fontFamily.black, color: Colors.textPrimary },
  statLabel: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.semiBold, marginTop: 4 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 16 },
  challengeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: BorderRadius.lg, gap: 8,
  },
  challengeBtnIcon: { fontSize: 18 },
  challengeBtnText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  randomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCard, paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  randomBtnIcon: { fontSize: 18 },
  randomBtnText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 24,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textMuted },
  tabTextActive: { color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  emptySubtext: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, marginTop: 4 },
  challengeCard: {
    marginHorizontal: 20, marginTop: 12, backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg, padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  challengeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  challengeAvatar: { fontSize: 36 },
  challengeInfo: { flex: 1 },
  challengeName: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  challengeMeta: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, marginTop: 4 },
  challengeActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: Colors.success, paddingVertical: 12, borderRadius: BorderRadius.md, alignItems: 'center' },
  acceptText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.bold, color: Colors.textDark },
  declineBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCardLight },
  declineText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textMuted },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 8,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 12, gap: 12,
  },
  historyAvatar: { fontSize: 28 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  historyMeta: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.regular, color: Colors.textMuted, marginTop: 2 },
  historyResult: { alignItems: 'flex-end' },
  historyResultText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.black },
  historyAmount: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.bold, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: Typography.sizes.xl, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 20 },
  fieldLabel: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.semiBold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  searchInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md, padding: 14,
    color: Colors.textPrimary, fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.medium,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  catChipText: { fontSize: Typography.sizes.xs, fontFamily: Typography.fontFamily.medium, color: Colors.textMuted },
  catChipTextActive: { color: Colors.primary },
  feeRow: { flexDirection: 'row', gap: 12 },
  feeChip: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border },
  feeChipActive: { borderColor: Colors.gold, backgroundColor: Colors.gold + '15' },
  feeText: { fontSize: Typography.sizes.lg, fontFamily: Typography.fontFamily.bold, color: Colors.textMuted },
  feeTextActive: { color: Colors.gold },
  stakesInfo: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 12, marginTop: 16, alignItems: 'center' },
  stakesText: { fontSize: Typography.sizes.sm, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  sendBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: 20 },
  sendBtnText: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  cancelText: { fontSize: Typography.sizes.base, fontFamily: Typography.fontFamily.medium, color: Colors.textMuted },
});
