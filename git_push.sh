#!/bin/bash
# Auto-commit and push script for Agile Dashboard
# Run this script to commit all changes and push to GitHub

cd "/Users/onuryuzbasioglu/Desktop/Agile Dashboard"

echo "=== Git Status ==="
git status

echo ""
echo "=== Adding all changes ==="
git add -A

echo ""
echo "=== Committing changes ==="
git commit -m "feat(v20260116): add editable cells for Story Points, Reporter, Department, Estimate, Labels columns"

echo ""
echo "=== Pushing to GitHub ==="
git push origin main

echo ""
echo "=== Done! ==="
