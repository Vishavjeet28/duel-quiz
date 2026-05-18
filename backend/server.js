// Duel Backend — Express API Server
// Implements all endpoints with Prisma (PostgreSQL)
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set!");
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Seed question bank
const CATEGORIES = ['cricket', 'politics', 'finance', 'science', 'bollywood', 'world'];
const DAY_CATEGORY = { 1: 'politics', 2: 'cricket', 3: 'finance', 4: 'science', 5: 'bollywood', 6: 'world', 0: 'mixed' };

const QUESTIONS_SEED = require('./data/questions');


async function seedDatabase() {
  const count = await prisma.question.count();
  if (count < QUESTIONS_SEED.length) {
    console.log('Seeding database with new questions...');
    for (const q of QUESTIONS_SEED) {
      const exists = await prisma.question.findFirst({
        where: { questionText: q.questionText }
      });
      if (!exists) {
        await prisma.question.create({ data: q });
      }
    }
    console.log('Database seeding complete.');
  }
}

// Automatically seed on startup
seedDatabase().catch(e => console.error("Database seeding failed", e));

// ===== SCORING ALGORITHM (PRD 6.1) =====
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

// ===== MIDDLEWARE =====
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ===== AUTH ROUTES =====
app.post('/v1/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10) return res.status(400).json({ error: 'Invalid phone number' });
  res.json({ success: true, message: 'OTP sent (dev: use 123456)' });
});

app.post('/v1/auth/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp !== '123456' && otp?.length !== 6) return res.status(400).json({ error: 'Invalid OTP' });
  
  try {
    let user = await prisma.user.findUnique({ where: { phone } });
    const token = `jwt_${uuidv4()}`;
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          username: `user_${Math.floor(Math.random() * 1000000)}`,
          displayName: '',
          avatarEmoji: '🦁',
          token,
          wallets: {
            create: { duelPoints: 0 }
          }
        }
      });
      return res.json({ user, token, isNewUser: true });
    }
    
    user = await prisma.user.update({
      where: { id: user.id },
      data: { token }
    });
    
    res.json({ user, token, isNewUser: false });
  } catch (error) {
    console.error("verify-otp error", error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== USER ROUTES =====
app.get('/v1/users/me', authMiddleware, (req, res) => res.json(req.user));
app.patch('/v1/users/me', authMiddleware, async (req, res) => {
  const updates = req.body;
  try {
    // Exclude fields that shouldn't be updated directly
    delete updates.id;
    delete updates.token;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});
app.get('/v1/users/check-username', async (req, res) => {
  const { username } = req.query;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    res.json({ available: !user });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== QUIZ ROUTES =====
app.get('/v1/quiz/today', authMiddleware, async (req, res) => {
  const day = new Date().getDay();
  const category = DAY_CATEGORY[day] || 'mixed';
  
  try {
    const questions = await prisma.question.findMany({
      where: category === 'mixed' ? { isApproved: true } : { category, isApproved: true },
      take: 5
    });
    
    const selected = questions.map(q => ({
      id: q.id, questionText: q.questionText,
      optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
      difficulty: q.difficulty, category: q.category,
    }));
    
    res.json({ category, questions: selected, totalPlayers: Math.floor(Math.random() * 300) + 100 });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/v1/quiz/submit', authMiddleware, async (req, res) => {
  const { answers, entryTier } = req.body;
  let totalScore = 0, correctCount = 0, consecutiveCorrect = 0;
  
  try {
    const scored = [];
    for (const a of answers) {
      const q = await prisma.question.findUnique({ where: { id: a.questionId } });
      const isCorrect = q && a.answer === q.correctOption;
      if (isCorrect) { consecutiveCorrect++; correctCount++; } else consecutiveCorrect = 0;
      const base = isCorrect ? 1000 : 0;
      const speed = getSpeedMultiplier(a.timeTakenMs);
      const streak = getStreakBonus(consecutiveCorrect);
      const score = Math.round(base * speed * streak);
      totalScore += score;
      scored.push({ ...a, isCorrect, score, speedMultiplier: speed, streakBonus: streak });
    }

    const totalPlayers = Math.floor(Math.random() * 300) + 100;
    const rank = Math.max(1, Math.floor(totalPlayers * (1 - totalScore / 12000)));
    const duelPoints = correctCount * 50 + (totalScore > 8000 ? 200 : 0);

    const session = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        totalScore,
        rank,
        totalPlayers,
        correctCount,
        duelPoints
      }
    });

    // Update streak and wallet
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        streakCount: { increment: 1 },
        totalPoints: { increment: totalScore }
      }
    });
    
    await prisma.wallet.upsert({
      where: { userId: req.user.id },
      update: { duelPoints: { increment: duelPoints } },
      create: { userId: req.user.id, duelPoints }
    });

    res.json({ sessionId: session.id, totalScore, correctCount, rank, totalPlayers, duelPoints, answers: scored });
  } catch (error) {
    console.error("quiz/submit error", error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== WALLET ROUTES =====
app.get('/v1/wallet/balance', authMiddleware, async (req, res) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user.id, duelPoints: 0 } });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== LEADERBOARD ROUTES =====
app.get('/v1/leaderboard/daily', async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  try {
    const sessions = await prisma.quizSession.findMany({
      where: { createdAt: { gte: today } },
      orderBy: { totalScore: 'desc' },
      take: 50,
      include: { user: true }
    });
    
    const board = sessions.map((s, i) => ({
      rank: i + 1, 
      username: s.user?.username || 'Player', 
      avatar: s.user?.avatarEmoji || '🦁', 
      score: s.totalScore 
    }));
    
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== DUEL ROUTES =====
app.post('/v1/duels/create', authMiddleware, async (req, res) => {
  const { opponentId, category } = req.body;
  try {
    const duel = await prisma.duel.create({
      data: {
        initiatorId: req.user.id,
        opponentId,
        category,
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    res.json(duel);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/v1/duels/history', authMiddleware, async (req, res) => {
  try {
    const duels = await prisma.duel.findMany({
      where: {
        OR: [
          { initiatorId: req.user.id },
          { opponentId: req.user.id }
        ]
      }
    });
    res.json(duels);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ===== FRIENDS & ACHIEVEMENTS =====
app.get('/v1/friends', authMiddleware, (req, res) => res.json([]));
app.get('/v1/achievements', authMiddleware, (req, res) => {
  res.json([
    { id: '1', name: 'First Quiz', emoji: '🎯', earned: true },
    { id: '2', name: 'Speed Demon', emoji: '⚡', earned: false, criteria: 'Answer in under 5 seconds' },
    { id: '3', name: 'Week Warrior', emoji: '🗓️', earned: false, criteria: '7-day streak' },
    { id: '4', name: 'Perfect Score', emoji: '💯', earned: false, criteria: '5/5 correct in one quiz' },
  ]);
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Duel API running on http://localhost:${PORT}`));
