#!/usr/bin/env bash

# ================================
# Cleanup tracked files ignored by .gitignore
# ================================

echo "🔍 Finding tracked files matching .gitignore ..."

# List tracked files that match .gitignore
IGNORED_FILES=$(git ls-files -i -c --exclude-from=.gitignore)

if [ -z "$IGNORED_FILES" ]; then
    echo "✅ No tracked files match .gitignore. Nothing to clean."
    exit 0
fi

echo "🗑️ Untracking the following files:"
echo "$IGNORED_FILES"

# Remove the tracked files from Git's index (but keep them on disk)
git ls-files -i -c --exclude-from=.gitignore -z | xargs -0 git rm --cached

# Commit the cleanup
echo "📦 Committing changes..."
git commit -m "Stop tracking files ignored by .gitignore"

echo "🎉 Cleanup complete!"
