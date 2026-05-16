// Wallet Store — Virtual Duel Points Management
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export interface Transaction {
  id: string;
  type: 'points_earned' | 'points_spent';
  amount: number;
  balanceAfter: number;
  status: 'pending' | 'success' | 'failed';
  description: string;
  createdAt: string;
}

interface WalletState {
  duelPoints: number;
  transactions: Transaction[];

  // Actions
  setDuelPoints: (amount: number) => void;
  creditDuelPoints: (points: number, description?: string) => void;
  deductDuelPoints: (points: number, description?: string) => boolean;
  addTransaction: (tx: Transaction) => void;
  loadWallet: () => Promise<void>;
  saveWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  duelPoints: 500, // Starting balance
  transactions: [],

  setDuelPoints: (amount) => set({ duelPoints: amount }),

  creditDuelPoints: (points, description = 'Earned Duel Points') => {
    const state = get();
    const newBalance = state.duelPoints + points;
    const tx: Transaction = {
      id: `tx_pts_${Date.now()}`,
      type: 'points_earned',
      amount: points,
      balanceAfter: newBalance,
      status: 'success',
      description,
      createdAt: new Date().toISOString(),
    };
    set({
      duelPoints: newBalance,
      transactions: [tx, ...state.transactions],
    });
    get().saveWallet();
  },

  deductDuelPoints: (points, description = 'Spent Duel Points') => {
    const state = get();
    if (state.duelPoints < points) return false;

    const newBalance = state.duelPoints - points;
    const tx: Transaction = {
      id: `tx_pts_${Date.now()}`,
      type: 'points_spent',
      amount: -points,
      balanceAfter: newBalance,
      status: 'success',
      description,
      createdAt: new Date().toISOString(),
    };

    set({
      duelPoints: newBalance,
      transactions: [tx, ...state.transactions],
    });
    get().saveWallet();
    return true;
  },

  addTransaction: (tx) => {
    set(state => ({ transactions: [tx, ...state.transactions] }));
  },

  loadWallet: async () => {
    try {
      const data = await api.get<any>('/v1/wallet/balance');
      if (data) {
        set({ duelPoints: data.duelPoints || 0 });
      }
    } catch {
      // Fallback to local storage if network fails
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const data = await AsyncStorage.getItem('wallet_points');
        if (data) {
          const parsed = JSON.parse(data);
          set(parsed);
        }
      } catch {}
    }
  },

  saveWallet: async () => {
    const { duelPoints, transactions } = get();
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('wallet_points', JSON.stringify({
        duelPoints,
        transactions: transactions.slice(0, 100), // Keep last 100
      }));
    } catch {}
  },
}));
