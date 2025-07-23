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
git add -A
git commit -m 'Deploy VitePress site'

# Force push to gh-pages branch of your repo
git push -f https://github.com/jerrywiltz/nP.git master:gh-pages

# Return to the original directory
cd -
