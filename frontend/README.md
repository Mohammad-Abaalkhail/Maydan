# Frontend - الميدان يا حميدان

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your backend URL:
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

4. Start development server:
```bash
npm run dev
```

## Features

### Pages
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user registration
- **Lobby** (`/lobby`) - Room list, create/join rooms
- **GameRoom** (`/room/:roomId`) - Real-time game interface

### Components
- **StatusToast** - Toast notifications for user feedback
- **ProtectedRoute** - Route guard for authenticated pages

### Hooks
- **useAuth** - Authentication context and functions
- **useSocket** - Socket.IO connection management

### Features Implemented
- ✅ JWT authentication with token refresh
- ✅ Socket.IO real-time connection
- ✅ Room creation and joining
- ✅ Real-time game state updates
- ✅ Answer submission
- ✅ Voting system
- ✅ Power cards (Skip, DoubleVote)
- ✅ Player hand display
- ✅ Turn indicators
- ✅ Score tracking
- ✅ Arabic RTL support

## Socket Events

### Client → Server
- `room:create` - Create new room
- `room:join` - Join existing room
- `room:leave` - Leave room
- `room:start` - Start game (host only)
- `turn:answer` - Submit answer
- `vote:cast` - Cast vote
- `power:use` - Use power card

### Server → Client
- `room:created` - Room created successfully
- `room:updated` - Room state updated
- `room:started` - Game started
- `game:state` - Game state update
- `turn:answer-submitted` - Answer submitted
- `vote:phase-started` - Voting phase started
- `vote:update` - Vote update
- `vote:result` - Vote result
- `game:end` - Game ended

## Build

```bash
npm run build
```

Build output will be in `dist/` directory.

