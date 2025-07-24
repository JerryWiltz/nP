#!/usr/bin/env sh

# Stop script if any command fails
set -e

# Build the site
npm run docs:build

# Go to the build output directory
cd docs/.vitepress/dist

# Add .nojekyll to prevent GitHub Pages from using Jekyll
touch .nojekyll

# Initialize a new Git repo
git init

# Add remote only if it doesn't exist
git remote get-url origin 2>/dev/null || git remote add origin https://github.com/jerrywiltz/nP.git

# Use -B to safely switch/create gh-pages branch
git checkout -B gh-pages

git add -A
git commit -m 'Deploy VitePress site'

# Force push to gh-pages branch
git push -f origin gh-pages

# Return to original directory
cd -
