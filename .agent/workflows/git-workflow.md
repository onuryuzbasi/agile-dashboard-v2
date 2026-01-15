---
description: Git branching workflow for feature development
---

# Git Workflow

## Branch Naming
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `refactor/<name>` - Code refactoring

## Process
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

4. **ALWAYS ASK USER**: "Do you want me to merge this PR to main?"
   - Wait for explicit approval before merging

5. After user approval, merge via GitHub or:
   ```bash
   gh pr merge --squash
   ```

6. Delete the feature branch after merge
