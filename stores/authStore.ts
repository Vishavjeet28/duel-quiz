// Auth Store — Firebase-backed authentication + session state
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  uid: string;           // Firebase UID (Google/Apple sub)
  email: string | null;
  username: string;
  displayName: string;
  avatarEmoji: string;
  language: string;
  isPro: boolean;
  proExpiresAt: string | null;
  streakCount: number;
  lastPlayedAt: string | null;
  totalPoints: number;
  referralCode: string;  // Stable, stored in DB
  quizStats: {
    totalMatches: number;
    wins: number;
    accuracy: number;
    maxStreak: number;
  };
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setOnboarded: (val: boolean) => void;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,

  setUser: (user) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },

  setToken: (token) => {
    set({ token, isAuthenticated: true });
    AsyncStorage.setItem('token', token);
  },

  login: (user, token) => {
    set({ user, token, isAuthenticated: true, isOnboarded: true });
    AsyncStorage.setItem('user', JSON.stringify(user));
    AsyncStorage.setItem('token', token);
    AsyncStorage.setItem('isOnboarded', 'true');
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, isOnboarded: false });
    AsyncStorage.multiRemove(['user', 'token', 'isOnboarded', 'hasPlayedDate']);
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updates };
      set({ user: updated });
      AsyncStorage.setItem('user', JSON.stringify(updated));
    }
  },

  setOnboarded: (val) => {
    set({ isOnboarded: val });
    AsyncStorage.setItem('isOnboarded', String(val));
  },

  loadFromStorage: async () => {
    try {
      const [userStr, token, onboarded] = await AsyncStorage.multiGet([
        'user', 'token', 'isOnboarded',
      ]);
      const user = userStr[1] ? JSON.parse(userStr[1]) : null;
      set({
        user,
        token: token[1],
        isAuthenticated: !!(user && token[1]),
        isLoading: false,
        isOnboarded: onboarded[1] === 'true',
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
