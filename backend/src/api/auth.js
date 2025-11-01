import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateRefreshToken } from '../middleware/refreshAuth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'Username, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'كلمة مرور ضعيفة',
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'مستخدم موجود',
        message: 'Username or email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        wins: true,
        losses: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.status(201).json({
      message: 'تم التسجيل بنجاح',
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return tokens
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!password || (!username && !email)) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'Username or email and password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: username ? { username } : { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'بيانات غير صحيحة',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'بيانات غير صحيحة',
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        wins: user.wins,
        losses: user.losses,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', authenticateRefreshToken, async (req, res) => {
  try {
    // Token rotation: invalidate old refresh token, issue new ones
    const { rotateRefreshToken } = await import('../utils/jwt.js');
    const oldRefreshToken = req.body.refreshToken;
    
    const { accessToken, refreshToken } = rotateRefreshToken(
      oldRefreshToken,
      { userId: req.user.id, role: req.user.role }
    );

    res.json({
      message: 'تم تحديث الرمز بنجاح',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        wins: true,
        losses: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, role: true, wins: true, losses: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'خطأ في جلب بيانات المستخدم' });
  }
});

export default router;

