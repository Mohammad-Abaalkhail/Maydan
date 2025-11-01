import { PrismaClient } from '@prisma/client';
import { buildDeckFromCategory, shuffleDeck, dealCards, drawCards } from './deckManager.js';

const prisma = new PrismaClient();

/**
 * Game state manager for a room
 */
export class GameState {
  constructor(roomId) {
    this.roomId = roomId;
    this.deck = []; // Array of card IDs
    this.playerHands = new Map(); // Map<userId, cardIds[]>
    this.currentQuestion = null;
    this.currentTurn = null; // { playerId, phase: 'answering' | 'voting' | 'ended' }
    this.currentAnswer = null; // { playerId, answer: string }
    this.votes = new Map(); // Map<userId, boolean> - true = accept, false = reject
    this.turnOrder = []; // Array of userIds in turn order
    this.currentTurnIndex = 0;
  }

  /**
   * Initialize game: build deck, shuffle, deal cards
   */
  async initialize(categoryId, playerIds) {
    // Build deck from category
    this.deck = await buildDeckFromCategory(categoryId);
    
    // Shuffle once
    this.deck = shuffleDeck(this.deck);
    
    // Deal 5 unique cards per player
    const { playerHands, remainingDeck } = dealCards(this.deck, playerIds, 5);
    this.playerHands = playerHands;
    this.deck = remainingDeck;
    
    // Set turn order
    this.turnOrder = [...playerIds];
    this.currentTurnIndex = 0;
    
    // Set first player's turn
    if (this.turnOrder.length > 0) {
      this.currentTurn = {
        playerId: this.turnOrder[0],
        phase: 'answering',
      };
    }
  }

  /**
   * Get next question
   */
  async getNextQuestion(categoryId) {
    const questions = await prisma.question.findMany({
      where: { categoryId },
      select: { id: true, textAr: true },
    });

    if (questions.length === 0) {
      return null;
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    this.currentQuestion = randomQuestion;
    return randomQuestion;
  }

  /**
   * Submit answer
   */
  submitAnswer(playerId, answer) {
    if (this.currentTurn?.playerId !== playerId || this.currentTurn?.phase !== 'answering') {
      throw new Error('Not your turn or invalid phase');
    }

    this.currentAnswer = { playerId, answer };
    this.currentTurn.phase = 'voting';
    this.votes.clear(); // Reset votes
  }

  /**
   * Cast vote
   */
  castVote(voterId, vote) {
    if (this.currentTurn?.phase !== 'voting') {
      throw new Error('Not in voting phase');
    }

    this.votes.set(voterId, vote);

    // Check if one "no" vote exists (immediate rejection)
    const hasRejection = Array.from(this.votes.values()).includes(false);
    
    if (hasRejection) {
      // Rejected - move to next player
      this.advanceTurn(false);
      return { accepted: false, reason: 'rejected' };
    }

    // Check if all players voted (all yes)
    const allPlayersVoted = this.votes.size === this.turnOrder.length - 1; // Exclude answerer
    if (allPlayersVoted) {
      const allAccepted = Array.from(this.votes.values()).every(v => v === true);
      if (allAccepted) {
        // Accepted - same player continues, progress += 1
        this.advanceTurn(true);
        return { accepted: true, reason: 'accepted' };
      }
    }

    return { pending: true };
  }

  /**
   * Advance turn based on result
   */
  advanceTurn(accepted) {
    // Clear active power effects when turn changes (DoubleVote expires)
    if (!accepted) {
      // Turn changing - clear DoubleVote effects
      this.activePowerEffects.clear();
    }

    if (accepted) {
      // Same player continues - roll dice and stay on turn
      // Progress will be incremented in database
      this.currentTurn.phase = 'answering';
      this.currentAnswer = null;
      this.votes.clear();
      // Note: Progress increment happens in socket handler
    } else {
      // Rejected/Skipped - move to next player
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
      this.currentTurn = {
        playerId: this.turnOrder[this.currentTurnIndex],
        phase: 'answering',
      };
      this.currentAnswer = null;
      this.votes.clear();
    }
  }

  /**
   * Roll dice (returns random number 1-6)
   */
  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  /**
   * Draw card for player
   */
  drawCard(playerId) {
    if (this.deck.length === 0) {
      throw new Error('Deck is empty');
    }

    const { drawnCards, remainingDeck } = drawCards(this.deck, 1);
    this.deck = remainingDeck;

    // Add to player's hand
    const hand = this.playerHands.get(playerId) || [];
    hand.push(drawnCards[0]);
    this.playerHands.set(playerId, hand);

    return drawnCards[0];
  }

  /**
   * Get player's hand
   */
  getPlayerHand(playerId) {
    return this.playerHands.get(playerId) || [];
  }

  /**
   * Active power card effects
   */
  activePowerEffects = new Map(); // Map<userId, { type: 'DoubleVote', expiresAt: turnId }>

  /**
   * Use power card
   */
  usePowerCard(userId, type) {
    if (type !== 'Skip' && type !== 'DoubleVote') {
      throw new Error('Invalid power card type');
    }

    // Check if it's player's turn and in answering phase
    if (this.currentTurn?.playerId !== userId) {
      throw new Error('E_POWER_NOT_OWNER');
    }

    if (this.currentTurn?.phase !== 'answering') {
      throw new Error('E_POWER_BAD_STATE');
    }

    // Skip logic
    if (type === 'Skip') {
      // End current turn immediately, advance to next player
      // Clear current answer and votes (none counted)
      this.currentAnswer = null;
      this.votes.clear();
      
      // Advance to next player
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
      this.currentTurn = {
        playerId: this.turnOrder[this.currentTurnIndex],
        phase: 'answering',
      };
      
      return { type: 'Skip', action: 'turn_skipped' };
    }

    // DoubleVote logic
    if (type === 'DoubleVote') {
      // Mark for next vote (this turn)
      this.activePowerEffects.set(userId, {
        type: 'DoubleVote',
        expiresAt: this.currentTurn?.playerId, // Expires after this turn
      });
      return { type: 'DoubleVote', action: 'activated' };
    }
  }

  /**
   * Check if power card can be used (not already used)
   */
  canUsePowerCard(userId) {
    // This will be checked against database (one per game)
    return true; // Database check happens in socket handler
  }

  /**
   * Apply DoubleVote effect to vote
   */
  applyDoubleVote(voterId) {
    const effect = this.activePowerEffects.get(voterId);
    if (effect && effect.type === 'DoubleVote') {
      // Remove after use
      this.activePowerEffects.delete(voterId);
      return true; // Vote counts x2
    }
    return false;
  }

  /**
   * Get game state for client
   */
  getState() {
    return {
      deck: { remaining: this.deck.length },
      currentQuestion: this.currentQuestion,
      currentTurn: this.currentTurn,
      currentAnswer: this.currentAnswer,
      votes: Object.fromEntries(this.votes),
      activePowerEffects: Object.fromEntries(this.activePowerEffects),
    };
  }
}

// Room game states cache
const roomGameStates = new Map();

/**
 * Get or create game state for room
 */
export function getGameState(roomId) {
  if (!roomGameStates.has(roomId)) {
    roomGameStates.set(roomId, new GameState(roomId));
  }
  return roomGameStates.get(roomId);
}

/**
 * Remove game state for room
 */
export function removeGameState(roomId) {
  roomGameStates.delete(roomId);
}

