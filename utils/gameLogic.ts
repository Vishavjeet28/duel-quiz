// Game Logic — Scoring Algorithm, Prize Distribution, Streak System
// All formulas match PRD Section 6

export interface QuestionAnswer {
  questionId: string;
  answerChosen: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface ScoreResult {
  questionScore: number;
  basePoints: number;
  speedMultiplier: number;
  streakBonus: number;
  speedTier: string;
}

// ===== SCORING ALGORITHM (PRD 6.1) =====
export function getSpeedMultiplier(timeTakenMs: number): { multiplier: number; tier: string } {
  const seconds = timeTakenMs / 1000;
  if (seconds <= 5) return { multiplier: 2.0, tier: 'Lightning Fast ⚡' };
  if (seconds <= 10) return { multiplier: 1.8, tier: 'Super Fast 🔥' };
  if (seconds <= 20) return { multiplier: 1.5, tier: 'Fast ✨' };
  if (seconds <= 35) return { multiplier: 1.2, tier: 'Good 👍' };
  if (seconds <= 50) return { multiplier: 1.0, tier: 'Normal' };
  return { multiplier: 0.8, tier: 'Slow 🐌' };
}

export function getStreakBonus(consecutiveCorrect: number): number {
  switch (consecutiveCorrect) {
    case 0: return 1.0;
    case 1: return 1.0;
    case 2: return 1.05;
    case 3: return 1.10;
    case 4: return 1.15;
    default: return 1.20; // 5+ correct = max combo
  }
}

export function calculateQuestionScore(
  isCorrect: boolean,
  timeTakenMs: number,
  consecutiveCorrect: number
): ScoreResult {
  const basePoints = isCorrect ? 1000 : 0;
  const { multiplier: speedMultiplier, tier: speedTier } = getSpeedMultiplier(timeTakenMs);
  const streakBonus = getStreakBonus(consecutiveCorrect);

  const questionScore = Math.round(basePoints * speedMultiplier * streakBonus);

  return {
    questionScore,
    basePoints,
    speedMultiplier,
    streakBonus,
    speedTier,
  };
}

export function calculateQuizScore(answers: QuestionAnswer[]): {
  totalScore: number;
  correctCount: number;
  avgTimeTakenMs: number;
  questionScores: ScoreResult[];
} {
  let consecutiveCorrect = 0;
  let totalScore = 0;
  let correctCount = 0;
  let totalTime = 0;
  const questionScores: ScoreResult[] = [];

  for (const answer of answers) {
    if (answer.isCorrect) {
      consecutiveCorrect++;
      correctCount++;
    } else {
      consecutiveCorrect = 0;
    }
    totalTime += answer.timeTakenMs;

    const score = calculateQuestionScore(
      answer.isCorrect,
      answer.timeTakenMs,
      consecutiveCorrect
    );
    totalScore += score.questionScore;
    questionScores.push(score);
  }

  return {
    totalScore,
    correctCount,
    avgTimeTakenMs: Math.round(totalTime / answers.length),
    questionScores,
  };
}

// ===== PRIZE DISTRIBUTION (PRD 6.2) =====
export interface PrizeRange {
  rankMin: number;
  rankMax: number;
  percentOfPlayers: string;
  label: string;
  multiplier: number; // prize per ₹5 entry
}

const PRIZE_RANGES: PrizeRange[] = [
  { rankMin: 1, rankMax: 1, percentOfPlayers: '0.3%', label: 'Champion', multiplier: 1.7 },
  { rankMin: 2, rankMax: 3, percentOfPlayers: '1%', label: 'Runner-up', multiplier: 1.2 },
  { rankMin: 4, rankMax: 10, percentOfPlayers: '3%', label: 'Top 10', multiplier: 0.8 },
  { rankMin: 11, rankMax: 50, percentOfPlayers: '15%', label: 'Prize Zone', multiplier: 0.4 },
  { rankMin: 51, rankMax: 100, percentOfPlayers: '30%', label: 'Micro Prize', multiplier: 0.1 },
];

export function calculatePrize(rank: number, totalPlayers: number, entryFee: number): number {
  if (entryFee === 0) return 0;

  // Scale prize ranges based on total players
  for (const range of PRIZE_RANGES) {
    const scaledMax = Math.max(range.rankMax, Math.floor(totalPlayers * parseFloat(range.percentOfPlayers) / 100));
    if (rank >= range.rankMin && rank <= scaledMax) {
      return Math.round(entryFee * range.multiplier * 100) / 100;
    }
  }
  return 0; // Below prize threshold
}

export function calculateTotalPrizePool(totalPlayers: number, entryFee: number): number {
  return totalPlayers * entryFee * 0.85; // 85% goes to prizes, 15% platform commission
}

// ===== STREAK SYSTEM (PRD 6.3) =====
export const STREAK_MILESTONES = [
  { day: 3, points: 100, badge: null, cash: 0, label: 'Getting Started!' },
  { day: 7, points: 500, badge: 'Week Warrior 🗓️', cash: 0, label: '7-day streak!' },
  { day: 14, points: 1000, badge: 'Fortnight Fighter 💪', cash: 0, label: '2 weeks strong!' },
  { day: 30, points: 2000, badge: 'Monthly Master 🏅', cash: 0, label: 'One month! Legendary!' },
  { day: 60, points: 5000, badge: 'Unstoppable 🔥', cash: 25, label: '60 days! Incredible!' },
  { day: 100, points: 10000, badge: 'Century Legend 💎', cash: 50, label: '100 days! You are LEGEND!' },
];

export function checkStreakMilestone(streakCount: number) {
  return STREAK_MILESTONES.find(m => m.day === streakCount) || null;
}

// ===== 1v1 DUEL RESOLUTION (PRD 6.5) =====
export function resolveDuel(
  player1: { score: number; correctCount: number; avgTimeTakenMs: number },
  player2: { score: number; correctCount: number; avgTimeTakenMs: number }
): 'player1' | 'player2' | 'tie' {
  // Primary: Higher total score
  if (player1.score > player2.score) return 'player1';
  if (player2.score > player1.score) return 'player2';

  // Tiebreaker 1: Higher accuracy
  if (player1.correctCount > player2.correctCount) return 'player1';
  if (player2.correctCount > player1.correctCount) return 'player2';

  // Tiebreaker 2: Lower avg response time
  if (player1.avgTimeTakenMs < player2.avgTimeTakenMs) return 'player1';
  if (player2.avgTimeTakenMs < player1.avgTimeTakenMs) return 'player2';

  // Perfect tie
  return 'tie';
}

// ===== LEVEL SYSTEM (PRD 11.2) =====
export function getUserLevel(totalPoints: number): { level: number; title: string; color: string; nextLevel: number | null } {
  const levels = [
    { level: 6, title: 'Legend', minPoints: 500000, color: '#FF6B35' },
    { level: 5, title: 'Champion', minPoints: 200000, color: '#6C5CE7' },
    { level: 4, title: 'Expert', minPoints: 75000, color: '#FFD700' },
    { level: 3, title: 'Competitor', minPoints: 25000, color: '#C0C0C0' },
    { level: 2, title: 'Challenger', minPoints: 5000, color: '#CD7F32' },
    { level: 1, title: 'Rookie', minPoints: 0, color: '#8B8FA3' },
  ];

  for (const l of levels) {
    if (totalPoints >= l.minPoints) {
      const nextIdx = levels.indexOf(l) - 1;
      return {
        ...l,
        nextLevel: nextIdx >= 0 ? levels[nextIdx].minPoints : null,
      };
    }
  }
  return { level: 1, title: 'Rookie', color: '#8B8FA3', nextLevel: 5000 };
}
