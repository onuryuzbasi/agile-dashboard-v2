import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '../stores/projectStore'
import FacetedFilterMenu from '../components/common/FacetedFilterMenu'
import useGlobalFilterOptions from '../hooks/useGlobalFilterOptions'
import {
    Search,
    X,
    ChevronDown,
    ChevronRight,
    Zap,
    User,
    Building2,
    Filter,
    Bookmark,
    Bug,
    CheckSquare,
    BookOpen,
    Layers,
    ListTree,
    ChevronLeft,
    GripVertical,
    Tag,
    Check
} from 'lucide-react'
import { getIconByName } from '../config/fieldConfig'

// Type icons for issues
const typeIcons = {
    epic: Zap,
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    subtask: ListTree
}

// Status colors matching app theme
const statusConfig = {
    todo: { label: 'TO DO', color: '#94a3b8', barColor: '#64748b' },
    progress: { label: 'IN PROGRESS', color: '#3b82f6', barColor: '#3b82f6' },
    review: { label: 'IN REVIEW', color: '#8b5cf6', barColor: '#8b5cf6' },
    done: { label: 'DONE', color: '#22c55e', barColor: '#22c55e' }
}

// Helper: Days between two dates
const daysBetween = (d1, d2) => Math.round((d2 - d1) / (24 * 60 * 60 * 1000))

// Helper: Format date
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Helper: Add days to date
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

export default function Timeline() {
    // Global filter options
    const { filterOptions } = useGlobalFilterOptions()

    // Global store
    const {
        issues,
        users,
        sprints,
        games,
        departments,
        fieldConfig,
        setSelectedIssue,
        updateIssue,
        savedFilters,
        addSavedFilter,
        deleteSavedFilter
    } = useProjectStore()

    // UI State
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('weeks') // 'days' | 'weeks' | 'months' | 'quarters'
    const [groupBy, setGroupBy] = useState('epic') // 'epic' | 'assignee' | 'department'
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [showGroupByMenu, setShowGroupByMenu] = useState(false)
    const [showBarFieldsMenu, setShowBarFieldsMenu] = useState(false)
    const [barFields, setBarFields] = useState(['key', 'summary']) // Array of selected field keys
    const [collapsedGroups, setCollapsedGroups] = useState({})
    const [timelineOffset, setTimelineOffset] = useState(0) // days from today
    const [dragState, setDragState] = useState(null)

    // Refs
    const groupByRef = useRef(null)
    const barFieldsRef = useRef(null)
    const headerScrollRef = useRef(null)
    const sprintScrollRef = useRef(null)
    const bodyScrollRef = useRef(null)

    // Faceted filter state
    const [filterTypes, setFilterTypes] = useState(new Set())
    const [filterStatuses, setFilterStatuses] = useState(new Set())
    const [filterPriorities, setFilterPriorities] = useState(new Set())
    const [filterAssignees, setFilterAssignees] = useState(new Set())
    const [filterSprints, setFilterSprints] = useState(new Set())
    const [filterGames, setFilterGames] = useState(new Set())
    const [filterDepartments, setFilterDepartments] = useState(new Set())
    const [filterEpics, setFilterEpics] = useState(new Set())

    // Active (non-deleted) issues
    const activeIssues = useMemo(() =>
        issues.filter(issue => !issue.isDeleted),
        [issues]
    )

    // Epics
    const epics = useMemo(() =>
        activeIssues.filter(issue => issue.type === 'epic'),
        [activeIssues]
    )

    // Apply filters
    const filteredIssues = useMemo(() => {
        return activeIssues.filter(issue => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                if (!issue.key?.toLowerCase().includes(q) && !issue.summary?.toLowerCase().includes(q)) return false
            }
            if (filterTypes.size > 0 && !filterTypes.has(issue.type)) return false
            if (filterStatuses.size > 0 && !filterStatuses.has(issue.status)) return false
            if (filterPriorities.size > 0 && !filterPriorities.has(issue.priority)) return false
            if (filterAssignees.size > 0 && !filterAssignees.has(issue.assigneeId)) return false
            if (filterSprints.size > 0 && !filterSprints.has(issue.sprintId)) return false
            if (filterGames.size > 0 && !filterGames.has(issue.gameId)) return false
            if (filterDepartments.size > 0 && !filterDepartments.has(issue.departmentId)) return false
            if (filterEpics.size > 0) {
                const isEpic = issue.type === 'epic' && filterEpics.has(issue.id)
                if (!isEpic && !filterEpics.has(issue.epicId)) return false
            }
            return true
        })
    }, [activeIssues, searchQuery, filterTypes, filterStatuses, filterPriorities,
        filterAssignees, filterSprints, filterGames, filterDepartments, filterEpics])

    // Group issues based on groupBy mode
    const groupedData = useMemo(() => {
        const groups = []

        if (groupBy === 'epic') {
            // Epic groups
            const epicMap = new Map()
            epics.forEach(epic => epicMap.set(epic.id, { group: epic, issues: [], isEpic: true }))
            epicMap.set('no-epic', { group: { id: 'no-epic', summary: 'Issues without Epic', key: '' }, issues: [], isEpic: false })

            filteredIssues.forEach(issue => {
                if (issue.type === 'epic') return
                const epicId = issue.epicId || 'no-epic'
                if (epicMap.has(epicId)) epicMap.get(epicId).issues.push(issue)
            })

            epicMap.forEach(({ group, issues: groupIssues, isEpic }) => {
                if (isEpic || groupIssues.length > 0) {
                    // Calculate epic dates from child issues
                    let calculatedStart = null
                    let calculatedEnd = null

                    if (isEpic && groupIssues.length > 0) {
                        groupIssues.forEach(issue => {
                            const issueStart = issue.startDate ? new Date(issue.startDate) : null
                            const issueEnd = issue.dueDate ? new Date(issue.dueDate) : null

                            if (issueStart && (!calculatedStart || issueStart < calculatedStart)) {
                                calculatedStart = issueStart
                            }
                            if (issueEnd && (!calculatedEnd || issueEnd > calculatedEnd)) {
                                calculatedEnd = issueEnd
                            }
                        })
                    }

                    // Create enhanced group with calculated dates
                    const enhancedGroup = isEpic ? {
                        ...group,
                        calculatedStartDate: calculatedStart?.toISOString().split('T')[0] || group.startDate,
                        calculatedDueDate: calculatedEnd?.toISOString().split('T')[0] || group.dueDate
                    } : group

                    groups.push({ group: enhancedGroup, issues: groupIssues, isEpic, type: 'epic' })
                }
            })
        } else if (groupBy === 'assignee') {
            const assigneeMap = new Map()
            users.forEach(user => assigneeMap.set(user.id, { group: { id: user.id, name: user.name, avatar: user.avatarUrl }, issues: [] }))
            assigneeMap.set('unassigned', { group: { id: 'unassigned', name: 'Unassigned', avatar: null }, issues: [] })

            filteredIssues.forEach(issue => {
                const assigneeId = issue.assigneeId || 'unassigned'
                if (assigneeMap.has(assigneeId)) assigneeMap.get(assigneeId).issues.push(issue)
            })

            assigneeMap.forEach(({ group, issues: groupIssues }) => {
                if (groupIssues.length > 0) groups.push({ group, issues: groupIssues, type: 'assignee' })
            })
        } else if (groupBy === 'department') {
            const deptMap = new Map()
            departments?.forEach(dept => deptMap.set(dept.id, { group: { id: dept.id, name: dept.name, color: dept.color }, issues: [] }))
            deptMap.set('no-department', { group: { id: 'no-department', name: 'No Department', color: '#64748b' }, issues: [] })

            filteredIssues.forEach(issue => {
                const deptId = issue.departmentId || 'no-department'
                if (deptMap.has(deptId)) deptMap.get(deptId).issues.push(issue)
            })

            deptMap.forEach(({ group, issues: groupIssues }) => {
                if (groupIssues.length > 0) groups.push({ group, issues: groupIssues, type: 'department' })
            })
        }

        return groups
    }, [filteredIssues, groupBy, epics, users, departments])

    // Timeline configuration based on view mode
    const timelineConfig = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        switch (viewMode) {
            case 'days':
                return { cellWidth: 40, daysPerCell: 1, visibleDays: 365, headerFormat: 'day' }
            case 'weeks':
                return { cellWidth: 100, daysPerCell: 7, visibleDays: 730, headerFormat: 'week' }
            case 'months':
                return { cellWidth: 120, daysPerCell: 30, visibleDays: 1095, headerFormat: 'month' }
            case 'quarters':
                return { cellWidth: 150, daysPerCell: 91, visibleDays: 1825, headerFormat: 'quarter' }
            default:
                return { cellWidth: 100, daysPerCell: 7, visibleDays: 730, headerFormat: 'week' }
        }
    }, [viewMode])

    // Timeline range
    const timelineRange = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const startDate = addDays(today, timelineOffset - timelineConfig.visibleDays / 2)
        const endDate = addDays(today, timelineOffset + timelineConfig.visibleDays / 2)
        return { startDate, endDate, today }
    }, [timelineOffset, timelineConfig])

    // Generate timeline headers with month row
    const timelineHeaders = useMemo(() => {
        const headers = []
        let currentDate = new Date(timelineRange.startDate)
        const { daysPerCell, headerFormat } = timelineConfig

        while (currentDate < timelineRange.endDate) {
            const isToday = currentDate.toDateString() === timelineRange.today.toDateString()
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
            const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' })
            const year = currentDate.getFullYear().toString().slice(-2)

            let label = ''
            let sublabel = ''
            if (headerFormat === 'day') {
                label = `${monthName} ${currentDate.getDate()}`
            } else if (headerFormat === 'week') {
                const weekNum = Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)
                label = `${monthName} W${weekNum}`
            } else if (headerFormat === 'month') {
                label = `${monthName} '${year}`
            } else if (headerFormat === 'quarter') {
                label = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${currentDate.getFullYear()}`
            }

            headers.push({
                date: new Date(currentDate),
                label,
                sublabel,
                monthName,
                isToday,
                isWeekend
            })
            currentDate = addDays(currentDate, daysPerCell)
        }

        return headers
    }, [timelineRange, timelineConfig])

    // Generate sprint bars for header
    const sprintBars = useMemo(() => {
        if (!sprints || sprints.length === 0) return []

        const colors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']
        const pixelsPerDay = timelineConfig.cellWidth / timelineConfig.daysPerCell
        const calculatedTimelineWidth = timelineHeaders.length * timelineConfig.cellWidth

        return sprints
            .filter(sprint => sprint.startDate && sprint.endDate && sprint.state !== 'closed')
            .map((sprint, index) => {
                const start = new Date(sprint.startDate)
                const end = new Date(sprint.endDate)
                const startOffset = daysBetween(timelineRange.startDate, start)
                const duration = daysBetween(start, end)

                return {
                    ...sprint,
                    left: startOffset * pixelsPerDay,
                    width: Math.max(duration * pixelsPerDay, 60),
                    color: colors[index % colors.length]
                }
            })
            .filter(sprint => sprint.left + sprint.width > 0 && sprint.left < calculatedTimelineWidth)
    }, [sprints, timelineRange, timelineConfig, timelineHeaders])

    // Calculate bar position and width
    const getBarStyle = useCallback((startDate, endDate) => {
        if (!startDate) return null

        const start = new Date(startDate)
        const end = endDate ? new Date(endDate) : addDays(start, 1)

        const timelineStart = timelineRange.startDate
        const startOffset = daysBetween(timelineStart, start)
        const duration = Math.max(1, daysBetween(start, end))

        const pixelsPerDay = timelineConfig.cellWidth / timelineConfig.daysPerCell
        const left = startOffset * pixelsPerDay
        const width = duration * pixelsPerDay

        return { left, width: Math.max(width, 20) }
    }, [timelineRange, timelineConfig])

    // Today line position
    const todayPosition = useMemo(() => {
        const daysFromStart = daysBetween(timelineRange.startDate, timelineRange.today)
        const pixelsPerDay = timelineConfig.cellWidth / timelineConfig.daysPerCell
        return daysFromStart * pixelsPerDay
    }, [timelineRange, timelineConfig])

    // Toggle group collapse
    const toggleGroup = (groupId) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
    }

    // Handle issue click - CRITICAL: Open issue modal
    const handleIssueClick = useCallback((issue) => {
        console.log('Opening issue:', issue.key)
        setSelectedIssue(issue)
    }, [setSelectedIssue])

    // Handle bar drag start
    const handleBarMouseDown = useCallback((e, issue, handleType) => {
        e.preventDefault()
        e.stopPropagation()
        setDragState({
            issue,
            handleType, // 'move' | 'left' | 'right'
            startX: e.clientX,
            originalStart: issue.startDate,
            originalEnd: issue.dueDate
        })
    }, [])

    // Handle bar drag
    const handleBarDrag = useCallback((e) => {
        if (!dragState) return

        const deltaX = e.clientX - dragState.startX
        const pixelsPerDay = timelineConfig.cellWidth / timelineConfig.daysPerCell
        const daysDelta = Math.round(deltaX / pixelsPerDay)

        if (daysDelta === 0) return

        const originalStart = dragState.originalStart ? new Date(dragState.originalStart) : new Date()
        const originalEnd = dragState.originalEnd ? new Date(dragState.originalEnd) : addDays(originalStart, 1)

        let newStart, newEnd

        if (dragState.handleType === 'move') {
            // Move entire bar
            newStart = addDays(originalStart, daysDelta)
            newEnd = addDays(originalEnd, daysDelta)
        } else if (dragState.handleType === 'left') {
            // Resize left edge (change start date)
            newStart = addDays(originalStart, daysDelta)
            newEnd = originalEnd
            if (newStart >= newEnd) newStart = addDays(newEnd, -1)
        } else if (dragState.handleType === 'right') {
            // Resize right edge (change end date)
            newStart = originalStart
            newEnd = addDays(originalEnd, daysDelta)
            if (newEnd <= newStart) newEnd = addDays(newStart, 1)
        }

        // Visual preview (state will be committed on mouseup)
        setDragState(prev => ({
            ...prev,
            previewStart: newStart,
            previewEnd: newEnd
        }))
    }, [dragState, timelineConfig])

    // Handle bar drag end
    const handleBarDragEnd = useCallback(async () => {
        if (!dragState || !dragState.previewStart) {
            setDragState(null)
            return
        }

        const updates = {}
        const startDate = dragState.previewStart.toISOString().split('T')[0]
        const endDate = dragState.previewEnd.toISOString().split('T')[0]

        if (dragState.handleType === 'move') {
            updates.startDate = startDate
            updates.dueDate = endDate
        } else if (dragState.handleType === 'left') {
            updates.startDate = startDate
        } else if (dragState.handleType === 'right') {
            updates.dueDate = endDate
        }

        await updateIssue(dragState.issue.id, updates)
        setDragState(null)
    }, [dragState, updateIssue])

    // Drag listeners
    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleBarDrag)
            window.addEventListener('mouseup', handleBarDragEnd)
            return () => {
                window.removeEventListener('mousemove', handleBarDrag)
                window.removeEventListener('mouseup', handleBarDragEnd)
            }
        }
    }, [dragState, handleBarDrag, handleBarDragEnd])

    // Close group by menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (groupByRef.current && !groupByRef.current.contains(e.target)) {
                setShowGroupByMenu(false)
            }
        }
        if (showGroupByMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showGroupByMenu])

    // Close bar fields menu on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (barFieldsRef.current && !barFieldsRef.current.contains(e.target)) {
                setShowBarFieldsMenu(false)
            }
        }
        if (showBarFieldsMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showBarFieldsMenu])

    // Available bar label fields
    const availableBarFields = [
        { key: 'key', label: 'Key' },
        { key: 'summary', label: 'Summary' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'assignee', label: 'Assignee' },
        { key: 'sprint', label: 'Sprint' },
        { key: 'dueDate', label: 'Due Date' }
    ]

    // Toggle bar field selection
    const toggleBarField = (fieldKey) => {
        setBarFields(prev => {
            if (prev.includes(fieldKey)) {
                return prev.filter(k => k !== fieldKey)
            } else {
                return [...prev, fieldKey]
            }
        })
    }

    // Get bar label text from selected fields
    const getBarLabel = (issue) => {
        if (!issue) return ''
        const labels = []

        if (barFields.includes('key')) labels.push(issue.key)
        if (barFields.includes('summary')) labels.push(issue.summary)
        if (barFields.includes('type') && issue.type) labels.push(issue.type.toUpperCase())
        if (barFields.includes('status') && issue.status) {
            labels.push(statusConfig[issue.status]?.label || issue.status)
        }
        if (barFields.includes('priority') && issue.priority) labels.push(issue.priority.toUpperCase())
        if (barFields.includes('assignee') && issue.assigneeId && users) {
            const user = users.find(u => u.id === issue.assigneeId)
            if (user) labels.push(user.name)
        }
        if (barFields.includes('sprint') && issue.sprintId && sprints) {
            const sprint = sprints.find(s => s.id === issue.sprintId)
            if (sprint) labels.push(sprint.name)
        }
        if (barFields.includes('dueDate') && issue.dueDate) {
            labels.push(formatDate(issue.dueDate))
        }

        return labels.filter(Boolean).join(' - ')
    }

    // Sync scroll between header, sprints, and body
    const handleBodyScroll = useCallback(() => {
        if (bodyScrollRef.current) {
            const scrollLeft = bodyScrollRef.current.scrollLeft
            if (headerScrollRef.current) {
                headerScrollRef.current.scrollLeft = scrollLeft
            }
            if (sprintScrollRef.current) {
                sprintScrollRef.current.scrollLeft = scrollLeft
            }
        }
    }, [])

    // Navigate timeline
    const navigateTimeline = (direction) => {
        const step = timelineConfig.daysPerCell * 5
        setTimelineOffset(prev => direction === 'left' ? prev - step : prev + step)
    }

    // Scroll to today - center the view on today
    const scrollToToday = useCallback(() => {
        setTimelineOffset(0)
        // After state update, scroll to center
        setTimeout(() => {
            if (bodyScrollRef.current && headerScrollRef.current) {
                const scrollPosition = todayPosition - (bodyScrollRef.current.clientWidth / 2)
                bodyScrollRef.current.scrollLeft = Math.max(0, scrollPosition)
                headerScrollRef.current.scrollLeft = Math.max(0, scrollPosition)
                if (sprintScrollRef.current) {
                    sprintScrollRef.current.scrollLeft = Math.max(0, scrollPosition)
                }
            }
        }, 50)
    }, [todayPosition])

    // Handle filter change
    const handleFilterChange = useCallback((field, values) => {
        const valueSet = values instanceof Set ? values : new Set(values)
        switch (field) {
            case 'type': setFilterTypes(valueSet); break
            case 'status': setFilterStatuses(valueSet); break
            case 'priority': setFilterPriorities(valueSet); break
            case 'assignee': setFilterAssignees(valueSet); break
            case 'sprint': setFilterSprints(valueSet); break
            case 'game': setFilterGames(valueSet); break
            case 'department': setFilterDepartments(valueSet); break
            case 'epic': setFilterEpics(valueSet); break
        }
    }, [])

    // Clear all filters
    const handleClearAll = useCallback(() => {
        setSearchQuery('')
        setFilterTypes(new Set())
        setFilterStatuses(new Set())
        setFilterPriorities(new Set())
        setFilterAssignees(new Set())
        setFilterSprints(new Set())
        setFilterGames(new Set())
        setFilterDepartments(new Set())
        setFilterEpics(new Set())
    }, [])

    // Active filter count
    const activeFilterCount = filterTypes.size + filterStatuses.size + filterPriorities.size +
        filterAssignees.size + filterSprints.size + filterGames.size + filterDepartments.size + filterEpics.size

    const timelineWidth = timelineHeaders.length * timelineConfig.cellWidth

    // Render issue bar
    const renderBar = (issue) => {
        const status = statusConfig[issue.status] || statusConfig.todo

        // For epics, use calculated dates from child issues
        const useStartDate = issue.calculatedStartDate || issue.startDate
        const useEndDate = issue.calculatedDueDate || issue.dueDate

        const startDate = dragState?.issue.id === issue.id && dragState.previewStart
            ? dragState.previewStart
            : useStartDate
        const endDate = dragState?.issue.id === issue.id && dragState.previewEnd
            ? dragState.previewEnd
            : useEndDate

        const barStyle = getBarStyle(startDate, endDate)
        if (!barStyle) return null

        // Epic bars get purple color
        const isEpic = issue.type === 'epic'
        const barColor = isEpic ? '#8b5cf6' : status.barColor

        return (
            <div
                className={`gantt-bar ${issue.status} ${isEpic ? 'epic-bar' : ''} ${dragState?.issue.id === issue.id ? 'dragging' : ''}`}
                style={{
                    left: barStyle.left,
                    width: barStyle.width,
                    backgroundColor: barColor
                }}
                title={`${issue.key}: ${issue.summary}\n${formatDate(startDate)} - ${formatDate(endDate)}`}
            >
                {/* Left resize handle */}
                <div
                    className="gantt-bar-handle left"
                    onMouseDown={(e) => handleBarMouseDown(e, issue, 'left')}
                />
                {/* Move handle (center) with label */}
                <div
                    className="gantt-bar-content"
                    onMouseDown={(e) => handleBarMouseDown(e, issue, 'move')}
                    onClick={() => handleIssueClick(issue)}
                >
                    <span className="gantt-bar-label">{getBarLabel(issue)}</span>
                </div>
                {/* Right resize handle */}
                <div
                    className="gantt-bar-handle right"
                    onMouseDown={(e) => handleBarMouseDown(e, issue, 'right')}
                />
            </div>
        )
    }

    // Render group header row
    const renderGroupHeader = ({ group, issues: groupIssues, type, isEpic }) => {
        const isCollapsed = collapsedGroups[group.id]
        const TypeIcon = type === 'epic' && isEpic ? Zap : type === 'assignee' ? User : Building2

        return (
            <div
                className={`gantt-group-header ${type}`}
                onClick={() => toggleGroup(group.id)}
            >
                <div className="gantt-group-header-left">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    {type === 'epic' && isEpic && (
                        <div className="gantt-type-icon epic"><Zap size={12} /></div>
                    )}
                    {type === 'assignee' && (
                        group.avatar ? (
                            <img src={group.avatar} alt="" className="gantt-avatar" />
                        ) : (
                            <div className="gantt-avatar-placeholder"><User size={12} /></div>
                        )
                    )}
                    {type === 'department' && (
                        <div className="gantt-dept-badge" style={{ backgroundColor: group.color }}><Building2 size={10} /></div>
                    )}
                    <span className="gantt-group-name">
                        {type === 'epic' && isEpic ? `${group.key} ${group.summary}` : (group.name || group.summary)}
                    </span>
                    <span className="gantt-group-count">{groupIssues.length}</span>
                </div>
            </div>
        )
    }

    // Render issue row in sidebar
    const renderIssueRow = (issue) => {
        const TypeIcon = typeIcons[issue.type] || CheckSquare
        const status = statusConfig[issue.status] || statusConfig.todo

        return (
            <div
                key={issue.id}
                className="gantt-issue-row"
                onClick={() => handleIssueClick(issue)}
            >
                <div className="gantt-issue-row-left">
                    <div className={`gantt-type-icon ${issue.type}`}>
                        <TypeIcon size={12} />
                    </div>
                    <span className="gantt-issue-key">{issue.key}</span>
                    <span className="gantt-issue-summary">{issue.summary}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="timeline-page animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Timeline</h1>
                    <p className="text-secondary">Visualize your project schedule with Gantt chart</p>
                </div>
            </div>

            {/* Filter Bar - Matching other pages */}
            <div className="timeline-toolbar">
                {/* Search */}
                <div className="toolbar-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}
                </div>

                <div className="toolbar-divider" />

                {/* FacetedFilterMenu */}
                <div className="toolbar-filter-container" style={{ position: 'relative' }}>
                    <button
                        className={`btn btn-secondary ${activeFilterCount > 0 ? 'active' : ''}`}
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                        <Filter size={14} />
                        Filters
                        {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
                    </button>
                    <FacetedFilterMenu
                        issues={activeIssues}
                        users={users}
                        sprints={sprints}
                        games={games}
                        departments={departments}
                        fieldConfig={fieldConfig}
                        filterOptions={filterOptions}
                        filters={{
                            type: filterTypes,
                            status: filterStatuses,
                            priority: filterPriorities,
                            assignee: filterAssignees,
                            sprint: filterSprints,
                            game: filterGames,
                            department: filterDepartments,
                            epic: filterEpics
                        }}
                        onFilterChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        isOpen={showFilterMenu}
                        onClose={() => setShowFilterMenu(false)}
                        savedFilters={savedFilters || []}
                        onSaveFilter={(name, filterData) => addSavedFilter?.({ name, filters: filterData })}
                        onDeleteSavedFilter={(filterId) => deleteSavedFilter?.(filterId)}
                        onApplySavedFilter={(filterData) => {
                            if (filterData.type) setFilterTypes(new Set(filterData.type))
                            if (filterData.status) setFilterStatuses(new Set(filterData.status))
                            if (filterData.priority) setFilterPriorities(new Set(filterData.priority))
                            if (filterData.assignee) setFilterAssignees(new Set(filterData.assignee))
                            if (filterData.sprint) setFilterSprints(new Set(filterData.sprint))
                            if (filterData.game) setFilterGames(new Set(filterData.game))
                            if (filterData.department) setFilterDepartments(new Set(filterData.department))
                            if (filterData.epic) setFilterEpics(new Set(filterData.epic))
                        }}
                    />
                </div>

                <div style={{ flex: 1 }} />

                {/* View Mode */}
                <div className="toolbar-segmented">
                    <button className={viewMode === 'days' ? 'active' : ''} onClick={() => setViewMode('days')}>Day</button>
                    <button className={viewMode === 'weeks' ? 'active' : ''} onClick={() => setViewMode('weeks')}>Week</button>
                    <button className={viewMode === 'months' ? 'active' : ''} onClick={() => setViewMode('months')}>Month</button>
                    <button className={viewMode === 'quarters' ? 'active' : ''} onClick={() => setViewMode('quarters')}>Quarter</button>
                </div>

                {/* Group By */}
                <div className="toolbar-dropdown" ref={groupByRef}>
                    <button onClick={() => setShowGroupByMenu(!showGroupByMenu)}>
                        {groupBy === 'epic' && <Zap size={14} />}
                        {groupBy === 'assignee' && <User size={14} />}
                        {groupBy === 'department' && <Building2 size={14} />}
                        Group: {groupBy === 'epic' ? 'Epic' : groupBy === 'assignee' ? 'Assignee' : 'Department'}
                        <ChevronDown size={14} />
                    </button>
                    {showGroupByMenu && (
                        <div className="toolbar-dropdown-menu">
                            <button className={groupBy === 'epic' ? 'active' : ''} onClick={() => { setGroupBy('epic'); setShowGroupByMenu(false) }}>
                                <Zap size={14} /> Epic (Default)
                            </button>
                            <button className={groupBy === 'assignee' ? 'active' : ''} onClick={() => { setGroupBy('assignee'); setShowGroupByMenu(false) }}>
                                <User size={14} /> Assignee
                            </button>
                            <button className={groupBy === 'department' ? 'active' : ''} onClick={() => { setGroupBy('department'); setShowGroupByMenu(false) }}>
                                <Building2 size={14} /> Department
                            </button>
                        </div>
                    )}
                </div>

                {/* Show Fields on Bars */}
                <div className="toolbar-dropdown" ref={barFieldsRef}>
                    <button onClick={() => setShowBarFieldsMenu(!showBarFieldsMenu)}>
                        <Tag size={14} />
                        Show: {barFields.length} field{barFields.length !== 1 ? 's' : ''}
                        <ChevronDown size={14} />
                    </button>
                    {showBarFieldsMenu && (
                        <div className="toolbar-dropdown-menu bar-fields-menu">
                            <div className="bar-fields-header">Show fields on bars</div>
                            {availableBarFields.map(field => (
                                <button
                                    key={field.key}
                                    className={barFields.includes(field.key) ? 'active' : ''}
                                    onClick={() => toggleBarField(field.key)}
                                >
                                    <div className="bar-field-check">
                                        {barFields.includes(field.key) && <Check size={14} />}
                                    </div>
                                    {field.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Gantt Chart Container */}
            <div className="gantt-container">
                {/* Timeline Header */}
                <div className="gantt-header">
                    <div className="gantt-header-left">
                        <span>Task Name</span>
                    </div>
                    <div className="gantt-header-right" ref={headerScrollRef}>
                        <div className="gantt-header-cells" style={{ width: timelineWidth }}>
                            {timelineHeaders.map((header, idx) => (
                                <div
                                    key={idx}
                                    className={`gantt-header-cell ${header.isToday ? 'today' : ''} ${header.isWeekend ? 'weekend' : ''}`}
                                    style={{ width: timelineConfig.cellWidth }}
                                >
                                    {header.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sprint Swimlanes */}
                {sprintBars.length > 0 && (
                    <div className="gantt-sprints-row">
                        <div className="gantt-sprints-label">Sprints</div>
                        <div className="gantt-sprints-track" ref={sprintScrollRef}>
                            <div className="gantt-sprints-content" style={{ width: timelineWidth }}>
                                {sprintBars.map(sprint => (
                                    <div
                                        key={sprint.id}
                                        className={`gantt-sprint-bar ${sprint.state}`}
                                        style={{
                                            left: sprint.left,
                                            width: sprint.width,
                                            backgroundColor: sprint.color
                                        }}
                                        title={`${sprint.name}\n${formatDate(sprint.startDate)} - ${formatDate(sprint.endDate)}`}
                                    >
                                        <span className="gantt-sprint-name">{sprint.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Gantt Body */}
                <div className="gantt-body">
                    {/* Left Sidebar */}
                    <div className="gantt-sidebar">
                        {groupedData.map(({ group, issues: groupIssues, type, isEpic }) => (
                            <div key={group.id} className="gantt-group">
                                {renderGroupHeader({ group, issues: groupIssues, type, isEpic })}
                                {!collapsedGroups[group.id] && groupIssues.map(issue => renderIssueRow(issue))}
                            </div>
                        ))}
                    </div>

                    {/* Right Timeline Area */}
                    <div className="gantt-timeline" ref={bodyScrollRef} onScroll={handleBodyScroll}>
                        <div className="gantt-timeline-content" style={{ width: timelineWidth }}>
                            {/* Grid lines */}
                            <div className="gantt-grid">
                                {timelineHeaders.map((header, idx) => (
                                    <div
                                        key={idx}
                                        className={`gantt-grid-cell ${header.isWeekend ? 'weekend' : ''}`}
                                        style={{ width: timelineConfig.cellWidth }}
                                    />
                                ))}
                            </div>

                            {/* Today line */}
                            {todayPosition > 0 && todayPosition < timelineWidth && (
                                <div className="gantt-today-line" style={{ left: todayPosition }} />
                            )}

                            {/* Bars */}
                            {groupedData.map(({ group, issues: groupIssues, type, isEpic }) => (
                                <div key={group.id} className="gantt-bars-group">
                                    {/* Group header row - render epic bar inline with others */}
                                    <div className="gantt-bar-row">
                                        {type === 'epic' && isEpic && renderBar(group)}
                                    </div>
                                    {/* Issue rows */}
                                    {!collapsedGroups[group.id] && groupIssues.map(issue => (
                                        <div key={issue.id} className="gantt-bar-row">
                                            {renderBar(issue)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer with navigation */}
                <div className="gantt-footer">
                    <div className="gantt-nav">
                        <button onClick={() => navigateTimeline('left')}><ChevronLeft size={16} /></button>
                        <button onClick={scrollToToday} className="today-btn">Today</button>
                        <button onClick={() => navigateTimeline('right')}><ChevronRight size={16} /></button>
                    </div>
                    <div className="gantt-info">
                        {filteredIssues.length} issues
                    </div>
                </div>
            </div>
        </div>
    )
}
