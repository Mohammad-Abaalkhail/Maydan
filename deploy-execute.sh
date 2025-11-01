#!/bin/bash
# Direct deployment execution

export REPO_URL="https://github.com/Mohammad-Abaalkhail/Maydan.git"
export JWT_SECRET="XdvyNs1K0ChtQukcUZpF8RrfoJ6YgIHEWba4i5Ol2qm9TDLSVxnPMGz7wje3BA"
export DATABASE_URL="mysql://almaydan_user:rndmbKxvUqYe4tpVWaf5OGP7s2yzgB6LMC9HhDc0SZk8X3wuEIJFlTo1AQjNiR@mysql:3306/almaydan_db"

HOST=72.61.84.181
SSH_USER=root

echo "🚀 Executing deployment to $HOST..."
echo "Repository: $REPO_URL"
echo ""

# Execute deployment script via SSH
ssh "$SSH_USER@$HOST" 'bash -s' < DEPLOY_NOW_COMPLETE.sh

