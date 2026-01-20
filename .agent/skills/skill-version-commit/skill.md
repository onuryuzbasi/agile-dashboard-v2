---
name: version-commit-push
description: "Workflow for versioning, committing, and pushing changes. Use when (1) Completing a feature and need to bump version (2) Making a commit with proper version tag (3) Pushing changes to GitHub with version update"
---

# Version, Commit & Push Skill

This skill handles the standard workflow for versioning and pushing completed features.

## Workflow Steps

### 1. Version Bump
Update the VERSION file with the new version number:
```
Major.Minor.Patch
```
- **Major**: Breaking changes or major rewrites
- **Minor**: New features (e.g., 2.7.0 → 2.8.0)
- **Patch**: Bug fixes (e.g., 2.8.0 → 2.8.1)

### 2. Commit Message Format
Use semantic versioning prefix:
```
v{VERSION}: {Short Description}

{Detailed bullet points of changes}
```

Example:
```
v2.8.0: Standardize Backlog filters with FacetedFilterMenu

- Replaced 'Quick filters' dropdown with global FacetedFilterMenu
- Added all filter criteria: Type, Status, Priority, etc.
- Integrated saved filters (same as List/Board views)
```

### 3. Command Sequence
```bash
# 1. Stage all changes
git add .

# 2. Commit with version message
git commit -m "v{VERSION}: {Description}"

# 3. Update VERSION file
echo "{VERSION}" > VERSION

# 4. Amend commit to include VERSION
git add VERSION && git commit --amend --no-edit

# 5. Push to main
git push origin main
```

### 4. Quick One-Liner (for simple updates)
```bash
git add . && git commit -m "v{VERSION}: {Description}" && git push origin main
```

## Version History Location
The VERSION file is at the project root: `/Users/onuryuzbasioglu/Desktop/Agile Dashboard/VERSION`

## Git Remote
Repository: `https://github.com/onuryuzbasi/agile-dashboard-v2.git`
Branch: `main`
