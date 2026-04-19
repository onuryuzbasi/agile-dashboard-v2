---
name: integrate-faceted-filter
description: "Pattern for integrating FacetedFilterMenu into a new page. Use when (1) Adding global filter menu to a page (2) Standardizing filters across views (3) Connecting saved filters to a new component"
---

# Integrate FacetedFilterMenu Skill

Step-by-step pattern for adding the global FacetedFilterMenu to any page in the Agile Dashboard.

## Required Imports

```jsx
import FacetedFilterMenu from '../components/common/FacetedFilterMenu'
```

## Store Fields to Destructure

```jsx
const {
    issues,
    users,
    sprints,
    fieldConfig,
    games,
    departments,
    savedFilters,
    addSavedFilter,
    deleteSavedFilter
} = useProjectStore()
```

## Filter State Variables

Add these state variables for each filter category:

```jsx
// Filter menu visibility
const [showFilterMenu, setShowFilterMenu] = useState(false)

// Filter values (use Sets for multi-select)
const [filterTypes, setFilterTypes] = useState(new Set())
const [filterStatuses, setFilterStatuses] = useState(new Set())
const [filterPriorities, setFilterPriorities] = useState(new Set())
const [filterAssignees, setFilterAssignees] = useState(new Set())
const [filterGames, setFilterGames] = useState(new Set())
const [filterDepartments, setFilterDepartments] = useState(new Set())
const [filterLabels, setFilterLabels] = useState(new Set())
const [filterReporters, setFilterReporters] = useState(new Set())
```

## Filter Function Pattern

```jsx
const filterIssues = (issueList) => {
    return issueList.filter(issue => {
        if (filterTypes.size > 0 && !filterTypes.has(issue.type)) return false
        if (filterStatuses.size > 0 && !filterStatuses.has(issue.status)) return false
        if (filterPriorities.size > 0 && !filterPriorities.has(issue.priority)) return false
        if (filterAssignees.size > 0 && !filterAssignees.has(issue.assigneeId)) return false
        if (filterGames.size > 0 && !filterGames.has(issue.gameId)) return false
        if (filterDepartments.size > 0 && !filterDepartments.has(issue.departmentId)) return false
        if (filterReporters.size > 0 && !filterReporters.has(issue.reporterId)) return false
        if (filterLabels.size > 0) {
            const issueLabels = issue.labels || []
            if (![...filterLabels].some(l => issueLabels.includes(l))) return false
        }
        return true
    })
}
```

## Clear Filters Function

```jsx
const clearFilters = () => {
    setFilterTypes(new Set())
    setFilterStatuses(new Set())
    setFilterPriorities(new Set())
    setFilterAssignees(new Set())
    setFilterGames(new Set())
    setFilterDepartments(new Set())
    setFilterLabels(new Set())
    setFilterReporters(new Set())
}

const filterCount = filterTypes.size + filterStatuses.size + filterPriorities.size + 
    filterAssignees.size + filterGames.size + filterDepartments.size + 
    filterLabels.size + filterReporters.size
```

## JSX Component Pattern

```jsx
<div className="filter-popover-container" style={{ position: 'relative' }}>
    <button 
        className={`btn btn-sm btn-secondary ${filterCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setShowFilterMenu(!showFilterMenu)}
    >
        <Filter size={14} />
        Filter
        {filterCount > 0 && <span className="filter-count">{filterCount}</span>}
    </button>
    <FacetedFilterMenu
        isOpen={showFilterMenu}
        onClose={() => setShowFilterMenu(false)}
        issues={issues}
        users={users}
        sprints={sprints}
        games={games}
        departments={departments}
        fieldConfig={fieldConfig}
        filters={{
            type: filterTypes,
            status: filterStatuses,
            priority: filterPriorities,
            assignee: filterAssignees,
            game: filterGames,
            department: filterDepartments,
            labels: filterLabels,
            reporter: filterReporters
        }}
        onFilterChange={(field, values) => {
            if (field === 'type') setFilterTypes(values)
            else if (field === 'status') setFilterStatuses(values)
            else if (field === 'priority') setFilterPriorities(values)
            else if (field === 'assignee') setFilterAssignees(values)
            else if (field === 'game') setFilterGames(values)
            else if (field === 'department') setFilterDepartments(values)
            else if (field === 'labels') setFilterLabels(values)
            else if (field === 'reporter') setFilterReporters(values)
        }}
        onClearAll={clearFilters}
        savedFilters={savedFilters}
        onSaveFilter={addSavedFilter}
        onDeleteSavedFilter={deleteSavedFilter}
        onApplySavedFilter={(filterData) => {
            setFilterTypes(new Set(filterData.type || []))
            setFilterStatuses(new Set(filterData.status || []))
            setFilterPriorities(new Set(filterData.priority || []))
            setFilterAssignees(new Set(filterData.assignee || []))
            setFilterGames(new Set(filterData.game || []))
            setFilterDepartments(new Set(filterData.department || []))
            setFilterLabels(new Set(filterData.labels || []))
            setFilterReporters(new Set(filterData.reporter || []))
        }}
    />
</div>
```

## Pages Already Integrated
- ✅ Board.jsx
- ✅ List.jsx
- ✅ ListTemplate.jsx
- ✅ Timeline.jsx
- ✅ Backlog.jsx
