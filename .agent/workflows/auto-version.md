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

## Auto-Commit Steps

### Step 1: Check for changes
```bash
git status --porcelain
```
If there are no changes, skip the rest of the workflow.

### Step 2: Read current version
```bash
cat VERSION 2>/dev/null || echo "1.0.0"
```

### Step 3: Increment version
Increment the PATCH version by default. For new features, increment MINOR. For breaking changes, increment MAJOR.

### Step 4: Update VERSION file
Write the new version to the VERSION file.

### Step 5: Stage all changes
```bash
git add .
```

### Step 6: Commit with version
```bash
git commit -m "v{VERSION}: {task description}"
```

### Step 7: Push to remote
```bash
git push origin main
```

### Step 8: Create git tag (optional, for major releases)
```bash
git tag v{VERSION}
git push --tags
```

## Commit Message Format
- `v1.2.3: Add new feature X` - Feature additions
- `v1.2.4: Fix bug in Y` - Bug fixes
- `v1.2.5: Update styling for Z` - Style changes
- `v1.2.6: Refactor component W` - Refactoring

## Example Workflow Execution

1. Complete task implementation
2. Run: `git status --porcelain` → Changes detected
3. Read: `cat VERSION` → "1.2.5"
4. Increment: "1.2.5" → "1.2.6"
5. Update VERSION file with "1.2.6"
6. Run: `git add .`
7. Run: `git commit -m "v1.2.6: Implement search functionality"`
8. Run: `git push origin main`
9. Notify user of completion

## Notes
- Always run commands one by one, not chained with &&
- This workflow is marked with `// turbo-all` so all commands auto-run
- Version increments are cumulative across tasks
