// Duel App — Design System
// Dark navy premium theme with vibrant accent colors

export const Colors = {
  // Primary brand (Navy Blue)
  navy: '#0B162C', // Deep Navy
  navyLight: '#152238', // Card Navy
  navyMedium: '#1A2B4C', // Border Navy
  
  // Accent colors
  primary: '#00D2FF',       // Neon Cyan
  primaryLight: '#33DBFF',
  primaryDark: '#00A3CC',
  
  secondary: '#FFD700',     // Premium Gold
  secondaryDark: '#CCAC00',
  
  // Game colors
  gold: '#FFD700',
  silver: '#E0E0E0',
  bronze: '#CD7F32',
  
  // Status
  success: '#00E676',
  error: '#FF3D00',
  warning: '#FFD700',
  info: '#00D2FF',
  
  // Streak
  streakFire: '#FF3D00',
  streakFireLight: '#FF8A65',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5', // Clean blue-grey
  textMuted: '#78909C',
  textDark: '#0B162C', // For text on bright primary buttons
  
  // Backgrounds
  bgPrimary: '#0B162C',
  bgSecondary: '#152238',
  bgCard: '#152238',
  bgCardLight: '#1A2B4C',
  bgInput: '#152238',
  bgModal: 'rgba(11, 22, 44, 0.95)',
  
  // Borders
  border: '#1A2B4C', // Navy borders
  borderLight: '#263A60',
  
  // Gradients (start, end)
  gradientPurple: ['#8B5CF6', '#A78BFA'],
  gradientCyan: ['#00D2FF', '#0077FF'],
  gradientGold: ['#FFD700', '#FFA000'],
  gradientFire: ['#FF3D00', '#FF8A65'],
  gradientDark: ['#152238', '#0B162C'],
  gradientCard: ['#1A2B4C', '#152238'],
  
  // Category colors
  categories: {
    cricket: '#00E676',
    politics: '#FF3D00',
    finance: '#FFD700',
    science: '#00D2FF',
    bollywood: '#8B5CF6',
    world: '#A78BFA',
    mixed: '#FFA000',
  } as Record<string, string>,

  // Transparent
  overlay: 'rgba(0,0,0,0.8)',
  glass: 'rgba(255,255,255,0.05)',
  glassLight: 'rgba(255,255,255,0.1)',
};

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
    black: 'Inter_900Black',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    hero: 56,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#00D2FF', // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#FFD700', // Gold shadow for larger elements
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#00D2FF', // Vibrant cyan glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};

// Day-of-week category mapping
export const DAILY_CATEGORIES: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Politics & Governance', icon: '🏛️', color: Colors.categories.politics },
  2: { name: 'Cricket & Sports', icon: '🏏', color: Colors.categories.cricket },
  3: { name: 'Finance & Markets', icon: '💹', color: Colors.categories.finance },
  4: { name: 'Science & Tech', icon: '🔬', color: Colors.categories.science },
  5: { name: 'Bollywood & Culture', icon: '🎬', color: Colors.categories.bollywood },
  6: { name: 'World Affairs', icon: '🌍', color: Colors.categories.world },
  0: { name: 'Mega Mix', icon: '🎯', color: Colors.categories.mixed },
};



export const LEVEL_SYSTEM = [
  { level: 1, title: 'Rookie', minPoints: 0, color: '#8B8FA3' },
  { level: 2, title: 'Challenger', minPoints: 5000, color: '#CD7F32' },
  { level: 3, title: 'Competitor', minPoints: 25000, color: '#C0C0C0' },
  { level: 4, title: 'Expert', minPoints: 75000, color: '#FFD700' },
  { level: 5, title: 'Champion', minPoints: 200000, color: '#6C5CE7' },
  { level: 6, title: 'Legend', minPoints: 500000, color: '#FF6B35' },
];

export const AVATARS = [
  '🦁', '🐯', '🦊', '🐺', '🦅', '🐲',
  '🦈', '🐘', '🦉', '🐬', '🦚', '🦋',
];
