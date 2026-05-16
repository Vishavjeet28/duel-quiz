// Quiz Store — Manages quiz game state
import { create } from 'zustand';
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
  
  // Today's quiz
  hasPlayedToday: boolean;
  todayCategory: string;
  
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

    // Update question with correct answer for display
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
          timeTakenMs: a.timeTakenMs
        })),
        entryTier: 'free'
      };
      
      const result = await api.post<any>('/v1/quiz/submit', payload);
      
      set({
        isQuizActive: false,
        isQuizComplete: true,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
        rank: result.rank,
        totalPlayers: result.totalPlayers,
        duelPointsEarned: result.duelPoints,
        hasPlayedToday: true,
      });
    } catch (e) {
      console.error("Failed to submit quiz", e);
      // Fallback in case of network error, calculate locally
      const { calculateQuizScore } = require('../utils/gameLogic');
      const quizResult = calculateQuizScore(state.answers.map(a => ({
        questionId: a.questionId,
        answerChosen: a.answerChosen,
        isCorrect: a.isCorrect,
        timeTakenMs: a.timeTakenMs,
      })));

      set({
        isQuizActive: false,
        isQuizComplete: true,
        totalScore: quizResult.totalScore,
        correctCount: quizResult.correctCount,
        avgTimeTakenMs: quizResult.avgTimeTakenMs,
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
}));
