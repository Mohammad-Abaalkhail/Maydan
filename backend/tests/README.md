# Socket.IO Test Suite

## Overview

This test suite validates the Socket.IO game flow with comprehensive positive and negative test cases.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Database seeded with test data (`npm run prisma:seed`)
3. Dependencies installed (`npm install`)

## Running Tests

### Local Execution

```bash
cd backend
npm run test:socket
```

### CI Execution

The test script is designed to work in CI environments. Set environment variables:

```bash
export SERVER_URL=http://localhost:3000
npm run test:socket
```

## Test Cases

### Core Game Flow
1. **Basic Game Flow (4 players)** - Room creation, joining, game start
2. **Join Full Room (Negative)** - Validates `E_ROOM_FULL` error
3. **Unauthenticated Connection (Negative)** - Validates `E_AUTH_401` error
4. **Duplicate Vote (Negative)** - Vote override behavior
5. **8-Player Load Test** - Maximum capacity validation
6. **Reconnection and State Resync** - Player disconnect/reconnect
7. **Idempotent room:start** - Multiple start calls

### Power Cards
8. **Power Card Use Twice (Negative)** - Validates `E_POWER_USED` error
9. **Power Card Wrong Timing (Negative)** - Validates `E_POWER_NOT_OWNER` error
10. **DoubleVote Decay** - Validates DoubleVote expires after one turn
11. **Skip Min Players** - Skip works with minimum 3 players

## Power Cards Demo Script

### Skip Power Card
```javascript
// Player uses Skip during their turn
socket.emit('power:use', {
  roomId: 'room-id',
  type: 'Skip'
}, (response) => {
  if (response.success) {
    console.log('Turn skipped, moving to next player');
  }
});

// Expected: Turn advances immediately, no voting occurs
```

### DoubleVote Power Card
```javascript
// Player activates DoubleVote during their turn
socket.emit('power:use', {
  roomId: 'room-id',
  type: 'DoubleVote'
}, (response) => {
  if (response.success) {
    console.log('DoubleVote activated for next vote');
  }
});

// Player submits answer
socket.emit('turn:answer', {
  roomId: 'room-id',
  answer: 'My answer'
});

// When voting, player's vote counts x2
socket.emit('vote:cast', {
  roomId: 'room-id',
  vote: true
}, (response) => {
  // Vote counts twice (handled server-side)
});
```

### Error Cases
```javascript
// Try to use power card twice (should fail)
socket.emit('power:use', { roomId: 'room-id', type: 'Skip' });
socket.emit('power:use', { roomId: 'room-id', type: 'Skip' });
// Expected: E_POWER_USED error

// Try to use during voting phase (should fail)
socket.emit('turn:answer', { roomId: 'room-id', answer: 'Answer' });
socket.emit('power:use', { roomId: 'room-id', type: 'Skip' });
// Expected: E_POWER_BAD_STATE error

// Try to use when not your turn (should fail)
socket.emit('power:use', { roomId: 'room-id', type: 'Skip' });
// Expected: E_POWER_NOT_OWNER error
```

## Expected Output

```
🚀 Starting Socket.IO Test Suite

============================================================

🧪 Test 1: Basic Game Flow (4 players)
✅ Basic Game Flow

🧪 Test 2: Join Full Room (Negative)
✅ Join Full Room

🧪 Test 3: Unauthenticated Connection (Negative)
✅ Unauthenticated Connection

🧪 Test 4: Duplicate Vote (Negative)
✅ Duplicate Vote

🧪 Test 5: 8-Player Load Test
✅ 8-Player Load Test

🧪 Test 6: Reconnection and State Resync
✅ Reconnection and State Resync

🧪 Test 7: Idempotent room:start
✅ Idempotent room:start

============================================================

📊 Test Summary:
✅ Passed: 7
❌ Failed: 0
📈 Success Rate: 100.0%
```

## Test Coverage

- ✅ Room creation and joining
- ✅ Capacity enforcement (3-8 players)
- ✅ Authentication validation
- ✅ Game flow initialization
- ✅ Vote casting and override
- ✅ Reconnection handling
- ✅ Idempotent operations
- ✅ Error code standardization

## Troubleshooting

### Connection Errors
- Ensure backend server is running
- Check `SERVER_URL` environment variable
- Verify database connection

### Authentication Errors
- Ensure test users can be created
- Check JWT token generation

### Room Errors
- Ensure database is seeded
- Check category IDs match seed data

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run Socket.IO Tests
  run: |
    cd backend
    npm install
    npm run prisma:generate
    npm run prisma:migrate
    npm run prisma:seed
    npm run test:socket
```

