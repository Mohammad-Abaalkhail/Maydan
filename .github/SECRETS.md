# GitHub Actions Secrets Configuration

## Required Secrets

Configure these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

### Backend Secrets

```
JWT_SECRET
- Description: Secret key for JWT access tokens
- Format: Base64 or random string (min 32 characters)
- Example: openssl rand -base64 32

JWT_REFRESH_SECRET
- Description: Secret key for JWT refresh tokens
- Format: Base64 or random string (min 32 characters)
- Example: openssl rand -base64 32

ACCESS_TOKEN_TTL
- Description: Access token expiry time
- Format: Time string (e.g., "15m", "1h")
- Default: "15m"

REFRESH_TOKEN_TTL
- Description: Refresh token expiry time
- Format: Time string (e.g., "7d", "30d")
- Default: "7d"
```

### Database Secrets

```
DATABASE_URL
- Description: MySQL connection string for CI/testing
- Format: mysql://user:password@host:port/database
- Example: mysql://root:testpassword@localhost:3306/test_db

MYSQL_ROOT_PASSWORD
- Description: MySQL root password for CI
- Format: Plain text password
- Example: testpassword_ci_2024

MYSQL_USER
- Description: MySQL application user
- Format: Plain text username
- Example: almaydan_user

MYSQL_PASSWORD
- Description: MySQL application password
- Format: Plain text password
- Example: secure_app_password_2024
```

### Frontend Secrets

```
VITE_API_URL
- Description: Backend API URL for frontend build
- Format: Full URL
- Example: https://api.staging.almaydan.com

VITE_SOCKET_URL
- Description: Socket.IO server URL for frontend build
- Format: Full URL
- Example: https://api.staging.almaydan.com
```

### CORS Origins

```
CORS_ORIGINS
- Description: Allowed frontend origins for CORS (comma-separated)
- Format: Comma-separated URLs (no trailing slash)
- Example: https://staging.almaydan.com,https://app.almaydan.com

WS_ORIGINS
- Description: Allowed origins for Socket.IO CORS (comma-separated)
- Format: Comma-separated URLs (no trailing slash)
- Example: https://staging.almaydan.com,https://app.almaydan.com
```

### Staging Deployment

```
STAGING_HOST
- Description: Staging server hostname/IP
- Format: Hostname or IP
- Example: staging.almaydan.com

STAGING_SSH_KEY
- Description: SSH private key for staging server
- Format: Private key content (multiline)
- Example: (Paste full SSH private key)

STAGING_USER
- Description: SSH user for staging deployment
- Format: Username
- Example: deploy
```

### Observability

```
SENTRY_DSN_BACKEND
- Description: Sentry DSN for backend error tracking
- Format: Sentry DSN URL
- Example: https://xxx@sentry.io/xxx

SENTRY_DSN_FRONTEND
- Description: Sentry DSN for frontend error tracking
- Format: Sentry DSN URL
- Example: https://xxx@sentry.io/xxx
```

### Rate Limiting

```
RATE_LIMIT_WINDOW_MS
- Description: Rate limit time window in milliseconds
- Format: Number (milliseconds)
- Default: 900000 (15 minutes)
- Example: 900000

RATE_LIMIT_MAX
- Description: Maximum requests per window
- Format: Number
- Default: 100
- Example: 100
```

### Monitoring

```
UPTIME_PROBE_URL
- Description: URL for uptime monitoring
- Format: Full URL
- Example: https://staging.almaydan.com/api/health
```

## Setup Instructions

### 1. Generate Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# Generate database password
openssl rand -base64 24  # For MYSQL_PASSWORD
```

### 2. Add Secrets to GitHub

1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with exact name from above
4. Save secrets

### 3. Verify Secrets in CI

Secrets are automatically available in GitHub Actions workflows as environment variables:

```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Security Notes

- ✅ Never commit secrets to repository
- ✅ Use different secrets for staging/production
- ✅ Rotate secrets regularly
- ✅ Use GitHub Secrets for all sensitive data
- ✅ Review secret access logs periodically

## Secret Rotation

To rotate secrets:

1. Generate new secret value
2. Update secret in GitHub repository settings
3. Update application configuration
4. Restart services
5. Verify application works with new secret
6. Mark old secret as deprecated

