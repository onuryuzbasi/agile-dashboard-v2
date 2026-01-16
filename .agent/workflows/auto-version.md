---
description: Auto-push workflow using browser-based GitHub API (workaround for terminal issues)
---

# Auto-Version and Push Workflow

This workflow triggers at the end of each completed task to commit and push changes to GitHub.

## When to Trigger
- After completing a feature implementation
- After fixing a bug
- After significant code changes
- At the end of each task before notifying user

## Repository Details
- **Repo**: `agile-dashboard-v2`
- **Owner**: `onuryuzbasi`
- **Token**: Configured in `.git/config`
- **URL**: https://github.com/onuryuzbasi/agile-dashboard-v2

## Push Method (Browser-based)

Since terminal commands may not execute properly, use the browser subagent to push via GitHub API:

### Step 1: Commit locally (via file edit)
Edit `.git/COMMIT_EDITMSG` with the commit message, then use `git commit --file=.git/COMMIT_EDITMSG`

### Step 2: Ask user to push
Provide this command for user to run:
```bash
cd ~/Desktop/Agile\ Dashboard && git add -A && git commit -m "feat: description" && git push
```

### Step 3: Verify via browser
Use browser_subagent to navigate to the repository and verify the push succeeded.

## Commit Message Format
- `feat(vYYYYMMDD): description` - New feature
- `fix(vYYYYMMDD): description` - Bug fix
- `refactor: description` - Code cleanup
- `style: description` - CSS/styling changes

## Checkpoints for Auto-Push
1. Feature implementation complete
2. Bug fix verified working
3. UI enhancement tested
4. Before notifying user of task completion

## Fallback
If push fails, ask user to run the git push command manually - it only takes 2 seconds.
