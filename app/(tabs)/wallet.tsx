// SCR-024: Rewards Home — Duel Points & Transactions
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { useWalletStore } from '../../stores/walletStore';

export default function RewardsScreen() {
  const { duelPoints, transactions } = useWalletStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'spent'>('all');

  const filteredTx = transactions.filter(tx => {
    if (activeFilter === 'earned') return tx.amount > 0;
    if (activeFilter === 'spent') return tx.amount < 0;
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>⭐ My Rewards</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceCards}>
          <View style={[styles.balanceCard, styles.pointsCard]}>
            <Text style={styles.balanceLabel}>Total Duel Points</Text>
            <Text style={styles.balanceAmount}>{duelPoints.toLocaleString()}</Text>
            <Text style={styles.balanceSub}>Redeem for prizes soon!</Text>
          </View>
        </View>

        {/* Action Buttons Placeholder (for future store) */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.storeBtn}>
            <Text style={styles.storeBtnIcon}>🛍️</Text>
            <Text style={styles.storeBtnText}>Rewards Store (Coming Soon)</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.txSection}>
          <Text style={styles.sectionTitle}>Points History</Text>
          
          <View style={styles.filterRow}>
            {(['all', 'earned', 'spent'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTx.length === 0 ? (
            <View style={styles.emptyTx}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No points history yet</Text>
            </View>
          ) : (
            filteredTx.slice(0, 20).map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? Colors.success + '15' : Colors.error + '15' }]}>
                  <Text style={styles.txIconText}>⭐</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.error }]}>
                  {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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

  // Balance Cards
  balanceCards: { paddingHorizontal: 20, marginTop: 16 },
  balanceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    ...Shadows.md,
  },
  pointsCard: {},
  balanceLabel: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: Typography.sizes.hero,
    fontFamily: Typography.fontFamily.black,
    color: Colors.gold,
    marginVertical: 8,
  },
  balanceSub: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.success,
  },

  // Actions
  actions: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCardLight,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  storeBtnIcon: { fontSize: 18 },
  storeBtnText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },

  // Transactions
  txSection: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
  },
  filterChipActive: { backgroundColor: Colors.primary + '20' },
  filterText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  filterTextActive: { color: Colors.primary },
  emptyTx: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txDesc: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  txDate: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.bold,
  },
});
