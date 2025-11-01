# الميدان يا حميدان (Almaydan Ya 7maidan)

An online Arabic multiplayer card game for 3-8 players, focused on Kuwaiti culture.

## 🎮 Game Overview

الميدان يا حميدان is a card-based multiplayer game where players answer questions using cards from their hand. Players vote on answers, and the first player to reach the goal progress wins.

## ✨ Features

- **Multiplayer**: 3-8 players per room
- **Real-time**: Socket.IO for instant updates
- **Power Cards**: Skip and DoubleVote abilities
- **Arabic UI**: Full Arabic interface with RTL support
- **Responsive**: Works on iOS, Android, and PC
- **Kuwaiti Culture**: Content focused on Kuwaiti traditions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Development Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd almaydan-ya-7maidan
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URLs
   npm run dev
   ```

4. **Access application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health: http://localhost:3000/api/health

## 📦 Production Deployment

### Using Docker Compose

1. **Configure environment**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your values
   ```

2. **Start services**
   ```bash
   docker-compose up -d --build
   ```

3. **Initialize database**
   ```bash
   docker-compose exec backend npm run prisma:migrate deploy
   docker-compose exec backend npm run prisma:seed
   ```

See [deployment/README.md](deployment/README.md) for detailed deployment guide.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test:socket
```

### Integration Tests
See [tests/integration/test-plan.md](tests/integration/test-plan.md) for comprehensive test plan.

### CI Pipeline
CI pipeline runs automatically on push/PR:
- Lint code
- Backend tests
- Build frontend
- Socket.IO simulation tests

## 📁 Project Structure

```
almaydan-ya-7maidan/
├── backend/          # Node.js backend (Express + Socket.IO)
├── frontend/         # React frontend (Vite)
├── docs/            # Documentation
├── tests/           # Test files
├── deployment/      # Deployment configs
├── nginx/          # Nginx configuration
└── docker-compose.yml
```

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=mysql://user:password@localhost:3306/dbname
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## 📚 Documentation

- [Game Rules](docs/game-rules-v3.2.md)
- [Socket.IO Events](docs/EVENTS.md)
- [Integration Test Plan](tests/integration/test-plan.md)
- [Deployment Guide](deployment/README.md)
- [API Documentation](docs/EVENTS.md)

## 🎯 Current Version

**v1.0-milestone** - Core functionality complete

- ✅ Backend API and Socket.IO
- ✅ Frontend React application
- ✅ Power Cards (Skip, DoubleVote)
- ✅ Real-time game state
- ✅ Arabic UI

## 🛣️ Roadmap

- [ ] UX polish and improvements
- [ ] Arabic localization QA
- [ ] Performance optimizations
- [ ] Additional power cards
- [ ] Admin panel UI
- [ ] Mobile app (future)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

ISC

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- Kuwaiti cultural content contributors
- Game design inspiration

---

**الميدان يا حميدان** - Bringing Kuwaiti culture to digital gaming! 🎮🇰🇼
