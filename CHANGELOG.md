# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-milestone] - 2025-01-11

### Added
- **Backend**
  - Express.js REST API with JWT authentication
  - Socket.IO real-time game server
  - Prisma ORM with MySQL database
  - User registration, login, and token refresh
  - Room management (create, join, leave, list)
  - Game flow (start, answer, vote, turn progression)
  - Power cards (Skip, DoubleVote)
  - Admin CRUD API for categories, cards, questions
  - Error code standardization
  - Comprehensive test suite (11 test cases)

- **Frontend**
  - React + Vite application
  - Tailwind CSS with Arabic RTL support
  - JWT authentication with auto-refresh
  - Socket.IO real-time connection
  - Login and Register pages
  - Lobby page (room list, create, join)
  - Game Room page (real-time game state)
  - Power card UI components
  - Toast notification system
  - Responsive design (mobile, tablet, desktop)

- **Infrastructure**
  - Docker Compose configuration
  - Nginx reverse proxy with SSL support
  - CI/CD pipeline (GitHub Actions)
  - Integration test plan
  - Deployment documentation

### Features
- ✅ Multiplayer card game (3-8 players)
- ✅ Real-time game state synchronization
- ✅ Power cards (Skip, DoubleVote)
- ✅ Progress-based win condition
- ✅ One "no" vote rejection rule
- ✅ Card uniqueness per round
- ✅ Turn-based gameplay
- ✅ Arabic UI and messages
- ✅ RTL support
- ✅ Responsive design

### Technical Details
- Backend: Node.js 18, Express 4.18, Socket.IO 4.6
- Frontend: React 18, Vite 5, Tailwind CSS 3
- Database: MySQL 8.0 with Prisma 5.7
- Authentication: JWT (access + refresh tokens)
- Deployment: Docker Compose, Nginx, SSL

### Testing
- 11 socket simulation tests
- Integration test plan (28 scenarios)
- CI pipeline with automated tests
- Error handling validation

### Documentation
- API documentation (EVENTS.md)
- Game rules documentation
- Test plans and results
- Deployment guide
- README files

---

## [Unreleased]

### Planned
- UX polish and improvements
- Arabic localization QA
- Performance optimizations
- Additional power cards
- Admin panel UI
- Mobile app (future)

