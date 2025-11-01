import { verifyAccessToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Socket.IO authentication middleware
 * Verifies JWT access token on connection
 */
export async function socketAuthenticate(socket, next) {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('غير مصرح - Access token required'));
    }

    const decoded = verifyAccessToken(token);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, role: true },
    });

    if (!user) {
      return next(new Error('غير مصرح - User not found'));
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user.id;
    
    next();
  } catch (error) {
    next(new Error(`غير مصرح - ${error.message}`));
  }
}

