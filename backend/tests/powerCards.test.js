/**
 * Power Cards Unit Tests
 * Tests for Skip and DoubleVote power cards
 */

import { GameState } from '../src/utils/gameLogic.js';

describe('Power Cards', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState('test-room');
    gameState.turnOrder = ['player1', 'player2', 'player3'];
    gameState.currentTurnIndex = 0;
    gameState.currentTurn = {
      playerId: 'player1',
      phase: 'answering',
    };
  });

  test('Skip power card ends turn and advances to next player', () => {
    const result = gameState.usePowerCard('player1', 'Skip');
    
    expect(result.type).toBe('Skip');
    expect(result.action).toBe('turn_skipped');
    expect(gameState.currentTurn.playerId).toBe('player2');
    expect(gameState.currentTurn.phase).toBe('answering');
  });

  test('DoubleVote power card activates for next vote', () => {
    const result = gameState.usePowerCard('player1', 'DoubleVote');
    
    expect(result.type).toBe('DoubleVote');
    expect(result.action).toBe('activated');
    expect(gameState.activePowerEffects.has('player1')).toBe(true);
  });

  test('Cannot use power card when not your turn', () => {
    expect(() => {
      gameState.usePowerCard('player2', 'Skip');
    }).toThrow('E_POWER_NOT_OWNER');
  });

  test('Cannot use power card during voting phase', () => {
    gameState.currentTurn.phase = 'voting';
    
    expect(() => {
      gameState.usePowerCard('player1', 'Skip');
    }).toThrow('E_POWER_BAD_STATE');
  });

  test('DoubleVote applies to vote', () => {
    gameState.usePowerCard('player1', 'DoubleVote');
    gameState.currentTurn.phase = 'voting';
    
    const hasDoubleVote = gameState.applyDoubleVote('player1');
    expect(hasDoubleVote).toBe(true);
    
    // Should be removed after use
    const hasAfterUse = gameState.applyDoubleVote('player1');
    expect(hasAfterUse).toBe(false);
  });

  test('DoubleVote expires when turn advances', () => {
    gameState.usePowerCard('player1', 'DoubleVote');
    gameState.advanceTurn(false); // Turn changes
    
    const hasDoubleVote = gameState.applyDoubleVote('player1');
    expect(hasDoubleVote).toBe(false);
  });
});

