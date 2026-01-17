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
    Calendar,
    MessageSquare,
    Settings2,
    X,
    ChevronLeft,
    ChevronsLeft,
    ChevronsRight,
    AlertTriangle,
    User
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
function SearchableDropdown({ options, value, onChange, onClose, placeholder = 'Search...' }) {
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
                        key={opt.value}
                        className={`jira-dropdown-option ${value === opt.value ? 'active' : ''}`}
                        onClick={() => { onChange(opt.value); onClose(); }}
                    >
                        {opt.icon && <span className="opt-icon">{opt.icon}</span>}
                        {opt.avatar && <Avatar user={opt.avatar} size={20} />}
                        <span>{opt.label}</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="jira-dropdown-empty">No results</div>
                )}
            </div>
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

    // Column configuration (scrollable columns - excludes pinned Type, Key, Summary)
    const columns = [
        { id: 'parent', label: 'Parent', width: 120 },
        { id: 'assignee', label: 'Assignee', width: 140 },
        { id: 'project', label: 'Project Name', width: 120 },
        { id: 'estimate', label: 'Original estimate', width: 120 },
        { id: 'status', label: 'Status', width: 100 },
        { id: 'sprint', label: 'Sprint', width: 100 },
        { id: 'startDate', label: 'Start date', width: 130 },
        { id: 'dueDate', label: 'Due date', width: 130 },
        { id: 'priority', label: 'Priority', width: 80 },
        { id: 'comments', label: 'Comments', width: 100 },
        { id: 'reporter', label: 'Reporter', width: 140 },
        { id: 'department', label: 'Department', width: 120 },
        { id: 'affectsVersions', label: 'Affects versions', width: 130 }
    ]

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = () => {
            setActiveDropdown(null)
            setActiveDatePicker(null)
            setShowGroupMenu(false)
            setShowFilterMenu(false)
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

    // Get parent issue for a given issue
    const getParentIssue = (issue) => {
        if (!issue.epicId) return null
        return epics.find(e => e.id === issue.epicId)
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

    // Filter issues by search
    const filterIssues = (issueList) => {
        if (!searchQuery) return issueList
        const query = searchQuery.toLowerCase()
        return issueList.filter(issue =>
            issue.summary.toLowerCase().includes(query) ||
            issue.key.toLowerCase().includes(query)
        )
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
                        <Avatar key={user.id} user={user} size={28} />
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
                    <div className="list-template-header">
                        <div className="pinned-columns">
                            <div className="header-cell checkbox">
                                <input type="checkbox" />
                            </div>
                            <div className="header-cell type">Type</div>
                            <div className="header-cell key">
                                Key
                                <ChevronDown size={14} className="sort-icon" />
                            </div>
                            <div className="header-cell summary">
                                Summary
                                <ChevronDown size={14} className="sort-icon" />
                            </div>
                        </div>
                        <div className="scrollable-columns">
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className="header-cell"
                                    style={{ width: col.width, minWidth: col.width, flex: col.flex ? 1 : undefined }}
                                >
                                    {col.label}
                                    <ChevronDown size={14} className="sort-icon" />
                                </div>
                            ))}
                            <div className="header-cell add-column">
                                <Plus size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Groups */}
                    {groups.map(group => (
                        <div key={group.id} className="list-template-group-container">
                            {/* Group Header */}
                            <div className="list-template-group-header">
                                <div className="pinned-columns">
                                    <div className="cell checkbox">
                                        <input type="checkbox" />
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
                                            >
                                                <div className="pinned-columns">
                                                    <div className="cell checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIssues.has(issue.id)}
                                                            onChange={() => toggleIssueSelection(issue.id)}
                                                        />
                                                    </div>
                                                    <div className="cell type">
                                                        <TypeIcon type={issue.type} />
                                                    </div>
                                                    <div className="cell key">
                                                        {parentIssue && (
                                                            <div className="parent-key">{parentIssue.key}</div>
                                                        )}
                                                        <div
                                                            className={`issue-key ${parentIssue ? 'has-parent' : ''}`}
                                                            onClick={() => setSelectedIssue(issue)}
                                                        >
                                                            {parentIssue && <span className="key-indent">└</span>}
                                                            <span className="key-link">{issue.key}</span>
                                                        </div>
                                                    </div>
                                                    <div className="cell summary">
                                                        <span
                                                            className="summary-text"
                                                            onClick={() => setSelectedIssue(issue)}
                                                        >
                                                            {issue.summary}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="scrollable-columns">
                                                    {/* Parent */}
                                                    <div className="cell" style={{ width: 120, minWidth: 120 }}>
                                                        {parentIssue ? (
                                                            <span className="parent-link">{parentIssue.key}</span>
                                                        ) : '—'}
                                                    </div>
                                                    {/* Assignee */}
                                                    <div
                                                        className="cell assignee"
                                                        style={{ width: 140, minWidth: 140 }}
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
                                                    {/* Project Name */}
                                                    <div className="cell" style={{ width: 120, minWidth: 120 }}>
                                                        <span>{issue.projectName || 'Zen Master'}</span>
                                                    </div>
                                                    {/* Original Estimate */}
                                                    <div className="cell" style={{ width: 120, minWidth: 120 }}>
                                                        <span>{issue.originalEstimate || issue.storyPoints ? `${issue.storyPoints || issue.originalEstimate}h` : '—'}</span>
                                                    </div>
                                                    {/* Status */}
                                                    <div
                                                        className="cell status"
                                                        style={{ width: 100, minWidth: 100 }}
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
                                                    {/* Sprint */}
                                                    <div
                                                        className="cell sprint"
                                                        style={{ width: 100, minWidth: 100 }}
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
                                                    {/* Start Date */}
                                                    <div
                                                        className="cell date"
                                                        style={{ width: 130, minWidth: 130 }}
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
                                                    {/* Due Date */}
                                                    <div
                                                        className="cell date"
                                                        style={{ width: 130, minWidth: 130 }}
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
                                                    {/* Priority */}
                                                    <div className="cell priority" style={{ width: 80, minWidth: 80 }}>
                                                        <PriorityIcon priority={issue.priority} />
                                                        <span className="priority-label">
                                                            {priorityConfig[issue.priority]?.label || 'Medium'}
                                                        </span>
                                                    </div>
                                                    {/* Comments */}
                                                    <div className="cell comments" style={{ width: 100, minWidth: 100 }}>
                                                        <MessageSquare size={14} />
                                                        <span>
                                                            {issue.comments?.length ? `${issue.comments.length} comment${issue.comments.length > 1 ? 's' : ''}` : 'Add comment'}
                                                        </span>
                                                    </div>
                                                    {/* Reporter */}
                                                    <div className="cell reporter" style={{ width: 140, minWidth: 140 }}>
                                                        <Avatar user={reporter} size={24} />
                                                        <span>{reporter?.name || 'Unknown'}</span>
                                                    </div>
                                                    {/* Department */}
                                                    <div className="cell" style={{ width: 120, minWidth: 120 }}>
                                                        <span>{issue.department || 'Development'}</span>
                                                    </div>
                                                    {/* Affects Versions */}
                                                    <div className="cell" style={{ width: 130, minWidth: 130 }}>
                                                        <span>—</span>
                                                    </div>
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
                                                <div className="cell key">
                                                    <span className="new-key">NEW</span>
                                                </div>
                                                <div className="cell summary">
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
                            <div className="list-template-group-header completed">
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
