# Socket.IO Events Documentation

## Authentication

All Socket.IO connections require JWT authentication via `auth.token` in handshake:

```javascript
socket = io('http://localhost:3000', {
  auth: {
    token: 'your-access-token-here'
  }
});
```

**Error Codes:**
- `E_AUTH_401` - Authentication failed (invalid or missing token)
- `E_AUTH_403` - Token expired or user not found

---

## Room Events

### `room:create`
Create a new room.

**Request:**
```javascript
socket.emit('room:create', {
  categoryId: 'optional-category-id'
}, (response) => {
  // response: { success: boolean, room?: Room, error?: string, code?: string }
});
```

**Response Events:**
- `room:created` - Emitted to creator with room data

**Error Codes:**
- `E_ROOM_CREATE_FAILED` - Failed to create room

**Success Response:**
```javascript
{
  success: true,
  room: {
    id: string,
    code: string,
    hostId: string,
    state: 'lobby',
    categoryId: string | null,
    roundGoal: number,
    category?: { id: string, nameAr: string },
    playerRooms: Array<PlayerRoom>
  }
}
```

---

### `room:join`
Join an existing room.

**Request:**
```javascript
socket.emit('room:join', {
  roomId: 'room-id'
}, (response) => {
  // response: { success: boolean, room?: Room, error?: string, code?: string }
});
```

**Response Events:**
- `room:updated` - Broadcasted to all room members when player joins

**Error Codes:**
- `E_ROOM_NOT_FOUND` - Room does not exist
- `E_ROOM_FULL` - Room is at capacity (8 players)
- `E_ROOM_BAD_STATE` - Room is not accepting new players (state is 'playing' or 'ended')
- `E_ROOM_ALREADY_IN` - User is already in the room

**Success Response:**
```javascript
{
  success: true,
  room: Room
}
```

---

### `room:leave`
Leave a room.

**Request:**
```javascript
socket.emit('room:leave', {
  roomId: 'room-id'
}, (response) => {
  // response: { success: boolean, error?: string, code?: string }
});
```

**Response Events:**
- `room:updated` - Broadcasted to remaining room members

**Error Codes:**
- `E_ROOM_NOT_IN` - User is not in the room

**Success Response:**
```javascript
{
  success: true
}
```

---

### `room:start`
Start the game (host only, minimum 3 players).

**Request:**
```javascript
socket.emit('room:start', {
  roomId: 'room-id'
}, (response) => {
  // response: { success: boolean, room?: Room, gameState?: GameState, error?: string, code?: string }
});
```

**Response Events:**
- `room:started` - Broadcasted to all room members with:
  ```javascript
  {
    room: Room,
    gameState: {
      deck: { remaining: number },
      currentQuestion: { id: string, textAr: string },
      currentTurn: { playerId: string, phase: 'answering' | 'voting' | 'ended' },
      currentAnswer: { playerId: string, answer: string } | null,
      votes: { [voterId: string]: boolean }
    },
    playerHands: {
      [playerId: string]: Array<{ id: string, textAr: string }>
    }
  }
  ```

**Error Codes:**
- `E_ROOM_NOT_FOUND` - Room does not exist
- `E_ROOM_NOT_HOST` - Only host can start the game
- `E_ROOM_MIN_PLAYERS` - Minimum 3 players required
- `E_ROOM_NO_CATEGORY` - Category must be selected
- `E_ROOM_BAD_STATE` - Game already started or ended
- `E_ROOM_START_IDEMPOTENT` - Game already started (idempotent call, returns current state)

**Success Response:**
```javascript
{
  success: true,
  room: Room,
  gameState: GameState
}
```

**Idempotent Behavior:**
- If game already started, returns current game state without error
- No duplicate card dealing or state reset

---

## Turn Events

### `turn:answer`
Submit an answer to the current question.

**Request:**
```javascript
socket.emit('turn:answer', {
  roomId: 'room-id',
  answer: 'player answer text'
}, (response) => {
  // response: { success: boolean, error?: string, code?: string }
});
```

**Response Events:**
- `turn:answer-submitted` - Broadcasted to all room members:
  ```javascript
  {
    playerId: string,
    answer: string
  }
  ```
- `vote:phase-started` - Broadcasted to all room members:
  ```javascript
  {
    answer: string,
    answererId: string
  }
  ```

**Error Codes:**
- `E_GAME_NOT_FOUND` - Game state not found
- `E_TURN_NOT_YOUR_TURN` - Not your turn
- `E_TURN_BAD_PHASE` - Not in answering phase (already answered or voting)
- `E_TURN_LOCKED` - Answer phase locked (voting in progress)

**Success Response:**
```javascript
{
  success: true
}
```

---

## Vote Events

### `vote:cast`
Cast a vote on the current answer.

**Request:**
```javascript
socket.emit('vote:cast', {
  roomId: 'room-id',
  vote: true  // true = accept, false = reject
}, (response) => {
  // response: { 
  //   success: boolean, 
  //   result?: 'accepted' | 'rejected' | 'pending', 
  //   diceRoll?: number, 
  //   gameEnded?: boolean, 
  //   error?: string,
  //   code?: string
  // }
});
```

**Response Events:**
- `vote:update` - Broadcasted after each vote:
  ```javascript
  {
    voterId: string,
    vote: boolean,
    votes: { [voterId: string]: boolean }
  }
  ```

- `vote:result` - Broadcasted when voting completes:
  ```javascript
  {
    accepted: boolean,
    adminOverride?: boolean,
    diceRoll?: number,  // Only if accepted
    gameState: GameState
  }
  ```

**Error Codes:**
- `E_GAME_NOT_FOUND` - Game state not found
- `E_VOTE_BAD_PHASE` - Not in voting phase
- `E_VOTE_ALREADY_VOTED` - Already voted (will override previous vote)
- `E_VOTE_ANSWERER` - Cannot vote on your own answer

**Voting Rules:**
- One "no" vote immediately rejects the answer
- All "yes" votes accepts the answer
- Accepted: Same player continues, progress += 1, rolls dice
- Rejected: Move to next player
- Duplicate votes from same player override previous vote

**Success Response:**
```javascript
{
  success: true,
  result: 'accepted' | 'rejected' | 'pending',
  diceRoll?: number,  // If accepted
  gameEnded?: boolean  // If win condition reached
}
```

---

## Power Card Events

### `power:use`
Use a power card (Skip or DoubleVote).

**Request:**
```javascript
socket.emit('power:use', {
  roomId: 'room-id',
  type: 'Skip' | 'DoubleVote'
}, (response) => {
  // response: { success: boolean, result?: string, error?: string, code?: string }
});
```

**Response Events:**
- `game:state` - Broadcasted to all room members with updated game state:
  ```javascript
  {
    gameState: GameState,
    powerCardUsed: {
      userId: string,
      type: 'Skip' | 'DoubleVote',
      message: string  // Arabic message
    }
  }
  ```

**Error Codes:**
- `E_POWER_USED` - Power card already used (once per game limit)
- `E_POWER_BAD_STATE` - Invalid state (not your turn or wrong phase)
- `E_POWER_NOT_OWNER` - Not your turn
- `E_GAME_NOT_FOUND` - Game state not found

**Power Card Rules:**

**Skip:**
- Ends current turn immediately
- Advances to next player
- No votes counted
- Can only be used during own turn, before voting starts
- Once per game per player

**DoubleVote:**
- Activates for next vote only
- Next `vote:cast` counts x2 for that turn
- Expires after one turn (when turn advances)
- Can only be used during own turn, before voting starts
- Once per game per player

**Timing:**
- Only during own turn
- Only in "answering" phase (before answer submitted)
- Cannot be used after voting starts

**Per-Player Limit:**
- Server-enforced: one power card per player per game
- Tracked in database with audit trail

**Success Response:**
```javascript
{
  success: true,
  result: 'turn_skipped' | 'double_vote_activated'
}
```

**Audit Trail:**
- All power card usage persisted to database
- Fields: roomId, userId, type, turnId, createdAt
- Prevents replay attacks

---

## Admin Events

### `admin:override`
Admin can manually override vote result.

**Request:**
```javascript
socket.emit('admin:override', {
  roomId: 'room-id',
  accept: true  // true = force accept, false = force reject
}, (response) => {
  // response: { success: boolean, error?: string, code?: string }
});
```

**Response Events:**
- `vote:result` - Same as vote:cast result, with `adminOverride: true`

**Error Codes:**
- `E_AUTH_ADMIN_REQUIRED` - Admin role required
- `E_GAME_NOT_FOUND` - Game state not found

**Success Response:**
```javascript
{
  success: true
}
```

---

## Game End

### `game:end`
Emitted when a player reaches the win condition (progress >= roundGoal).

**Event:**
```javascript
{
  winner: {
    userId: string,
    username: string,
    progress: number
  }
}
```

---

## Reconnection

When a player reconnects:

1. Client should emit `room:join` with existing `roomId`
2. Server will restore player's state:
   - Current room membership
   - Player progress
   - Game state (if game in progress)
   - Hand cards (if game started)

**Reconnection Flow:**
```javascript
// On reconnect
socket.on('connect', () => {
  if (currentRoomId) {
    socket.emit('room:join', { roomId: currentRoomId }, (response) => {
      if (response.success) {
        // State restored, sync UI
      }
    });
  }
});
```

---

## Room State Structure

```typescript
interface Room {
  id: string;
  code: string;
  hostId: string;
  state: 'lobby' | 'dealing' | 'playing' | 'ended';
  categoryId: string | null;
  roundGoal: number;  // Default: 5
  category?: {
    id: string;
    nameAr: string;
  };
  playerRooms: Array<{
    id: string;
    userId: string;
    seat: number;
    progress: number;
    isTurn: boolean;
    isReady: boolean | null;
    user: {
      id: string;
      username: string;
      wins: number;
      losses: number;
    };
  }>;
}
```

---

## Game State Structure

```typescript
interface GameState {
  deck: {
    remaining: number;
  };
  currentQuestion: {
    id: string;
    textAr: string;
  } | null;
  currentTurn: {
    playerId: string;
    phase: 'answering' | 'voting' | 'ended';
  } | null;
  currentAnswer: {
    playerId: string;
    answer: string;
  } | null;
  votes: {
    [voterId: string]: boolean;
  };
}
```

---

## Error Code Reference

### Authentication Errors
- `E_AUTH_401` - Authentication failed (invalid or missing token)
- `E_AUTH_403` - Token expired or user not found
- `E_AUTH_ADMIN_REQUIRED` - Admin role required

### Room Errors
- `E_ROOM_NOT_FOUND` - Room does not exist
- `E_ROOM_FULL` - Room is at capacity (8 players)
- `E_ROOM_BAD_STATE` - Room state does not allow operation
- `E_ROOM_ALREADY_IN` - User is already in the room
- `E_ROOM_NOT_IN` - User is not in the room
- `E_ROOM_NOT_HOST` - Only host can perform this action
- `E_ROOM_MIN_PLAYERS` - Minimum 3 players required
- `E_ROOM_NO_CATEGORY` - Category must be selected
- `E_ROOM_CREATE_FAILED` - Failed to create room
- `E_ROOM_START_IDEMPOTENT` - Game already started (idempotent)

### Game/Turn Errors
- `E_GAME_NOT_FOUND` - Game state not found
- `E_TURN_NOT_YOUR_TURN` - Not your turn
- `E_TURN_BAD_PHASE` - Invalid phase for this operation
- `E_TURN_LOCKED` - Operation locked (e.g., answer phase locked during voting)

### Vote Errors
- `E_VOTE_BAD_PHASE` - Not in voting phase
- `E_VOTE_ALREADY_VOTED` - Already voted (will override)
- `E_VOTE_ANSWERER` - Cannot vote on your own answer

### Power Card Errors
- `E_POWER_USED` - Power card already used (once per game limit)
- `E_POWER_BAD_STATE` - Invalid state (not your turn or wrong phase)
- `E_POWER_NOT_OWNER` - Not your turn
- `E_RATE_LIMIT` - Rate limit exceeded (future use)

---

## Game Flow

1. **Lobby Phase:**
   - Players join room (`room:join`)
   - Host starts game (`room:start`)

2. **Game Start:**
   - Deck built from category
   - Cards dealt (5 per player, unique across round)
   - First question selected
   - First player's turn begins

3. **Turn Cycle:**
   - Player submits answer (`turn:answer`)
   - Other players vote (`vote:cast`)
   - If accepted: Same player continues, progress += 1, roll dice
   - If rejected: Next player's turn
   - Repeat until someone reaches `roundGoal`

4. **Win Condition:**
   - Player progress >= roundGoal (default 5)
   - `game:end` event emitted
   - Game state cleaned up

---

## Capacity Enforcement

- **Minimum Players:** 3 (enforced on `room:start`)
- **Maximum Players:** 8 (enforced on `room:join`)
- **Strict Enforcement:** Server validates capacity before allowing join/start operations

---

## Idempotent Operations

- `room:start` - If game already started, returns current state without error
- `vote:cast` - Duplicate votes from same player override previous vote
- `room:join` - If already in room, returns current room state

---

## Error Handling

All callbacks include error handling:
```javascript
{
  success: boolean,
  error?: string,  // Arabic error message
  code?: string    // Error code (e.g., E_ROOM_FULL)
}
```

Socket connection errors are emitted as connection errors with Arabic messages and error codes.
