// Duel Backend — Production-Ready Express API Server
// Features: Firebase Auth, real JWTs, rate limiting, streak logic, real stats
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =====================================================================
// ENV VALIDATION
// =====================================================================
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set!');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '30d';

// =====================================================================
// FIREBASE ADMIN SETUP
// Verifies Google/Apple ID tokens from the mobile app
// =====================================================================
let firebaseAdmin = null;
try {
  const admin = require('firebase-admin');
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️  Firebase Admin env vars not set — social login will use bypass mode');
  }
} catch (e) {
  console.warn('⚠️  Firebase Admin not available:', e.message);
}

// =====================================================================
// APP SETUP
// =====================================================================
const app = express();

// CORS — restrict to your domains in production
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://duel.app']
    : '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.static('public'));

// =====================================================================
// RATE LIMITING
// =====================================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests. Please slow down.' },
});

app.use('/v1/auth', authLimiter);
app.use('/v1/', apiLimiter);

// =====================================================================
// SEED DATA
// =====================================================================
const CATEGORIES = ['cricket', 'politics', 'finance', 'science', 'bollywood', 'world'];
const DAY_CATEGORY = { 1: 'politics', 2: 'cricket', 3: 'finance', 4: 'science', 5: 'bollywood', 6: 'world', 0: 'mixed' };
const QUESTIONS_SEED = require('./data/questions');

async function seedDatabase() {
  const count = await prisma.question.count();
  if (count < QUESTIONS_SEED.length) {
    console.log('Seeding database with new questions...');
    for (const q of QUESTIONS_SEED) {
      const exists = await prisma.question.findFirst({ where: { questionText: q.questionText } });
      if (!exists) {
        await prisma.question.create({ data: q });
      }
    }
    console.log('Database seeding complete.');
  }
}
seedDatabase().catch(e => console.error('Database seeding failed', e));

// =====================================================================
// SCORING ALGORITHM
// =====================================================================
function getSpeedMultiplier(ms) {
  const s = ms / 1000;
  if (s <= 5) return 2.0;
  if (s <= 10) return 1.8;
  if (s <= 20) return 1.5;
  if (s <= 35) return 1.2;
  if (s <= 50) return 1.0;
  return 0.8;
}

function getStreakBonus(consecutive) {
  if (consecutive <= 1) return 1.0;
  if (consecutive === 2) return 1.05;
  if (consecutive === 3) return 1.10;
  if (consecutive === 4) return 1.15;
  return 1.20;
}

// Helper: get today start (midnight local) in UTC
function getTodayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// Helper: did user play today?
function isPlayedToday(lastPlayedAt) {
  if (!lastPlayedAt) return false;
  const today = getTodayStart();
  const played = new Date(lastPlayedAt);
  played.setHours(0, 0, 0, 0);
  return played.getTime() === today.getTime();
}

// Helper: was user's last play yesterday? (for streak continuity)
function isPlayedYesterday(lastPlayedAt) {
  if (!lastPlayedAt) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const played = new Date(lastPlayedAt);
  played.setHours(0, 0, 0, 0);
  return played.getTime() === yesterday.getTime();
}

// =====================================================================
// JWT HELPERS
// =====================================================================
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// =====================================================================
// AUTH MIDDLEWARE
// =====================================================================
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const { userId } = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// =====================================================================
// SOCIAL LOGIN — Google & Apple via Firebase ID Token verification
// POST /v1/auth/social-login
// Body: { provider: 'google'|'apple', idToken, email, name, providerUid }
// =====================================================================
app.post('/v1/auth/social-login', async (req, res) => {
  const { provider, idToken, email, name, providerUid } = req.body;

  if (!provider || !idToken || !providerUid) {
    return res.status(400).json({ error: 'provider, idToken, and providerUid are required' });
  }

  try {
    let verifiedUid = providerUid; // Default — will be overridden by Firebase verification

    if (!firebaseAdmin) {
      if (process.env.NODE_ENV === 'production') {
        console.error('Production Error: Firebase Admin is not initialized. Rejecting social login bypass.');
        return res.status(500).json({ error: 'Authentication service is not properly configured.' });
      }
      console.warn('⚠️  Bypassing token verification (development mode only)');
    } else {
      try {
        const { getAuth } = require('firebase-admin/auth');
        const decodedToken = await getAuth().verifyIdToken(idToken);
        verifiedUid = decodedToken.uid;
      } catch (verifyErr) {
        console.error('Firebase token verification failed:', verifyErr.message);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    }

    // Find or create user by their stable Firebase UID (stored in `uid` field)
    let user = await prisma.user.findFirst({ where: { uid: verifiedUid } });
    const isNewUser = !user;

    if (!user) {
      // Generate a unique username and stable referral code
      const baseUsername = (name || email || 'player')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10) || 'player';

      let username = `${baseUsername}_${Math.floor(Math.random() * 9999)}`;
      // Ensure unique
      let usernameExists = await prisma.user.findUnique({ where: { username } });
      while (usernameExists) {
        username = `${baseUsername}_${Math.floor(Math.random() * 99999)}`;
        usernameExists = await prisma.user.findUnique({ where: { username } });
      }

      const referralCode = `DUEL${username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`;

      user = await prisma.user.create({
        data: {
          uid: verifiedUid,
          email: email || null,
          displayName: name || '',
          username,
          avatarEmoji: '🦁',
          referralCode,
          wallets: { create: { duelPoints: 500 } }, // New user bonus
        },
      });
    }

    const token = signToken(user.id);

    res.json({ user, token, isNewUser });
  } catch (error) {
    console.error('social-login error:', error);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

// =====================================================================
// USER ROUTES
// =====================================================================
app.get('/v1/users/me', authMiddleware, async (req, res) => {
  try {
    // Return user with wallet
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { wallets: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/v1/users/me', authMiddleware, async (req, res) => {
  const updates = { ...req.body };
  // Guard: disallow sensitive fields from direct update
  delete updates.id;
  delete updates.uid;
  delete updates.token;
  delete updates.streakCount;
  delete updates.totalPoints;
  delete updates.referralCode;

  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: updates });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/users/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /v1/users/me/stats — real quiz stats
app.get('/v1/users/me/stats', authMiddleware, async (req, res) => {
  try {
    const sessions = await prisma.quizSession.findMany({
      where: { userId: req.user.id },
      select: {
        totalScore: true,
        correctCount: true,
        totalPlayers: true,
        rank: true,
        createdAt: true,
      },
    });

    const totalMatches = sessions.length;
    const wins = sessions.filter(s => s.rank > 0 && s.rank <= Math.ceil(s.totalPlayers * 0.3)).length;
    const totalCorrect = sessions.reduce((acc, s) => acc + s.correctCount, 0);
    const totalQuestions = totalMatches * 5;
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    res.json({
      totalMatches,
      wins,
      winRate,
      accuracy,
      maxStreak: req.user.streakCount,
    });
  } catch (error) {
    console.error('stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// QUIZ ROUTES
// =====================================================================
app.get('/v1/quiz/today', authMiddleware, async (req, res) => {
  const day = new Date().getDay();
  const category = DAY_CATEGORY[day] || 'mixed';

  try {
    // Get real player count for today
    const today = getTodayStart();
    const totalPlayers = await prisma.quizSession.count({
      where: { createdAt: { gte: today } },
    });

    // Fetch questions — shuffled by picking a random offset
    const questionCount = await prisma.question.count({
      where: category === 'mixed' ? { isApproved: true } : { category, isApproved: true },
    });

    const skip = questionCount > 5
      ? Math.floor(Math.random() * (questionCount - 5))
      : 0;

    const questions = await prisma.question.findMany({
      where: category === 'mixed' ? { isApproved: true } : { category, isApproved: true },
      take: 5,
      skip,
    });

    // Shuffle the selected questions
    const shuffled = questions.sort(() => Math.random() - 0.5);

    const selected = shuffled.map(q => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
      category: q.category,
    }));

    res.json({
      category,
      questions: selected,
      totalPlayers: Math.max(totalPlayers, 1), // at least 1
    });
  } catch (error) {
    console.error('quiz/today error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/v1/quiz/submit', authMiddleware, async (req, res) => {
  const { answers, entryTier } = req.body;

  // Guard: prevent double submission today
  if (isPlayedToday(req.user.lastPlayedAt)) {
    return res.status(409).json({ error: 'You have already played today. Come back tomorrow!' });
  }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'No answers provided' });
  }

  let totalScore = 0;
  let correctCount = 0;
  let consecutiveCorrect = 0;

  try {
    const scored = [];
    for (const a of answers) {
      const q = await prisma.question.findUnique({
        where: { id: a.questionId },
        select: { correctOption: true, explanation: true },
      });
      const isCorrect = q && a.answer === q.correctOption;
      if (isCorrect) { consecutiveCorrect++; correctCount++; } else consecutiveCorrect = 0;

      const base = isCorrect ? 1000 : 0;
      const speed = getSpeedMultiplier(a.timeTakenMs);
      const streak = getStreakBonus(consecutiveCorrect);
      const score = Math.round(base * speed * streak);
      totalScore += score;
      scored.push({
        ...a,
        isCorrect,
        score,
        correctOption: q?.correctOption,
        explanation: q?.explanation,
        speedMultiplier: speed,
        streakBonus: streak,
      });
    }

    // Get real total players for today
    const today = getTodayStart();
    const totalPlayers = (await prisma.quizSession.count({ where: { createdAt: { gte: today } } })) + 1;

    // Calculate rank based on real scores
    const higherScores = await prisma.quizSession.count({
      where: { createdAt: { gte: today }, totalScore: { gt: totalScore } },
    });
    const rank = higherScores + 1;
    const duelPoints = correctCount * 50 + (totalScore > 8000 ? 200 : 0);

    // Create quiz session
    await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        totalScore,
        rank,
        totalPlayers,
        correctCount,
        duelPoints,
      },
    });

    // Update streak logic
    const lastPlayed = req.user.lastPlayedAt;
    let newStreak = 1;
    if (isPlayedYesterday(lastPlayed)) {
      newStreak = req.user.streakCount + 1; // Continue streak
    } else if (!isPlayedToday(lastPlayed)) {
      newStreak = 1; // Streak broken — reset
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        streakCount: newStreak,
        totalPoints: { increment: totalScore },
        lastPlayedAt: new Date(),
      },
    });

    // Update wallet
    await prisma.wallet.upsert({
      where: { userId: req.user.id },
      update: { duelPoints: { increment: duelPoints } },
      create: { userId: req.user.id, duelPoints },
    });

    res.json({ totalScore, correctCount, rank, totalPlayers, duelPoints, streakCount: newStreak, answers: scored });
  } catch (error) {
    console.error('quiz/submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// =====================================================================
// WALLET ROUTES
// =====================================================================
app.get('/v1/wallet/balance', authMiddleware, async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user.id, duelPoints: 500 } });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// LEADERBOARD
// =====================================================================
app.get('/v1/leaderboard/daily', async (req, res) => {
  const today = getTodayStart();
  try {
    // Best score per user today
    const sessions = await prisma.quizSession.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { totalScore: 'desc' },
      take: 50,
      include: { user: { select: { username: true, avatarEmoji: true, displayName: true } } },
      distinct: ['userId'],
    });

    const board = sessions.map((s, i) => ({
      rank: i + 1,
      username: s.user?.username || 'Player',
      displayName: s.user?.displayName || s.user?.username || 'Player',
      avatar: s.user?.avatarEmoji || '🦁',
      score: s.totalScore,
      correctCount: s.correctCount,
    }));

    res.json(board);
  } catch (error) {
    console.error('leaderboard error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// User's own rank today
app.get('/v1/leaderboard/my-rank', authMiddleware, async (req, res) => {
  const today = getTodayStart();
  try {
    const mySession = await prisma.quizSession.findFirst({
      where: { userId: req.user.id, createdAt: { gte: today } },
      orderBy: { totalScore: 'desc' },
    });

    if (!mySession) {
      return res.json({ rank: null, score: 0, hasPlayed: false });
    }

    const higherCount = await prisma.quizSession.count({
      where: { createdAt: { gte: today }, totalScore: { gt: mySession.totalScore } },
    });

    const totalPlayers = await prisma.quizSession.count({ where: { createdAt: { gte: today } } });

    res.json({
      rank: higherCount + 1,
      score: mySession.totalScore,
      totalPlayers,
      hasPlayed: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// DUEL ROUTES (Backend framework — UI coming soon)
// =====================================================================
app.post('/v1/duels/create', authMiddleware, async (req, res) => {
  const { opponentId, category } = req.body;
  if (!opponentId || !category) {
    return res.status(400).json({ error: 'opponentId and category are required' });
  }
  try {
    const duel = await prisma.duel.create({
      data: {
        initiatorId: req.user.id,
        opponentId,
        category,
        expiresAt: new Date(Date.now() + 86400000), // 24h
      },
    });
    res.json(duel);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/duels/pending', authMiddleware, async (req, res) => {
  try {
    const duels = await prisma.duel.findMany({
      where: {
        opponentId: req.user.id,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });
    res.json(duels);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/duels/history', authMiddleware, async (req, res) => {
  try {
    const duels = await prisma.duel.findMany({
      where: {
        OR: [{ initiatorId: req.user.id }, { opponentId: req.user.id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(duels);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// REFERRAL
// =====================================================================
app.get('/v1/users/my-referrals', authMiddleware, async (req, res) => {
  try {
    const referrals = await prisma.user.findMany({
      where: { referredBy: req.user.referralCode },
      select: { id: true, createdAt: true },
    });
    res.json({
      referralCode: req.user.referralCode,
      totalInvited: referrals.length,
      pointsEarned: referrals.length * 500,
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// ACHIEVEMENTS (real logic based on sessions)
// =====================================================================
app.get('/v1/achievements', authMiddleware, async (req, res) => {
  try {
    const today = getTodayStart();
    const [sessionCount, perfectSessions, speedSessions] = await Promise.all([
      prisma.quizSession.count({ where: { userId: req.user.id } }),
      prisma.quizSession.count({ where: { userId: req.user.id, correctCount: 5 } }),
      prisma.quizSession.count({ where: { userId: req.user.id, totalScore: { gte: 9000 } } }),
    ]);

    const streak = req.user.streakCount;

    res.json([
      { id: '1', name: 'First Quiz', emoji: '🎯', earned: sessionCount >= 1, criteria: 'Complete your first quiz' },
      { id: '2', name: 'Speed Demon', emoji: '⚡', earned: speedSessions >= 1, criteria: 'Score 9000+ in a quiz' },
      { id: '3', name: 'Week Warrior', emoji: '🗓️', earned: streak >= 7, criteria: '7-day streak' },
      { id: '4', name: 'Perfect Score', emoji: '💯', earned: perfectSessions >= 1, criteria: 'Answer all 5 correct' },
      { id: '5', name: 'Unstoppable', emoji: '🔥', earned: streak >= 30, criteria: '30-day streak' },
      { id: '6', name: 'Century Legend', emoji: '💎', earned: streak >= 100, criteria: '100-day streak' },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// =====================================================================
// FRIENDS (stub — future feature)
// =====================================================================
app.get('/v1/friends', authMiddleware, (req, res) => res.json([]));

// =====================================================================
// HEALTH CHECK
// =====================================================================
app.get('/health', (req, res) =>
  res.json({ status: 'ok', version: '2.0.0', uptime: process.uptime() })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Duel API v2 running on http://localhost:${PORT}`));
