import { verifyRefreshToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify JWT refresh token
 */
export async function authenticateRefreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'غير مصرح',
        message: 'Refresh token required' 
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'غير مصرح',
        message: 'User not found' 
      });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'غير مصرح',
      message: error.message || 'Invalid or expired refresh token' 
    });
  }
}

