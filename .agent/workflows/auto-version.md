---
description: Automatically commit and push with version numbers after each completed task
---

# Auto-Version and Push Workflow

// turbo-all

This workflow triggers automatically at the end of each completed task to commit and push changes to GitHub with incremental version numbers.

## When to Trigger
- After completing any task
- Before notifying user of task completion
- After bug fixes, feature implementations, or any code changes

## Repository Details
- **Repo**: `agile-dashboard-v2`
- **Owner**: `onuryuzbasi`
- **URL**: https://github.com/onuryuzbasi/agile-dashboard-v2

## Version Tracking

A `VERSION` file in the project root tracks the current version using semantic versioning (MAJOR.MINOR.PATCH):
- **PATCH**: Bug fixes, small changes, styling updates
- **MINOR**: New features, significant enhancements
- **MAJOR**: Breaking changes, major rewrites

## CRITICAL: Auto-Increment Rule

**NEVER manually set the version number.** Always read the current VERSION file and increment from it:
- Read current version: `cat VERSION`
- Increment PATCH by 1 (default)
- For new features, increment MINOR and reset PATCH to 0
- For breaking changes, increment MAJOR and reset MINOR and PATCH to 0

## Auto-Commit Steps

### Step 1: Check for changes
```bash
git status --porcelain
```
If there are no changes, skip the rest of the workflow.

### Step 2: Read current version and auto-increment
```bash
CURRENT=$(cat VERSION 2>/dev/null || echo "1.0.0") && MAJOR=$(echo $CURRENT | cut -d. -f1) && MINOR=$(echo $CURRENT | cut -d. -f2) && PATCH=$(echo $CURRENT | cut -d. -f3) && NEW_PATCH=$((PATCH + 1)) && NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH" && echo $NEW_VERSION > VERSION && echo "Version: $CURRENT → $NEW_VERSION"
```

### Step 3: Stage all changes
```bash
git add .
```

### Step 4: Commit with version
```bash
git commit -m "v{NEW_VERSION}: {task description}"
```

### Step 5: Push to remote
```bash
git push origin main
```

## Commit Message Format
- `v3.2.7: Add new feature X` - Feature additions
- `v3.2.8: Fix bug in Y` - Bug fixes
- `v3.3.0: Major new module Z` - New features (MINOR bump)

## Notes
- **NEVER hardcode a version number** — always read from VERSION and increment
- Always run commands one by one, not chained with &&
- This workflow is marked with `// turbo-all` so all commands auto-run
- Version increments are cumulative across tasks
