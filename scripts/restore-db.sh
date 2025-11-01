#!/bin/bash

# Database Restore Script
# Usage: ./scripts/restore-db.sh <backup-file.sql.gz>

BACKUP_FILE=$1
CONTAINER_NAME=${MYSQL_CONTAINER:-almaydan-mysql-staging}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./scripts/restore-db.sh <backup-file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Decompress and restore
echo "Restoring from: $BACKUP_FILE"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" mysql \
      -u "${MYSQL_USER:-root}" \
      -p"${MYSQL_PASSWORD}" \
      "${MYSQL_DATABASE:-almaydan_db}"
else
    docker exec -i "$CONTAINER_NAME" mysql \
      -u "${MYSQL_USER:-root}" \
      -p"${MYSQL_PASSWORD}" \
      "${MYSQL_DATABASE:-almaydan_db}" \
      < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully"

