#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-db.sh [backup-name]

BACKUP_NAME=${1:-backup_$(date +%Y%m%d_%H%M%S)}
BACKUP_DIR="./backups"
CONTAINER_NAME=${MYSQL_CONTAINER:-almaydan-mysql-staging}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "Creating backup: $BACKUP_NAME"
docker exec "$CONTAINER_NAME" mysqldump \
  -u "${MYSQL_USER:-root}" \
  -p"${MYSQL_PASSWORD}" \
  "${MYSQL_DATABASE:-almaydan_db}" \
  > "$BACKUP_DIR/$BACKUP_NAME.sql"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_NAME.sql"

echo "✅ Backup created: $BACKUP_DIR/$BACKUP_NAME.sql.gz"

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz | tail -5

