import { useState, useRef, useEffect, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
import FacetedFilterMenu from '../components/common/FacetedFilterMenu'
import useGlobalFilterOptions from '../hooks/useGlobalFilterOptions'
import {
    Plus,
    ChevronDown,
    ChevronRight,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    MessageSquare,
    Settings2,
    Edit,
    Copy,
    Trash2,
    X,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    EyeOff,
    User,
    Flag,
    Zap
} from 'lucide-react'

const typeIcons = {
    story: { icon: BookOpen, color: 'var(--story)' },
    bug: { icon: Bug, color: 'var(--bug)' },
    task: { icon: CheckSquare, color: 'var(--task)' },
    epic: { icon: Layers, color: 'var(--epic)' },
    subtask: { icon: ListTree, color: 'var(--subtask)' }
}

const priorityConfig = {
    highest: { icon: ArrowUp, color: 'var(--priority-highest)', label: 'Highest', order: 1 },
    high: { icon: ArrowUp, color: 'var(--priority-high)', label: 'High', order: 2 },
    medium: { icon: Minus, color: 'var(--priority-medium)', label: 'Medium', order: 3 },
    low: { icon: ArrowDown, color: 'var(--priority-low)', label: 'Low', order: 4 },
    lowest: { icon: ArrowDown, color: 'var(--priority-lowest)', label: 'Lowest', order: 5 }
}

const statusConfig = {
    todo: { label: 'TO DO', class: 'status-todo' },
    progress: { label: 'IN PROGRESS', class: 'status-progress' },
    review: { label: 'IN REVIEW', class: 'status-review' },
    done: { label: 'DONE', class: 'status-done' }
}

// Format date for display
const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Searchable Dropdown Component
function SearchableDropdown({ options, value, onChange, onClose, placeholder = 'Search...', footerAction }) {
    const [search, setSearch] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="searchable-dropdown" onClick={e => e.stopPropagation()}>
            <div className="searchable-dropdown-search">
                <Search size={14} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="searchable-dropdown-options">
                {filtered.map(opt => (
                    <button
                        key={opt.value}
                        className={`searchable-dropdown-option ${value === opt.value ? 'active' : ''}`}
                        onClick={() => { onChange(opt.value); onClose(); }}
                    >
                        {opt.icon && <span className="opt-icon">{opt.icon}</span>}
                        {opt.avatar && <div className="avatar xs">{opt.avatar}</div>}
                        <span>{opt.label}</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="searchable-dropdown-empty">No results</div>
                )}
            </div>
            {footerAction && (
                <div className="searchable-dropdown-footer">
                    <button
                        className="searchable-dropdown-action"
                        onClick={(e) => { e.stopPropagation(); footerAction.onClick(); }}
                    >
                        {footerAction.icon}
                        <span>{footerAction.label}</span>
                    </button>
                </div>
            )}
        </div>
    )
}

// Calendar Date Picker Component
function DatePicker({ value, onChange, onClose }) {
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date())
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days = []

        // Get the day of week for first day (0 = Sunday, adjust for Monday start)
        let startDay = firstDay.getDay()
        startDay = startDay === 0 ? 6 : startDay - 1 // Convert to Monday = 0

        // Add days from previous month
        const prevMonth = new Date(year, month, 0)
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false
            })
        }

        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

        // Add days from next month
        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }

        return days
    }

    const days = getDaysInMonth(viewDate)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const handleSelect = (date) => {
        onChange(date.toISOString())
        onClose()
    }

    const isSelected = (date) => {
        if (!value) return false
        const selected = new Date(value)
        return date.toDateString() === selected.toDateString()
    }

    const isToday = (date) => {
        return date.toDateString() === today.toDateString()
    }

    return (
        <div className="date-picker" onClick={e => e.stopPropagation()}>
            <div className="date-picker-header">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))}>
                    <ChevronsLeft size={16} />
                </button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                    <ChevronLeft size={16} />
                </button>
                <span className="date-picker-title">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                    <ChevronRight size={16} />
                </button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))}>
                    <ChevronsRight size={16} />
                </button>
            </div>
            <div className="date-picker-weekdays">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="date-picker-weekday">{d}</div>
                ))}
            </div>
            <div className="date-picker-days">
                {days.map((day, i) => (
                    <button
                        key={i}
                        className={`date-picker-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected(day.date) ? 'selected' : ''} ${isToday(day.date) ? 'today' : ''}`}
                        onClick={() => handleSelect(day.date)}
                    >
                        {day.date.getDate()}
                    </button>
                ))}
            </div>
            <div className="date-picker-footer">
                <button className="btn btn-sm btn-ghost" onClick={() => { onChange(null); onClose(); }}>
                    Clear
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => handleSelect(today)}>
                    Today
                </button>
            </div>
        </div>
    )
}

// Column Sort Dropdown
function ColumnSortDropdown({ column, sortConfig, onSort, onHide, onClose }) {
    return (
        <div className="column-sort-dropdown" onClick={e => e.stopPropagation()}>
            <button onClick={() => { onSort(column, 'asc'); onClose(); }}>
                <ArrowUp size={14} />
                Sort A → Z
            </button>
            <button onClick={() => { onSort(column, 'desc'); onClose(); }}>
                <ArrowDown size={14} />
                Sort Z → A
            </button>
            <button onClick={() => { onSort(null, null); onClose(); }} disabled={!sortConfig.column}>
                <X size={14} />
                Clear sorting
            </button>
            <div className="dropdown-divider" />
            <button onClick={() => { onHide(column); onClose(); }}>
                <EyeOff size={14} />
                Hide field
            </button>
        </div>
    )
}

// Delete Confirmation Modal
function DeleteConfirmModal({ count, onConfirm, onCancel }) {
    const [confirmText, setConfirmText] = useState('')

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="delete-confirm-modal" onClick={e => e.stopPropagation()}>
                <h3>Delete {count} issue{count > 1 ? 's' : ''}?</h3>
                <p>This action cannot be undone. Items will be moved to trash.</p>
                <p className="delete-confirm-instruction">
                    Type <strong>delete</strong> to confirm:
                </p>
                <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="delete"
                    autoFocus
                />
                <div className="delete-confirm-actions">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn btn-danger"
                        disabled={confirmText.toLowerCase() !== 'delete'}
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}

// Epic Create Modal
function EpicCreateModal({ onSave, onCancel }) {
    const [summary, setSummary] = useState('')

    const handleSave = () => {
        if (summary.trim()) {
            onSave(summary.trim())
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && summary.trim()) {
            handleSave()
        } else if (e.key === 'Escape') {
            onCancel()
        }
    }

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="epic-create-modal" onClick={e => e.stopPropagation()}>
                <h3>Create New Epic</h3>
                <p>Create a new Epic issue to organize related stories.</p>
                <input
                    type="text"
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Epic summary..."
                    autoFocus
                />
                <div className="epic-create-actions">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        disabled={!summary.trim()}
                        onClick={handleSave}
                    >
                        Create Epic
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function List() {
    // Single Source of Truth: Global normalized filter options
    const { filterOptions } = useGlobalFilterOptions()

    const {
        issues,
        sprints,
        users,
        games,
        departments,
        fieldConfig,
        savedFilters,
        getUserById,
        setSelectedIssue,
        addIssue,
        updateIssue,
        softDeleteIssues,
        addSavedFilter,
        removeSavedFilter
    } = useProjectStore()

    const [searchQuery, setSearchQuery] = useState('')
    const [collapsedSections, setCollapsedSections] = useState(new Set())
    const [groupBy, setGroupBy] = useState('sprint') // 'sprint' | 'assignee' | 'priority'
    const [showGroupByMenu, setShowGroupByMenu] = useState(false)
    const [selectedIssues, setSelectedIssues] = useState(new Set())
    const [sortConfig, setSortConfig] = useState({ column: null, direction: null })
    const [hiddenColumns, setHiddenColumns] = useState(new Set())
    const [activeDropdown, setActiveDropdown] = useState(null) // { issueId, field }
    const [activeDatePicker, setActiveDatePicker] = useState(null) // { issueId, field }
    const [columnSortMenu, setColumnSortMenu] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showCompleted, setShowCompleted] = useState(false) // Tab for completed sprints

    // Filter state
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [filterAssignees, setFilterAssignees] = useState(new Set())
    const [filterStatuses, setFilterStatuses] = useState(new Set())
    const [filterPriorities, setFilterPriorities] = useState(new Set())
    const [filterTypes, setFilterTypes] = useState(new Set())
    const [filterSprints, setFilterSprints] = useState(new Set())
    const [filterEpics, setFilterEpics] = useState(new Set())
    const [filterGames, setFilterGames] = useState(new Set())
    const [filterDepartments, setFilterDepartments] = useState(new Set())
    const [filterLabels, setFilterLabels] = useState(new Set())
    const [filterReporters, setFilterReporters] = useState(new Set())

    // Inline create state
    const [creatingInGroup, setCreatingInGroup] = useState(null)
    const [creatingEpic, setCreatingEpic] = useState(null) // Holds issueId for which we're creating a parent Epic
    const [newIssueSummary, setNewIssueSummary] = useState('')
    const [newIssueType, setNewIssueType] = useState('story')
    const [newIssueAssignee, setNewIssueAssignee] = useState(null)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
    const [showColumnMenu, setShowColumnMenu] = useState(false)
    const [draggingColumn, setDraggingColumn] = useState(null)

    // All available columns (as state for reordering)
    // Pinned columns (type, key, summary) - cannot be reordered
    const pinnedColumns = [
        { id: 'type', label: 'Type' },
        { id: 'key', label: 'Key' },
        { id: 'summary', label: 'Summary' }
    ]

    // Scrollable columns that can be reordered
    const [columnOrder, setColumnOrder] = useState([
        { id: 'parent', label: 'Parent', required: false },
        { id: 'assignee', label: 'Assignee', required: false },
        { id: 'status', label: 'Status', required: false },
        { id: 'sprint', label: 'Sprint', required: false },
        { id: 'startDate', label: 'Start Date', required: false },
        { id: 'dueDate', label: 'Due Date', required: false },
        { id: 'priority', label: 'Priority', required: false },
        { id: 'storyPoints', label: 'Story Points', required: false },
        { id: 'reporter', label: 'Reporter', required: false },
        { id: 'department', label: 'Department', required: false },
        { id: 'originalEstimate', label: 'Estimate (hours)', required: false },
        { id: 'labels', label: 'Labels', required: false }
    ])

    // Column widths state for resizing
    const [columnWidths, setColumnWidths] = useState({})
    const [resizingColumn, setResizingColumn] = useState(null)
    const resizeStartX = useRef(0)
    const resizeStartWidth = useRef(0)

    // Handle column drag and drop reordering (for column menu)
    const handleColumnDragStart = (e, index) => {
        setDraggingColumn(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleColumnDragOver = (e, index) => {
        e.preventDefault()
        if (draggingColumn === null || draggingColumn === index) return

        const newOrder = [...columnOrder]
        const draggedItem = newOrder[draggingColumn]
        newOrder.splice(draggingColumn, 1)
        newOrder.splice(index, 0, draggedItem)
        setColumnOrder(newOrder)
        setDraggingColumn(index)
    }

    const handleColumnDragEnd = () => {
        setDraggingColumn(null)
    }

    // Handle header column drag and drop reordering (for table header)
    const [draggingHeader, setDraggingHeader] = useState(null)

    const handleHeaderDragStart = (e, columnId) => {
        const index = columnOrder.findIndex(c => c.id === columnId)
        setDraggingHeader(index)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', columnId)
    }

    const handleHeaderDragOver = (e, columnId) => {
        e.preventDefault()
        const targetIndex = columnOrder.findIndex(c => c.id === columnId)
        if (draggingHeader === null || draggingHeader === targetIndex) return

        const newOrder = [...columnOrder]
        const draggedItem = newOrder[draggingHeader]
        newOrder.splice(draggingHeader, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        setColumnOrder(newOrder)
        setDraggingHeader(targetIndex)
    }

    const handleHeaderDragEnd = () => {
        setDraggingHeader(null)
    }

    // Get column index for checking if dragging
    const getColumnIndex = (columnId) => columnOrder.findIndex(c => c.id === columnId)

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => {
            setActiveDropdown(null)
            setActiveDatePicker(null)
            setColumnSortMenu(null)
            setShowGroupByMenu(false)
            setShowTypeDropdown(false)
            setShowAssigneeDropdown(false)
            setShowColumnMenu(false)
            setShowFilterMenu(false)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    // Column resize handlers
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (resizingColumn === null) return
            const delta = e.clientX - resizeStartX.current
            const newWidth = Math.max(60, resizeStartWidth.current + delta)
            setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }))
        }

        const handleMouseUp = () => {
            setResizingColumn(null)
        }

        if (resizingColumn !== null) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizingColumn])

    // Helper to close other dropdowns when opening one
    const openDropdown = (dropdown, setDropdown) => {
        setActiveDropdown(null)
        setActiveDatePicker(null)
        setColumnSortMenu(null)
        setShowGroupByMenu(false)
        setShowTypeDropdown(false)
        setDropdown(dropdown)
    }

    // Filter out deleted issues
    const activeIssues = issues.filter(i => !i.isDeleted && i.type !== 'epic')

    // Toggle section collapse
    const toggleSection = (sectionId) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            if (next.has(sectionId)) {
                next.delete(sectionId)
            } else {
                next.add(sectionId)
            }
            return next
        })
    }

    // Get issues grouped by selected criteria
    const getGroupedIssues = () => {
        const groups = []

        if (groupBy === 'sprint') {
            // Filter sprints based on showCompleted tab
            const filteredSprints = sprints.filter(s =>
                showCompleted ? s.state === 'closed' : s.state !== 'closed'
            )

            const sortedSprints = [...filteredSprints].sort((a, b) => {
                if (a.state === 'active') return -1
                if (b.state === 'active') return 1
                return new Date(a.startDate) - new Date(b.startDate)
            })

            sortedSprints.forEach(sprint => {
                const sprintIssues = activeIssues.filter(i => i.sprintId === sprint.id)
                groups.push({
                    id: sprint.id,
                    name: sprint.name,
                    type: 'sprint',
                    state: sprint.state,
                    issues: sprintIssues
                })
            })

            // Only show Backlog in active tab
            if (!showCompleted) {
                const backlogIssues = activeIssues.filter(i => !i.sprintId)
                groups.push({
                    id: 'backlog',
                    name: 'Backlog',
                    type: 'backlog',
                    issues: backlogIssues
                })
            }
        } else if (groupBy === 'assignee') {
            // Group by assignee
            const assigneeMap = new Map()
            assigneeMap.set('unassigned', { id: 'unassigned', name: 'Unassigned', issues: [] })

            users.forEach(user => {
                assigneeMap.set(user.id, { id: user.id, name: user.name, issues: [] })
            })

            activeIssues.forEach(issue => {
                const key = issue.assigneeId || 'unassigned'
                if (assigneeMap.has(key)) {
                    assigneeMap.get(key).issues.push(issue)
                }
            })

            assigneeMap.forEach((value, key) => {
                groups.push({
                    id: key,
                    name: value.name,
                    type: 'assignee',
                    issues: value.issues
                })
            })
        } else if (groupBy === 'priority') {
            // Group by priority
            const priorities = ['highest', 'high', 'medium', 'low', 'lowest']
            priorities.forEach(priority => {
                const priorityIssues = activeIssues.filter(i => i.priority === priority)
                groups.push({
                    id: priority,
                    name: priorityConfig[priority].label,
                    type: 'priority',
                    issues: priorityIssues
                })
            })
        }

        return groups
    }

    // Sort issues within groups
    const sortIssues = (issueList) => {
        if (!sortConfig.column) return issueList

        return [...issueList].sort((a, b) => {
            let aVal, bVal

            switch (sortConfig.column) {
                case 'key':
                    aVal = a.key
                    bVal = b.key
                    break
                case 'summary':
                    aVal = a.summary.toLowerCase()
                    bVal = b.summary.toLowerCase()
                    break
                case 'assignee':
                    aVal = getUserById(a.assigneeId)?.name || 'zzz'
                    bVal = getUserById(b.assigneeId)?.name || 'zzz'
                    break
                case 'status':
                    aVal = a.status
                    bVal = b.status
                    break
                case 'priority':
                    aVal = priorityConfig[a.priority]?.order || 3
                    bVal = priorityConfig[b.priority]?.order || 3
                    break
                case 'startDate':
                    aVal = a.startDate || ''
                    bVal = b.startDate || ''
                    break
                case 'dueDate':
                    aVal = a.dueDate || ''
                    bVal = b.dueDate || ''
                    break
                default:
                    return 0
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }

    // Filter issues by search and filters
    const filterIssues = (issueList) => {
        return issueList.filter(issue => {
            // Search filter
            if (searchQuery) {
                const searchMatch = issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    issue.key.toLowerCase().includes(searchQuery.toLowerCase())
                if (!searchMatch) return false
            }

            // Type filter (OR within group)
            if (filterTypes.size > 0) {
                if (!filterTypes.has(issue.type)) return false
            }

            // Status filter (OR within group)
            if (filterStatuses.size > 0) {
                if (!filterStatuses.has(issue.status)) return false
            }

            // Priority filter (OR within group)
            if (filterPriorities.size > 0) {
                if (!filterPriorities.has(issue.priority)) return false
            }

            // Assignee filter (OR within group)
            if (filterAssignees.size > 0) {
                if (!filterAssignees.has(issue.assigneeId || 'unassigned')) return false
            }

            // Sprint filter (OR within group)
            if (filterSprints.size > 0) {
                if (!filterSprints.has(issue.sprintId || 'backlog')) return false
            }

            // Epic filter (OR within group)
            if (filterEpics.size > 0) {
                const epicMatch = filterEpics.has(issue.parentId) ||
                    (issue.type === 'epic' && filterEpics.has(issue.id)) ||
                    (!issue.parentId && issue.type !== 'epic' && filterEpics.has('no-epic'))
                if (!epicMatch) return false
            }

            // Game filter (OR within group)
            if (filterGames.size > 0) {
                if (!filterGames.has(issue.gameId || 'no-game')) return false
            }

            // Department filter (OR within group)
            if (filterDepartments.size > 0) {
                if (!filterDepartments.has(issue.departmentId || 'no-department')) return false
            }

            // Labels filter (OR within group)
            if (filterLabels.size > 0) {
                const issueLabels = issue.labels || []
                const hasMatchingLabel = issueLabels.some(label => filterLabels.has(label))
                if (!hasMatchingLabel) return false
            }

            // Reporter filter (OR within group)
            if (filterReporters.size > 0) {
                if (!filterReporters.has(issue.reporterId)) return false
            }

            return true
        })
    }

    // Get active filter count
    const activeFilterCount = filterTypes.size + filterStatuses.size + filterPriorities.size +
        filterAssignees.size + filterSprints.size + filterEpics.size +
        filterGames.size + filterDepartments.size + filterLabels.size + filterReporters.size

    // Filters object for FacetedFilterMenu
    const filters = useMemo(() => ({
        type: filterTypes,
        status: filterStatuses,
        priority: filterPriorities,
        assignee: filterAssignees,
        sprint: filterSprints,
        epic: filterEpics,
        game: filterGames,
        department: filterDepartments,
        label: filterLabels,
        reporter: filterReporters
    }), [filterTypes, filterStatuses, filterPriorities, filterAssignees, filterSprints,
        filterEpics, filterGames, filterDepartments, filterLabels, filterReporters])

    // Handle filter change from FacetedFilterMenu
    const handleFilterChange = (field, newSet) => {
        switch (field) {
            case 'type': setFilterTypes(newSet); break
            case 'status': setFilterStatuses(newSet); break
            case 'priority': setFilterPriorities(newSet); break
            case 'assignee': setFilterAssignees(newSet); break
            case 'sprint': setFilterSprints(newSet); break
            case 'epic': setFilterEpics(newSet); break
            case 'game': setFilterGames(newSet); break
            case 'department': setFilterDepartments(newSet); break
            case 'label': setFilterLabels(newSet); break
            case 'reporter': setFilterReporters(newSet); break
        }
    }

    // Toggle filter helper
    const toggleFilter = (set, setFn, value) => {
        setFn(prev => {
            const next = new Set(prev)
            if (next.has(value)) {
                next.delete(value)
            } else {
                next.add(value)
            }
            return next
        })
    }

    // Clear all filters
    const clearAllFilters = () => {
        setFilterTypes(new Set())
        setFilterStatuses(new Set())
        setFilterPriorities(new Set())
        setFilterAssignees(new Set())
        setFilterSprints(new Set())
        setFilterEpics(new Set())
        setFilterGames(new Set())
        setFilterDepartments(new Set())
        setFilterLabels(new Set())
        setFilterReporters(new Set())
    }

    // Apply saved filter (converts arrays back to Sets)
    const applySavedFilter = (savedFilters) => {
        // Clear all first, then apply saved
        setFilterTypes(new Set(savedFilters.type || []))
        setFilterStatuses(new Set(savedFilters.status || []))
        setFilterPriorities(new Set(savedFilters.priority || []))
        setFilterAssignees(new Set(savedFilters.assignee || []))
        setFilterSprints(new Set(savedFilters.sprint || []))
        setFilterEpics(new Set(savedFilters.epic || []))
        setFilterGames(new Set(savedFilters.game || []))
        setFilterDepartments(new Set(savedFilters.department || []))
        setFilterLabels(new Set(savedFilters.label || []))
        setFilterReporters(new Set(savedFilters.reporter || []))
    }

    // Handle inline issue creation
    const handleCreateIssue = (groupId) => {
        if (!newIssueSummary.trim()) return

        const newIssue = addIssue({
            type: newIssueType,
            status: 'todo',
            priority: 'medium',
            summary: newIssueSummary.trim(),
            description: '',
            sprintId: groupBy === 'sprint' && groupId !== 'backlog' ? groupId : null,
            assigneeId: newIssueAssignee || (groupBy === 'assignee' && groupId !== 'unassigned' ? groupId : null),
            storyPoints: null,
            labels: [],
            reporterId: users[0]?.id || null
        })

        setNewIssueSummary('')
        setNewIssueType('story')
        setNewIssueAssignee(null)
        setCreatingInGroup(null)
    }

    // Count completed sprints for badge
    const completedSprintCount = sprints.filter(s => s.state === 'closed').length

    // Handle inline field update
    const handleFieldUpdate = (issueId, field, value) => {
        updateIssue(issueId, { [field]: value })
        setActiveDropdown(null)
        setActiveDatePicker(null)
    }

    // Handle select all visible issues
    const handleSelectAll = (checked) => {
        if (checked) {
            const visibleIds = new Set()
            groups.forEach(group => {
                if (!collapsedSections.has(group.id)) {
                    filterIssues(sortIssues(group.issues)).forEach(issue => {
                        visibleIds.add(issue.id)
                    })
                }
            })
            setSelectedIssues(visibleIds)
        } else {
            setSelectedIssues(new Set())
        }
    }

    // Handle group checkbox
    const handleGroupSelect = (group, checked) => {
        const groupIssueIds = filterIssues(sortIssues(group.issues)).map(i => i.id)
        setSelectedIssues(prev => {
            const next = new Set(prev)
            if (checked) {
                groupIssueIds.forEach(id => next.add(id))
            } else {
                groupIssueIds.forEach(id => next.delete(id))
            }
            return next
        })
    }

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (softDeleteIssues) {
            softDeleteIssues([...selectedIssues])
        } else {
            // Fallback if store doesn't have softDeleteIssues yet
            selectedIssues.forEach(id => {
                updateIssue(id, { isDeleted: true, deletedAt: new Date().toISOString() })
            })
        }
        setSelectedIssues(new Set())
        setShowDeleteConfirm(false)
    }

    // Handle create epic from parent dropdown
    const handleCreateEpic = (summary) => {
        // Create a new Epic issue
        const newEpic = {
            summary,
            type: 'epic',
            status: 'todo',
            priority: 'medium',
            sprintId: null, // Epics typically aren't in sprints
            assigneeId: null,
            labels: []
        }

        const createdEpic = addIssue(newEpic)

        // Link it to the issue that triggered the modal
        if (creatingEpic && createdEpic) {
            handleFieldUpdate(creatingEpic, 'parentId', createdEpic.id)
        }

        setCreatingEpic(null)
    }

    // Get dropdown options
    const getAssigneeOptions = () => [
        { value: null, label: 'Unassigned', icon: <User size={14} /> },
        ...users.map(u => ({ value: u.id, label: u.name, avatar: u.name.charAt(0) }))
    ]

    const getStatusOptions = () => Object.entries(statusConfig).map(([key, val]) => ({
        value: key,
        label: val.label
    }))

    const getPriorityOptions = () => Object.entries(priorityConfig).map(([key, val]) => ({
        value: key,
        label: val.label,
        icon: <val.icon size={14} style={{ color: val.color }} />
    }))

    const getSprintOptions = () => [
        { value: null, label: 'Backlog' },
        ...sprints.map(s => ({ value: s.id, label: s.name }))
    ]

    // Get available Epics for parent selection
    const getParentOptions = () => [
        { value: null, label: 'No parent', icon: <Minus size={14} /> },
        ...issues.filter(i => i.type === 'epic' && !i.isDeleted).map(epic => ({
            value: epic.id,
            label: epic.key + ' - ' + epic.summary.substring(0, 30) + (epic.summary.length > 30 ? '...' : ''),
            icon: <Zap size={14} style={{ color: 'var(--epic)' }} />
        }))
    ]

    const groups = getGroupedIssues()

    // Helper to render a single header cell with drag support
    const renderHeaderCell = (col, index) => {
        if (hiddenColumns.has(col.id)) return null

        const cellClassMap = {
            type: 'list-cell-type',
            key: 'list-cell-key',
            summary: 'list-cell-summary',
            parent: 'list-cell-parent',
            assignee: 'list-cell-assignee',
            status: 'list-cell-status',
            sprint: 'list-cell-sprint',
            startDate: 'list-cell-date',
            dueDate: 'list-cell-date',
            priority: 'list-cell-priority',
            storyPoints: 'list-cell-points',
            reporter: 'list-cell-reporter',
            department: 'list-cell-department',
            originalEstimate: 'list-cell-estimate',
            labels: 'list-cell-labels'
        }

        const sortableColumns = ['key', 'summary', 'assignee', 'status', 'startDate', 'dueDate', 'priority', 'type']
        const isSortable = sortableColumns.includes(col.id)

        const handleResizeStart = (e) => {
            e.preventDefault()
            e.stopPropagation()
            setResizingColumn(col.id)
            resizeStartX.current = e.clientX
            resizeStartWidth.current = columnWidths[col.id] || 100
        }

        return (
            <div
                key={col.id}
                className={`list-cell ${cellClassMap[col.id] || ''} list-header-cell ${draggingHeader === index ? 'dragging' : ''}`}
                style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: columnWidths[col.id], flexShrink: 0 } : undefined}
                draggable
                onDragStart={(e) => handleHeaderDragStart(e, col.id)}
                onDragOver={(e) => handleHeaderDragOver(e, col.id)}
                onDragEnd={handleHeaderDragEnd}
                onClick={isSortable ? (e) => { e.stopPropagation(); setColumnSortMenu(columnSortMenu === col.id ? null : col.id); } : undefined}
            >
                {col.label}
                {sortConfig.column === col.id && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                {isSortable && <MoreHorizontal size={12} className="header-menu-icon" />}
                {columnSortMenu === col.id && (
                    <ColumnSortDropdown
                        column={col.id}
                        sortConfig={sortConfig}
                        onSort={(c, dir) => setSortConfig({ column: c, direction: dir })}
                        onHide={(c) => setHiddenColumns(prev => new Set([...prev, c]))}
                        onClose={() => setColumnSortMenu(null)}
                    />
                )}
                <div
                    className="column-resize-handle"
                    onMouseDown={handleResizeStart}
                />
            </div>
        )
    }

    // Helper to render a single data cell based on column id
    const renderDataCell = (col, issue) => {
        if (hiddenColumns.has(col.id)) return null

        const cellClassMap = {
            type: 'list-cell-type',
            key: 'list-cell-key',
            summary: 'list-cell-summary',
            parent: 'list-cell-parent',
            assignee: 'list-cell-assignee',
            status: 'list-cell-status',
            sprint: 'list-cell-sprint',
            startDate: 'list-cell-date',
            dueDate: 'list-cell-date',
            priority: 'list-cell-priority',
            storyPoints: 'list-cell-points',
            reporter: 'list-cell-reporter',
            department: 'list-cell-department',
            originalEstimate: 'list-cell-estimate',
            labels: 'list-cell-labels'
        }

        const assignee = getUserById(issue.assigneeId)
        const parentIssue = issue.parentId ? issues.find(i => i.id === issue.parentId) : null
        const reporter = getUserById(issue.reporterId)
        const issueSprint = sprints.find(s => s.id === issue.sprintId)
        const TypeIcon = typeIcons[issue.type]?.icon
        const PriorityIcon = priorityConfig[issue.priority]?.icon

        const cellContent = () => {
            switch (col.id) {
                case 'parent':
                    return (
                        <div className="list-cell-editable parent-cell">
                            {parentIssue ? (
                                <span className="parent-link-display">
                                    <button
                                        className="parent-icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setActiveDatePicker(null)
                                            setActiveDropdown({ issueId: issue.id, field: 'parent' })
                                        }}
                                        title="Change parent Epic"
                                        type="button"
                                    >
                                        <Zap size={12} className="parent-icon parent-icon-clickable" />
                                    </button>
                                    <span
                                        className="parent-key-name parent-link-clickable"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedIssue(parentIssue)
                                        }}
                                        title={`${parentIssue.key} - ${parentIssue.summary}`}
                                    >
                                        {parentIssue.key} - {parentIssue.summary.length > 20 ? parentIssue.summary.substring(0, 20) + '...' : parentIssue.summary}
                                    </span>
                                </span>
                            ) : (
                                <span
                                    className="list-cell-empty-text"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setActiveDatePicker(null)
                                        setActiveDropdown({ issueId: issue.id, field: 'parent' })
                                    }}
                                >
                                    —
                                </span>
                            )}
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'parent' && (
                                <SearchableDropdown
                                    options={getParentOptions()}
                                    value={issue.parentId}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'parentId', val)}
                                    onClose={() => setActiveDropdown(null)}
                                    placeholder="Search epics..."
                                    footerAction={{
                                        icon: <Plus size={14} />,
                                        label: 'Create new Epic',
                                        onClick: () => {
                                            setActiveDropdown(null)
                                            setCreatingEpic(issue.id)
                                        }
                                    }}
                                />
                            )}
                        </div>
                    )
                case 'assignee':
                    return assignee ? (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'assignee' })
                            }}
                        >
                            <div className="avatar sm">{assignee.name.charAt(0)}</div>
                            <span>{assignee.name}</span>
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'assignee' && (
                                <SearchableDropdown
                                    options={getAssigneeOptions()}
                                    value={issue.assigneeId}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'assigneeId', val)}
                                    onClose={() => setActiveDropdown(null)}
                                />
                            )}
                        </div>
                    ) : (
                        <div
                            className="list-cell-editable list-cell-empty"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'assignee' })
                            }}
                        >
                            —
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'assignee' && (
                                <SearchableDropdown
                                    options={getAssigneeOptions()}
                                    value={issue.assigneeId}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'assigneeId', val)}
                                    onClose={() => setActiveDropdown(null)}
                                />
                            )}
                        </div>
                    )
                case 'status':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'status' })
                            }}
                        >
                            <span className={`status-badge ${issue.status}`}>
                                {statusConfig[issue.status]?.label}
                            </span>
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'status' && (
                                <SearchableDropdown
                                    options={getStatusOptions()}
                                    value={issue.status}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'status', val)}
                                    onClose={() => setActiveDropdown(null)}
                                />
                            )}
                        </div>
                    )
                case 'sprint':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'sprint' })
                            }}
                        >
                            <span className="sprint-badge">{issueSprint?.name || 'Backlog'}</span>
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'sprint' && (
                                <SearchableDropdown
                                    options={getSprintOptions()}
                                    value={issue.sprintId}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'sprintId', val)}
                                    onClose={() => setActiveDropdown(null)}
                                />
                            )}
                        </div>
                    )
                case 'startDate':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdown(null)
                                setActiveDatePicker({ issueId: issue.id, field: 'startDate' })
                            }}
                        >
                            {issue.startDate ? formatDate(issue.startDate) : '—'}
                            {activeDatePicker?.issueId === issue.id && activeDatePicker?.field === 'startDate' && (
                                <DatePicker
                                    value={issue.startDate}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'startDate', val)}
                                    onClose={() => setActiveDatePicker(null)}
                                />
                            )}
                        </div>
                    )
                case 'dueDate':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdown(null)
                                setActiveDatePicker({ issueId: issue.id, field: 'dueDate' })
                            }}
                        >
                            {issue.dueDate ? formatDate(issue.dueDate) : '—'}
                            {activeDatePicker?.issueId === issue.id && activeDatePicker?.field === 'dueDate' && (
                                <DatePicker
                                    value={issue.dueDate}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'dueDate', val)}
                                    onClose={() => setActiveDatePicker(null)}
                                />
                            )}
                        </div>
                    )
                case 'priority':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'priority' })
                            }}
                        >
                            {PriorityIcon && <PriorityIcon size={14} style={{ color: priorityConfig[issue.priority]?.color }} />}
                            <span style={{ color: priorityConfig[issue.priority]?.color }}>
                                {priorityConfig[issue.priority]?.label}
                            </span>
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'priority' && (
                                <SearchableDropdown
                                    options={getPriorityOptions()}
                                    value={issue.priority}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'priority', val)}
                                    onClose={() => setActiveDropdown(null)}
                                />
                            )}
                        </div>
                    )
                case 'storyPoints':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'storyPoints' })
                            }}
                        >
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'storyPoints' ? (
                                <input
                                    type="number"
                                    className="inline-edit-input"
                                    defaultValue={issue.storyPoints || ''}
                                    min="0"
                                    max="100"
                                    autoFocus
                                    onBlur={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value) : null
                                        handleFieldUpdate(issue.id, 'storyPoints', val)
                                        setActiveDropdown(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value ? parseInt(e.target.value) : null
                                            handleFieldUpdate(issue.id, 'storyPoints', val)
                                            setActiveDropdown(null)
                                        } else if (e.key === 'Escape') {
                                            setActiveDropdown(null)
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span>{issue.storyPoints ?? '—'}</span>
                            )}
                        </div>
                    )
                case 'reporter':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'reporter' })
                            }}
                        >
                            {reporter ? (
                                <div className="list-user">
                                    <div className="avatar xs">{reporter.name.charAt(0)}</div>
                                    <span>{reporter.name}</span>
                                </div>
                            ) : '—'}
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'reporter' && (
                                <SearchableDropdown
                                    options={getAssigneeOptions()}
                                    value={issue.reporterId}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'reporterId', val)}
                                    onClose={() => setActiveDropdown(null)}
                                    placeholder="Search users..."
                                />
                            )}
                        </div>
                    )
                case 'department':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'department' })
                            }}
                        >
                            <span>{issue.department || '—'}</span>
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'department' && (
                                <SearchableDropdown
                                    options={[
                                        { value: 'development', label: 'Development', icon: null },
                                        { value: 'design', label: 'Design', icon: null },
                                        { value: 'qa', label: 'QA', icon: null },
                                        { value: 'marketing', label: 'Marketing', icon: null },
                                        { value: 'operations', label: 'Operations', icon: null }
                                    ]}
                                    value={issue.department}
                                    onChange={(val) => handleFieldUpdate(issue.id, 'department', val)}
                                    onClose={() => setActiveDropdown(null)}
                                    placeholder="Select department..."
                                />
                            )}
                        </div>
                    )
                case 'originalEstimate':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'originalEstimate' })
                            }}
                        >
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'originalEstimate' ? (
                                <input
                                    type="number"
                                    className="inline-edit-input"
                                    defaultValue={issue.originalEstimate || ''}
                                    min="0"
                                    placeholder="Hours"
                                    autoFocus
                                    onBlur={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value) : null
                                        handleFieldUpdate(issue.id, 'originalEstimate', val)
                                        setActiveDropdown(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value ? parseInt(e.target.value) : null
                                            handleFieldUpdate(issue.id, 'originalEstimate', val)
                                            setActiveDropdown(null)
                                        } else if (e.key === 'Escape') {
                                            setActiveDropdown(null)
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span>{issue.originalEstimate ? `${issue.originalEstimate}h` : '—'}</span>
                            )}
                        </div>
                    )
                case 'labels':
                    return (
                        <div
                            className="list-cell-editable"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDatePicker(null)
                                setActiveDropdown({ issueId: issue.id, field: 'labels' })
                            }}
                        >
                            {issue.labels?.length > 0 ? (
                                <div className="list-labels">
                                    {issue.labels.slice(0, 2).map((label, idx) => (
                                        <span key={idx} className="list-label">{label}</span>
                                    ))}
                                    {issue.labels.length > 2 && <span className="list-label-more">+{issue.labels.length - 2}</span>}
                                </div>
                            ) : '—'}
                            {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'labels' && (
                                <SearchableDropdown
                                    options={[
                                        { value: 'bug', label: 'Bug', icon: null },
                                        { value: 'feature', label: 'Feature', icon: null },
                                        { value: 'enhancement', label: 'Enhancement', icon: null },
                                        { value: 'documentation', label: 'Documentation', icon: null },
                                        { value: 'urgent', label: 'Urgent', icon: null },
                                        { value: 'backend', label: 'Backend', icon: null },
                                        { value: 'frontend', label: 'Frontend', icon: null }
                                    ]}
                                    value={issue.labels?.[0] || null}
                                    onChange={(val) => {
                                        const currentLabels = issue.labels || []
                                        const newLabels = currentLabels.includes(val)
                                            ? currentLabels.filter(l => l !== val)
                                            : [...currentLabels, val]
                                        handleFieldUpdate(issue.id, 'labels', newLabels)
                                    }}
                                    onClose={() => setActiveDropdown(null)}
                                    placeholder="Add label..."
                                />
                            )}
                        </div>
                    )
                default:
                    return '—'
            }
        }

        return (
            <div
                key={col.id}
                className={`list-cell ${cellClassMap[col.id] || ''}`}
                style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: columnWidths[col.id], flexShrink: 0 } : undefined}
            >
                {cellContent()}
            </div>
        )
    }

    // Check if all visible issues are selected
    const allSelected = (() => {
        let total = 0
        groups.forEach(group => {
            if (!collapsedSections.has(group.id)) {
                total += filterIssues(sortIssues(group.issues)).length
            }
        })
        return total > 0 && selectedIssues.size === total
    })()

    return (
        <div className="list-page animate-fade-in">
            {/* Toolbar */}
            <div className="list-toolbar">
                <div className="list-toolbar-left">
                    {/* Search */}
                    <div className="list-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search list"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* User Avatars - Quick Assignee Filter */}
                    <div className="list-user-filters">
                        {users.slice(0, 4).map(user => (
                            <div
                                key={user.id}
                                className={`avatar sm clickable ${filterAssignees.has(user.id) ? 'active' : ''}`}
                                title={user.name}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFilter(filterAssignees, setFilterAssignees, user.id)
                                }}
                            >
                                {user.name.charAt(0)}
                            </div>
                        ))}
                    </div>

                    {/* Filter Button & Dropdown */}
                    <div className="filter-dropdown-wrapper">
                        <button
                            className={`btn btn-ghost btn-sm ${activeFilterCount > 0 ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowFilterMenu(!showFilterMenu)
                            }}
                        >
                            <Filter size={16} />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="filter-count">{activeFilterCount}</span>
                            )}
                        </button>
                        <FacetedFilterMenu
                            issues={issues.filter(i => !i.isDeleted)}
                            users={users}
                            sprints={sprints}
                            games={games}
                            departments={departments}
                            fieldConfig={fieldConfig}
                            filterOptions={filterOptions}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={clearAllFilters}
                            isOpen={showFilterMenu}
                            onClose={() => setShowFilterMenu(false)}
                            savedFilters={savedFilters}
                            onSaveFilter={addSavedFilter}
                            onDeleteSavedFilter={removeSavedFilter}
                            onApplySavedFilter={applySavedFilter}
                        />
                    </div>
                </div>

                <div className="list-toolbar-right">
                    {/* Group By Dropdown */}
                    <div className="list-group-by-wrapper">
                        <button
                            className="list-group-by"
                            onClick={(e) => { e.stopPropagation(); setShowGroupByMenu(!showGroupByMenu); }}
                        >
                            <span>Group: {groupBy === 'sprint' ? 'Sprint' : groupBy === 'assignee' ? 'Assignee' : 'Priority'}</span>
                            <ChevronDown size={14} />
                        </button>
                        {showGroupByMenu && (
                            <div className="group-by-menu" onClick={e => e.stopPropagation()}>
                                <button
                                    className={groupBy === 'sprint' ? 'active' : ''}
                                    onClick={() => { setGroupBy('sprint'); setShowGroupByMenu(false); }}
                                >
                                    <Calendar size={14} />
                                    Sprint
                                </button>
                                <button
                                    className={groupBy === 'assignee' ? 'active' : ''}
                                    onClick={() => { setGroupBy('assignee'); setShowGroupByMenu(false); }}
                                >
                                    <User size={14} />
                                    Assignee
                                </button>
                                <button
                                    className={groupBy === 'priority' ? 'active' : ''}
                                    onClick={() => { setGroupBy('priority'); setShowGroupByMenu(false); }}
                                >
                                    <Flag size={14} />
                                    Priority
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <button className="btn btn-icon btn-ghost">
                        <Settings2 size={16} />
                    </button>

                    <button className="btn btn-icon btn-ghost">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Active/Completed Tabs - Only when grouped by Sprint */}
            {groupBy === 'sprint' && (
                <div className="list-tabs">
                    <button
                        className={`list-tab ${!showCompleted ? 'active' : ''}`}
                        onClick={() => setShowCompleted(false)}
                    >
                        Active
                    </button>
                    <button
                        className={`list-tab ${showCompleted ? 'active' : ''}`}
                        onClick={() => setShowCompleted(true)}
                    >
                        Completed
                        {completedSprintCount > 0 && (
                            <span className="list-tab-badge">{completedSprintCount}</span>
                        )}
                    </button>
                </div>
            )}

            {/* Table */}
            <div className={`list-table ${resizingColumn ? 'resizing' : ''}`}>
                <div className="list-scroll-container">
                    <div className="list-header">
                        {/* Pinned columns (always visible on left) */}
                        <div className="list-pinned-columns">
                            <div className="list-cell list-cell-checkbox">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </div>
                            <div
                                className="list-cell list-cell-type list-header-cell list-header-pinned-resizable"
                                style={columnWidths['pinned-type'] ? { width: columnWidths['pinned-type'], minWidth: columnWidths['pinned-type'], flexShrink: 0 } : undefined}
                            >
                                Type
                                <div
                                    className="column-resize-handle"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setResizingColumn('pinned-type')
                                        resizeStartX.current = e.clientX
                                        resizeStartWidth.current = columnWidths['pinned-type'] || 60
                                    }}
                                />
                            </div>
                            <div
                                className="list-cell list-cell-key list-header-cell list-header-pinned-resizable"
                                style={columnWidths['pinned-key'] ? { width: columnWidths['pinned-key'], minWidth: columnWidths['pinned-key'], flexShrink: 0 } : undefined}
                            >
                                Key
                                <div
                                    className="column-resize-handle"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setResizingColumn('pinned-key')
                                        resizeStartX.current = e.clientX
                                        resizeStartWidth.current = columnWidths['pinned-key'] || 100
                                    }}
                                />
                            </div>
                            <div
                                className="list-cell list-cell-summary list-header-cell list-header-pinned-resizable"
                                style={columnWidths['pinned-summary'] ? { width: columnWidths['pinned-summary'], minWidth: columnWidths['pinned-summary'], flexShrink: 0 } : undefined}
                            >
                                Summary
                                <div
                                    className="column-resize-handle"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setResizingColumn('pinned-summary')
                                        resizeStartX.current = e.clientX
                                        resizeStartWidth.current = columnWidths['pinned-summary'] || 300
                                    }}
                                />
                            </div>
                        </div>
                        {/* Scrollable columns (can be reordered) */}
                        <div className="list-scrollable-columns">
                            {columnOrder.map((col, index) => renderHeaderCell(col, index))}
                        </div>
                        {/* Column Selector Button */}
                        <div className="column-add-btn">
                            <button
                                className="btn btn-ghost btn-sm column-add-button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowColumnMenu(!showColumnMenu)
                                }}
                                title="Add or manage columns"
                            >
                                <Plus size={16} />
                            </button>
                            {showColumnMenu && (
                                <div className="column-menu" onClick={(e) => e.stopPropagation()}>
                                    <div className="column-menu-header">
                                        Manage Columns
                                    </div>
                                    <div className="column-menu-list">
                                        {columnOrder.map((col, index) => (
                                            <div
                                                key={col.id}
                                                className={`column-menu-item ${draggingColumn === index ? 'dragging' : ''}`}
                                                draggable
                                                onDragStart={(e) => handleColumnDragStart(e, index)}
                                                onDragOver={(e) => handleColumnDragOver(e, index)}
                                                onDragEnd={handleColumnDragEnd}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`col-${col.id}`}
                                                    checked={!hiddenColumns.has(col.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setHiddenColumns(prev => {
                                                                const next = new Set(prev)
                                                                next.delete(col.id)
                                                                return next
                                                            })
                                                        } else {
                                                            setHiddenColumns(prev => new Set([...prev, col.id]))
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`col-${col.id}`}>{col.label}</label>
                                                <MoreHorizontal size={12} className="drag-handle" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>



                    {/* Scrollable issues area */}
                    <div className="list-body">
                        {/* Groups */}
                        {groups.map(group => {
                            const isCollapsed = collapsedSections.has(group.id)
                            const filteredIssues = filterIssues(sortIssues(group.issues))
                            const groupIssueIds = filteredIssues.map(i => i.id)
                            const allGroupSelected = groupIssueIds.length > 0 && groupIssueIds.every(id => selectedIssues.has(id))
                            const someGroupSelected = groupIssueIds.some(id => selectedIssues.has(id))

                            return (
                                <div key={group.id} className="list-group">
                                    {/* Group Header - outer extends full width, inner content sticky */}
                                    <div className="list-group-header">
                                        <div className="list-group-header-content">
                                            <div className="list-cell list-cell-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={allGroupSelected}
                                                    ref={el => { if (el) el.indeterminate = someGroupSelected && !allGroupSelected }}
                                                    onChange={(e) => handleGroupSelect(group, e.target.checked)}
                                                />
                                            </div>
                                            <button
                                                className="list-group-toggle"
                                                onClick={() => toggleSection(group.id)}
                                            >
                                                {isCollapsed ?
                                                    <ChevronRight size={16} /> :
                                                    <ChevronDown size={16} />
                                                }
                                            </button>
                                            <span className="list-group-name">{group.name}</span>
                                            <button
                                                className="list-add-btn"
                                                onClick={() => setCreatingInGroup(group.id)}
                                                title="Add issue"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <span className="list-group-count">
                                                {filteredIssues.length} issues
                                            </span>
                                        </div>
                                        <div className="list-group-header-spacer"></div>
                                    </div>

                                    {/* Group Rows */}
                                    {!isCollapsed && filteredIssues.map(issue => {
                                        const TypeIcon = typeIcons[issue.type]?.icon || CheckSquare
                                        const typeColor = typeIcons[issue.type]?.color || 'var(--text-secondary)'
                                        const PriorityIcon = priorityConfig[issue.priority]?.icon || Minus
                                        const priorityColor = priorityConfig[issue.priority]?.color
                                        const priorityLabel = priorityConfig[issue.priority]?.label || 'Medium'
                                        const status = statusConfig[issue.status] || statusConfig.todo
                                        const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null
                                        const sprint = sprints.find(s => s.id === issue.sprintId)

                                        return (
                                            <div
                                                key={issue.id}
                                                className={`list-row ${selectedIssues.has(issue.id) ? 'selected' : ''}`}
                                            >
                                                {/* Pinned cells (checkbox, type, key, summary) */}
                                                <div className="list-pinned-cells">
                                                    <div className="list-cell list-cell-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIssues.has(issue.id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedIssues(prev => {
                                                                    const next = new Set(prev)
                                                                    if (next.has(issue.id)) {
                                                                        next.delete(issue.id)
                                                                    } else {
                                                                        next.add(issue.id)
                                                                    }
                                                                    return next
                                                                })
                                                            }}
                                                        />
                                                    </div>
                                                    <div
                                                        className="list-cell list-cell-type"
                                                        style={columnWidths['pinned-type'] ? { width: columnWidths['pinned-type'], minWidth: columnWidths['pinned-type'], flexShrink: 0 } : undefined}
                                                    >
                                                        <div
                                                            className="list-type-icon"
                                                            style={{ backgroundColor: typeColor }}
                                                        >
                                                            <TypeIcon size={12} />
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="list-cell list-cell-key"
                                                        style={columnWidths['pinned-key'] ? { width: columnWidths['pinned-key'], minWidth: columnWidths['pinned-key'], flexShrink: 0 } : undefined}
                                                        onClick={() => setSelectedIssue(issue)}
                                                    >
                                                        <a className="list-key-link">{issue.key}</a>
                                                        {issue.parentId && (() => {
                                                            const parentIssue = issues.find(i => i.id === issue.parentId)
                                                            return parentIssue ? (
                                                                <div className="child-issue-link" onClick={(e) => { e.stopPropagation(); setSelectedIssue(parentIssue) }}>
                                                                    <Zap size={10} style={{ color: 'var(--epic)' }} />
                                                                    {parentIssue.key}
                                                                </div>
                                                            ) : null
                                                        })()}
                                                    </div>
                                                    <div
                                                        className="list-cell list-cell-summary"
                                                        style={columnWidths['pinned-summary'] ? { width: columnWidths['pinned-summary'], minWidth: columnWidths['pinned-summary'], flexShrink: 0 } : undefined}
                                                        onClick={() => setSelectedIssue(issue)}
                                                    >
                                                        {issue.summary}
                                                    </div>
                                                </div>
                                                {/* Scrollable cells */}
                                                <div className="list-scrollable-cells">
                                                    {columnOrder.map(col => renderDataCell(col, issue))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {/* Dynamic cells rendered by renderDataCell */}

                                    {/* Inline Create Row */}
                                    {!isCollapsed && (
                                        creatingInGroup === group.id ? (
                                            <div className="list-create-row" onClick={e => e.stopPropagation()}>
                                                {/* Type Dropdown */}
                                                <div className="list-create-type-dropdown">
                                                    <button
                                                        className={`issue-type-icon ${newIssueType}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setShowTypeDropdown(!showTypeDropdown)
                                                            setShowAssigneeDropdown(false)
                                                        }}
                                                    >
                                                        {newIssueType === 'story' && <BookOpen size={10} />}
                                                        {newIssueType === 'bug' && <Bug size={10} />}
                                                        {newIssueType === 'task' && <CheckSquare size={10} />}
                                                        <ChevronDown size={10} />
                                                    </button>
                                                    {showTypeDropdown && (
                                                        <div className="list-create-type-menu">
                                                            <button onClick={() => { setNewIssueType('story'); setShowTypeDropdown(false) }}>
                                                                <span className="issue-type-icon story"><BookOpen size={10} /></span>
                                                                Story
                                                            </button>
                                                            <button onClick={() => { setNewIssueType('bug'); setShowTypeDropdown(false) }}>
                                                                <span className="issue-type-icon bug"><Bug size={10} /></span>
                                                                Bug
                                                            </button>
                                                            <button onClick={() => { setNewIssueType('task'); setShowTypeDropdown(false) }}>
                                                                <span className="issue-type-icon task"><CheckSquare size={10} /></span>
                                                                Task
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Input Field */}
                                                <input
                                                    type="text"
                                                    className="list-create-input"
                                                    placeholder="What needs to be done?"
                                                    value={newIssueSummary}
                                                    onChange={(e) => setNewIssueSummary(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCreateIssue(group.id)
                                                        if (e.key === 'Escape') {
                                                            setCreatingInGroup(null)
                                                            setNewIssueSummary('')
                                                            setNewIssueType('story')
                                                            setNewIssueAssignee(null)
                                                        }
                                                    }}
                                                    autoFocus
                                                />

                                                {/* Calendar Icon */}
                                                <button className="inline-icon-btn" title="Set due date">
                                                    <Calendar size={16} />
                                                </button>

                                                {/* Assignee Dropdown */}
                                                <div className="list-create-assignee-dropdown">
                                                    <button
                                                        className="inline-icon-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setShowAssigneeDropdown(!showAssigneeDropdown)
                                                            setShowTypeDropdown(false)
                                                        }}
                                                        title="Assign to"
                                                    >
                                                        {newIssueAssignee ? (
                                                            <span className="avatar xs">
                                                                {getUserById(newIssueAssignee)?.name.charAt(0)}
                                                            </span>
                                                        ) : (
                                                            <User size={16} />
                                                        )}
                                                    </button>
                                                    {showAssigneeDropdown && (
                                                        <div className="list-create-assignee-menu">
                                                            <div className="assignee-search">
                                                                <Search size={14} />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search..."
                                                                    value={assigneeSearchQuery}
                                                                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                            <div className="assignee-list">
                                                                <button onClick={() => { setNewIssueAssignee(null); setShowAssigneeDropdown(false); setAssigneeSearchQuery('') }}>
                                                                    <span className="avatar xs">?</span>
                                                                    Unassigned
                                                                </button>
                                                                {users
                                                                    .filter(user => user.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()))
                                                                    .map(user => (
                                                                        <button
                                                                            key={user.id}
                                                                            onClick={() => { setNewIssueAssignee(user.id); setShowAssigneeDropdown(false); setAssigneeSearchQuery('') }}
                                                                        >
                                                                            <span className="avatar xs">{user.name.charAt(0)}</span>
                                                                            {user.name}
                                                                        </button>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Create Button */}
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleCreateIssue(group.id)}
                                                    disabled={!newIssueSummary.trim()}
                                                >
                                                    Create ↵
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="list-create-btn"
                                                onClick={() => setCreatingInGroup(group.id)}
                                            >
                                                <Plus size={14} />
                                                Create
                                            </button>
                                        )
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIssues.size > 0 && (
                <div className="bulk-action-bar">
                    <button className="bulk-action-close" onClick={() => setSelectedIssues(new Set())}>
                        <X size={16} />
                    </button>
                    <span className="bulk-action-count">
                        {selectedIssues.size} work item{selectedIssues.size > 1 ? 's' : ''} selected
                    </span>
                    <button className="btn btn-ghost btn-sm">
                        <Edit size={14} />
                        Edit
                    </button>
                    <button className="btn btn-ghost btn-sm">
                        <Copy size={14} />
                        Copy to clipboard
                    </button>
                    <button
                        className="btn btn-ghost btn-sm btn-danger-text"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <DeleteConfirmModal
                    count={selectedIssues.size}
                    onConfirm={handleBulkDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

            {/* Epic Creation Modal */}
            {creatingEpic && (
                <EpicCreateModal
                    onSave={handleCreateEpic}
                    onCancel={() => setCreatingEpic(null)}
                />
            )}
        </div>
    )
}
