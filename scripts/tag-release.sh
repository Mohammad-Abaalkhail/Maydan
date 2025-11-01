#!/bin/bash

# Tag Release Script
# Usage: ./scripts/tag-release.sh v1.0-milestone

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: ./scripts/tag-release.sh <version>"
    echo "Example: ./scripts/tag-release.sh v1.0-milestone"
    exit 1
fi

# Check if git repository
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: v1.0-milestone"
fi

# Create tag
echo "Creating tag: $VERSION"
git tag -a "$VERSION" -m "Release $VERSION: Core game functionality, Socket.IO, Power Cards, and frontend integration complete"

# Show tag
git tag -l "$VERSION"

echo "✅ Tag $VERSION created successfully"
echo "To push tags: git push origin $VERSION"

