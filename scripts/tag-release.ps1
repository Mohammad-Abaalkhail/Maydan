# Tag Release Script (PowerShell)
# Usage: .\scripts\tag-release.ps1 v1.0-milestone

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

# Check if git repository
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: v1.0-milestone"
}

# Create tag
Write-Host "Creating tag: $Version"
git tag -a $Version -m "Release $Version: Core game functionality, Socket.IO, Power Cards, and frontend integration complete"

# Show tag
git tag -l $Version

Write-Host "✅ Tag $Version created successfully"
Write-Host "To push tags: git push origin $Version"

