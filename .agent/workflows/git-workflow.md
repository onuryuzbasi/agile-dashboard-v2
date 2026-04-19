---
description: Git branching workflow for feature development
---

# Git Workflow

## Branch Naming
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Code refactoring

## Process (Auto-managed)
// turbo-all

1. Create feature branch from main:
   ```bash
   git checkout main && git pull
   git checkout -b feature/<name>
   ```

2. Make commits with clear messages

3. Push branch and create PR:
   ```bash
   git push -u origin feature/<name>
   gh pr create --title "<title>" --body "<description>"
   ```

4. Auto-merge after verification:
   ```bash
   gh pr merge --squash
   ```

5. Delete the feature branch after merge

## Rollback Commands

If user asks to revert to a previous state:

```bash
# View commit history
git log --oneline -20

# Revert to specific commit
git revert <commit-hash>

# Or reset to previous state (destructive)
git reset --hard <commit-hash>
git push --force
```

**All commits are preserved in git history for easy rollback.**
