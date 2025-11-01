# Deployment Guide - الميدان يا حميدان

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (optional, for SSL)
- MySQL database (or use Docker Compose)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd almaydan-ya-7maidan
```

### 2. Configure Environment
```bash
cp .env.production.example .env.production
# Edit .env.production with your values
```

### 3. Generate SSL Certificates (Optional)
```bash
# Using Let's Encrypt
certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### 4. Build and Start Services
```bash
docker-compose up -d --build
```

### 5. Initialize Database
```bash
# Run migrations
docker-compose exec backend npm run prisma:migrate deploy

# Seed database
docker-compose exec backend npm run prisma:seed
```

### 6. Verify Deployment
```bash
# Check health
curl http://localhost/api/health

# Check logs
docker-compose logs -f
```

## Production Configuration

### Environment Variables

Required variables in `.env.production`:

```bash
# Database
MYSQL_ROOT_PASSWORD=<secure_password>
MYSQL_DATABASE=almaydan_db
MYSQL_USER=almaydan_user
MYSQL_PASSWORD=<secure_password>

# Backend
JWT_SECRET=<min_32_chars_secret>
JWT_REFRESH_SECRET=<min_32_chars_secret>
DATABASE_URL=mysql://almaydan_user:<password>@mysql:3306/almaydan_db

# Frontend
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
VITE_SOCKET_URL=https://yourdomain.com
```

### SSL Configuration

1. **Let's Encrypt (Recommended)**
   ```bash
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Self-Signed (Development)**
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/key.pem \
     -out nginx/ssl/cert.pem
   ```

### Database Backup

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} almaydan_db > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} almaydan_db < backup.sql
```

## Monitoring

### Health Checks

- Backend: `http://localhost/api/health`
- Frontend: `http://localhost`
- Database: `docker-compose exec mysql mysqladmin ping`

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Performance Monitoring

```bash
# Container stats
docker stats

# Database connections
docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW PROCESSLIST;"
```

## Updates

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend npm run prisma:migrate deploy
```

### Update Dependencies

```bash
# Backend
cd backend
npm update
docker-compose restart backend

# Frontend
cd frontend
npm update
docker-compose up -d --build frontend
```

## Troubleshooting

### Backend Not Starting

1. Check database connection:
   ```bash
   docker-compose exec backend node -e "console.log(process.env.DATABASE_URL)"
   ```

2. Check logs:
   ```bash
   docker-compose logs backend
   ```

### Frontend Not Loading

1. Check build:
   ```bash
   docker-compose exec frontend ls -la /usr/share/nginx/html
   ```

2. Check nginx:
   ```bash
   docker-compose logs nginx
   ```

### Database Connection Issues

1. Verify MySQL is running:
   ```bash
   docker-compose ps mysql
   ```

2. Test connection:
   ```bash
   docker-compose exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;"
   ```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Monitor logs for suspicious activity
- [ ] Set up rate limiting (configured in nginx)

## Scaling

### Horizontal Scaling (Multiple Backend Instances)

Update `docker-compose.yml`:

```yaml
backend:
  deploy:
    replicas: 3
```

Use load balancer (nginx upstream already configured).

### Database Scaling

For production, consider:
- MySQL master-slave replication
- Connection pooling
- Read replicas for queries

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review deployment guide
3. Check GitHub issues
4. Contact support team

