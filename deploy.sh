#!/usr/bin/env sh

# Stop script if any command fails
set -e

# Build the site
npm run docs:build

# Go to the build output directory
cd docs/.vitepress/dist

# Prevent Jekyll processing
touch .nojekyll

# Remove previous Git data
rm -rf .git 

# Initialize a new Git repo
git init

# Add remote using SSH if not already set
git remote get-url origin 2>/dev/null || git remote add origin git@github.com:jerrywiltz/nP.git

# Create/switch to gh-pages branch
git checkout -B gh-pages

# Commit and push
git add -A
git commit -m 'Deploy VitePress site'
git push -f origin gh-pages

# Return to original directory
cd -

