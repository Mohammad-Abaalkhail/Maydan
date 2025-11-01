import { verifyAccessToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify JWT access token
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'غير مصرح',
        message: 'Access token required' 
      });
    }

    const decoded = verifyAccessToken(token);
    
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
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'غير مصرح',
      message: error.message || 'Invalid or expired token' 
    });
  }
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      error: 'غير مصرح',
      message: 'Admin access required' 
    });
  }
}

