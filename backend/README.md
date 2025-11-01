# Backend - الميدان يا حميدان

Backend server for the Arabic multiplayer card game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials and secrets.

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npm run prisma:seed
```

## Development

Run with nodemon for auto-reload:
```bash
npm run dev
```

## Production

Start the server:
```bash
npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/version` - Version information

More endpoints will be added as development progresses.

