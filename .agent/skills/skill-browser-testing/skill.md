---
name: browser-ui-testing
description: "Pattern for testing UI changes in browser. Use when (1) Verifying visual changes work correctly (2) Testing interactions like clicks, scrolls, form inputs (3) Capturing screenshots for documentation"
---

# Browser UI Testing Skill

Standard workflow for testing UI implementations using the browser subagent.

## Basic Test Pattern

```javascript
// Standard browser test structure
browser_subagent({
    TaskName: "Test {Feature Name}",
    RecordingName: "{feature}_test",
    Task: `
        1. Navigate to http://localhost:5174/{page}
        2. Wait 2 seconds for page load
        3. Take a screenshot of {initial state}
        4. Perform action: {click/type/scroll}
        5. Wait 1 second for response
        6. Take a screenshot of {result state}
        
        Report:
        - Did {action} work correctly?
        - Is {expected result} visible?
        - Any errors or unexpected behavior?
    `
})
```

## Common Actions

### Click Element
```
Click the {button name} button
Click on element with text "{text}"
Click at coordinates X, Y
```

### Type Input
```
Type "{text}" into the {input name} field
Clear the input and type "{new text}"
```

### Scroll
```
Scroll down 300 pixels
Scroll the {container} to see more items
```

### Wait
```
Wait {N} seconds for {reason}
Wait for the animation to complete
Wait for the page to load
```

### Screenshot
```
Take a screenshot showing {what}
Capture the current state as "{name}"
```

## Screenshot Naming Convention
Format: `{feature}_{state}_{timestamp}.png`

Examples:
- `dark_mode_initial_1768918103975.png`
- `filter_menu_opened_1768929072440.png`
- `board_after_drag_1768740928908.png`

## Test Checklist Template

```
Test: {Feature Name}
Page: http://localhost:5174/{page}

Steps:
1. [ ] Navigate to page
2. [ ] Verify initial state
3. [ ] Perform primary action
4. [ ] Verify expected result
5. [ ] Test edge cases
6. [ ] Capture final screenshot

Expected Results:
- {Result 1}
- {Result 2}
```

## Common Pages to Test
| Page | URL | Key Features |
|------|-----|--------------|
| Board | `/board` | Kanban columns, drag-drop, filters |
| Backlog | `/backlog` | Sprint sections, issue rows, epics |
| List | `/list` | Table view, column headers |
| List Template | `/list-template` | Dynamic columns, grouping |
| Timeline | `/timeline` | Gantt chart, date ranges |
| Settings | `/settings` | Configuration forms |
| Dashboard | `/dashboard` | Widgets, charts |

## Recording Files
Recordings are saved to:
`/Users/onuryuzbasioglu/.gemini/antigravity/brain/{conversation-id}/{name}_{timestamp}.webp`
