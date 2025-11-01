import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { generateRoomCode, isValidRoomCode } from '../utils/roomCode.js';

const router = express.Router();
const prisma = new PrismaClient();

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;

/**
 * GET /api/rooms
 * List available rooms
 */
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        state: {
          in: ['lobby', 'dealing'],
        },
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        playerRooms: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            playerRooms: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format response
    const formattedRooms = rooms.map(room => ({
      id: room.id,
      code: room.code,
      state: room.state,
      category: room.category,
      hostId: room.hostId,
      roundGoal: room.roundGoal,
      playerCount: room._count.playerRooms,
      maxPlayers: MAX_PLAYERS,
      players: room.playerRooms.map(pr => ({
        userId: pr.user.id,
        username: pr.user.username,
        seat: pr.seat,
        progress: pr.progress,
        isReady: pr.isReady,
      })),
      createdAt: room.createdAt,
    }));

    res.json({ rooms: formattedRooms });
  } catch (error) {
    console.error('List rooms error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * GET /api/rooms/:roomId
 * Get room details
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
            descriptionAr: true,
          },
        },
        playerRooms: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                wins: true,
                losses: true,
              },
            },
          },
          orderBy: {
            seat: 'asc',
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        error: 'الغرفة غير موجودة',
        message: 'Room not found',
      });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/rooms
 * Create a new room (host only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.body;
    const hostId = req.user.id;

    // Generate unique room code
    let code;
    let exists = true;
    while (exists) {
      code = generateRoomCode();
      const existing = await prisma.room.findUnique({
        where: { code },
      });
      exists = !!existing;
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        code,
        hostId,
        state: 'lobby',
        categoryId: categoryId || null,
        roundGoal: 5,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
    });

    // Add host as first player
    await prisma.playerRoom.create({
      data: {
        roomId: room.id,
        userId: hostId,
        seat: 0,
        progress: 0,
        isTurn: false,
        isReady: false,
      },
    });

    res.status(201).json({
      message: 'تم إنشاء الغرفة بنجاح',
      room,
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/rooms/:roomId/join
 * Join a room (check capacity 3-8 players)
 */
router.post('/:roomId/join', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Find room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        playerRooms: true,
      },
    });

    if (!room) {
      return res.status(404).json({
        error: 'الغرفة غير موجودة',
        message: 'Room not found',
      });
    }

    // Check if room is joinable
    if (room.state !== 'lobby' && room.state !== 'dealing') {
      return res.status(400).json({
        error: 'الغرفة غير متاحة',
        message: 'Room is not accepting new players',
      });
    }

    // Check if user already in room
    const existingPlayer = room.playerRooms.find(pr => pr.userId === userId);
    if (existingPlayer) {
      return res.status(400).json({
        error: 'أنت موجود بالفعل في الغرفة',
        message: 'You are already in this room',
      });
    }

    // Check capacity (3-8 players)
    if (room.playerRooms.length >= MAX_PLAYERS) {
      return res.status(400).json({
        error: 'الغرفة ممتلئة',
        message: `Room is full (max ${MAX_PLAYERS} players)`,
      });
    }

    // Find next available seat
    const takenSeats = room.playerRooms.map(pr => pr.seat);
    let seat = 0;
    while (takenSeats.includes(seat)) {
      seat++;
    }

    // Add player to room
    await prisma.playerRoom.create({
      data: {
        roomId: room.id,
        userId,
        seat,
        progress: 0,
        isTurn: false,
        isReady: false,
      },
    });

    res.json({
      message: 'تم الانضمام للغرفة بنجاح',
      roomId: room.id,
      seat,
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/rooms/:roomId/leave
 * Leave a room
 */
router.post('/:roomId/leave', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Find room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        playerRooms: true,
      },
    });

    if (!room) {
      return res.status(404).json({
        error: 'الغرفة غير موجودة',
        message: 'Room not found',
      });
    }

    // Check if user is in room
    const playerRoom = room.playerRooms.find(pr => pr.userId === userId);
    if (!playerRoom) {
      return res.status(400).json({
        error: 'أنت غير موجود في الغرفة',
        message: 'You are not in this room',
      });
    }

    // Remove player
    await prisma.playerRoom.delete({
      where: { id: playerRoom.id },
    });

    // If no players left, delete room
    const remainingPlayers = await prisma.playerRoom.count({
      where: { roomId },
    });

    if (remainingPlayers === 0) {
      await prisma.room.delete({
        where: { id: roomId },
      });
    } else if (room.hostId === userId) {
      // If host left, assign new host (first remaining player)
      const newHost = await prisma.playerRoom.findFirst({
        where: { roomId },
        orderBy: { seat: 'asc' },
        include: { user: true },
      });

      if (newHost) {
        await prisma.room.update({
          where: { id: roomId },
          data: { hostId: newHost.userId },
        });
      }
    }

    res.json({
      message: 'تم مغادرة الغرفة بنجاح',
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/rooms/:roomId/start
 * Start game (host only, minimum 3 players)
 */
router.post('/:roomId/start', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Find room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        playerRooms: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({
        error: 'الغرفة غير موجودة',
        message: 'Room not found',
      });
    }

    // Check if user is host
    if (room.hostId !== userId) {
      return res.status(403).json({
        error: 'غير مصرح',
        message: 'Only the host can start the game',
      });
    }

    // Check minimum players
    if (room.playerRooms.length < MIN_PLAYERS) {
      return res.status(400).json({
        error: 'لاعبين غير كافيين',
        message: `Minimum ${MIN_PLAYERS} players required to start`,
      });
    }

    // Check if game already started
    if (room.state === 'playing' || room.state === 'ended') {
      return res.status(400).json({
        error: 'اللعبة بدأت بالفعل',
        message: 'Game has already started',
      });
    }

    // Update room state to dealing (game logic will handle card dealing via Socket.IO)
    await prisma.room.update({
      where: { id: roomId },
      data: {
        state: 'dealing',
      },
    });

    res.json({
      message: 'تم بدء اللعبة',
      roomId: room.id,
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

export default router;

