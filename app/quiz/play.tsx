// SCR-010 + SCR-011: Question Screen + Answer Reveal — Core quiz gameplay
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, BorderRadius } from '../../constants/theme';
import { useQuizStore } from '../../stores/quizStore';

const { width } = Dimensions.get('window');
const QUESTION_TIME = 60; // seconds per question
const REVEAL_TIME = 2500; // ms to show answer

export default function QuizPlayScreen() {
  const router = useRouter();
  const {
    questions, currentQuestionIndex, answers,
    answerQuestion, skipQuestion, nextQuestion, completeQuiz,
    totalScore,
  } = useQuizStore();

  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealData, setRevealData] = useState<{
    isCorrect: boolean; correctOption: string; explanation: string;
    pointsEarned: number; speedTier: string;
  } | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const startTimeRef = useRef(Date.now());
  const timerAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scorePopAnim = useRef(new Animated.Value(0)).current;

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Start timer for each question
  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeLeft(QUESTION_TIME);
    setSelectedAnswer(null);
    setIsRevealing(false);
    setRevealData(null);

    // Animate timer bar
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: QUESTION_TIME * 1000,
      useNativeDriver: false,
    }).start();

    // Countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up — skip
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  const handleTimeUp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isRevealing || selectedAnswer) return;
    
    skipQuestion();
    showReveal(false, question.correctOption, question.explanation, 0, 'Time\'s Up ⏰');
  }, [isRevealing, selectedAnswer, question]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer || isRevealing) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTakenMs = Date.now() - startTimeRef.current;
    const isCorrect = option === question.correctOption;
    
    setSelectedAnswer(option);
    answerQuestion(option, timeTakenMs, isCorrect, question.correctOption, question.explanation);

    // Get the score from the last answer
    const lastAnswer = useQuizStore.getState().answers[useQuizStore.getState().answers.length - 1];
    showReveal(
      isCorrect,
      question.correctOption,
      question.explanation,
      lastAnswer?.score.questionScore || 0,
      lastAnswer?.score.speedTier || '',
    );
  };

  const showReveal = (isCorrect: boolean, correctOption: string, explanation: string, points: number, speedTier: string) => {
    setIsRevealing(true);
    setRevealData({ isCorrect, correctOption, explanation, pointsEarned: points, speedTier });

    // Score pop animation
    Animated.sequence([
      Animated.timing(scorePopAnim, { toValue: 1.3, duration: 300, useNativeDriver: true }),
      Animated.timing(scorePopAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Wrong answer shake
    if (!isCorrect) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    // Auto advance after reveal
    setTimeout(async () => {
      if (isLastQuestion) {
        await completeQuiz();
        router.replace('/quiz/result');
      } else {
        nextQuestion();
      }
    }, REVEAL_TIME);
  };

  const handleSkip = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    skipQuestion();
    
    if (isLastQuestion) {
      await completeQuiz();
      router.replace('/quiz/result');
    } else {
      nextQuestion();
    }
  };

  const getOptionStyle = (option: string) => {
    if (!isRevealing) {
      if (selectedAnswer === option) return styles.optionSelected;
      return styles.option;
    }
    if (option === revealData?.correctOption) return styles.optionCorrect;
    if (selectedAnswer === option && !revealData?.isCorrect) return styles.optionWrong;
    return styles.option;
  };

  const getOptionTextStyle = (option: string) => {
    if (!isRevealing) {
      if (selectedAnswer === option) return styles.optionTextSelected;
      return styles.optionText;
    }
    if (option === revealData?.correctOption) return styles.optionTextCorrect;
    if (selectedAnswer === option && !revealData?.isCorrect) return styles.optionTextWrong;
    return styles.optionTextDimmed;
  };

  const timerColor = timeLeft <= 15 ? Colors.error : timeLeft <= 30 ? Colors.warning : Colors.primary;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      {/* Header: Progress + Score */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Q{currentQuestionIndex + 1}/{questions.length}</Text>
          <View style={styles.progressBar}>
            {questions.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < currentQuestionIndex && (answers[i]?.isCorrect ? styles.progressCorrect : styles.progressWrong),
                  i === currentQuestionIndex && styles.progressCurrent,
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{totalScore.toLocaleString()}</Text>
        </View>
      </View>

      {/* Timer Bar */}
      <View style={styles.timerBarContainer}>
        <Animated.View
          style={[
            styles.timerBar,
            {
              width: timerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: timerColor,
            },
          ]}
        />
      </View>

      {/* Timer Circle */}
      <View style={[styles.timerCircle, { borderColor: timerColor }]}>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
      </View>

      {/* Category Tag */}
      <View style={styles.categoryTag}>
        <Text style={styles.categoryText}>
          {question.difficulty.toUpperCase()} · {question.category.toUpperCase()}
        </Text>
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* Answer Options */}
      <View style={styles.optionsContainer}>
        {(['A', 'B', 'C', 'D'] as const).map(opt => {
          const optionText = opt === 'A' ? question.optionA :
                           opt === 'B' ? question.optionB :
                           opt === 'C' ? question.optionC : question.optionD;
          return (
            <TouchableOpacity
              key={opt}
              style={getOptionStyle(opt)}
              onPress={() => handleAnswer(opt)}
              disabled={!!selectedAnswer || isRevealing}
              activeOpacity={0.7}
            >
              <View style={styles.optionLetter}>
                <Text style={styles.optionLetterText}>{opt}</Text>
              </View>
              <Text style={getOptionTextStyle(opt)}>{optionText}</Text>
              {isRevealing && opt === revealData?.correctOption && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
              {isRevealing && selectedAnswer === opt && !revealData?.isCorrect && (
                <Text style={styles.crossIcon}>✗</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Answer Reveal Overlay */}
      {isRevealing && revealData && (
        <View style={styles.revealOverlay}>
          <Animated.View style={[styles.revealContent, { transform: [{ scale: scorePopAnim }] }]}>
            <Text style={styles.revealIcon}>
              {revealData.isCorrect ? '✅' : '❌'}
            </Text>
            <Text style={[styles.revealPoints, { color: revealData.isCorrect ? Colors.success : Colors.error }]}>
              {revealData.isCorrect ? `+${revealData.pointsEarned} pts` : '+0 pts'}
            </Text>
            {revealData.isCorrect && revealData.speedTier && (
              <Text style={styles.revealSpeed}>{revealData.speedTier}</Text>
            )}
          </Animated.View>
          <Text style={styles.revealExplanation}>{revealData.explanation}</Text>
        </View>
      )}

      {/* Skip Button */}
      {!selectedAnswer && !isRevealing && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 20,
    paddingTop: 56,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContainer: { flex: 1 },
  progressText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bgCardLight,
  },
  progressCorrect: { backgroundColor: Colors.success },
  progressWrong: { backgroundColor: Colors.error },
  progressCurrent: { backgroundColor: Colors.primary },
  scoreContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  scoreLabel: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
  },
  scoreValue: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
    color: Colors.gold,
  },

  // Timer
  timerBarContainer: {
    height: 4,
    backgroundColor: Colors.bgCardLight,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 2,
  },
  timerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
  },

  // Category
  categoryTag: {
    alignSelf: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Question
  questionText: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
    minHeight: 60,
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgCardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textSecondary,
  },
  optionText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  optionTextSelected: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  optionTextCorrect: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.success,
  },
  optionTextWrong: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.error,
  },
  optionTextDimmed: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
  checkIcon: {
    fontSize: 20,
    color: Colors.success,
    fontWeight: 'bold',
  },
  crossIcon: {
    fontSize: 20,
    color: Colors.error,
    fontWeight: 'bold',
  },

  // Reveal
  revealOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  revealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  revealIcon: { fontSize: 28 },
  revealPoints: {
    fontSize: Typography.sizes.xl,
    fontFamily: Typography.fontFamily.black,
  },
  revealSpeed: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.secondary,
    backgroundColor: Colors.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  revealExplanation: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textMuted,
  },
});
