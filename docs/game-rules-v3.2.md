# Game Rules v3.2 - الميدان يا حميدان

## Overview

الميدان يا حميدان is an Arabic multiplayer card game for 3-8 players focused on Kuwaiti culture (actors, plays, movies, series).

## Game Setup

- **Players:** 3-8 players per room
- **Cards per Player:** 5 unique cards initially
- **Win Condition:** First player to reach 5 correct answers (round_goal, default 5)
- **Voting:** One "no" vote immediately rejects an answer

## Card System

### Card Uniqueness

- Cards are unique per round across all players (no duplicates anywhere in the same game)
- Deck is built once from selected category at game start
- Deck is shuffled once per round
- Every draw removes the card permanently from the deck (unique across whole round)
- Initial deal: 5 unique cards per player

### Card Types

1. **Regular Cards:** Cultural content (actors, plays, movies, series)
2. **Power Cards:** Special action cards (5 types)

## Power Cards

### 1. بساعدك (Help)
- **Effect:** Count one missing element as verified
- **Message:** "تم احتساب عنصر واحد مفقود كمتحقق."

### 2. نزل اللي بايدك (Drop Hand)
- **Effect:** Discard all target player's cards, then target draws 3 new unique cards
- **Message:** "تم تفريغ يد {player} وسحب ٣ بطاقات جديدة."

### 3. عطني (Give Take)
- **Effect:** Give card to another player, take random card back from target's hand
- **Message:** "تم تبادل بطاقة بينك وبين {player}."

### 4. اقعد مكانك (Skip Next)
- **Effect:** Skip the next player's turn once (not the next vote)
- **Message:** "تم تخطي دور {player} في الدورة القادمة."

### 5. شيرني (Ask Card)
- **Effect:** Request a specific card from the target player's hand; if it exists, transfer it
- **Success Message:** "{player} يمتلك البطاقة المطلوبة وتم نقلها إليك."
- **Failure Message:** "البطاقة غير موجودة لدى {player}."

## Game Flow

### Turn System

- **Player Actions:** answer | draw | skip
- **Voting:** One "no" vote rejects → turn advances to next player
- **Accepted:** Player rolls dice and stays on turn; progress += 1
- **Rejected/Skipped:** Move to next player
- **Win Condition:** When progress == round_goal (default 5) → game-end

### Progress System

- No explicit "rounds" - progress-based system only
- Server manages turn order and progression automatically
- Progress increments when answer is accepted
- First player to reach round_goal (default 5) wins

## Voting Rules

- One "no" vote immediately rejects the answer
- Admin can override votes manually via API or socket events
- Vote results broadcast in real-time

## Room States

- **lobby:** Waiting for players
- **dealing:** Cards being dealt
- **playing:** Game in progress
- **ended:** Game finished

## Admin Features

- Admin can override vote acceptance/rejection
- Admin can manage categories, cards, and questions
- Admin can manage power cards

## Technical Notes

- All UI and messages in Arabic
- Code comments and variables in English
- Socket events: `turn:answer`, `vote:cast`, `vote:result`, `admin:override`, `power:use`, `turn:advance`, `game:end`
- Room state structure includes: id, code, state, category, players, deck, current_question, turn

