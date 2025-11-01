#!/bin/bash

# Create staging basic auth file
# Usage: ./scripts/create-staging-auth.sh [username] [password]

USERNAME=${1:-staging}
PASSWORD=${2:-staging123}

# Create auth directory
mkdir -p nginx/auth

# Create .htpasswd file using htpasswd or openssl
if command -v htpasswd &> /dev/null; then
    htpasswd -bc nginx/auth/.htpasswd "$USERNAME" "$PASSWORD"
else
    # Fallback using openssl
    echo "$(openssl passwd -apr1 $PASSWORD)" > nginx/auth/.htpasswd
    echo "$USERNAME:$(openssl passwd -apr1 $PASSWORD)" > nginx/auth/.htpasswd
fi

echo "✅ Staging auth created: nginx/auth/.htpasswd"
echo "Username: $USERNAME"
echo "Password: $PASSWORD"

