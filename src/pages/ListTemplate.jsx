import { useState, useRef, useEffect, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
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
    MoreVertical,
    Calendar,
    MessageSquare,
    Settings2,
    X,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
    User,
    EyeOff
} from 'lucide-react'

// Type icons configuration
const typeIcons = {
    story: { icon: BookOpen, color: '#36B37E', bg: '#E3FCEF' },
    bug: { icon: Bug, color: '#FF5630', bg: '#FFEBE6' },
    task: { icon: CheckSquare, color: '#4FADE6', bg: '#DEEBFF' },
    epic: { icon: Layers, color: '#904EE2', bg: '#EAE6FF' },
    subtask: { icon: ListTree, color: '#4FADE6', bg: '#DEEBFF' }
}

// Priority configuration
const priorityConfig = {
    highest: { icon: ArrowUp, color: '#CD1316', label: 'Highest' },
    high: { icon: ArrowUp, color: '#E97F33', label: 'High' },
    medium: { icon: Minus, color: '#E9A233', label: 'Medium' },
    low: { icon: ArrowDown, color: '#2D8738', label: 'Low' },
    lowest: { icon: ArrowDown, color: '#57A55A', label: 'Lowest' }
}

// Status configuration - Jira style
const statusConfig = {
    todo: { label: 'TO DO', bg: '#DFE1E6', color: '#42526E' },
    progress: { label: 'IN PROGRESS', bg: '#0052CC', color: '#FFFFFF' },
    review: { label: 'IN REVIEW', bg: '#FF991F', color: '#172B4D' },
    done: { label: 'DONE', bg: '#00875A', color: '#FFFFFF' }
}

// Format date for display
const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Check if date is overdue
const isOverdue = (dateString) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

// Type Icon Component
function TypeIcon({ type }) {
    const config = typeIcons[type] || typeIcons.task
    const IconComponent = config.icon
    return (
        <div
            className="jira-type-icon"
            style={{ backgroundColor: config.bg }}
        >
            <IconComponent size={14} color={config.color} />
        </div>
    )
}

// Status Badge Component
function StatusBadge({ status }) {
    const config = statusConfig[status] || statusConfig.todo
    return (
        <span
            className="jira-status-badge"
            style={{ backgroundColor: config.bg, color: config.color }}
        >
            {config.label}
        </span>
    )
}

// Priority Icon Component
function PriorityIcon({ priority }) {
    const config = priorityConfig[priority] || priorityConfig.medium
    const IconComponent = config.icon
    return (
        <div className="jira-priority-icon" title={config.label}>
            <IconComponent size={16} color={config.color} />
        </div>
    )
}

// Avatar Component
function Avatar({ user, size = 24 }) {
    if (!user) {
        return (
            <div
                className="jira-avatar jira-avatar-empty"
                style={{ width: size, height: size }}
            >
                <User size={size * 0.6} />
            </div>
        )
    }
    return (
        <div
            className="jira-avatar"
            style={{
                width: size,
                height: size,
                backgroundColor: user.avatar ? 'transparent' : '#0052CC'
            }}
            title={user.name}
        >
            {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
            ) : (
                <span>{user.name?.charAt(0)?.toUpperCase()}</span>
            )}
        </div>
    )
}

// Date Cell Component
function DateCell({ value, showWarning = false }) {
    const formatted = formatDate(value)
    const overdue = showWarning && isOverdue(value)

    if (!formatted) return <span className="jira-empty-cell">—</span>

    return (
        <div className={`jira-date-cell ${overdue ? 'overdue' : ''}`}>
            <Calendar size={14} />
            <span>{formatted}</span>
            {overdue && <AlertTriangle size={14} className="overdue-icon" />}
        </div>
    )
}

// Sprint Selector Component
function SprintSelector({ value, sprints, onChange, isActive }) {
    const sprint = sprints.find(s => s.id === value)

    return (
        <div className={`jira-sprint-cell ${isActive ? 'active' : ''}`}>
            {sprint?.name || '—'}
        </div>
    )
}

// Searchable Dropdown for inline editing
function SearchableDropdown({ options, value, onChange, onClose, placeholder = 'Search...', createButton, renderOption }) {
    const [search, setSearch] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const filtered = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="jira-dropdown" onClick={e => e.stopPropagation()}>
            <div className="jira-dropdown-search">
                <Search size={14} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="jira-dropdown-options">
                {filtered.map(opt => (
                    <button
                        key={opt.value ?? 'none'}
                        className={`jira-dropdown-option ${value === opt.value ? 'active' : ''}`}
                        onClick={() => { onChange(opt.value); onClose(); }}
                    >
                        {renderOption ? renderOption(opt) : (
                            <>
                                {opt.icon && <span className="opt-icon">{opt.icon}</span>}
                                {opt.avatar && <Avatar user={opt.avatar} size={20} />}
                                <span>{opt.label}</span>
                            </>
                        )}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="jira-dropdown-empty">No results</div>
                )}
            </div>
            {createButton && (
                <>
                    <div className="jira-dropdown-divider" />
                    {createButton}
                </>
            )}
        </div>
    )
}

// Date Picker Component
function DatePicker({ value, onChange, onClose }) {
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days = []

        let startDay = firstDay.getDay()
        startDay = startDay === 0 ? 6 : startDay - 1

        const prevMonth = new Date(year, month, 0)
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false
            })
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

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
        <div className="jira-date-picker" onClick={e => e.stopPropagation()}>
            <div className="jira-date-picker-header">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))}>
                    <ChevronsLeft size={16} />
                </button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                    <ChevronLeft size={16} />
                </button>
                <span className="jira-date-picker-title">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                    <ChevronRight size={16} />
                </button>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))}>
                    <ChevronsRight size={16} />
                </button>
            </div>
            <div className="jira-date-picker-weekdays">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <div key={d} className="jira-date-picker-weekday">{d}</div>
                ))}
            </div>
            <div className="jira-date-picker-days">
                {days.map((day, i) => (
                    <button
                        key={i}
                        className={`jira-date-picker-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected(day.date) ? 'selected' : ''} ${isToday(day.date) ? 'today' : ''}`}
                        onClick={() => handleSelect(day.date)}
                    >
                        {day.date.getDate()}
                    </button>
                ))}
            </div>
            <div className="jira-date-picker-footer">
                <button onClick={() => { onChange(null); onClose(); }}>Clear</button>
                <button onClick={() => handleSelect(today)}>Today</button>
            </div>
        </div>
    )
}

// Main List Template Component
export default function ListTemplate() {
    const {
        issues,
        sprints,
        users,
        getUserById,
        setSelectedIssue,
        addIssue,
        updateIssue
    } = useProjectStore()

    // State
    const [searchQuery, setSearchQuery] = useState('')
    const [collapsedGroups, setCollapsedGroups] = useState(new Set())
    const [selectedIssues, setSelectedIssues] = useState(new Set())
    const [groupBy, setGroupBy] = useState('sprint')
    const [showGroupMenu, setShowGroupMenu] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState(null)
    const [activeDatePicker, setActiveDatePicker] = useState(null)
    const [showCompleted, setShowCompleted] = useState(false)

    // Filter state
    const [filterAssignees, setFilterAssignees] = useState(new Set())
    const [showFilterMenu, setShowFilterMenu] = useState(false)

    // Inline create state
    const [creatingInGroup, setCreatingInGroup] = useState(null)
    const [newIssueSummary, setNewIssueSummary] = useState('')

    // Epic creation state for dropdown
    const [showEpicCreate, setShowEpicCreate] = useState(false)
    const [newEpicName, setNewEpicName] = useState('')

    // Header menu state
    const [activeHeaderMenu, setActiveHeaderMenu] = useState(null)
    const [sortConfig, setSortConfig] = useState({ field: null, direction: null })

    // Inline summary editing
    const [editingSummary, setEditingSummary] = useState(null)
    const [editingSummaryText, setEditingSummaryText] = useState('')

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    // All available fields configuration
    const allFields = [
        { id: 'parent', label: 'Parent', width: 120, defaultVisible: true },
        { id: 'assignee', label: 'Assignee', width: 140, defaultVisible: true },
        { id: 'game', label: 'Game', width: 120, defaultVisible: true },
        { id: 'estimate', label: 'Original estimate', width: 120, defaultVisible: true },
        { id: 'status', label: 'Status', width: 100, defaultVisible: true },
        { id: 'sprint', label: 'Sprint', width: 100, defaultVisible: true },
        { id: 'startDate', label: 'Start date', width: 130, defaultVisible: true },
        { id: 'dueDate', label: 'Due date', width: 130, defaultVisible: true },
        { id: 'priority', label: 'Priority', width: 100, defaultVisible: true },
        { id: 'reporter', label: 'Reporter', width: 140, defaultVisible: true },
        { id: 'department', label: 'Department', width: 120, defaultVisible: true },
        { id: 'labels', label: 'Labels', width: 120, defaultVisible: true }
    ]

    // Column state (visible columns in order)
    const [columns, setColumns] = useState(
        allFields.filter(f => f.defaultVisible).map(f => ({ id: f.id, label: f.label, width: f.width }))
    )

    // Pinned column widths (Key, Summary)
    const [keyWidth, setKeyWidth] = useState(100)
    const [summaryWidth, setSummaryWidth] = useState(300)

    // Drag state for column reordering
    const [draggedColumn, setDraggedColumn] = useState(null)
    const [dragOverColumn, setDragOverColumn] = useState(null)

    // Resize state for column width adjustment
    const [resizingColumn, setResizingColumn] = useState(null)
    const [resizeStartX, setResizeStartX] = useState(0)
    const [resizeStartWidth, setResizeStartWidth] = useState(0)

    // Add fields dropdown state
    const [showAddFields, setShowAddFields] = useState(false)
    const [fieldSearch, setFieldSearch] = useState('')

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => {
            setActiveDropdown(null)
            setActiveDatePicker(null)
            setShowGroupMenu(false)
            setShowFilterMenu(false)
            setShowAddFields(false)
            setFieldSearch('')
            setActiveHeaderMenu(null)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    // Get active (non-deleted, non-epic) issues
    const activeIssues = useMemo(() =>
        issues.filter(i => !i.isDeleted && i.type !== 'epic'),
        [issues]
    )

    // Get epics for parent lookup
    const epics = useMemo(() =>
        issues.filter(i => !i.isDeleted && i.type === 'epic'),
        [issues]
    )

    // Calculate total scrollable columns width dynamically
    const scrollableWidth = useMemo(() => {
        const columnsWidth = columns.reduce((sum, col) => sum + col.width, 0)
        return columnsWidth + 40 // +40 for spacer/add-column button
    }, [columns])

    // Calculate total row width (pinned + scrollable) for row borders
    // Pinned columns: checkbox(40) + type(60) + key(100) + summary(300) = 500px
    const totalRowWidth = useMemo(() => {
        return 500 + scrollableWidth
    }, [scrollableWidth])

    // Get parent issue for a given issue
    const getParentIssue = (issue) => {
        if (!issue.parentId) return null
        return epics.find(e => e.id === issue.parentId)
    }

    // Toggle group collapse
    const toggleGroup = (groupId) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) {
                next.delete(groupId)
            } else {
                next.add(groupId)
            }
            return next
        })
    }

    // Get grouped issues
    const getGroupedIssues = () => {
        const groups = []

        if (groupBy === 'sprint') {
            // Always show non-closed sprints first
            const activeSprints = sprints.filter(s => s.state !== 'closed')

            const sortedSprints = [...activeSprints].sort((a, b) => {
                if (a.state === 'active') return -1
                if (b.state === 'active') return 1
                return new Date(a.startDate || 0) - new Date(b.startDate || 0)
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

            // Always show backlog
            const backlogIssues = activeIssues.filter(i => !i.sprintId)
            groups.push({
                id: 'backlog',
                name: 'Backlog',
                type: 'backlog',
                issues: backlogIssues
            })

            // Show completed sprints if toggled - all in ONE group
            if (showCompleted) {
                const closedSprints = sprints.filter(s => s.state === 'closed')
                const closedSprintIds = closedSprints.map(s => s.id)
                const completedIssues = activeIssues.filter(i => closedSprintIds.includes(i.sprintId))

                if (completedIssues.length > 0) {
                    groups.push({
                        id: 'completed',
                        name: 'Completed',
                        type: 'completed',
                        issues: completedIssues
                    })
                }
            }
        }

        return groups
    }

    // Filter issues by search and assignees
    const filterIssues = (issueList) => {
        let filtered = issueList

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(issue =>
                issue.summary.toLowerCase().includes(query) ||
                issue.key.toLowerCase().includes(query)
            )
        }

        // Filter by assignees
        if (filterAssignees.size > 0) {
            filtered = filtered.filter(issue => filterAssignees.has(issue.assigneeId))
        }

        // Sort issues if sort is configured
        if (sortConfig.field && sortConfig.direction) {
            filtered = [...filtered].sort((a, b) => {
                let aVal = a[sortConfig.field] || ''
                let bVal = b[sortConfig.field] || ''

                if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                if (typeof bVal === 'string') bVal = bVal.toLowerCase()

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return filtered
    }

    // Handle sort column
    const handleSort = (field, direction) => {
        setSortConfig({ field, direction })
        setActiveHeaderMenu(null)
    }

    // Handle hide column
    const handleHideColumn = (columnId) => {
        setColumns(prev => prev.filter(col => col.id !== columnId))
        setActiveHeaderMenu(null)
    }

    // Handle field update
    const handleFieldUpdate = (issueId, field, value) => {
        updateIssue(issueId, { [field]: value })
        setActiveDropdown(null)
        setActiveDatePicker(null)
    }

    // Handle inline create
    const handleCreateIssue = (groupId) => {
        if (!newIssueSummary.trim()) return

        addIssue({
            type: 'story',
            status: 'todo',
            priority: 'medium',
            summary: newIssueSummary.trim(),
            description: '',
            sprintId: groupBy === 'sprint' && groupId !== 'backlog' ? groupId : null,
            assigneeId: null,
            storyPoints: null,
            labels: [],
            reporterId: 'user-1'
        })

        setNewIssueSummary('')
        setCreatingInGroup(null)
    }

    // Handle row selection
    const toggleIssueSelection = (issueId) => {
        setSelectedIssues(prev => {
            const next = new Set(prev)
            if (next.has(issueId)) {
                next.delete(issueId)
            } else {
                next.add(issueId)
            }
            return next
        })
    }

    // Get all visible issue IDs (only from expanded groups)
    const getVisibleIssueIds = () => {
        const groups = getGroupedIssues()
        const visibleIds = []
        groups.forEach(group => {
            if (!collapsedGroups.has(group.id)) {
                filterIssues(group.issues).forEach(issue => visibleIds.push(issue.id))
            }
        })
        return visibleIds
    }

    // Toggle all visible issues (master checkbox)
    const toggleAllVisible = () => {
        const visibleIds = getVisibleIssueIds()
        const allSelected = visibleIds.every(id => selectedIssues.has(id))

        if (allSelected) {
            // Deselect all visible
            setSelectedIssues(prev => {
                const next = new Set(prev)
                visibleIds.forEach(id => next.delete(id))
                return next
            })
        } else {
            // Select all visible
            setSelectedIssues(prev => {
                const next = new Set(prev)
                visibleIds.forEach(id => next.add(id))
                return next
            })
        }
    }

    // Toggle all issues in a specific group
    const toggleGroupSelection = (groupId) => {
        const groups = getGroupedIssues()
        const group = groups.find(g => g.id === groupId)
        if (!group) return

        const groupIssueIds = filterIssues(group.issues).map(issue => issue.id)
        const allSelected = groupIssueIds.every(id => selectedIssues.has(id))

        if (allSelected) {
            // Deselect all in group
            setSelectedIssues(prev => {
                const next = new Set(prev)
                groupIssueIds.forEach(id => next.delete(id))
                return next
            })
        } else {
            // Select all in group
            setSelectedIssues(prev => {
                const next = new Set(prev)
                groupIssueIds.forEach(id => next.add(id))
                return next
            })
        }
    }

    // Check if all visible issues are selected (for master checkbox state)
    const areAllVisibleSelected = () => {
        const visibleIds = getVisibleIssueIds()
        return visibleIds.length > 0 && visibleIds.every(id => selectedIssues.has(id))
    }

    // Check if some but not all visible issues are selected (indeterminate state)
    const areSomeVisibleSelected = () => {
        const visibleIds = getVisibleIssueIds()
        const selectedCount = visibleIds.filter(id => selectedIssues.has(id)).length
        return selectedCount > 0 && selectedCount < visibleIds.length
    }

    // Check if all issues in a group are selected
    const areAllGroupSelected = (groupId) => {
        const groups = getGroupedIssues()
        const group = groups.find(g => g.id === groupId)
        if (!group) return false
        const groupIssueIds = filterIssues(group.issues).map(issue => issue.id)
        return groupIssueIds.length > 0 && groupIssueIds.every(id => selectedIssues.has(id))
    }

    // Check if some issues in a group are selected
    const areSomeGroupSelected = (groupId) => {
        const groups = getGroupedIssues()
        const group = groups.find(g => g.id === groupId)
        if (!group) return false
        const groupIssueIds = filterIssues(group.issues).map(issue => issue.id)
        const selectedCount = groupIssueIds.filter(id => selectedIssues.has(id)).length
        return selectedCount > 0 && selectedCount < groupIssueIds.length
    }

    // Handle summary inline edit
    const handleSummaryEdit = (issueId, newSummary) => {
        if (newSummary.trim()) {
            updateIssue(issueId, { summary: newSummary.trim() })
        }
        setEditingSummary(null)
        setEditingSummaryText('')
    }

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (deleteConfirmText.toLowerCase() === 'delete') {
            selectedIssues.forEach(issueId => {
                updateIssue(issueId, { isDeleted: true })
            })
            setSelectedIssues(new Set())
            setShowDeleteModal(false)
            setDeleteConfirmText('')
        }
    }

    // Clear selection
    const clearSelection = () => {
        setSelectedIssues(new Set())
    }

    // ====== COLUMN DRAG AND DROP ======
    const handleDragStart = (e, columnId) => {
        setDraggedColumn(columnId)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', columnId)
        // Add some visual feedback
        e.target.style.opacity = '0.5'
    }

    const handleDragOver = (e, columnId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (draggedColumn && columnId !== draggedColumn) {
            setDragOverColumn(columnId)
        }
    }

    const handleDrop = (e, targetColumnId) => {
        e.preventDefault()
        if (!draggedColumn || draggedColumn === targetColumnId) return

        setColumns(prevColumns => {
            const newColumns = [...prevColumns]
            const draggedIdx = newColumns.findIndex(c => c.id === draggedColumn)
            const targetIdx = newColumns.findIndex(c => c.id === targetColumnId)

            if (draggedIdx === -1 || targetIdx === -1) return prevColumns

            // Remove dragged column and insert at target position
            const [removed] = newColumns.splice(draggedIdx, 1)
            newColumns.splice(targetIdx, 0, removed)

            return newColumns
        })

        setDraggedColumn(null)
        setDragOverColumn(null)
    }

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1'
        setDraggedColumn(null)
        setDragOverColumn(null)
    }

    // ====== COLUMN RESIZE ======
    const handleResizeStart = (e, columnId, currentWidth) => {
        e.preventDefault()
        e.stopPropagation()
        setResizingColumn(columnId)
        setResizeStartX(e.clientX)
        setResizeStartWidth(currentWidth)
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    useEffect(() => {
        const handleResizeMove = (e) => {
            if (!resizingColumn) return
            const delta = e.clientX - resizeStartX
            const newWidth = Math.max(60, resizeStartWidth + delta)

            // Handle pinned columns
            if (resizingColumn === 'key') {
                setKeyWidth(newWidth)
            } else if (resizingColumn === 'summary') {
                setSummaryWidth(newWidth)
            } else {
                // Handle scrollable columns
                setColumns(prev => prev.map(col =>
                    col.id === resizingColumn ? { ...col, width: newWidth } : col
                ))
            }
        }

        const handleResizeEnd = () => {
            if (!resizingColumn) return
            setResizingColumn(null)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        if (resizingColumn) {
            document.addEventListener('mousemove', handleResizeMove)
            document.addEventListener('mouseup', handleResizeEnd)
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove)
            document.removeEventListener('mouseup', handleResizeEnd)
        }
    }, [resizingColumn, resizeStartX, resizeStartWidth])

    // ====== FIELD VISIBILITY TOGGLE ======
    const toggleFieldVisibility = (fieldId) => {
        const isVisible = columns.some(c => c.id === fieldId)

        if (isVisible) {
            // Remove the column
            setColumns(prev => prev.filter(c => c.id !== fieldId))
        } else {
            // Add the column at the end
            const field = allFields.find(f => f.id === fieldId)
            if (field) {
                setColumns(prev => [...prev, { id: field.id, label: field.label, width: field.width }])
            }
        }
    }

    // Filter fields by search
    const filteredFields = allFields.filter(f =>
        f.label.toLowerCase().includes(fieldSearch.toLowerCase())
    )

    // ====== DYNAMIC CELL RENDERER ======
    // Renders cell content based on column ID for dynamic column ordering
    const renderCell = (columnId, issue, column, parentIssue, assignee, reporter) => {
        const cellStyle = { width: column.width, minWidth: column.width }

        switch (columnId) {
            case 'parent':
                return (
                    <div
                        key={columnId}
                        className="cell parent"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            if (!parentIssue) {
                                setActiveDropdown({ issueId: issue.id, field: 'parent' })
                                setShowEpicCreate(false)
                            }
                        }}
                    >
                        {parentIssue ? (
                            <span
                                className="parent-link"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedIssue(parentIssue)
                                }}
                            >
                                {parentIssue.key}
                            </span>
                        ) : (
                            <span
                                className="text-tertiary parent-empty"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveDropdown({ issueId: issue.id, field: 'parent' })
                                    setShowEpicCreate(false)
                                }}
                            >
                                —
                            </span>
                        )}
                        <button
                            className="parent-edit-btn"
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveDropdown({ issueId: issue.id, field: 'parent' })
                                setShowEpicCreate(false)
                            }}
                        >
                            <ChevronDown size={12} />
                        </button>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'parent' && (
                            <SearchableDropdown
                                options={getEpicOptions()}
                                value={issue.parentId}
                                onChange={val => handleFieldUpdate(issue.id, 'parentId', val)}
                                onClose={() => { setActiveDropdown(null); setShowEpicCreate(false); setNewEpicName(''); }}
                                placeholder="Search epics..."
                                renderOption={(opt) => (
                                    <div className="epic-option">
                                        {opt.key && <span className="epic-key">{opt.key}</span>}
                                        <span className="epic-summary">{opt.summary || opt.label}</span>
                                    </div>
                                )}
                                createButton={
                                    showEpicCreate ? (
                                        <div className="jira-dropdown-create-form" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                className="jira-dropdown-create-input"
                                                placeholder="Enter epic name..."
                                                value={newEpicName}
                                                onChange={e => setNewEpicName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleCreateEpic(issue.id)
                                                    if (e.key === 'Escape') { setShowEpicCreate(false); setNewEpicName(''); }
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                className="jira-dropdown-create-btn"
                                                onClick={() => handleCreateEpic(issue.id)}
                                            >
                                                Create
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="jira-dropdown-option create-epic"
                                            onClick={e => { e.stopPropagation(); setShowEpicCreate(true); }}
                                        >
                                            <Plus size={14} />
                                            <span>Create Epic</span>
                                        </button>
                                    )
                                }
                            />
                        )}
                    </div>
                )
            case 'assignee':
                return (
                    <div
                        key={columnId}
                        className="cell assignee"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'assignee' })
                        }}
                    >
                        <Avatar user={assignee} size={24} />
                        <span className="assignee-name">
                            {assignee?.name || 'Unassigned'}
                        </span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'assignee' && (
                            <SearchableDropdown
                                options={getAssigneeOptions()}
                                value={issue.assigneeId}
                                onChange={val => handleFieldUpdate(issue.id, 'assigneeId', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'game':
                return (
                    <div
                        key={columnId}
                        className="cell game"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'game' })
                        }}
                    >
                        <span>{issue.game || 'Zen Master'}</span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'game' && (
                            <SearchableDropdown
                                options={getGameOptions()}
                                value={issue.game}
                                onChange={val => handleFieldUpdate(issue.id, 'game', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'estimate':
                return (
                    <div key={columnId} className="cell estimate" style={cellStyle}>
                        <input
                            type="text"
                            className="estimate-input"
                            value={issue.originalEstimate || ''}
                            placeholder="—"
                            onChange={e => handleFieldUpdate(issue.id, 'originalEstimate', e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                )
            case 'status':
                return (
                    <div
                        key={columnId}
                        className="cell status"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'status' })
                        }}
                    >
                        <StatusBadge status={issue.status} />
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'status' && (
                            <SearchableDropdown
                                options={getStatusOptions()}
                                value={issue.status}
                                onChange={val => handleFieldUpdate(issue.id, 'status', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'sprint':
                return (
                    <div
                        key={columnId}
                        className="cell sprint"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'sprint' })
                        }}
                    >
                        <SprintSelector
                            value={issue.sprintId}
                            sprints={sprints}
                            isActive={activeDropdown?.issueId === issue.id && activeDropdown?.field === 'sprint'}
                        />
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'sprint' && (
                            <SearchableDropdown
                                options={getSprintOptions()}
                                value={issue.sprintId}
                                onChange={val => handleFieldUpdate(issue.id, 'sprintId', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'startDate':
                return (
                    <div
                        key={columnId}
                        className="cell date"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDatePicker({ issueId: issue.id, field: 'startDate' })
                        }}
                    >
                        <DateCell value={issue.startDate} />
                        {activeDatePicker?.issueId === issue.id && activeDatePicker?.field === 'startDate' && (
                            <DatePicker
                                value={issue.startDate}
                                onChange={val => handleFieldUpdate(issue.id, 'startDate', val)}
                                onClose={() => setActiveDatePicker(null)}
                            />
                        )}
                    </div>
                )
            case 'dueDate':
                return (
                    <div
                        key={columnId}
                        className="cell date"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDatePicker({ issueId: issue.id, field: 'dueDate' })
                        }}
                    >
                        <DateCell value={issue.dueDate} showWarning />
                        {activeDatePicker?.issueId === issue.id && activeDatePicker?.field === 'dueDate' && (
                            <DatePicker
                                value={issue.dueDate}
                                onChange={val => handleFieldUpdate(issue.id, 'dueDate', val)}
                                onClose={() => setActiveDatePicker(null)}
                            />
                        )}
                    </div>
                )
            case 'priority':
                return (
                    <div
                        key={columnId}
                        className="cell priority"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'priority' })
                        }}
                    >
                        <PriorityIcon priority={issue.priority} />
                        <span className="priority-label">
                            {priorityConfig[issue.priority]?.label || 'Medium'}
                        </span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'priority' && (
                            <SearchableDropdown
                                options={getPriorityOptions()}
                                value={issue.priority}
                                onChange={val => handleFieldUpdate(issue.id, 'priority', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'reporter':
                return (
                    <div
                        key={columnId}
                        className="cell reporter"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'reporter' })
                        }}
                    >
                        <Avatar user={reporter} size={24} />
                        <span>{reporter?.name || 'Unknown'}</span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'reporter' && (
                            <SearchableDropdown
                                options={getAssigneeOptions()}
                                value={issue.reporterId}
                                onChange={val => handleFieldUpdate(issue.id, 'reporterId', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'department':
                return (
                    <div
                        key={columnId}
                        className="cell department"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'department' })
                        }}
                    >
                        <span>{issue.department || 'Development'}</span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'department' && (
                            <SearchableDropdown
                                options={getDepartmentOptions()}
                                value={issue.department}
                                onChange={val => handleFieldUpdate(issue.id, 'department', val)}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            case 'labels':
                return (
                    <div
                        key={columnId}
                        className="cell labels"
                        style={cellStyle}
                        onClick={e => {
                            e.stopPropagation()
                            setActiveDropdown({ issueId: issue.id, field: 'labels' })
                        }}
                    >
                        <span>{issue.labels?.length ? issue.labels.join(', ') : '—'}</span>
                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'labels' && (
                            <SearchableDropdown
                                options={getLabelOptions()}
                                value={issue.labels?.[0] || null}
                                onChange={val => handleFieldUpdate(issue.id, 'labels', val ? [val] : [])}
                                onClose={() => setActiveDropdown(null)}
                            />
                        )}
                    </div>
                )
            default:
                return (
                    <div key={columnId} className="cell" style={cellStyle}>
                        <span>—</span>
                    </div>
                )
        }
    }

    // Get assignee options
    const getAssigneeOptions = () => {
        return [
            { value: null, label: 'Unassigned', avatar: null },
            ...users.map(u => ({ value: u.id, label: u.name, avatar: u }))
        ]
    }

    // Get sprint options
    const getSprintOptions = () => {
        return [
            { value: null, label: 'None' },
            ...sprints.filter(s => s.state !== 'closed').map(s => ({ value: s.id, label: s.name }))
        ]
    }

    // Get status options
    const getStatusOptions = () => {
        return Object.entries(statusConfig).map(([key, val]) => ({
            value: key,
            label: val.label
        }))
    }

    // Get epic options for parent selection
    const getEpicOptions = () => {
        const epics = issues.filter(i => i.type === 'epic' && !i.isDeleted)
        return [
            { value: null, label: 'None', key: null, summary: 'No parent' },
            ...epics.map(e => ({
                value: e.id,
                label: `${e.key} - ${e.summary.length > 25 ? e.summary.substring(0, 25) + '...' : e.summary}`,
                key: e.key,
                summary: e.summary
            }))
        ]
    }

    // Create new epic and return its ID
    const handleCreateEpic = (issueId) => {
        if (!newEpicName.trim()) return
        const newEpic = addIssue({
            type: 'epic',
            status: 'todo',
            priority: 'medium',
            summary: newEpicName.trim(),
            description: '',
            sprintId: null,
            storyPoints: null,
            labels: []
        })
        handleFieldUpdate(issueId, 'parentId', newEpic.id)
        setNewEpicName('')
        setShowEpicCreate(false)
        setActiveDropdown(null)
    }

    // Get game options
    const getGameOptions = () => {
        return [
            { value: 'Zen Master', label: 'Zen Master' },
            { value: 'Dreamland', label: 'Dreamland' },
            { value: 'Royal Quest', label: 'Royal Quest' },
            { value: 'Puzzle Island', label: 'Puzzle Island' },
            { value: 'Castle Clash', label: 'Castle Clash' }
        ]
    }

    // Get priority options
    const getPriorityOptions = () => {
        return Object.entries(priorityConfig).map(([key, val]) => ({
            value: key,
            label: val.label
        }))
    }

    // Get department options
    const getDepartmentOptions = () => {
        return [
            { value: 'Development', label: 'Development' },
            { value: 'Design', label: 'Design' },
            { value: 'QA', label: 'QA' },
            { value: 'Product', label: 'Product' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Operations', label: 'Operations' }
        ]
    }

    // Get label options
    const getLabelOptions = () => {
        return [
            { value: 'frontend', label: 'Frontend' },
            { value: 'backend', label: 'Backend' },
            { value: 'api', label: 'API' },
            { value: 'ui', label: 'UI' },
            { value: 'ux', label: 'UX' },
            { value: 'bug', label: 'Bug' },
            { value: 'enhancement', label: 'Enhancement' },
            { value: 'documentation', label: 'Documentation' }
        ]
    }

    // Get type options
    const getTypeOptions = () => {
        return Object.entries(typeIcons).map(([key, val]) => ({
            value: key,
            label: key.charAt(0).toUpperCase() + key.slice(1)
        }))
    }

    const groups = getGroupedIssues()
    const activeFilterCount = filterAssignees.size

    // Count completed sprints
    const completedSprintCount = sprints.filter(s => s.state === 'closed').length

    return (
        <div className="list-template-container">
            {/* Toolbar */}
            <div className="list-template-toolbar">
                {/* Search */}
                <div className="jira-search-box">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search list"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Avatar Filter Group */}
                <div className="jira-avatar-group">
                    {users.slice(0, 4).map(user => (
                        <div
                            key={user.id}
                            className={`jira-avatar-filter ${filterAssignees.has(user.id) ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                setFilterAssignees(prev => {
                                    const next = new Set(prev)
                                    if (next.has(user.id)) {
                                        next.delete(user.id)
                                    } else {
                                        next.add(user.id)
                                    }
                                    return next
                                })
                            }}
                        >
                            <Avatar user={user} size={28} />
                        </div>
                    ))}
                    {users.length > 4 && (
                        <div className="jira-avatar-more">+{users.length - 4}</div>
                    )}
                </div>

                {/* Filter Button */}
                <button
                    className="jira-filter-btn"
                    onClick={e => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); }}
                >
                    <Filter size={16} />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="jira-filter-count">{activeFilterCount}</span>
                    )}
                </button>

                {/* Spacer */}
                <div className="toolbar-spacer" />

                {/* Group By Dropdown */}
                <div className="jira-group-dropdown" onClick={e => e.stopPropagation()}>
                    <button
                        className="jira-group-btn"
                        onClick={() => setShowGroupMenu(!showGroupMenu)}
                    >
                        <span>Group: Sprint</span>
                        <ChevronDown size={16} />
                    </button>
                    {showGroupMenu && (
                        <div className="jira-group-menu">
                            <button className={groupBy === 'sprint' ? 'active' : ''} onClick={() => { setGroupBy('sprint'); setShowGroupMenu(false); }}>
                                Sprint
                            </button>
                            <button className={groupBy === 'assignee' ? 'active' : ''} onClick={() => { setGroupBy('assignee'); setShowGroupMenu(false); }}>
                                Assignee
                            </button>
                            <button className={groupBy === 'priority' ? 'active' : ''} onClick={() => { setGroupBy('priority'); setShowGroupMenu(false); }}>
                                Priority
                            </button>
                        </div>
                    )}
                </div>

                {/* Settings */}
                <button className="jira-icon-btn">
                    <Settings2 size={18} />
                </button>
                <button className="jira-icon-btn">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {/* Table */}
            <div className="list-template-table-wrapper">
                <div className="list-template-table">
                    {/* Header Row */}
                    <div className="list-template-header" style={{ minWidth: totalRowWidth }}>
                        <div className="pinned-columns">
                            <div className="header-cell checkbox">
                                <input
                                    type="checkbox"
                                    checked={areAllVisibleSelected()}
                                    ref={el => { if (el) el.indeterminate = areSomeVisibleSelected() }}
                                    onChange={toggleAllVisible}
                                />
                            </div>
                            <div className="header-cell type">
                                <span className="header-label">Type</span>
                            </div>
                            <div className="header-cell key" style={{ width: keyWidth, minWidth: keyWidth }}>
                                <span className="header-label">Key</span>
                                <button
                                    className="header-menu-btn"
                                    onClick={(e) => { e.stopPropagation(); setActiveHeaderMenu(activeHeaderMenu === 'key' ? null : 'key'); }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {activeHeaderMenu === 'key' && (
                                    <div className="header-menu-dropdown" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleSort('key', 'asc')}><ArrowUp size={14} /> Sort A to Z</button>
                                        <button onClick={() => handleSort('key', 'desc')}><ArrowDown size={14} /> Sort Z to A</button>
                                    </div>
                                )}
                                <div
                                    className="column-resize-handle"
                                    onMouseDown={(e) => handleResizeStart(e, 'key', keyWidth)}
                                />
                            </div>
                            <div className="header-cell summary" style={{ width: summaryWidth, minWidth: summaryWidth }}>
                                <span className="header-label">Summary</span>
                                <button
                                    className="header-menu-btn"
                                    onClick={(e) => { e.stopPropagation(); setActiveHeaderMenu(activeHeaderMenu === 'summary' ? null : 'summary'); }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                                {activeHeaderMenu === 'summary' && (
                                    <div className="header-menu-dropdown" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => handleSort('summary', 'asc')}><ArrowUp size={14} /> Sort A to Z</button>
                                        <button onClick={() => handleSort('summary', 'desc')}><ArrowDown size={14} /> Sort Z to A</button>
                                    </div>
                                )}
                                <div
                                    className="column-resize-handle"
                                    onMouseDown={(e) => handleResizeStart(e, 'summary', summaryWidth)}
                                />
                            </div>
                        </div>
                        <div className="scrollable-columns" style={{ minWidth: scrollableWidth }}>
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className={`header-cell ${dragOverColumn === col.id ? 'drag-over' : ''}`}
                                    style={{ width: col.width, minWidth: col.width, flex: col.flex ? 1 : undefined }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, col.id)}
                                    onDragOver={(e) => handleDragOver(e, col.id)}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <span className="header-label">{col.label}</span>
                                    <button
                                        className="header-menu-btn"
                                        onClick={(e) => { e.stopPropagation(); setActiveHeaderMenu(activeHeaderMenu === col.id ? null : col.id); }}
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                    {activeHeaderMenu === col.id && (
                                        <div className="header-menu-dropdown" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleSort(col.id, 'asc')}><ArrowUp size={14} /> Sort A to Z</button>
                                            <button onClick={() => handleSort(col.id, 'desc')}><ArrowDown size={14} /> Sort Z to A</button>
                                            <div className="menu-divider" />
                                            <button onClick={() => handleHideColumn(col.id)}><EyeOff size={14} /> Hide Field</button>
                                        </div>
                                    )}
                                    {/* Resize handle */}
                                    <div
                                        className="column-resize-handle"
                                        onMouseDown={(e) => handleResizeStart(e, col.id, col.width)}
                                    />
                                </div>
                            ))}
                            <div
                                className="header-cell add-column"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowAddFields(!showAddFields)
                                }}
                            >
                                <Plus size={16} />
                                {showAddFields && (
                                    <div
                                        className="add-fields-dropdown"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="add-fields-header">
                                            <span>Add Fields</span>
                                            <button
                                                className="close-btn"
                                                onClick={() => setShowAddFields(false)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="add-fields-search">
                                            <Search size={14} />
                                            <input
                                                type="text"
                                                placeholder="Search fields..."
                                                value={fieldSearch}
                                                onChange={(e) => setFieldSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="add-fields-list">
                                            {filteredFields.map(field => {
                                                const isVisible = columns.some(c => c.id === field.id)
                                                return (
                                                    <label key={field.id} className="field-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={isVisible}
                                                            onChange={() => toggleFieldVisibility(field.id)}
                                                        />
                                                        <span>{field.label}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Groups */}
                    {groups.map(group => (
                        <div key={group.id} className="list-template-group-container">
                            {/* Group Header */}
                            <div className="list-template-group-header" style={{ minWidth: totalRowWidth }}>
                                <div className="pinned-columns">
                                    <div className="cell checkbox">
                                        <input
                                            type="checkbox"
                                            checked={areAllGroupSelected(group.id)}
                                            ref={el => { if (el) el.indeterminate = areSomeGroupSelected(group.id) }}
                                            onChange={() => toggleGroupSelection(group.id)}
                                        />
                                    </div>
                                    <button
                                        className="group-expand-btn"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        {collapsedGroups.has(group.id) ? (
                                            <ChevronRight size={16} />
                                        ) : (
                                            <ChevronDown size={16} />
                                        )}
                                    </button>
                                    <span className="group-name">{group.name}</span>
                                    <button
                                        className="group-add-btn"
                                        onClick={() => setCreatingInGroup(group.id)}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {/* Scrollable spacer to extend group header with columns */}
                                <div className="scrollable-columns group-header-spacer" style={{ minWidth: scrollableWidth }}></div>
                            </div>

                            {/* Group Issues */}
                            {!collapsedGroups.has(group.id) && (
                                <div className="list-template-rows">
                                    {filterIssues(group.issues).map(issue => {
                                        const parentIssue = getParentIssue(issue)
                                        const assignee = getUserById(issue.assigneeId)
                                        const reporter = getUserById(issue.reporterId)

                                        return (
                                            <div
                                                key={issue.id}
                                                className={`list-template-row ${selectedIssues.has(issue.id) ? 'selected' : ''}`}
                                                style={{ minWidth: totalRowWidth }}
                                            >
                                                <div className="pinned-columns">
                                                    <div className="cell checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIssues.has(issue.id)}
                                                            onChange={() => toggleIssueSelection(issue.id)}
                                                        />
                                                    </div>
                                                    <div
                                                        className="cell type"
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            setActiveDropdown({ issueId: issue.id, field: 'type' })
                                                        }}
                                                    >
                                                        <TypeIcon type={issue.type} />
                                                        {activeDropdown?.issueId === issue.id && activeDropdown?.field === 'type' && (
                                                            <SearchableDropdown
                                                                options={getTypeOptions()}
                                                                value={issue.type}
                                                                onChange={val => handleFieldUpdate(issue.id, 'type', val)}
                                                                onClose={() => setActiveDropdown(null)}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="cell key" style={{ width: keyWidth, minWidth: keyWidth }}>
                                                        {parentIssue && (
                                                            <span
                                                                className="parent-key-link"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedIssue(parentIssue)
                                                                }}
                                                            >
                                                                {parentIssue.key}
                                                            </span>
                                                        )}
                                                        {parentIssue && <span className="key-separator">&gt;</span>}
                                                        <span
                                                            className="issue-key-link"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedIssue(issue)
                                                            }}
                                                        >
                                                            {issue.key}
                                                        </span>
                                                    </div>
                                                    <div className="cell summary" style={{ width: summaryWidth, minWidth: summaryWidth }}>
                                                        {editingSummary === issue.id ? (
                                                            <input
                                                                type="text"
                                                                className="summary-edit-input"
                                                                value={editingSummaryText}
                                                                onChange={e => setEditingSummaryText(e.target.value)}
                                                                onBlur={() => handleSummaryEdit(issue.id, editingSummaryText)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleSummaryEdit(issue.id, editingSummaryText)
                                                                    if (e.key === 'Escape') { setEditingSummary(null); setEditingSummaryText(''); }
                                                                }}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                className="summary-text"
                                                                onClick={() => {
                                                                    setEditingSummary(issue.id)
                                                                    setEditingSummaryText(issue.summary)
                                                                }}
                                                            >
                                                                {issue.summary}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="scrollable-columns" style={{ minWidth: scrollableWidth }}>
                                                    {columns.map(col => renderCell(col.id, issue, col, parentIssue, assignee, reporter))}
                                                    {/* Spacer to match header add-column button */}
                                                    <div className="cell spacer" style={{ width: 40, minWidth: 40 }}></div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Inline Create Row */}
                                    {creatingInGroup === group.id && (
                                        <div className="list-template-row create-row">
                                            <div className="pinned-columns">
                                                <div className="cell checkbox" />
                                                <div className="cell type">
                                                    <TypeIcon type="story" />
                                                </div>
                                                <div className="cell key" style={{ width: keyWidth, minWidth: keyWidth }}>
                                                    <span className="new-key">NEW</span>
                                                </div>
                                                <div className="cell summary" style={{ width: summaryWidth, minWidth: summaryWidth }}>
                                                    <input
                                                        type="text"
                                                        className="inline-create-input"
                                                        placeholder="What needs to be done?"
                                                        value={newIssueSummary}
                                                        onChange={e => setNewIssueSummary(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleCreateIssue(group.id)
                                                            if (e.key === 'Escape') setCreatingInGroup(null)
                                                        }}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="scrollable-columns">
                                                <div className="cell" style={{ width: 120 }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Completed Sprint Section */}
                    {completedSprintCount > 0 && !showCompleted && (
                        <div className="list-template-group-container">
                            <div className="list-template-group-header completed" style={{ minWidth: totalRowWidth }}>
                                <div className="pinned-columns">
                                    <div className="cell checkbox" />
                                    <button
                                        className="group-expand-btn"
                                        onClick={() => setShowCompleted(true)}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                    <span className="group-name">Completed sprint</span>
                                    <span className="completed-count">{completedSprintCount}</span>
                                </div>
                                {/* Scrollable spacer to extend group header with columns */}
                                <div className="scrollable-columns group-header-spacer" style={{ minWidth: scrollableWidth }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Bar - shown when items are selected */}
            {selectedIssues.size > 0 && (
                <div className="floating-action-bar">
                    <button className="fab-close" onClick={clearSelection}>
                        <X size={16} />
                    </button>
                    <span className="fab-count">{selectedIssues.size} work items selected</span>
                    <button className="fab-action">
                        <Settings2 size={16} />
                        <span>Edit</span>
                    </button>
                    <button className="fab-action">
                        <MessageSquare size={16} />
                        <span>Copy to clipboard</span>
                    </button>
                    <button className="fab-action danger" onClick={() => setShowDeleteModal(true)}>
                        <AlertTriangle size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="delete-modal-overlay" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-header">
                            <AlertTriangle size={24} color="#DE350B" />
                            <h3>Delete {selectedIssues.size} items?</h3>
                        </div>
                        <p>This action cannot be undone. To confirm deletion, type <strong>delete</strong> below:</p>
                        <input
                            type="text"
                            className="delete-confirm-input"
                            placeholder="Type 'delete' to confirm"
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            autoFocus
                        />
                        <div className="delete-modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="delete-btn"
                                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                                onClick={handleBulkDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
