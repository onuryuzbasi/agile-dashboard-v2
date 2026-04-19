---
name: zustand-store-patterns
description: "Patterns for working with the Zustand projectStore. Use when (1) Adding new state or actions (2) Connecting components to store (3) Persisting data to localStorage or Supabase"
---

# Zustand Store Patterns Skill

Reference for working with the Agile Dashboard's Zustand store (`projectStore.js`).

## Store Location
`/src/stores/projectStore.js`

## Basic Usage in Components

```jsx
import { useProjectStore } from '../stores/projectStore'

function MyComponent() {
    const { 
        issues,           // State
        addIssue,         // Action
        updateIssue       // Action
    } = useProjectStore()
    
    // Use state and actions...
}
```

## Common State Fields

### Data
```javascript
issues          // Array of all issues
users           // Array of team members
sprints         // Array of sprints
projects        // Array of projects
fieldConfig     // Field configuration (statuses, priorities, types)
games           // Game/product list
departments     // Department list
savedFilters    // User's saved filters
```

### UI State
```javascript
theme                   // 'light' or 'dark'
sidebarCollapsed       // Boolean
selectedIssue          // Currently selected issue
createIssueModalOpen   // Boolean
currentProjectId       // Active project ID
currentSprintId        // Active sprint ID
```

## Common Actions

### Issue CRUD
```javascript
addIssue(issueData)           // Create new issue
updateIssue(id, updates)      // Update issue
deleteIssue(id)               // Delete issue (hard)
softDeleteIssues(ids)         // Soft delete (batch)
```

### Sprint Management
```javascript
addSprint(sprintData)         // Create sprint
startSprint(id)               // Start sprint
completeSprint(id)            // Complete sprint
deleteSprint(id)              // Delete sprint
```

### Filters
```javascript
addSavedFilter(filterData)    // Save filter
deleteSavedFilter(id)         // Delete saved filter
```

### UI Actions
```javascript
setTheme(theme)               // Set theme
toggleTheme()                 // Toggle light/dark
toggleSidebar()               // Toggle sidebar
setSelectedIssue(issue)       // Select issue
openCreateIssueModal(type)    // Open create modal
closeCreateIssueModal()       // Close create modal
```

## Adding New State

```javascript
// In the store's initial state
{
    myNewState: defaultValue,
    // ...
}

// In the store's actions
setMyNewState: (value) => set({ myNewState: value }),
```

## Adding to localStorage Persistence

```javascript
// In the persist partialize function
partialize: (state) => ({
    theme: state.theme,
    sidebarCollapsed: state.sidebarCollapsed,
    currentProjectId: state.currentProjectId,
    currentSprintId: state.currentSprintId,
    savedFilters: state.savedFilters,  // Add new fields here
    myNewState: state.myNewState
})
```

## Supabase Integration Pattern

```javascript
// Action that syncs to Supabase
updateIssue: async (id, updates) => {
    // 1. Optimistic update (immediate UI feedback)
    set((state) => ({
        issues: state.issues.map(i => 
            i.id === id ? { ...i, ...updates } : i
        )
    }))
    
    // 2. Sync to Supabase
    try {
        await supabase
            .from('issues')
            .update(toSnakeCase(updates))
            .eq('id', id)
    } catch (error) {
        console.error('Failed to update:', error)
        // Optionally: rollback optimistic update
    }
}
```

## Getter Functions

```javascript
getBacklogIssues()           // Issues not in a sprint
getSprintIssues(sprintId)    // Issues in specific sprint
getUserById(userId)          // Get user by ID
getIssueById(issueId)        // Get issue by ID
```
