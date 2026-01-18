import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useProjectStore } from '../stores/projectStore'
import {
    ChevronRight,
    ChevronDown,
    Zap,
    Bug,
    CheckSquare,
    BookOpen,
    Layers,
    Check,
    X,
    Filter,
    Square,
    Search,
    ChevronLeft,
    ListTree
} from 'lucide-react'
import { getIconByName } from '../config/fieldConfig'

// Default type icons (fallback)
const defaultTypeIcons = {
    epic: Zap,
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    subtask: Layers
}

// Days between dates
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000
    return Math.round((new Date(date2) - new Date(date1)) / oneDay)
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Get week number
function getWeekNumber(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Multi-select dropdown
function MultiSelectDropdown({ label, options, selected, onChange }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="timeline-filter-dropdown" ref={dropdownRef}>
            <button
                className={`timeline-filter-btn ${selected.length > 0 ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {label}
                {selected.length > 0 && <span className="filter-count">{selected.length}</span>}
                <ChevronDown size={14} />
            </button>
            {isOpen && (
                <div className="timeline-filter-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            className={`timeline-filter-option ${selected.includes(option.value) ? 'selected' : ''}`}
                            onClick={() => {
                                if (selected.includes(option.value)) {
                                    onChange(selected.filter(v => v !== option.value))
                                } else {
                                    onChange([...selected, option.value])
                                }
                            }}
                        >
                            <div className="filter-option-check">
                                {selected.includes(option.value) && <Check size={14} />}
                            </div>
                            {option.label}
                        </button>
                    ))}
                    {selected.length > 0 && (
                        <>
                            <div className="filter-menu-divider" />
                            <button className="timeline-filter-option clear-btn" onClick={() => onChange([])}>
                                <X size={14} /> Clear
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default function Timeline() {
    // GLOBAL DATA - Single Source of Truth
    const {
        issues, sprints, users, games, departments,
        fieldConfig,
        setSelectedIssue, updateIssue
    } = useProjectStore()

    // Build dynamic configs from fieldConfig
    const statusConfig = useMemo(() => {
        const config = {}
            ; (fieldConfig?.statuses || []).forEach(s => {
                config[s.key] = {
                    label: s.label,
                    color: s.bgColor || '#94a3b8',
                    barColor: s.bgColor || '#94a3b8'
                }
            })
        // Fallback defaults if empty
        if (Object.keys(config).length === 0) {
            return {
                todo: { label: 'TO DO', color: '#94a3b8', barColor: '#ef4444' },
                progress: { label: 'IN PROGRESS', color: '#3b82f6', barColor: '#0891b2' },
                review: { label: 'IN REVIEW', color: '#a855f7', barColor: '#8b5cf6' },
                done: { label: 'DONE', color: '#22c55e', barColor: '#22c55e' }
            }
        }
        return config
    }, [fieldConfig])

    // Get type icon dynamically
    const getTypeIcon = useCallback((typeKey) => {
        const typeConfig = fieldConfig?.issueTypes?.find(t => t.key === typeKey)
        if (typeConfig?.icon) {
            return getIconByName(typeConfig.icon, CheckSquare)
        }
        return defaultTypeIcons[typeKey] || Square
    }, [fieldConfig])

    // UI state
    const [searchQuery, setSearchQuery] = useState('')
    const [epicFilter, setEpicFilter] = useState([])
    const [statusFilter, setStatusFilter] = useState([])
    const [priorityFilter, setPriorityFilter] = useState([])
    const [assigneeFilter, setAssigneeFilter] = useState([])
    const [sprintFilter, setSprintFilter] = useState([])
    const [gameFilter, setGameFilter] = useState([])
    const [departmentFilter, setDepartmentFilter] = useState([])
    const [collapsedEpics, setCollapsedEpics] = useState({})
    const [zoomLevel, setZoomLevel] = useState('weeks')
    const [timelineOffset, setTimelineOffset] = useState(0)
    const [dragState, setDragState] = useState(null)

    // Refs for synchronized scrolling
    const headerScrollRef = useRef(null)
    const bodyScrollRef = useRef(null)
    const isScrollSyncing = useRef(false)

    // Active issues from global store
    const activeIssues = useMemo(() => issues.filter(issue => !issue.isDeleted), [issues])
    const epics = useMemo(() => activeIssues.filter(issue => issue.type === 'epic'), [activeIssues])

    // Dynamic filter options from fieldConfig
    const epicOptions = useMemo(() => epics.map(epic => ({ value: epic.id, label: `${epic.key} ${epic.summary}` })), [epics])

    const statusOptions = useMemo(() => {
        return (fieldConfig?.statuses || []).map(s => ({ value: s.key, label: s.label }))
    }, [fieldConfig])

    const priorityOptions = useMemo(() => {
        return (fieldConfig?.priorities || []).map(p => ({ value: p.key, label: p.label }))
    }, [fieldConfig])

    const assigneeOptions = useMemo(() => users.map(user => ({ value: user.id, label: user.name })), [users])
    const sprintOptions = useMemo(() => sprints.map(sprint => ({ value: sprint.id, label: sprint.name })), [sprints])
    const gameOptions = useMemo(() => games.map(game => ({ value: game.id, label: game.name })), [games])
    const departmentOptions = useMemo(() => (departments || []).map(dept => ({ value: dept.id, label: dept.name })), [departments])

    // Apply filters
    const filteredIssues = useMemo(() => {
        return activeIssues.filter(issue => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!issue.key.toLowerCase().includes(query) && !issue.summary.toLowerCase().includes(query)) return false
            }
            if (epicFilter.length > 0) {
                const isMatchingEpic = issue.type === 'epic' && epicFilter.includes(issue.id)
                const parentId = issue.parentId || issue.epicId
                if (!isMatchingEpic && !(parentId && epicFilter.includes(parentId))) return false
            }
            if (statusFilter.length > 0 && !statusFilter.includes(issue.status)) return false
            if (priorityFilter.length > 0 && !priorityFilter.includes(issue.priority)) return false
            if (assigneeFilter.length > 0 && !assigneeFilter.includes(issue.assigneeId)) return false
            if (sprintFilter.length > 0 && !sprintFilter.includes(issue.sprintId)) return false
            if (gameFilter.length > 0 && !gameFilter.includes(issue.gameId)) return false
            if (departmentFilter.length > 0 && !departmentFilter.includes(issue.departmentId)) return false
            return true
        })
    }, [activeIssues, searchQuery, epicFilter, statusFilter, priorityFilter, assigneeFilter, sprintFilter, gameFilter, departmentFilter])

    // Group issues
    const groupedIssues = useMemo(() => {
        const epicMap = new Map()
        const noEpicIssues = []
        filteredIssues.forEach(issue => {
            if (issue.type === 'epic') epicMap.set(issue.id, { epic: issue, children: [] })
        })
        filteredIssues.forEach(issue => {
            if (issue.type !== 'epic') {
                const parentId = issue.parentId || issue.epicId
                if (parentId && epicMap.has(parentId)) epicMap.get(parentId).children.push(issue)
                else if (!parentId) noEpicIssues.push(issue)
            }
        })
        return { epicGroups: Array.from(epicMap.values()), noEpicIssues }
    }, [filteredIssues])

    // Timeline range
    const timelineRange = useMemo(() => {
        const today = new Date()
        const baseDays = zoomLevel === 'today' ? 60 : zoomLevel === 'weeks' ? 120 : zoomLevel === 'months' ? 180 : 365
        const start = new Date(today)
        start.setDate(start.getDate() - baseDays / 2 + timelineOffset)
        const end = new Date(today)
        end.setDate(end.getDate() + baseDays / 2 + timelineOffset)
        return { start, end }
    }, [zoomLevel, timelineOffset])

    // Get cell width
    const getCellWidth = useCallback(() => {
        switch (zoomLevel) {
            case 'today': return 40
            case 'weeks': return 80 // Each cell = 1 week
            case 'months': return 60
            case 'quarters': return 80
            default: return 40
        }
    }, [zoomLevel])

    // Generate timeline headers - FIXED WEEKS VIEW
    const timelineHeaders = useMemo(() => {
        const headers = []
        const { start, end } = timelineRange
        let current = new Date(start)

        if (zoomLevel === 'today') {
            // Day view
            while (current <= end) {
                headers.push({
                    date: new Date(current),
                    label: current.getDate().toString(),
                    isWeekend: current.getDay() === 0 || current.getDay() === 6,
                    isToday: current.toDateString() === new Date().toDateString(),
                    monthLabel: current.getDate() === 1 || headers.length === 0
                        ? current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                        : null
                })
                current.setDate(current.getDate() + 1)
            }
        } else if (zoomLevel === 'weeks') {
            // WEEK VIEW - Show week numbers
            current.setDate(current.getDate() - current.getDay() + 1) // Start on Monday
            while (current <= end) {
                const weekNum = getWeekNumber(current)
                const weekEnd = new Date(current)
                weekEnd.setDate(weekEnd.getDate() + 6)
                const isCurrentWeek = new Date() >= current && new Date() <= weekEnd

                headers.push({
                    date: new Date(current),
                    label: `W${weekNum}`,
                    sublabel: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { day: 'numeric' })}`,
                    isToday: isCurrentWeek,
                    monthLabel: current.getDate() <= 7 || headers.length === 0
                        ? current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                        : null
                })
                current.setDate(current.getDate() + 7)
            }
        } else if (zoomLevel === 'months') {
            // Week intervals for months view
            current.setDate(current.getDate() - current.getDay())
            let weekNum = 1
            let currentMonth = current.getMonth()
            while (current <= end) {
                if (current.getMonth() !== currentMonth) {
                    weekNum = 1
                    currentMonth = current.getMonth()
                }
                headers.push({
                    date: new Date(current),
                    label: `W${weekNum}`,
                    monthLabel: weekNum === 1 ? current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null
                })
                weekNum++
                current.setDate(current.getDate() + 7)
            }
        } else {
            // Quarters view - monthly
            current.setDate(1)
            while (current <= end) {
                headers.push({
                    date: new Date(current),
                    label: current.toLocaleDateString('en-US', { month: 'short' }),
                    monthLabel: current.getMonth() % 3 === 0 ? `Q${Math.floor(current.getMonth() / 3) + 1} ${current.getFullYear()}` : null
                })
                current.setMonth(current.getMonth() + 1)
            }
        }
        return headers
    }, [timelineRange, zoomLevel])

    // Sync scroll between header and body
    const handleBodyScroll = useCallback((e) => {
        if (isScrollSyncing.current) return
        isScrollSyncing.current = true
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = e.target.scrollLeft
        }
        requestAnimationFrame(() => { isScrollSyncing.current = false })
    }, [])

    const handleHeaderScroll = useCallback((e) => {
        if (isScrollSyncing.current) return
        isScrollSyncing.current = true
        if (bodyScrollRef.current) {
            bodyScrollRef.current.scrollLeft = e.target.scrollLeft
        }
        requestAnimationFrame(() => { isScrollSyncing.current = false })
    }, [])

    // Toggle collapse
    const toggleEpicCollapse = (epicId) => setCollapsedEpics(prev => ({ ...prev, [epicId]: !prev[epicId] }))
    const calculateEpicProgress = (children) => children.length === 0 ? 0 : Math.round((children.filter(c => c.status === 'done').length / children.length) * 100)

    // Get bar position
    const getBarStyle = useCallback((startDate, dueDate) => {
        if (!startDate || !dueDate) return null
        const cellWidth = getCellWidth()
        const { start: rangeStart } = timelineRange
        const issueStart = new Date(startDate)
        const issueEnd = new Date(dueDate)
        let leftOffset, width

        if (zoomLevel === 'today') {
            leftOffset = daysBetween(rangeStart, issueStart) * cellWidth
            width = (daysBetween(issueStart, issueEnd) + 1) * cellWidth
        } else if (zoomLevel === 'weeks') {
            leftOffset = (daysBetween(rangeStart, issueStart) / 7) * cellWidth
            width = Math.max(cellWidth / 2, (daysBetween(issueStart, issueEnd) / 7) * cellWidth)
        } else if (zoomLevel === 'months') {
            leftOffset = Math.round(daysBetween(rangeStart, issueStart) / 7) * cellWidth
            width = Math.max(1, Math.round(daysBetween(issueStart, issueEnd) / 7)) * cellWidth
        } else {
            const startMonth = (issueStart.getFullYear() - rangeStart.getFullYear()) * 12 + issueStart.getMonth() - rangeStart.getMonth()
            const durationMonths = (issueEnd.getFullYear() - issueStart.getFullYear()) * 12 + issueEnd.getMonth() - issueStart.getMonth() + 1
            leftOffset = startMonth * cellWidth
            width = durationMonths * cellWidth
        }
        return { left: `${leftOffset}px`, width: `${Math.max(20, width)}px` }
    }, [getCellWidth, timelineRange, zoomLevel])

    const getTodayPosition = useCallback(() => {
        const cellWidth = getCellWidth()
        const { start: rangeStart } = timelineRange
        const today = new Date()
        if (zoomLevel === 'today') return daysBetween(rangeStart, today) * cellWidth
        if (zoomLevel === 'weeks') return (daysBetween(rangeStart, today) / 7) * cellWidth
        if (zoomLevel === 'months') return Math.round(daysBetween(rangeStart, today) / 7) * cellWidth
        const months = (today.getFullYear() - rangeStart.getFullYear()) * 12 + today.getMonth() - rangeStart.getMonth()
        return months * cellWidth + (today.getDate() / 30) * cellWidth
    }, [getCellWidth, timelineRange, zoomLevel])

    // Navigation
    const navigateTimeline = (direction) => {
        const days = zoomLevel === 'today' ? 7 : zoomLevel === 'weeks' ? 14 : zoomLevel === 'months' ? 30 : 90
        setTimelineOffset(prev => prev + (direction === 'left' ? -days : days))
    }
    const scrollToToday = () => setTimelineOffset(0)

    // Drag handlers
    const handleBarDragStart = (e, issue, edge = 'middle') => {
        e.preventDefault()
        e.stopPropagation()
        setDragState({
            issue, edge, startX: e.clientX,
            originalStartDate: issue.startDate,
            originalDueDate: issue.dueDate
        })
    }

    const handleBarDrag = useCallback((e) => {
        if (!dragState) return
        const cellWidth = getCellWidth()
        const deltaX = e.clientX - dragState.startX
        const deltaDays = zoomLevel === 'weeks' ? Math.round((deltaX / cellWidth) * 7) : Math.round(deltaX / cellWidth)
        if (deltaDays === 0) return

        const originalStart = new Date(dragState.originalStartDate)
        const originalEnd = new Date(dragState.originalDueDate)
        let newStartDate, newDueDate

        if (dragState.edge === 'middle') {
            newStartDate = new Date(originalStart)
            newStartDate.setDate(newStartDate.getDate() + deltaDays)
            newDueDate = new Date(originalEnd)
            newDueDate.setDate(newDueDate.getDate() + deltaDays)
        } else if (dragState.edge === 'left') {
            newStartDate = new Date(originalStart)
            newStartDate.setDate(newStartDate.getDate() + deltaDays)
            newDueDate = originalEnd
            if (newStartDate >= newDueDate) return
        } else {
            newStartDate = originalStart
            newDueDate = new Date(originalEnd)
            newDueDate.setDate(newDueDate.getDate() + deltaDays)
            if (newDueDate <= newStartDate) return
        }

        updateIssue(dragState.issue.id, {
            startDate: newStartDate.toISOString().split('T')[0],
            dueDate: newDueDate.toISOString().split('T')[0]
        })
    }, [dragState, getCellWidth, zoomLevel, updateIssue])

    const handleBarDragEnd = useCallback(() => setDragState(null), [])

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

    // Click handler
    const handleIssueClick = (issue) => {
        setSelectedIssue(issue)
        // Scroll to date
        if (issue.startDate) {
            const daysFromToday = daysBetween(new Date(), new Date(issue.startDate))
            setTimelineOffset(daysFromToday)
        }
    }

    const cellWidth = getCellWidth()
    const timelineWidth = timelineHeaders.length * cellWidth
    const todayPosition = getTodayPosition()

    // Check if sprint is completed
    const isSprintCompleted = (sprint) => {
        if (!sprint.endDate) return false
        return new Date(sprint.endDate) < new Date()
    }

    // Render Sprint Bar
    const renderSprintBar = (sprint) => {
        const barStyle = getBarStyle(sprint.startDate, sprint.endDate)
        if (!barStyle) return null
        const completed = isSprintCompleted(sprint)

        return (
            <div
                key={sprint.id}
                className={`timeline-sprint-block ${completed ? 'completed' : 'future'}`}
                style={barStyle}
            >
                {sprint.name}
            </div>
        )
    }

    // Render issue row
    const renderIssueRow = (issue, isChild = false, isEpic = false, children = []) => {
        const TypeIcon = getTypeIcon(issue.type)
        const status = statusConfig[issue.status] || { label: issue.status, color: '#94a3b8', barColor: '#94a3b8' }
        const isCollapsed = collapsedEpics[issue.id]
        const progress = isEpic ? calculateEpicProgress(children) : (issue.status === 'done' ? 100 : issue.status === 'progress' ? 50 : 0)

        return (
            <div key={issue.id} className={`timeline-row ${isEpic ? 'is-epic' : ''}`}>
                <div className={`timeline-row-left ${isChild ? 'is-child' : ''}`}>
                    <div className="timeline-row-content">
                        {isEpic && children.length > 0 ? (
                            <button className="timeline-expand-btn" onClick={() => toggleEpicCollapse(issue.id)}>
                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            </button>
                        ) : (
                            <div className="timeline-checkbox"><Square size={14} /></div>
                        )}
                        <span className={`timeline-key-text ${issue.type}`} onClick={() => handleIssueClick(issue)}>
                            <TypeIcon size={14} />{issue.key}
                        </span>
                        <span className="timeline-summary" title={issue.summary} onClick={() => handleIssueClick(issue)}>
                            {issue.summary}
                        </span>
                        <span className="timeline-status-badge" style={{ backgroundColor: `${status.color}20`, color: status.color }}>
                            {status.label}
                        </span>
                    </div>
                    <div className="timeline-item-progress">
                        <div className="timeline-item-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>
        )
    }

    // Render bar for right pane
    const renderBar = (issue) => {
        const status = statusConfig[issue.status] || { label: issue.status, color: '#94a3b8', barColor: '#94a3b8' }
        const barStyle = getBarStyle(issue.startDate, issue.dueDate)
        if (!barStyle) return null

        return (
            <div
                className={`timeline-bar ${issue.status} ${dragState?.issue.id === issue.id ? 'dragging' : ''}`}
                style={{ ...barStyle, backgroundColor: status.barColor }}
                title={`${issue.summary}\n${formatDate(issue.startDate)} - ${formatDate(issue.dueDate)}`}
                onClick={() => handleIssueClick(issue)}
            >
                <div className="timeline-bar-handle left" onMouseDown={(e) => handleBarDragStart(e, issue, 'left')} />
                <div className="timeline-bar-content" onMouseDown={(e) => handleBarDragStart(e, issue, 'middle')} />
                <div className="timeline-bar-handle right" onMouseDown={(e) => handleBarDragStart(e, issue, 'right')} />
            </div>
        )
    }

    return (
        <div className="timeline-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Timeline</h1>
                    <p className="text-secondary">Visualize your project schedule with Gantt chart</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="timeline-filter-bar">
                <div className="timeline-search">
                    <Search size={16} />
                    <input type="text" placeholder="Search issues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}
                </div>
                <div className="filter-divider" />
                <Filter size={16} className="filter-icon" />
                <MultiSelectDropdown label="Epic" options={epicOptions} selected={epicFilter} onChange={setEpicFilter} />
                <MultiSelectDropdown label="Status" options={statusOptions} selected={statusFilter} onChange={setStatusFilter} />
                <MultiSelectDropdown label="Priority" options={priorityOptions} selected={priorityFilter} onChange={setPriorityFilter} />
                <MultiSelectDropdown label="Assignee" options={assigneeOptions} selected={assigneeFilter} onChange={setAssigneeFilter} />
                <MultiSelectDropdown label="Sprint" options={sprintOptions} selected={sprintFilter} onChange={setSprintFilter} />
                <MultiSelectDropdown label="Game" options={gameOptions} selected={gameFilter} onChange={setGameFilter} />
                <MultiSelectDropdown label="Department" options={departmentOptions} selected={departmentFilter} onChange={setDepartmentFilter} />
            </div>

            {/* Timeline Container */}
            <div className="timeline-container">
                {/* Header */}
                <div className="timeline-header">
                    <div className="timeline-header-left">WORK</div>
                    <div className="timeline-header-right" ref={headerScrollRef} onScroll={handleHeaderScroll}>
                        <div className="timeline-header-scroll" style={{ width: timelineWidth }}>
                            <div className="timeline-date-labels">
                                {timelineHeaders.map((header, idx) => (
                                    header.monthLabel && (
                                        <div key={`label-${idx}`} className="timeline-month-label" style={{ left: idx * cellWidth }}>
                                            {header.monthLabel}
                                        </div>
                                    )
                                ))}
                            </div>
                            <div className="timeline-date-headers">
                                {timelineHeaders.map((header, idx) => (
                                    <div
                                        key={idx}
                                        className={`timeline-date-cell ${header.isWeekend ? 'weekend' : ''} ${header.isToday ? 'today' : ''}`}
                                        style={{ width: cellWidth }}
                                        title={header.sublabel || ''}
                                    >
                                        {header.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="timeline-body">
                    {/* Left Pane - FIXED WIDTH, NO SCROLL */}
                    <div className="timeline-left-pane">
                        {/* Sprints Header Row */}
                        <div className="timeline-row swimlane-row">
                            <div className="timeline-row-left">
                                <span className="timeline-swimlane-label">Sprints</span>
                            </div>
                        </div>

                        {/* Epic Groups */}
                        {groupedIssues.epicGroups.map(({ epic, children }) => (
                            <div key={epic.id} className="timeline-epic-group">
                                {renderIssueRow(epic, false, true, children)}
                                {!collapsedEpics[epic.id] && children.map(child => renderIssueRow(child, true, false))}
                            </div>
                        ))}

                        {/* No Epic */}
                        {groupedIssues.noEpicIssues.length > 0 && (
                            <div className="timeline-no-epic-group">
                                <div className="timeline-group-header" onClick={() => toggleEpicCollapse('no-epic')}>
                                    {collapsedEpics['no-epic'] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                    <span className="timeline-group-title">Issues without Epic</span>
                                    <span className="timeline-group-count">{groupedIssues.noEpicIssues.length}</span>
                                </div>
                                {!collapsedEpics['no-epic'] && groupedIssues.noEpicIssues.map(issue => renderIssueRow(issue, true, false))}
                            </div>
                        )}
                    </div>

                    {/* Right Pane - SCROLLABLE, SYNCED */}
                    <div className="timeline-right-pane" ref={bodyScrollRef} onScroll={handleBodyScroll}>
                        <div className="timeline-grid-wrapper" style={{ width: timelineWidth }}>
                            {/* Grid cells */}
                            <div className="timeline-grid">
                                {timelineHeaders.map((header, idx) => (
                                    <div
                                        key={idx}
                                        className={`timeline-grid-cell ${header.isWeekend ? 'weekend' : ''}`}
                                        style={{ width: cellWidth }}
                                    />
                                ))}
                            </div>

                            {/* Today line */}
                            {todayPosition > 0 && todayPosition < timelineWidth && (
                                <div className="timeline-today-line" style={{ left: todayPosition }}>
                                    <div className="timeline-today-marker" />
                                </div>
                            )}

                            {/* Sprint Swimlane - TOP ROW */}
                            <div className="timeline-row-bar-container swimlane-row sprint-swimlane">
                                {sprints.map(sprint => renderSprintBar(sprint))}
                            </div>

                            {/* Issue Bars */}
                            {groupedIssues.epicGroups.map(({ epic, children }) => (
                                <div key={`bars-${epic.id}`}>
                                    <div className="timeline-row-bar-container">{renderBar(epic)}</div>
                                    {!collapsedEpics[epic.id] && children.map(child => (
                                        <div key={`bar-${child.id}`} className="timeline-row-bar-container">{renderBar(child)}</div>
                                    ))}
                                </div>
                            ))}

                            {/* No Epic Bars */}
                            {groupedIssues.noEpicIssues.length > 0 && (
                                <>
                                    <div className="timeline-row-bar-container group-header" />
                                    {!collapsedEpics['no-epic'] && groupedIssues.noEpicIssues.map(issue => (
                                        <div key={`bar-${issue.id}`} className="timeline-row-bar-container">{renderBar(issue)}</div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="timeline-footer">
                <div className="timeline-nav-controls">
                    <button className="timeline-nav-btn" onClick={() => navigateTimeline('left')}><ChevronLeft size={16} /></button>
                    <button className="timeline-nav-btn today" onClick={scrollToToday}>Today</button>
                    <button className="timeline-nav-btn" onClick={() => navigateTimeline('right')}><ChevronRight size={16} /></button>
                </div>
                <div className="timeline-zoom-controls">
                    <button className={`timeline-zoom-btn ${zoomLevel === 'today' ? 'active' : ''}`} onClick={() => setZoomLevel('today')}>Days</button>
                    <button className={`timeline-zoom-btn ${zoomLevel === 'weeks' ? 'active' : ''}`} onClick={() => setZoomLevel('weeks')}>Weeks</button>
                    <button className={`timeline-zoom-btn ${zoomLevel === 'months' ? 'active' : ''}`} onClick={() => setZoomLevel('months')}>Months</button>
                    <button className={`timeline-zoom-btn ${zoomLevel === 'quarters' ? 'active' : ''}`} onClick={() => setZoomLevel('quarters')}>Quarters</button>
                </div>
            </div>
        </div>
    )
}
