import { PrismaClient } from '@prisma/client';
import { getGameState, removeGameState } from '../utils/gameLogic.js';

const prisma = new PrismaClient();

/**
 * Initialize game socket handlers
 */
export function initializeGameSocket(io) {
  // Rate limiting for Socket.IO connections
  const connectionLimiter = new Map();
  const MAX_CONNECTIONS_PER_IP = 5;
  const CONNECTION_WINDOW_MS = 60000; // 1 minute

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      // Rate limit connections per IP
      const clientIP = socket.handshake.address;
      const now = Date.now();
      
      if (!connectionLimiter.has(clientIP)) {
        connectionLimiter.set(clientIP, []);
      }
      
      const connections = connectionLimiter.get(clientIP);
      const recentConnections = connections.filter(timestamp => now - timestamp < CONNECTION_WINDOW_MS);
      
      if (recentConnections.length >= MAX_CONNECTIONS_PER_IP) {
        return next(new Error('E_RATE_LIMIT: Too many connection attempts'));
      }
      
      recentConnections.push(now);
      connectionLimiter.set(clientIP, recentConnections);

      const token = socket.handshake.auth?.token || 
                   socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('E_AUTH_401: غير مصرح - Access token required'));
      }

      const { verifyAccessToken } = await import('../utils/jwt.js');
      const decoded = verifyAccessToken(token);

      // Check token expiry (additional check)
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return next(new Error('E_AUTH_403: غير مصرح - Token expired'));
      }
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, email: true, role: true },
      });

      if (!user) {
        return next(new Error('E_AUTH_403: غير مصرح - User not found'));
      }

      socket.user = user;
      socket.userId = user.id;
      socket.tokenDecoded = decoded; // Store decoded token for re-auth check
      next();
    } catch (error) {
      // Check if error is from JWT verification
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return next(new Error('E_AUTH_403: غير مصرح - Token expired or invalid'));
      }
      return next(new Error(`E_AUTH_401: غير مصرح - ${error.message}`));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.user.username} (${socket.id})`);
    
    // Store original token for re-auth
    const originalToken = socket.handshake.auth?.token ||
                         socket.handshake.headers?.authorization?.split(' ')[1];

    // On reconnect, verify token is still valid
    socket.on('reconnect', async () => {
      try {
        if (!originalToken) {
          socket.disconnect();
          return;
        }

        const { verifyAccessToken } = await import('../utils/jwt.js');
        const decoded = verifyAccessToken(originalToken);

        // Check if token expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          socket.emit('error', { message: 'Token expired, please re-login', code: 'E_AUTH_403' });
          socket.disconnect();
          return;
        }

        // Verify user still exists
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, email: true, role: true },
        });

        if (!user) {
          socket.emit('error', { message: 'User not found', code: 'E_AUTH_403' });
          socket.disconnect();
          return;
        }

        // Update socket user data
        socket.user = user;
        socket.userId = user.id;
        socket.tokenDecoded = decoded;
      } catch (error) {
        socket.emit('error', { message: 'Re-authentication failed', code: 'E_AUTH_401' });
        socket.disconnect();
      }
    });

    // ==================== Room Events ====================

    /**
     * room:create - Create new room
     */
    socket.on('room:create', async (data, callback) => {
      try {
        const { categoryId } = data;
        const hostId = socket.userId;

        // Generate unique room code
        const { generateRoomCode } = await import('../utils/roomCode.js');
        let code;
        let exists = true;
        while (exists) {
          code = generateRoomCode();
          const existing = await prisma.room.findUnique({ where: { code } });
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
              select: { id: true, nameAr: true },
            },
            playerRooms: {
              include: {
                user: {
                  select: { id: true, username: true, wins: true, losses: true },
                },
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

        // Join socket room
        socket.join(`room:${room.id}`);

        callback({ success: true, room });
        socket.emit('room:created', { room });
      } catch (error) {
        console.error('room:create error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * room:join - Join a room
     */
    socket.on('room:join', async (data, callback) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;

        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            category: {
              select: { id: true, nameAr: true },
            },
            playerRooms: {
              include: {
                user: {
                  select: { id: true, username: true, wins: true, losses: true },
                },
              },
            },
          },
        });

        if (!room) {
          return callback({ success: false, error: 'الغرفة غير موجودة', code: 'E_ROOM_NOT_FOUND' });
        }

        if (room.state !== 'lobby' && room.state !== 'dealing') {
          return callback({ success: false, error: 'الغرفة غير متاحة', code: 'E_ROOM_BAD_STATE' });
        }

        // Check if already in room (idempotent - return current state)
        const existingPlayer = room.playerRooms.find(pr => pr.userId === userId);
        if (existingPlayer) {
          socket.join(`room:${roomId}`);
          return callback({ success: true, room, code: 'E_ROOM_ALREADY_IN' });
        }

        // Check capacity (strict enforcement: 3-8 players)
        if (room.playerRooms.length >= 8) {
          return callback({ success: false, error: 'الغرفة ممتلئة', code: 'E_ROOM_FULL' });
        }

        // Add player
        const takenSeats = room.playerRooms.map(pr => pr.seat);
        let seat = 0;
        while (takenSeats.includes(seat)) seat++;

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

        // Join socket room
        socket.join(`room:${roomId}`);

        // Fetch updated room
        const updatedRoom = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            category: {
              select: { id: true, nameAr: true },
            },
            playerRooms: {
              include: {
                user: {
                  select: { id: true, username: true, wins: true, losses: true },
                },
              },
            },
          },
        });

        // Broadcast to room
        io.to(`room:${roomId}`).emit('room:updated', { room: updatedRoom });
        callback({ success: true, room: updatedRoom });
      } catch (error) {
        console.error('room:join error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * room:leave - Leave a room
     */
    socket.on('room:leave', async (data, callback) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;

        const playerRoom = await prisma.playerRoom.findFirst({
          where: { roomId, userId },
        });

        if (!playerRoom) {
          return callback({ success: false, error: 'أنت غير موجود في الغرفة' });
        }

        await prisma.playerRoom.delete({ where: { id: playerRoom.id } });

        // Leave socket room
        socket.leave(`room:${roomId}`);

        // Check if room should be deleted
        const remainingCount = await prisma.playerRoom.count({ where: { roomId } });
        if (remainingCount === 0) {
          await prisma.room.delete({ where: { id: roomId } });
          removeGameState(roomId);
        } else {
          // Update room state
          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
              category: { select: { id: true, nameAr: true } },
              playerRooms: {
                include: {
                  user: {
                    select: { id: true, username: true, wins: true, losses: true },
                  },
                },
              },
            },
          });

          io.to(`room:${roomId}`).emit('room:updated', { room });
        }

        callback({ success: true });
      } catch (error) {
        console.error('room:leave error:', error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * room:start - Start game (host only)
     */
    socket.on('room:start', async (data, callback) => {
      try {
        const { roomId } = data;
        const userId = socket.userId;

        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            playerRooms: {
              include: {
                user: {
                  select: { id: true, username: true },
                },
              },
            },
          },
        });

        if (!room) {
          return callback({ success: false, error: 'الغرفة غير موجودة', code: 'E_ROOM_NOT_FOUND' });
        }

        // Idempotent: if game already started, return current state
        if (room.state === 'playing' || room.state === 'ended') {
          const gameState = getGameState(roomId);
          if (gameState) {
            const currentState = gameState.getState();
            return callback({ 
              success: true, 
              room, 
              gameState: currentState,
              code: 'E_ROOM_START_IDEMPOTENT' 
            });
          }
          return callback({ success: false, error: 'اللعبة بدأت بالفعل', code: 'E_ROOM_BAD_STATE' });
        }

        if (room.hostId !== userId) {
          return callback({ success: false, error: 'فقط المضيف يمكنه بدء اللعبة', code: 'E_ROOM_NOT_HOST' });
        }

        // Strict capacity enforcement: minimum 3 players
        if (room.playerRooms.length < 3) {
          return callback({ success: false, error: 'لاعبين غير كافيين (الحد الأدنى 3)', code: 'E_ROOM_MIN_PLAYERS' });
        }

        if (!room.categoryId) {
          return callback({ success: false, error: 'يجب اختيار فئة للعبة', code: 'E_ROOM_NO_CATEGORY' });
        }

        // Initialize game state
        const gameState = getGameState(roomId);
        const playerIds = room.playerRooms.map(pr => pr.userId);
        await gameState.initialize(room.categoryId, playerIds);

        // Get first question
        await gameState.getNextQuestion(room.categoryId);

        // Update room state to playing
        await prisma.room.update({
          where: { id: roomId },
          data: { state: 'playing' },
        });

        // Set first player's turn
        const firstPlayerId = playerIds[0];
        await prisma.playerRoom.updateMany({
          where: { roomId, userId: firstPlayerId },
          data: { isTurn: true },
        });

        // Get player hands (card IDs) - we'll fetch card details separately
        const playerHandsMap = {};
        for (const [playerId, cardIds] of gameState.playerHands.entries()) {
          const cards = await prisma.card.findMany({
            where: { id: { in: cardIds } },
            select: { id: true, textAr: true },
          });
          playerHandsMap[playerId] = cards;
        }

        // Fetch updated room with players
        const updatedRoom = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            category: { select: { id: true, nameAr: true } },
            playerRooms: {
              include: {
                user: {
                  select: { id: true, username: true, wins: true, losses: true },
                },
              },
            },
          },
        });

        // Broadcast game started
        const gameStateData = gameState.getState();
        io.to(`room:${roomId}`).emit('room:started', {
          room: updatedRoom,
          gameState: gameStateData,
          playerHands: playerHandsMap,
        });

        callback({ success: true, room: updatedRoom, gameState: gameStateData });
      } catch (error) {
        console.error('room:start error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // ==================== Turn Events ====================

    /**
     * turn:answer - Submit answer
     */
    socket.on('turn:answer', async (data, callback) => {
      try {
        const { roomId, answer } = data;
        const userId = socket.userId;

        const gameState = getGameState(roomId);
        if (!gameState) {
          return callback({ success: false, error: 'اللعبة غير موجودة', code: 'E_GAME_NOT_FOUND' });
        }

        // Check if it's player's turn and in answering phase
        if (gameState.currentTurn?.playerId !== userId) {
          return callback({ success: false, error: 'ليس دورك', code: 'E_TURN_NOT_YOUR_TURN' });
        }

        if (gameState.currentTurn?.phase !== 'answering') {
          return callback({ success: false, error: 'المرحلة غير صحيحة', code: 'E_TURN_BAD_PHASE' });
        }

        // Check if answer already submitted (locked)
        if (gameState.currentAnswer) {
          return callback({ success: false, error: 'تم قفل المرحلة', code: 'E_TURN_LOCKED' });
        }

        gameState.submitAnswer(userId, answer);

        // Broadcast answer submitted
        io.to(`room:${roomId}`).emit('turn:answer-submitted', {
          playerId: userId,
          answer,
        });

        // Broadcast voting phase
        io.to(`room:${roomId}`).emit('vote:phase-started', {
          answer,
          answererId: userId,
        });

        callback({ success: true });
      } catch (error) {
        console.error('turn:answer error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // ==================== Vote Events ====================

    /**
     * vote:cast - Cast vote
     */
    socket.on('vote:cast', async (data, callback) => {
      try {
        const { roomId, vote } = data; // vote: true = accept, false = reject
        const voterId = socket.userId;

        const gameState = getGameState(roomId);
        if (!gameState) {
          return callback({ success: false, error: 'اللعبة غير موجودة', code: 'E_GAME_NOT_FOUND' });
        }

        // Check if in voting phase
        if (gameState.currentTurn?.phase !== 'voting') {
          return callback({ success: false, error: 'ليست مرحلة التصويت', code: 'E_VOTE_BAD_PHASE' });
        }

        // Check if voter is the answerer (cannot vote on own answer)
        if (gameState.currentAnswer?.playerId === voterId) {
          return callback({ success: false, error: 'لا يمكنك التصويت على إجابتك', code: 'E_VOTE_ANSWERER' });
        }

        // Check if already voted (will override)
        if (gameState.votes.has(voterId)) {
          // Allow override, but log it
          console.log(`Vote override: ${voterId} changing vote`);
        }

        // Check for DoubleVote effect before voting
        const hasDoubleVote = gameState.applyDoubleVote(voterId);
        
        // Cast vote first time
        let result = gameState.castVote(voterId, vote);

        // If DoubleVote active, cast vote again (counts x2)
        if (hasDoubleVote) {
          // Cast vote second time (for DoubleVote effect)
          result = gameState.castVote(voterId, vote);
          console.log(`DoubleVote applied: ${voterId} vote counts x2`);
        }

        // Broadcast vote update
        io.to(`room:${roomId}`).emit('vote:update', {
          voterId,
          vote,
          doubleVote: hasDoubleVote,
          votes: Object.fromEntries(gameState.votes),
        });

        if (result.accepted === true) {
          // Accepted - same player continues, progress += 1
          const playerRoom = await prisma.playerRoom.findFirst({
            where: { roomId, userId: gameState.currentTurn.playerId },
          });

          const newProgress = (playerRoom.progress || 0) + 1;
          await prisma.playerRoom.update({
            where: { id: playerRoom.id },
            data: { progress: newProgress },
          });

          // Check win condition
          const updatedPlayerRoom = await prisma.playerRoom.findFirst({
            where: { roomId, userId: gameState.currentTurn.playerId },
          });

          const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { playerRooms: true },
          });

          if (updatedPlayerRoom.progress >= room.roundGoal) {
            // Game end
            await prisma.room.update({
              where: { id: roomId },
              data: { state: 'ended' },
            });

            await prisma.user.update({
              where: { id: updatedPlayerRoom.userId },
              data: { wins: { increment: 1 } },
            });

            // Update losers
            const losers = room.playerRooms.filter(pr => pr.userId !== updatedPlayerRoom.userId);
            for (const loser of losers) {
              await prisma.user.update({
                where: { id: loser.userId },
                data: { losses: { increment: 1 } },
              });
            }

            const winnerUser = await prisma.user.findUnique({
              where: { id: updatedPlayerRoom.userId },
              select: { username: true },
            });

            io.to(`room:${roomId}`).emit('game:end', {
              winner: {
                userId: updatedPlayerRoom.userId,
                username: winnerUser.username,
                progress: updatedPlayerRoom.progress,
              },
            });

            removeGameState(roomId);
            return callback({ success: true, result: 'accepted', gameEnded: true });
          }

          // Roll dice and continue
          const diceRoll = gameState.rollDice();
          gameState.advanceTurn(true);

          // Get next question
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          await gameState.getNextQuestion(room.categoryId);

          io.to(`room:${roomId}`).emit('vote:result', {
            accepted: true,
            diceRoll,
            gameState: gameState.getState(),
          });

          callback({ success: true, result: 'accepted', diceRoll });
        } else if (result.accepted === false) {
          // Rejected - move to next player
          const currentPlayerId = gameState.currentTurn.playerId;
          await prisma.playerRoom.updateMany({
            where: { roomId, userId: currentPlayerId },
            data: { isTurn: false },
          });

          gameState.advanceTurn(false);

          const nextPlayerId = gameState.currentTurn.playerId;
          await prisma.playerRoom.updateMany({
            where: { roomId, userId: nextPlayerId },
            data: { isTurn: true },
          });

          // Get next question
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          await gameState.getNextQuestion(room.categoryId);

          io.to(`room:${roomId}`).emit('vote:result', {
            accepted: false,
            gameState: gameState.getState(),
          });

          callback({ success: true, result: 'rejected' });
        } else {
          // Still pending votes
          callback({ success: true, result: 'pending' });
        }
      } catch (error) {
        console.error('vote:cast error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // ==================== Power Cards ====================

    /**
     * power:use - Use power card (Skip or DoubleVote)
     */
    socket.on('power:use', async (data, callback) => {
      // Start metrics timer
      const { startEventTimer, endEventTimer } = await import('../middleware/metrics.js');
      startEventTimer(socket.id, 'power:use');
      try {
        const { roomId, type } = data; // type: 'Skip' | 'DoubleVote'
        const userId = socket.userId;

        if (!['Skip', 'DoubleVote'].includes(type)) {
          return callback({ success: false, error: 'نوع بطاقة القوة غير صحيح', code: 'E_POWER_BAD_STATE' });
        }

        // Check if user already used power card in this game
        const existingUsage = await prisma.powerCardUsage.findUnique({
          where: {
            roomId_userId: {
              roomId,
              userId,
            },
          },
        });

        if (existingUsage) {
          return callback({ success: false, error: 'تم استخدام بطاقة القوة بالفعل', code: 'E_POWER_USED' });
        }

        const gameState = getGameState(roomId);
        if (!gameState) {
          return callback({ success: false, error: 'اللعبة غير موجودة', code: 'E_GAME_NOT_FOUND' });
        }

        // Check if it's player's turn and in answering phase
        if (gameState.currentTurn?.playerId !== userId) {
          return callback({ success: false, error: 'ليس دورك', code: 'E_POWER_NOT_OWNER' });
        }

        if (gameState.currentTurn?.phase !== 'answering') {
          return callback({ success: false, error: 'المرحلة غير صحيحة', code: 'E_POWER_BAD_STATE' });
        }

        // Use power card
        const result = gameState.usePowerCard(userId, type);

        // Persist audit
        await prisma.powerCardUsage.create({
          data: {
            roomId,
            userId,
            type,
            turnId: gameState.currentTurn?.playerId || null,
          },
        });

        if (type === 'Skip') {
          // Skip already advanced turn in usePowerCard
          // Update database to reflect new turn
          const currentPlayerId = userId; // Player who used Skip
          await prisma.playerRoom.updateMany({
            where: { roomId, userId: currentPlayerId },
            data: { isTurn: false },
          });

          // GameState already advanced, get next player
          const nextPlayerId = gameState.currentTurn.playerId;
          await prisma.playerRoom.updateMany({
            where: { roomId, userId: nextPlayerId },
            data: { isTurn: true },
          });

          // Get next question
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          await gameState.getNextQuestion(room.categoryId);

          // Broadcast game state update
          io.to(`room:${roomId}`).emit('game:state', {
            gameState: gameState.getState(),
            powerCardUsed: {
              userId,
              type: 'Skip',
              message: 'تم تخطي الدور',
            },
          });

          callback({ success: true, result: 'turn_skipped' });
        } else if (type === 'DoubleVote') {
          // DoubleVote activated, will apply on next vote
          io.to(`room:${roomId}`).emit('game:state', {
            gameState: gameState.getState(),
            powerCardUsed: {
              userId,
              type: 'DoubleVote',
              message: 'تم تفعيل التصويت المزدوج',
            },
          });

          callback({ success: true, result: 'double_vote_activated' });
        }
        
        // End metrics timer
        endEventTimer(socket.id, 'power:use');
      } catch (error) {
        console.error('power:use error:', error);
        const errorCode = error.message.startsWith('E_') ? error.message : 'E_POWER_BAD_STATE';
        endEventTimer(socket.id, 'power:use');
        callback({ success: false, error: error.message, code: errorCode });
      }
    });

    // ==================== Admin Override ====================

    /**
     * admin:override - Admin override vote
     */
    socket.on('admin:override', async (data, callback) => {
      try {
        const { roomId, accept } = data; // accept: true/false
        const userId = socket.userId;

        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (user.role !== 'admin') {
          return callback({ success: false, error: 'غير مصرح - Admin only', code: 'E_AUTH_ADMIN_REQUIRED' });
        }

        const gameState = getGameState(roomId);
        if (!gameState) {
          return callback({ success: false, error: 'اللعبة غير موجودة', code: 'E_GAME_NOT_FOUND' });
        }

        // Process override similar to vote result
        if (accept) {
          // Same as accepted vote
          const playerRoom = await prisma.playerRoom.findFirst({
            where: { roomId, userId: gameState.currentTurn.playerId },
          });

          const newProgress = (playerRoom.progress || 0) + 1;
          await prisma.playerRoom.update({
            where: { id: playerRoom.id },
            data: { progress: newProgress },
          });

          const diceRoll = gameState.rollDice();
          gameState.advanceTurn(true);

          const room = await prisma.room.findUnique({ where: { id: roomId } });
          await gameState.getNextQuestion(room.categoryId);

          io.to(`room:${roomId}`).emit('vote:result', {
            accepted: true,
            adminOverride: true,
            diceRoll,
            gameState: gameState.getState(),
          });
        } else {
          // Same as rejected vote
          gameState.advanceTurn(false);
          const room = await prisma.room.findUnique({ where: { id: roomId } });
          await gameState.getNextQuestion(room.categoryId);

          io.to(`room:${roomId}`).emit('vote:result', {
            accepted: false,
            adminOverride: true,
            gameState: gameState.getState(),
          });
        }

        callback({ success: true });
      } catch (error) {
        console.error('admin:override error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // ==================== Disconnect ====================

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.user?.username || 'Unknown'} (${socket.id})`);
    });
  });
}

