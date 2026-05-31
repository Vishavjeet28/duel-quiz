// Quiz Store — Manages quiz game state with proper persistence
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateQuestionScore, calculateQuizScore, type QuestionAnswer, type ScoreResult } from '../utils/gameLogic';
import { api } from '../services/api';

export interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string; // only populated after answering
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  sourceUrl?: string;
}

export interface QuizAnswer {
  questionId: string;
  answerChosen: string;
  isCorrect: boolean;
  timeTakenMs: number;
  score: ScoreResult;
}

interface QuizState {
  // Quiz state
  questions: Question[];
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  isQuizActive: boolean;
  isQuizComplete: boolean;

  // Timer
  timeRemaining: number;
  timerStartedAt: number | null;

  // Results
  totalScore: number;
  correctCount: number;
  avgTimeTakenMs: number;
  rank: number | null;
  totalPlayers: number;
  duelPointsEarned: number;

  // Today's quiz — persisted by date
  hasPlayedToday: boolean;
  todayCategory: string;
  todayRealPlayerCount: number;

  // Actions
  startQuiz: (questions: Question[]) => void;
  answerQuestion: (answerChosen: string, timeTakenMs: number, isCorrect: boolean, correctOption: string, explanation: string) => void;
  skipQuestion: () => void;
  nextQuestion: () => void;
  completeQuiz: () => void;
  setResults: (rank: number, totalPlayers: number, duelPoints: number) => void;
  resetQuiz: () => void;
  setHasPlayedToday: (val: boolean) => void;
  setTodayCategory: (cat: string) => void;
  setRealPlayerCount: (count: number) => void;
  checkAndLoadPlayedToday: () => Promise<void>;
}

// Returns today's date string YYYY-MM-DD in local time
function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  isQuizActive: false,
  isQuizComplete: false,
  timeRemaining: 60,
  timerStartedAt: null,
  totalScore: 0,
  correctCount: 0,
  avgTimeTakenMs: 0,
  rank: null,
  totalPlayers: 0,
  duelPointsEarned: 0,
  hasPlayedToday: false,
  todayCategory: '',
  todayRealPlayerCount: 0,

  startQuiz: (questions) => set({
    questions,
    currentQuestionIndex: 0,
    answers: [],
    isQuizActive: true,
    isQuizComplete: false,
    timeRemaining: 60,
    timerStartedAt: Date.now(),
    totalScore: 0,
    correctCount: 0,
    avgTimeTakenMs: 0,
    rank: null,
    duelPointsEarned: 0,
  }),

  answerQuestion: (answerChosen, timeTakenMs, isCorrect, correctOption, explanation) => {
    const state = get();
    const question = state.questions[state.currentQuestionIndex];

    // Calculate consecutive correct for streak bonus
    let consecutiveCorrect = 0;
    if (isCorrect) {
      consecutiveCorrect = 1;
      for (let i = state.answers.length - 1; i >= 0; i--) {
        if (state.answers[i].isCorrect) consecutiveCorrect++;
        else break;
      }
    }

    const score = calculateQuestionScore(isCorrect, timeTakenMs, consecutiveCorrect);

    const answer: QuizAnswer = {
      questionId: question.id,
      answerChosen,
      isCorrect,
      timeTakenMs,
      score,
    };

    // Update question with correct answer and explanation for display
    const updatedQuestions = [...state.questions];
    updatedQuestions[state.currentQuestionIndex] = {
      ...question,
      correctOption,
      explanation,
    };

    set({
      answers: [...state.answers, answer],
      questions: updatedQuestions,
      totalScore: state.totalScore + score.questionScore,
      correctCount: state.correctCount + (isCorrect ? 1 : 0),
    });
  },

  skipQuestion: () => {
    const state = get();
    const question = state.questions[state.currentQuestionIndex];
    const score = calculateQuestionScore(false, 60000, 0);

    set({
      answers: [...state.answers, {
        questionId: question.id,
        answerChosen: '',
        isCorrect: false,
        timeTakenMs: 60000,
        score,
      }],
    });
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentQuestionIndex < state.questions.length - 1) {
      set({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        timeRemaining: 60,
        timerStartedAt: Date.now(),
      });
    } else {
      get().completeQuiz();
    }
  },

  completeQuiz: async () => {
    const state = get();

    try {
      const payload = {
        answers: state.answers.map(a => ({
          questionId: a.questionId,
          answer: a.answerChosen,
          timeTakenMs: a.timeTakenMs,
        })),
        entryTier: 'free',
      };

      const result = await api.post<any>('/v1/quiz/submit', payload);

      // Calculate avg time
      const totalTime = state.answers.reduce((s, a) => s + a.timeTakenMs, 0);
      const avgTimeTakenMs = state.answers.length > 0 ? Math.round(totalTime / state.answers.length) : 0;

      // Persist played today with date key so it resets at midnight
      await AsyncStorage.setItem('hasPlayedDate', getTodayKey());

      set({
        isQuizActive: false,
        isQuizComplete: true,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
        avgTimeTakenMs,
        rank: result.rank,
        totalPlayers: result.totalPlayers,
        duelPointsEarned: result.duelPoints,
        hasPlayedToday: true,
      });
    } catch (e) {
      console.error('Failed to submit quiz:', e);
      // Fallback: calculate locally
      const quizResult = calculateQuizScore(state.answers.map(a => ({
        questionId: a.questionId,
        answerChosen: a.answerChosen,
        isCorrect: a.isCorrect,
        timeTakenMs: a.timeTakenMs,
      })));

      await AsyncStorage.setItem('hasPlayedDate', getTodayKey());

      set({
        isQuizActive: false,
        isQuizComplete: true,
        totalScore: quizResult.totalScore,
        correctCount: quizResult.correctCount,
        avgTimeTakenMs: quizResult.avgTimeTakenMs,
        rank: null,
        totalPlayers: 0,
        duelPointsEarned: quizResult.correctCount * 50,
        hasPlayedToday: true,
      });
    }
  },

  setResults: (rank, totalPlayers, duelPoints) => set({
    rank,
    totalPlayers,
    duelPointsEarned: duelPoints,
  }),

  resetQuiz: () => set({
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    isQuizActive: false,
    isQuizComplete: false,
    timeRemaining: 60,
    timerStartedAt: null,
    totalScore: 0,
    correctCount: 0,
    avgTimeTakenMs: 0,
    rank: null,
    totalPlayers: 0,
    duelPointsEarned: 0,
  }),

  setHasPlayedToday: (val) => set({ hasPlayedToday: val }),
  setTodayCategory: (cat) => set({ todayCategory: cat }),
  setRealPlayerCount: (count) => set({ todayRealPlayerCount: count }),

  // Call this on app load — checks AsyncStorage to see if user already played today
  checkAndLoadPlayedToday: async () => {
    try {
      const storedDate = await AsyncStorage.getItem('hasPlayedDate');
      const todayKey = getTodayKey();
      set({ hasPlayedToday: storedDate === todayKey });
    } catch {
      set({ hasPlayedToday: false });
    }
  },
}));
