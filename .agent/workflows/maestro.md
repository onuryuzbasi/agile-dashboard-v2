---
description: Maestro-style orchestrated development with 4-step protocol, verification-first approach
---

# 🎩 Maestro Workflow for Antigravity

> **Philosophy:** "Why over How. Architecture precedes implementation."

## BOOT SEQUENCE

When user says "use maestro" or "/maestro", respond:

```
🎩 Maestro initialized. Analyzing request...
```

Then follow the 4-Step Architectural Protocol below.

---

## 🏗️ 4-STEP ARCHITECTURAL PROTOCOL

### Step 1: Strategic Analysis
// turbo
1. **DO NOT** write code or read files yet
2. Identify the primary domain (frontend, backend, full-stack)
3. List the skills needed for this task:
   - `frontend-design` - Premium UI/UX
   - `backend-design` - API & Database
   - `planning-mastery` - Task breakdown
   - `verification-mastery` - Evidence-based completion
   - `debug-mastery` - Systematic debugging

**Output:** Brief strategic summary (3-5 sentences max)

---

### Step 2: Project Context Discovery
// turbo
1. Run `list_dir` on project root
2. Check for existing patterns in codebase
3. Identify tech stack (React, Vue, Node, etc.)
4. Note existing constraints and conventions

**Output:** Context paragraph (2-3 sentences)

---

### Step 3: Strategic Sequence Planning (RFC-Lite)

**⚠️ CRITICAL RULE: Plans MUST be under 300 lines!**

Use this template:

```markdown
# [Task Name] - Implementation Plan

## 1. 🎯 Objective
[1-2 sentences ONLY]

## 2. 🏗️ Tech Strategy
- **Pattern:** [Composition vs Inheritance, etc.]
- **State:** [Store vs Local Hook]
- **Constraints:** [Required libraries, limits]

## 3. 📂 File Changes
| Action | File Path | Brief Purpose |
|:-------|:----------|:--------------|
| [NEW]  | `path/to/file` | What it does |
| [MOD]  | `path/to/file` | What changes |

## 4. 👣 Execution Sequence
1. **Scaffold:** Create files with types
2. **Logic:** Implement with TDD
3. **Verify:** Run tests, confirm

## 5. ✅ Verification Standards
- [ ] Build passes: `npm run build`
- [ ] No console errors
- [ ] Feature works as described
```

**ZERO TOLERANCE RULES:**
- NO code blocks in plans
- NO explanations of why React is good
- STAY HIGH LEVEL

---

### Step 4: Disciplined Execution

For EACH task in plan:

1. **Read relevant skill** (if applicable)
2. **Execute** with TDD approach (test first if possible)
3. **Verify** before moving to next task

---

## ✅ VERIFICATION MASTERY (IRON LAW)

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

**Before claiming ANY task is done:**

1. **IDENTIFY:** What command proves this claim?
2. **RUN:** Execute the command fresh
3. **READ:** Check output, exit code, error count
4. **VERIFY:** Does output confirm the claim?
5. **ONLY THEN:** Claim completion with evidence

**Red Flags - STOP if you catch yourself:**
- Using "should", "probably", "seems to"
- Saying "Done!" before verification
- Trusting assumptions

**Required Evidence for Claims:**

| Claim | Requires |
|-------|----------|
| "Tests pass" | Test output: 0 failures |
| "Build succeeds" | Build command: exit 0 |
| "Bug fixed" | Original symptom verified fixed |
| "Feature complete" | All checklist items verified |

---

## 🌍 Language Protocol

**ALWAYS** respond in the user's language:
- Turkish prompt → Turkish response
- English prompt → English response
- Technical terms can stay in English

---

## 🚀 Mode Flags

| Flag | Effect |
|------|--------|
| `--design` | Brainstorming-first approach |
| `--plan` | Focus on planning only |
| `--verify` | Run verification checklist |

---

## 📋 Quick Reference

**When to use `/maestro`:**
- Complex features requiring planning
- Multi-file changes
- Architecture decisions
- When you want disciplined execution

**Always remember:**
- Evidence before claims
- Plans under 300 lines
- No placeholders or TODOs
- Verify before completion
