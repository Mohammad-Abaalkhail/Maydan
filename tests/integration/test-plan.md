# Integration Test Plan - الميدان يا حميدان

## Overview
Comprehensive integration test plan covering API endpoints, Socket.IO events, and UI flows.

## Test Environment Setup

### Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend dev server on `http://localhost:5173`
- Database migrated and seeded
- All dependencies installed

### Test Data
- Minimum 3 test users (for room creation)
- Seeded categories, cards, questions
- Test room codes

---

## Phase 1: Authentication Flow

### Test 1.1: User Registration
**API:** `POST /api/auth/register`

**Steps:**
1. Register new user with valid data
2. Verify response contains tokens and user data
3. Verify tokens stored in localStorage
4. Verify user redirected to lobby

**Expected:**
- Status: 201
- Response: `{ user, accessToken, refreshToken }`
- Tokens in localStorage
- Redirect to `/lobby`

**Negative Cases:**
- Duplicate username → 409
- Weak password (<6 chars) → 400
- Missing fields → 400

### Test 1.2: User Login
**API:** `POST /api/auth/login`

**Steps:**
1. Login with valid credentials
2. Verify tokens received
3. Verify user data correct

**Expected:**
- Status: 200
- Tokens in response
- User redirected to lobby

**Negative Cases:**
- Invalid credentials → 401
- Missing fields → 400

### Test 1.3: Token Refresh
**API:** `POST /api/auth/refresh`

**Steps:**
1. Use refresh token to get new access token
2. Verify new tokens received
3. Verify old access token invalid
4. Verify new access token works

**Expected:**
- Status: 200
- New tokens in response
- Old token invalid
- New token valid

### Test 1.4: Get Current User
**API:** `GET /api/auth/me`

**Steps:**
1. Request with valid access token
2. Verify user data returned

**Expected:**
- Status: 200
- User data: `{ id, username, email, role, wins, losses }`

---

## Phase 2: Room Management Flow

### Test 2.1: Create Room (REST API)
**API:** `POST /api/rooms`

**Steps:**
1. Authenticated user creates room
2. Verify room created with unique code
3. Verify user added as host
4. Verify room state is 'lobby'

**Expected:**
- Status: 201
- Room code: 4 uppercase letters
- Host ID matches user ID
- State: 'lobby'

### Test 2.2: Create Room (Socket.IO)
**Socket:** `room:create`

**Steps:**
1. Connect socket with JWT
2. Emit `room:create`
3. Verify `room:created` event received
4. Verify room data in response

**Expected:**
- Socket connected
- Callback: `{ success: true, room: {...} }`
- Event: `room:created` with room data

### Test 2.3: List Rooms
**API:** `GET /api/rooms`

**Steps:**
1. Create multiple rooms
2. List all rooms
3. Verify only lobby/dealing rooms returned
4. Verify player counts correct

**Expected:**
- Status: 200
- Rooms array with correct state filter
- Player counts accurate

### Test 2.4: Join Room (Socket.IO)
**Socket:** `room:join`

**Steps:**
1. User 1 creates room
2. User 2 joins room via socket
3. Verify join success
4. Verify room:updated broadcasted
5. Verify player count increased

**Expected:**
- Callback: `{ success: true, room: {...} }`
- Broadcast to all room members
- Player count +1

**Negative Cases:**
- Join full room (8 players) → `E_ROOM_FULL`
- Join non-existent room → `E_ROOM_NOT_FOUND`
- Join during game → `E_ROOM_BAD_STATE`

### Test 2.5: Leave Room
**Socket:** `room:leave`

**Steps:**
1. Join room
2. Leave room
3. Verify removed from room
4. Verify room:updated broadcasted

**Expected:**
- Callback: `{ success: true }`
- User removed from playerRooms
- Broadcast to remaining players

---

## Phase 3: Game Flow

### Test 3.1: Start Game
**Socket:** `room:start`

**Steps:**
1. Create room with 3+ players
2. Host starts game
3. Verify room state → 'playing'
4. Verify `room:started` event broadcasted
5. Verify game state initialized
6. Verify player hands dealt (5 cards each)
7. Verify first player's turn

**Expected:**
- Callback: `{ success: true }`
- Event: `room:started` with gameState
- Room state: 'playing'
- Each player has 5 cards
- First player's turn active

**Negative Cases:**
- Start with <3 players → `E_ROOM_MIN_PLAYERS`
- Non-host starts → `E_ROOM_NOT_HOST`
- Already started → `E_ROOM_START_IDEMPOTENT`

### Test 3.2: Submit Answer
**Socket:** `turn:answer`

**Steps:**
1. Game started, current player's turn
2. Submit answer
3. Verify answer stored
4. Verify phase → 'voting'
5. Verify `turn:answer-submitted` broadcasted
6. Verify `vote:phase-started` broadcasted

**Expected:**
- Callback: `{ success: true }`
- Event: `turn:answer-submitted`
- Event: `vote:phase-started`
- Phase: 'voting'

**Negative Cases:**
- Not your turn → `E_TURN_NOT_YOUR_TURN`
- Wrong phase → `E_TURN_BAD_PHASE`
- Already answered → `E_TURN_LOCKED`

### Test 3.3: Cast Vote
**Socket:** `vote:cast`

**Steps:**
1. Answer submitted, voting phase
2. Other players vote (accept/reject)
3. Verify votes recorded
4. Verify `vote:update` broadcasted
5. Test one "no" vote → immediate rejection
6. Test all "yes" votes → acceptance

**Expected:**
- Callback: `{ success: true, result: 'accepted'|'rejected'|'pending' }`
- Event: `vote:update` with votes
- One "no" → immediate rejection
- All "yes" → acceptance

**Negative Cases:**
- Vote on own answer → `E_VOTE_ANSWERER`
- Not voting phase → `E_VOTE_BAD_PHASE`

### Test 3.4: Turn Progression
**Flow:** Answer → Vote → Next Turn

**Steps:**
1. Player 1 answers → rejected
2. Verify turn advances to Player 2
3. Player 2 answers → accepted
4. Verify Player 2 continues (same player)
5. Verify progress incremented
6. Verify new question displayed

**Expected:**
- Rejection → next player's turn
- Acceptance → same player continues
- Progress +1 for accepted answer
- New question displayed

### Test 3.5: Win Condition
**Flow:** Progress reaches roundGoal

**Steps:**
1. Player reaches roundGoal (default 5)
2. Verify `game:end` event broadcasted
3. Verify winner data correct
4. Verify room state → 'ended'
5. Verify wins/losses updated in database

**Expected:**
- Event: `game:end` with winner
- Room state: 'ended'
- Winner's wins +1
- Losers' losses +1

---

## Phase 4: Power Cards

### Test 4.1: Skip Power Card
**Socket:** `power:use` with `type: 'Skip'`

**Steps:**
1. Player's turn (answering phase)
2. Use Skip power card
3. Verify turn advances immediately
4. Verify no voting occurs
5. Verify `game:state` broadcasted
6. Verify audit trail persisted

**Expected:**
- Callback: `{ success: true, result: 'turn_skipped' }`
- Turn advances to next player
- Event: `game:state` with updated turn
- PowerCardUsage record created

**Negative Cases:**
- Not your turn → `E_POWER_NOT_OWNER`
- Wrong phase → `E_POWER_BAD_STATE`
- Already used → `E_POWER_USED`

### Test 4.2: DoubleVote Power Card
**Socket:** `power:use` with `type: 'DoubleVote'`

**Steps:**
1. Player's turn (answering phase)
2. Use DoubleVote power card
3. Submit answer
4. Cast vote
5. Verify vote counts x2
6. Verify effect expires after turn

**Expected:**
- Callback: `{ success: true, result: 'double_vote_activated' }`
- Vote cast twice (counts x2)
- Effect expires when turn advances
- PowerCardUsage record created

### Test 4.3: Power Card Limits
**Test:** One per game per player

**Steps:**
1. Use Skip power card
2. Try to use DoubleVote → should fail
3. Try to use Skip again → should fail

**Expected:**
- First use succeeds
- Second use → `E_POWER_USED`

---

## Phase 5: UI Flow Tests

### Test 5.1: Login → Lobby Flow
**UI:** Login page → Lobby page

**Steps:**
1. Navigate to `/login`
2. Enter credentials
3. Submit form
4. Verify redirect to `/lobby`
5. Verify room list displayed
6. Verify user info displayed

**Expected:**
- Login form visible
- Successful login → redirect
- Lobby shows room list
- User name displayed

### Test 5.2: Create Room Flow
**UI:** Lobby → Create Room → GameRoom

**Steps:**
1. Click "إنشاء غرفة" button
2. Verify room created
3. Verify redirect to `/room/:roomId`
4. Verify room code displayed
5. Verify player list shows creator

**Expected:**
- Button click → room created
- Redirect to game room
- Room code visible
- Creator in player list

### Test 5.3: Join Room Flow
**UI:** Lobby → Join Room → GameRoom

**Steps:**
1. Enter room code
2. Click "انضم" button
3. Verify join success
4. Verify redirect to game room
5. Verify player added to list

**Expected:**
- Room code input works
- Join successful
- Redirect to game room
- Player count increased

### Test 5.4: Game Room UI Updates
**UI:** Real-time state updates

**Steps:**
1. Multiple players in room
2. Start game
3. Verify question displayed
4. Verify player hand displayed
5. Verify turn indicator highlights current player
6. Submit answer → verify answer input clears
7. Vote → verify vote buttons disabled after voting
8. Verify scores update in real-time

**Expected:**
- Question visible
- Hand displayed (5 cards)
- Current player highlighted
- UI updates match socket events
- Scores update automatically

### Test 5.5: Power Cards UI
**UI:** Power card buttons

**Steps:**
1. Player's turn
2. Verify power card buttons visible
3. Click Skip → verify turn advances
4. Click DoubleVote → verify effect activated
5. Verify buttons disabled after use

**Expected:**
- Buttons visible during own turn
- Click triggers socket event
- UI updates after use
- Buttons disabled after use

---

## Phase 6: Error Handling

### Test 6.1: Socket Connection Errors
**Scenario:** Invalid token, expired token

**Steps:**
1. Connect with invalid token
2. Verify connection rejected
3. Connect with expired token
4. Verify refresh attempted

**Expected:**
- Invalid token → connection error
- Expired token → auto-refresh or redirect

### Test 6.2: Network Interruption
**Scenario:** Disconnect during game

**Steps:**
1. Start game
2. Disconnect network
3. Reconnect
4. Verify state resync
5. Verify player can continue

**Expected:**
- Disconnect detected
- Reconnection successful
- State restored
- Game continues

### Test 6.3: Error Messages Display
**UI:** Error toast notifications

**Steps:**
1. Trigger various errors (full room, not your turn, etc.)
2. Verify error messages displayed
3. Verify messages in Arabic
4. Verify messages dismiss after timeout

**Expected:**
- Errors shown as toasts
- Messages in Arabic
- Auto-dismiss after 3 seconds

---

## Phase 7: Edge Cases

### Test 7.1: Concurrent Actions
**Scenario:** Multiple players act simultaneously

**Steps:**
1. Multiple players join room simultaneously
2. Multiple players vote simultaneously
3. Verify no race conditions
4. Verify state consistency

**Expected:**
- All joins processed correctly
- Votes recorded correctly
- No state corruption

### Test 7.2: Room Capacity
**Scenario:** 8-player maximum

**Steps:**
1. Fill room to 8 players
2. Attempt to join 9th player
3. Verify rejection with `E_ROOM_FULL`
4. Start game with 8 players
5. Verify game works correctly

**Expected:**
- 8 players max enforced
- 9th player rejected
- Game works with 8 players

### Test 7.3: Minimum Players
**Scenario:** 3-player minimum

**Steps:**
1. Create room with 2 players
2. Attempt to start game
3. Verify rejection with `E_ROOM_MIN_PLAYERS`
4. Add 3rd player
5. Verify game can start

**Expected:**
- Start blocked with <3 players
- Start succeeds with 3+ players

---

## Test Execution Checklist

- [ ] Phase 1: Authentication Flow (4 tests)
- [ ] Phase 2: Room Management Flow (5 tests)
- [ ] Phase 3: Game Flow (5 tests)
- [ ] Phase 4: Power Cards (3 tests)
- [ ] Phase 5: UI Flow Tests (5 tests)
- [ ] Phase 6: Error Handling (3 tests)
- [ ] Phase 7: Edge Cases (3 tests)

**Total: 28 test scenarios**

---

## Test Results Template

```markdown
## Test Results - [Date]

### Phase 1: Authentication Flow
- [ ] Test 1.1: User Registration ✅/❌
- [ ] Test 1.2: User Login ✅/❌
- [ ] Test 1.3: Token Refresh ✅/❌
- [ ] Test 1.4: Get Current User ✅/❌

### Phase 2: Room Management Flow
- [ ] Test 2.1: Create Room (REST) ✅/❌
- [ ] Test 2.2: Create Room (Socket) ✅/❌
- [ ] Test 2.3: List Rooms ✅/❌
- [ ] Test 2.4: Join Room ✅/❌
- [ ] Test 2.5: Leave Room ✅/❌

### Phase 3: Game Flow
- [ ] Test 3.1: Start Game ✅/❌
- [ ] Test 3.2: Submit Answer ✅/❌
- [ ] Test 3.3: Cast Vote ✅/❌
- [ ] Test 3.4: Turn Progression ✅/❌
- [ ] Test 3.5: Win Condition ✅/❌

### Phase 4: Power Cards
- [ ] Test 4.1: Skip Power Card ✅/❌
- [ ] Test 4.2: DoubleVote Power Card ✅/❌
- [ ] Test 4.3: Power Card Limits ✅/❌

### Phase 5: UI Flow Tests
- [ ] Test 5.1: Login → Lobby Flow ✅/❌
- [ ] Test 5.2: Create Room Flow ✅/❌
- [ ] Test 5.3: Join Room Flow ✅/❌
- [ ] Test 5.4: Game Room UI Updates ✅/❌
- [ ] Test 5.5: Power Cards UI ✅/❌

### Phase 6: Error Handling
- [ ] Test 6.1: Socket Connection Errors ✅/❌
- [ ] Test 6.2: Network Interruption ✅/❌
- [ ] Test 6.3: Error Messages Display ✅/❌

### Phase 7: Edge Cases
- [ ] Test 7.1: Concurrent Actions ✅/❌
- [ ] Test 7.2: Room Capacity ✅/❌
- [ ] Test 7.3: Minimum Players ✅/❌

**Summary:**
- Passed: X/28
- Failed: Y/28
- Success Rate: Z%
```

