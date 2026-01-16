---
description: Git workflow for auto-versioning and pushing completed tasks to GitHub
---

# Git Auto-Version Workflow

This workflow runs automatically after completing each task to create a versioned branch and push changes to GitHub.

## Remote Repository
- **URL**: https://github.com/onuryuzbasi/agile-dashboard.git

## Version Naming Convention
- Format: `feature/v{YYYYMMDD}-{feature-name-kebab-case}`
- Example: `feature/v20260116-editable-columns`

## Automatic Steps After Each Completed Task

// turbo-all

1. Create a new branch from current state:
```bash
git checkout -b feature/v$(date +%Y%m%d)-{feature-name-kebab-case}
```

2. Stage all changes:
```bash
git add -A
```

3. Commit with descriptive message:
```bash
git commit -m "feat: {feature description}"
```

4. Push branch to GitHub:
```bash
git push -u origin HEAD
```

## Commit Message Format
- `feat:` - New feature or enhancement
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - CSS/styling changes
- `refactor:` - Code refactoring

## Notes
- Each task gets its own feature branch for easy tracking
- Branches are pushed to GitHub automatically
- No manual intervention required
