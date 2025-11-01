import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Build unified deck from category
 * Returns array of card IDs
 */
export async function buildDeckFromCategory(categoryId) {
  const cards = await prisma.card.findMany({
    where: {
      categoryId,
      cardType: {
        type: 'regular', // Only regular cards, not power cards
      },
    },
    select: {
      id: true,
    },
  });

  return cards.map(card => card.id);
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deal cards to players ensuring uniqueness
 * Returns { playerHands: Map<userId, cardIds[]>, remainingDeck: cardIds[] }
 */
export function dealCards(deck, playerIds, cardsPerPlayer = 5) {
  const shuffled = shuffleDeck(deck);
  const playerHands = new Map();
  let dealtIndex = 0;

  // Deal cards to each player
  for (const playerId of playerIds) {
    const hand = [];
    for (let i = 0; i < cardsPerPlayer; i++) {
      if (dealtIndex < shuffled.length) {
        hand.push(shuffled[dealtIndex]);
        dealtIndex++;
      }
    }
    playerHands.set(playerId, hand);
  }

  // Remaining deck
  const remainingDeck = shuffled.slice(dealtIndex);

  return {
    playerHands,
    remainingDeck,
  };
}

/**
 * Draw cards from deck ensuring uniqueness
 * Returns { drawnCards: cardIds[], remainingDeck: cardIds[] }
 */
export function drawCards(deck, count) {
  if (deck.length < count) {
    throw new Error('Not enough cards in deck');
  }

  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);

  return {
    drawnCards: drawn,
    remainingDeck: remaining,
  };
}

