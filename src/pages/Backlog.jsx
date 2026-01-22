import { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../stores/projectStore'
import FacetedFilterMenu from '../components/common/FacetedFilterMenu'
import useGlobalFilterOptions from '../hooks/useGlobalFilterOptions'
import ViewSettingsMenu from '../components/common/ViewSettingsMenu'
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core'
import {
    Plus,
    GripVertical,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Search,
    X,
    ChevronDown,
    ChevronRight,
    Calendar,
    Clock,
    Filter,
    Play,
    CheckCircle2,
    User,
    Edit,
    Trash2,
    MoreHorizontal,
    Eye,
    MoveRight
} from 'lucide-react'

const typeIcons = {
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    epic: Layers,
    subtask: ListTree
}

const priorityConfig = {
    highest: { icon: ArrowUp, color: 'var(--priority-highest)' },
    high: { icon: ArrowUp, color: 'var(--priority-high)' },
    medium: { icon: Minus, color: 'var(--priority-medium)' },
    low: { icon: ArrowDown, color: 'var(--priority-low)' },
    lowest: { icon: ArrowDown, color: 'var(--priority-lowest)' }
}

// Format date for display
const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

// Format date range
const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Add dates'
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export default function Backlog() {
    // Single Source of Truth: Global normalized filter options
    const { filterOptions } = useGlobalFilterOptions()

    const {
        issues,
        getBacklogIssues,
        getSprintIssues,
        sprints,
        setSelectedIssue,
        getUserById,
        users,
        startSprint,
        completeSprint,
        deleteSprint,
        addIssue,
        updateIssue,
        deleteIssue,
        addSprint,
        softDeleteIssues,
        fieldConfig,
        games,
        departments,
        savedFilters,
        addSavedFilter,
        deleteSavedFilter,
        openCreateModal,
        cardFieldVisibility,
        setActiveFilterDefaults  // Sync filter state to global store
    } = useProjectStore()

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEpics, setSelectedEpics] = useState([]) // Multi-select epics
    const [selectedAssignees, setSelectedAssignees] = useState([])
    const [collapsedSprints, setCollapsedSprints] = useState(new Set())
    const [creatingInSection, setCreatingInSection] = useState(null)
    const [newIssueSummary, setNewIssueSummary] = useState('')
    const [newIssueType, setNewIssueType] = useState('story')
    const [newIssueAssignee, setNewIssueAssignee] = useState(null)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
    const [epicMenuOpen, setEpicMenuOpen] = useState(null)
    const [showAllEpicsModal, setShowAllEpicsModal] = useState(false)
    const [epicDropdownOpen, setEpicDropdownOpen] = useState(false)
    const [epicSearchQuery, setEpicSearchQuery] = useState('')
    const [allEpicsSearchQuery, setAllEpicsSearchQuery] = useState('')
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
    const [sprintMenuOpen, setSprintMenuOpen] = useState(null)

    // Global Faceted Filter state
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [filterTypes, setFilterTypes] = useState(new Set())
    const [filterStatuses, setFilterStatuses] = useState(new Set())
    const [filterPriorities, setFilterPriorities] = useState(new Set())
    const [filterGames, setFilterGames] = useState(new Set())
    const [filterDepartments, setFilterDepartments] = useState(new Set())
    const [filterLabels, setFilterLabels] = useState(new Set())
    const [filterReporters, setFilterReporters] = useState(new Set())

    // Multi-select state
    const [selectedIssues, setSelectedIssues] = useState(new Set())
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Drag and Drop state
    const [activeId, setActiveId] = useState(null)
    const [issueContextMenu, setIssueContextMenu] = useState(null) // { issueId, x, y }

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement before drag starts
            },
        })
    )

    // Refs for click-outside detection
    const typeDropdownRef = useRef(null)
    const assigneeDropdownRef = useRef(null)
    const filterButtonRef = useRef(null) // Anchor for FacetedFilterMenu portal

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setShowTypeDropdown(false)
            }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
                setShowAssigneeDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // CRITICAL: Sync filter state to global store so Header Create button can use it
    useEffect(() => {
        // Helper to get first value from Set or Array as string
        const getFirst = (setOrArr, exclude = []) => {
            const arr = setOrArr instanceof Set ? [...setOrArr] : (Array.isArray(setOrArr) ? setOrArr : [])
            const filtered = arr.filter(v => v && !exclude.includes(v))
            return filtered.length === 1 ? String(filtered[0]) : null
        }

        const defaults = {
            epicId: getFirst(selectedEpics, ['no-epic']),
            priority: getFirst(filterPriorities),
            status: getFirst(filterStatuses),
            type: getFirst(filterTypes),
            assigneeId: getFirst(selectedAssignees, ['unassigned']),
            departmentId: getFirst(filterDepartments, ['no-department']),
            gameId: getFirst(filterGames, ['no-game'])
        }

        // Only update if we have at least one non-null default
        const hasDefaults = Object.values(defaults).some(v => v !== null)
        setActiveFilterDefaults(hasDefaults ? defaults : {})
    }, [selectedEpics, selectedAssignees, filterTypes, filterStatuses, filterPriorities,
        filterDepartments, filterGames, setActiveFilterDefaults])

    // Get all epics for filter
    const epics = issues.filter(i => i.type === 'epic')

    // Filter issues (exclude epics from backlog list)
    const filterIssues = (issueList) => {
        if (!issueList || !Array.isArray(issueList)) return []

        return issueList.filter(issue => {
            // Defensive null check
            if (!issue) return false

            // Hide epics from the backlog list
            if (issue.type === 'epic') {
                return false
            }
            // Search filter (with null checks)
            if (searchQuery) {
                const summary = issue.summary || ''
                const key = issue.key || ''
                if (!summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    !key.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false
                }
            }
            // Epic filter (multi-select)
            if (selectedEpics.length > 0) {
                const includesNoEpic = selectedEpics.includes('no-epic')
                const selectedEpicIds = selectedEpics.filter(id => id !== 'no-epic')

                if (includesNoEpic && !issue.epicId) {
                    // Allow issues with no epic
                } else if (selectedEpicIds.includes(issue.epicId)) {
                    // Allow issues matching selected epics
                } else {
                    return false
                }
            }
            // Assignee filter (from avatar buttons)
            if (selectedAssignees.length > 0 && !selectedAssignees.includes(issue.assigneeId)) {
                return false
            }

            // === Faceted Filter criteria ===
            // Type filter (with null check)
            if (filterTypes.size > 0 && !filterTypes.has(issue.type || '')) {
                return false
            }
            // Status filter (with null check)
            if (filterStatuses.size > 0 && !filterStatuses.has(issue.status || '')) {
                return false
            }
            // Priority filter (with null check)
            if (filterPriorities.size > 0 && !filterPriorities.has(issue.priority || '')) {
                return false
            }
            // Game filter
            if (filterGames.size > 0 && !filterGames.has(issue.gameId)) {
                return false
            }
            // Department filter
            if (filterDepartments.size > 0 && !filterDepartments.has(issue.departmentId)) {
                return false
            }
            // Label filter
            if (filterLabels.size > 0) {
                const issueLabels = issue.labels || []
                const hasMatchingLabel = [...filterLabels].some(label => issueLabels.includes(label))
                if (!hasMatchingLabel) return false
            }
            // Reporter filter
            if (filterReporters.size > 0 && !filterReporters.has(issue.reporterId)) {
                return false
            }

            return true
        })
    }

    const backlogIssues = filterIssues(getBacklogIssues())
    const activeSprint = sprints.find(s => s.state === 'active')
    const futureSprints = sprints.filter(s => s.state === 'future')

    // Toggle sprint collapse
    const toggleSprintCollapse = (sprintId) => {
        setCollapsedSprints(prev => {
            const next = new Set(prev)
            if (next.has(sprintId)) {
                next.delete(sprintId)
            } else {
                next.add(sprintId)
            }
            return next
        })
    }

    // Toggle assignee filter
    const toggleAssignee = (userId) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    // Toggle epic selection (with Ctrl/Cmd for multi-select)
    const toggleEpic = (epicId, isMultiSelect = false) => {
        if (isMultiSelect) {
            // Multi-select: toggle the epic in the array
            setSelectedEpics(prev =>
                prev.includes(epicId)
                    ? prev.filter(id => id !== epicId)
                    : [...prev, epicId]
            )
        } else {
            // Single select: replace selection
            setSelectedEpics(prev =>
                prev.length === 1 && prev[0] === epicId ? [] : [epicId]
            )
        }
    }

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('')
        setSelectedEpics([])
        setSelectedAssignees([])
        // Clear faceted filters
        setFilterTypes(new Set())
        setFilterStatuses(new Set())
        setFilterPriorities(new Set())
        setFilterGames(new Set())
        setFilterDepartments(new Set())
        setFilterLabels(new Set())
        setFilterReporters(new Set())
    }

    // Count active faceted filters
    const facetedFilterCount = filterTypes.size + filterStatuses.size + filterPriorities.size +
        filterGames.size + filterDepartments.size + filterLabels.size + filterReporters.size

    const hasFilters = searchQuery || selectedEpics.length > 0 || selectedAssignees.length > 0 || facetedFilterCount > 0

    // Handle inline issue creation with context-aware defaults from active filters
    const handleCreateIssue = (sprintId) => {
        if (!newIssueSummary.trim()) return

        // Get first value from each filter set for smart defaults
        const defaultStatus = filterStatuses.size === 1 ? [...filterStatuses][0] : 'todo'
        const defaultPriority = filterPriorities.size === 1 ? [...filterPriorities][0] : 'medium'
        const defaultAssignee = selectedAssignees.length === 1 ? selectedAssignees[0] : newIssueAssignee
        const defaultEpic = selectedEpics.length === 1 && selectedEpics[0] !== 'no-epic' ? selectedEpics[0] : null

        addIssue({
            type: newIssueType,
            status: defaultStatus,
            priority: defaultPriority,
            summary: newIssueSummary.trim(),
            description: '',
            sprintId: sprintId || null,
            storyPoints: null,
            labels: [],
            assigneeId: defaultAssignee,
            reporterId: users[0]?.id || null,
            epicId: defaultEpic
        })

        setNewIssueSummary('')
        setNewIssueType('story')
        setNewIssueAssignee(null)
        setCreatingInSection(null)
    }

    // Handle create new sprint
    const handleCreateSprint = () => {
        const sprintNumber = sprints.length + 1
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 14) // 2-week sprint

        addSprint({
            name: `Sprint ${sprintNumber}`,
            goal: '',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        })
    }

    // Helper: Safely extract FIRST value from Set or Array, returns STRING or null
    const getFirstValue = (collection, excludeValues = []) => {
        let arr = []

        // Handle Set
        if (collection instanceof Set) {
            arr = [...collection]
        }
        // Handle Array
        else if (Array.isArray(collection)) {
            arr = collection
        }
        // Already a string or primitive
        else if (typeof collection === 'string' && collection) {
            return collection
        }
        else {
            return null
        }

        // Filter out excluded values and get first
        const filtered = arr.filter(v => v && !excludeValues.includes(v))
        const result = filtered.length === 1 ? String(filtered[0]) : null

        return result
    }

    // Build defaults from current filter state for context-aware issue creation
    // CRITICAL: All values must be STRINGS, not Arrays or Sets
    const getCreateDefaults = () => {
        // Debug: Log raw filter states BEFORE conversion
        console.log('🔍 DEBUG - Raw Filter States (BEFORE conversion):', {
            selectedAssignees_type: Array.isArray(selectedAssignees) ? 'Array' : typeof selectedAssignees,
            selectedAssignees_value: selectedAssignees,
            filterPriorities_type: filterPriorities instanceof Set ? 'Set' : typeof filterPriorities,
            filterPriorities_value: [...filterPriorities],
            filterStatuses_type: filterStatuses instanceof Set ? 'Set' : typeof filterStatuses,
            filterStatuses_value: [...filterStatuses],
            filterTypes_type: filterTypes instanceof Set ? 'Set' : typeof filterTypes,
            filterTypes_value: [...filterTypes],
            filterDepartments_type: filterDepartments instanceof Set ? 'Set' : typeof filterDepartments,
            filterDepartments_value: [...filterDepartments],
            selectedEpics_type: Array.isArray(selectedEpics) ? 'Array' : typeof selectedEpics,
            selectedEpics_value: selectedEpics
        })

        // Convert each filter to a SINGLE STRING value
        const defaults = {
            // Epic: from sidebar array (exclude 'no-epic')
            epicId: getFirstValue(selectedEpics, ['no-epic']),

            // Priority: from Set -> single string
            priority: getFirstValue(filterPriorities),

            // Status: from Set -> single string
            status: getFirstValue(filterStatuses),

            // Type: from Set -> single string
            type: getFirstValue(filterTypes),

            // Assignee: from Array (exclude 'unassigned') -> single string
            assigneeId: getFirstValue(selectedAssignees, ['unassigned']),

            // Department: from Set -> single string
            departmentId: getFirstValue(filterDepartments, ['no-department']),

            // Game: from Set -> single string
            gameId: getFirstValue(filterGames, ['no-game'])
        }

        // Debug: Log converted values AFTER conversion with type verification
        console.log('✅ DEBUG - Converted Defaults (AFTER conversion):', {
            epicId: { value: defaults.epicId, type: typeof defaults.epicId },
            priority: { value: defaults.priority, type: typeof defaults.priority },
            status: { value: defaults.status, type: typeof defaults.status },
            type: { value: defaults.type, type: typeof defaults.type },
            assigneeId: { value: defaults.assigneeId, type: typeof defaults.assigneeId },
            departmentId: { value: defaults.departmentId, type: typeof defaults.departmentId },
            gameId: { value: defaults.gameId, type: typeof defaults.gameId }
        })

        // Final assertion log
        if (defaults.assigneeId && typeof defaults.assigneeId !== 'string') {
            console.error('❌ TYPE ERROR: assigneeId is not a string!', typeof defaults.assigneeId)
        }

        return defaults
    }

    // Handle opening create modal with filter context
    const handleOpenCreateModal = (type = 'story') => {
        const defaults = getCreateDefaults()
        console.log('🚀 Opening Create Modal with FINAL defaults:', defaults)
        console.log('📋 Test: assigneeId type is:', typeof defaults.assigneeId, '| value:', defaults.assigneeId)
        openCreateModal(type, defaults)
    }

    // DnD Handlers
    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveId(null)

        if (!over || active.id === over.id) return

        // Get the target sprint ID (null for backlog)
        const targetSprintId = over.id === 'backlog' ? null : over.id

        // Get current issue
        const issue = issues.find(i => i.id === active.id)
        if (!issue || issue.sprintId === targetSprintId) return

        // Update issue's sprintId
        await updateIssue(active.id, { sprintId: targetSprintId })
    }

    // Handle Move to Sprint from context menu
    const handleMoveToSprint = async (issueId, targetSprintId) => {
        await updateIssue(issueId, { sprintId: targetSprintId })
        setIssueContextMenu(null)
    }

    // Handle right-click on issue
    const handleIssueContextMenu = (e, issueId) => {
        e.preventDefault()
        setIssueContextMenu({
            issueId,
            x: e.clientX,
            y: e.clientY
        })
    }

    // Close context menu when clicking elsewhere
    useEffect(() => {
        const handleClick = () => setIssueContextMenu(null)
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [])

    // Issue Row Component
    const IssueRow = ({ issue, isDragging = false }) => {
        const TypeIcon = typeIcons[issue.type] || CheckSquare
        const PriorityIcon = priorityConfig[issue.priority]?.icon || Minus
        const priorityColor = priorityConfig[issue.priority]?.color
        const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null
        const isSelected = selectedIssues.has(issue.id)

        const toggleSelection = (e) => {
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
        }

        return (
            <div
                className={`backlog-issue-row ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                onClick={() => setSelectedIssue(issue)}
                onContextMenu={(e) => handleIssueContextMenu(e, issue.id)}
                data-issue-id={issue.id}
            >
                {/* Checkbox for multi-select */}
                <input
                    type="checkbox"
                    className="issue-checkbox"
                    checked={isSelected}
                    onChange={toggleSelection}
                    onClick={(e) => e.stopPropagation()}
                />

                <GripVertical size={14} className="drag-handle" />

                <div className={`issue-type-icon ${issue.type}`}>
                    <TypeIcon size={10} />
                </div>

                <span className="issue-key">{issue.key}</span>

                <span className="issue-summary">{issue.summary}</span>

                {/* Labels - respects visibility setting */}
                {cardFieldVisibility.labels && issue.labels && issue.labels.length > 0 && (
                    <div className="issue-labels">
                        {issue.labels.slice(0, 2).map(label => (
                            <span key={label} className="issue-label">{label}</span>
                        ))}
                        {issue.labels.length > 2 && (
                            <span className="issue-label">+{issue.labels.length - 2}</span>
                        )}
                    </div>
                )}

                {/* Status badge - respects visibility setting */}
                {cardFieldVisibility.status && (
                    <span className={`issue-status-badge ${issue.status}`}>
                        {issue.status === 'todo' ? 'TO DO' :
                            issue.status === 'progress' ? 'IN PROGRESS' :
                                issue.status === 'review' ? 'IN REVIEW' : 'DONE'}
                    </span>
                )}

                {/* Due date - respects visibility setting */}
                {cardFieldVisibility.dueDate && issue.dueDate && (
                    <span className="issue-due-date">
                        <Calendar size={12} />
                        {formatDate(issue.dueDate)}
                    </span>
                )}

                {/* Time estimate - respects visibility setting */}
                {cardFieldVisibility.estimate && (
                    <span className="issue-estimate">
                        {issue.storyPoints ? `${issue.storyPoints}pt` : '0m'}
                    </span>
                )}

                {/* Priority - respects visibility setting */}
                {cardFieldVisibility.priority && (
                    <span className="issue-priority" style={{ color: priorityColor }}>
                        <PriorityIcon size={14} />
                    </span>
                )}

                {/* Assignee - respects visibility setting */}
                {cardFieldVisibility.assignee && (
                    assignee ? (
                        <div className="avatar sm" title={assignee.name}>
                            {assignee.name.charAt(0)}
                        </div>
                    ) : (
                        <div className="avatar sm unassigned" title="Unassigned">?</div>
                    )
                )}
            </div>
        )
    }

    // Draggable Issue Row wrapper
    const DraggableIssueRow = ({ issue }) => {
        return (
            <div
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('issueId', issue.id)
                    e.dataTransfer.effectAllowed = 'move'
                }}
            >
                <IssueRow issue={issue} />
            </div>
        )
    }

    // Sprint Section Component
    const SprintSection = ({ sprint, issues: sprintIssues, isBacklog = false }) => {
        const isCollapsed = collapsedSprints.has(sprint?.id || 'backlog')
        const sectionId = sprint?.id || 'backlog'
        const filteredIssues = filterIssues(sprintIssues)
        const totalIssues = sprintIssues.length
        const visibleIssues = filteredIssues.length
        const totalPoints = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
        const visiblePoints = filteredIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)

        return (
            <div className="sprint-section">
                {/* Sprint Header */}
                <div className="sprint-header">
                    <div className="sprint-header-left">
                        <button
                            className="btn btn-icon btn-ghost sm"
                            onClick={() => toggleSprintCollapse(sectionId)}
                        >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>

                        <span className="sprint-name">
                            {isBacklog ? 'Backlog' : sprint.name}
                        </span>

                        {!isBacklog && (
                            <span className="sprint-dates">
                                <Calendar size={12} />
                                {formatDateRange(sprint.startDate, sprint.endDate)}
                            </span>
                        )}

                        <span className="sprint-count">
                            ({visibleIssues} of {totalIssues} work items visible)
                        </span>
                    </div>

                    <div className="sprint-header-right">
                        {/* Points summary */}
                        <div className="sprint-points">
                            <span className="points-done">0h</span>
                            <span className="points-progress">0h</span>
                            <span className="points-todo">0h</span>
                        </div>

                        {!isBacklog && (
                            <>
                                <span className="sprint-estimate">
                                    Estimate: {visiblePoints}pt of {totalPoints}pt
                                </span>

                                {sprint.state === 'active' ? (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => completeSprint(sprint.id)}
                                    >
                                        <CheckCircle2 size={14} />
                                        Complete sprint
                                    </button>
                                ) : sprint.state === 'future' && (
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => startSprint(sprint.id)}
                                    >
                                        <Play size={14} />
                                        Start sprint
                                    </button>
                                )}
                            </>
                        )}

                        {/* Sprint Menu */}
                        {!isBacklog && (
                            <div className="sprint-menu-container">
                                <button
                                    className="btn btn-icon btn-ghost sm"
                                    onClick={() => setSprintMenuOpen(sprintMenuOpen === sprint.id ? null : sprint.id)}
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                                {sprintMenuOpen === sprint.id && (
                                    <div className="sprint-menu">
                                        <button onClick={() => {
                                            setSelectedIssue({ ...sprint, type: 'sprint' })
                                            setSprintMenuOpen(null)
                                        }}>
                                            <Edit size={14} />
                                            Edit Sprint
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={async () => {
                                                if (window.confirm(`Delete "${sprint.name}"? Issues will be moved to backlog.`)) {
                                                    await deleteSprint(sprint.id)
                                                }
                                                setSprintMenuOpen(null)
                                            }}
                                        >
                                            <Trash2 size={14} />
                                            Delete Sprint
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {isBacklog && (
                            <button className="btn btn-icon btn-ghost sm">
                                <MoreHorizontal size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Sprint Body */}
                {!isCollapsed && (
                    <div
                        className={`sprint-body droppable`}
                        onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('drag-over')
                        }}
                        onDragLeave={(e) => {
                            e.currentTarget.classList.remove('drag-over')
                        }}
                        onDrop={async (e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('drag-over')
                            const issueId = e.dataTransfer.getData('issueId')
                            if (issueId) {
                                const targetSprintId = isBacklog ? null : sprint.id
                                await updateIssue(issueId, { sprintId: targetSprintId })
                            }
                        }}
                    >
                        {filteredIssues.length > 0 ? (
                            filteredIssues.map(issue => (
                                <DraggableIssueRow key={issue.id} issue={issue} />
                            ))
                        ) : (
                            <div className="sprint-empty">
                                {hasFilters
                                    ? "There's nothing that matches this filter"
                                    : "Plan a sprint by dragging work items into it, or by dragging the sprint footer."
                                }
                            </div>
                        )}

                        {/* Inline Create */}
                        {creatingInSection === sectionId ? (
                            <div className="inline-create enhanced">
                                {/* Type Dropdown */}
                                <div className="inline-type-dropdown" ref={typeDropdownRef}>
                                    <button
                                        className={`issue-type-icon ${newIssueType}`}
                                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                                    >
                                        {newIssueType === 'story' && <BookOpen size={10} />}
                                        {newIssueType === 'bug' && <Bug size={10} />}
                                        {newIssueType === 'task' && <CheckSquare size={10} />}
                                        <ChevronDown size={10} />
                                    </button>
                                    {showTypeDropdown && (
                                        <div className="type-dropdown-menu">
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

                                <input
                                    type="text"
                                    className="input"
                                    placeholder="What needs to be done?"
                                    value={newIssueSummary}
                                    onChange={(e) => setNewIssueSummary(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateIssue(sprint?.id)
                                        if (e.key === 'Escape') {
                                            setCreatingInSection(null)
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
                                <div className="inline-assignee-dropdown" ref={assigneeDropdownRef}>
                                    <button
                                        className="inline-icon-btn"
                                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
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
                                        <div className="assignee-dropdown-menu">
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
                                    onClick={() => handleCreateIssue(sprint?.id)}
                                >
                                    Create ↵
                                </button>
                            </div>
                        ) : (
                            <button
                                className="create-issue-btn"
                                onClick={() => setCreatingInSection(sectionId)}
                            >
                                <Plus size={14} />
                                Create
                            </button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="backlog-page animate-fade-in">
            {/* Epic Filter Sidebar */}
            <div className="epic-sidebar">
                <div className="epic-sidebar-header">
                    <span>Epic</span>
                    <button
                        className="btn btn-icon btn-ghost sm"
                        onClick={() => setSelectedEpics([])}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Epic Search */}
                <div className="epic-sidebar-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search epics..."
                        value={epicSearchQuery}
                        onChange={(e) => setEpicSearchQuery(e.target.value)}
                    />
                </div>

                <div className="epic-list">
                    <button
                        className={`epic-item ${selectedEpics.includes('no-epic') ? 'active' : ''}`}
                        onClick={(e) => toggleEpic('no-epic', e.ctrlKey || e.metaKey)}
                    >
                        <span className="epic-color" style={{ background: 'var(--text-tertiary)' }} />
                        <span className="epic-name-text">No epic</span>
                    </button>

                    {epics
                        .filter(epic => epic.summary.toLowerCase().includes(epicSearchQuery.toLowerCase()))
                        .map(epic => (
                            <div key={epic.id} className="epic-item-wrapper" title={epic.summary}>
                                {/* Styled tooltip - shows on hover with full name */}
                                <div className="epic-name-tooltip">
                                    <span className="epic-tooltip-color" style={{ background: 'var(--epic)' }} />
                                    <span>{epic.summary}</span>
                                </div>
                                <button
                                    className={`epic-item ${selectedEpics.includes(epic.id) ? 'active' : ''}`}
                                    onClick={(e) => toggleEpic(epic.id, e.ctrlKey || e.metaKey)}
                                >
                                    <span className="epic-color" style={{ background: 'var(--epic)' }} />
                                    <span className="epic-name-text">{epic.summary}</span>
                                </button>
                                <div className="epic-menu-container">
                                    <button
                                        className="epic-dots-btn"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEpicMenuOpen(epicMenuOpen === epic.id ? null : epic.id)
                                        }}
                                    >
                                        ⋯
                                    </button>
                                    {epicMenuOpen === epic.id && (
                                        <div className="epic-dropdown-menu">
                                            <button onClick={() => {
                                                setSelectedIssue(epic)
                                                setEpicMenuOpen(null)
                                            }}>
                                                <Eye size={14} />
                                                View Details
                                            </button>
                                            <button onClick={() => {
                                                setSelectedIssue(epic)
                                                setEpicMenuOpen(null)
                                            }}>
                                                <Edit size={14} />
                                                Edit Epic
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => {
                                                    deleteIssue(epic.id)
                                                    setEpicMenuOpen(null)
                                                    setSelectedEpics(prev => prev.filter(id => id !== epic.id))
                                                }}
                                            >
                                                <Trash2 size={14} />
                                                Delete Epic
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Epic Sidebar Footer */}
                <div className="epic-sidebar-footer">
                    <button
                        className="create-epic-btn"
                        onClick={async () => {
                            const newEpic = await addIssue({
                                type: 'epic',
                                status: 'todo',
                                priority: 'medium',
                                summary: 'New Epic',
                                description: '',
                                sprintId: null,
                                storyPoints: null,
                                labels: [],
                                assigneeId: null,
                                reporterId: users[0]?.id || null
                            })
                            if (newEpic) {
                                setSelectedIssue(newEpic)
                            }
                        }}
                    >
                        <Plus size={14} />
                        Create epic
                    </button>
                    <button
                        className="show-all-epics-btn"
                        onClick={() => setShowAllEpicsModal(true)}
                    >
                        <Layers size={14} />
                        Show all Epics
                    </button>
                </div>
            </div>

            {/* Show All Epics Modal */}
            {showAllEpicsModal && (
                <div className="modal-overlay" onClick={() => setShowAllEpicsModal(false)}>
                    <div className="modal epic-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>All Epics</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowAllEpicsModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Search */}
                            <div className="epic-modal-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search epics..."
                                    value={allEpicsSearchQuery}
                                    onChange={(e) => setAllEpicsSearchQuery(e.target.value)}
                                />
                                {allEpicsSearchQuery && (
                                    <button onClick={() => setAllEpicsSearchQuery('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            {epics.length === 0 ? (
                                <p className="text-secondary text-center">No epics yet. Create one to get started.</p>
                            ) : (
                                <div className="epic-list-modal">
                                    {epics
                                        .filter(epic =>
                                            epic.summary.toLowerCase().includes(allEpicsSearchQuery.toLowerCase()) ||
                                            epic.key.toLowerCase().includes(allEpicsSearchQuery.toLowerCase())
                                        )
                                        .map(epic => {
                                            const epicIssues = issues.filter(i => i.epicId === epic.id)
                                            const completedCount = epicIssues.filter(i => i.status === 'done').length
                                            const totalCount = epicIssues.length
                                            const isDone = epic.status === 'done'

                                            return (
                                                <div key={epic.id} className={`epic-card ${isDone ? 'done' : ''}`}>
                                                    <div className="epic-card-header">
                                                        <span className="epic-color lg" style={{ background: 'var(--epic)' }} />
                                                        <div className="epic-card-info">
                                                            <span className="epic-key">{epic.key}</span>
                                                            <h3>{epic.summary}</h3>
                                                        </div>
                                                        <span className={`badge ${isDone ? 'badge-success' : 'badge-secondary'}`}>
                                                            {isDone ? 'Done' : 'In Progress'}
                                                        </span>
                                                    </div>
                                                    <div className="epic-card-stats">
                                                        <span>Work items: {totalCount}</span>
                                                        <span>Completed: {completedCount}/{totalCount}</span>
                                                    </div>
                                                    {totalCount > 0 && (
                                                        <div className="epic-progress-bar">
                                                            <div
                                                                className="epic-progress-fill"
                                                                style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => {
                                                            setSelectedIssue(epic)
                                                            setShowAllEpicsModal(false)
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            )
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="backlog-content">
                {/* Toolbar */}
                <div className="backlog-toolbar">
                    {/* Search */}
                    <div className="backlog-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search backlog"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Assignee Filters */}
                    <div className="assignee-filters">
                        {users.map(user => (
                            <button
                                key={user.id}
                                className={`avatar sm ${selectedAssignees.includes(user.id) ? 'selected' : ''}`}
                                onClick={() => toggleAssignee(user.id)}
                                title={user.name}
                            >
                                {user.name.charAt(0)}
                            </button>
                        ))}
                    </div>

                    {/* Epic Dropdown */}
                    <div className="toolbar-divider" />

                    <div className="epic-filter-dropdown-container">
                        <button
                            className={`btn btn-sm btn-secondary ${epicDropdownOpen ? 'active' : ''}`}
                            onClick={() => setEpicDropdownOpen(!epicDropdownOpen)}
                        >
                            Epic {selectedEpics.length > 0 && `(${selectedEpics.length})`}
                            <ChevronDown size={14} />
                        </button>

                        {epicDropdownOpen && (
                            <div className="epic-filter-dropdown">
                                <div className="epic-filter-search">
                                    <input
                                        type="text"
                                        placeholder="Search Epic filters..."
                                        value={epicSearchQuery}
                                        onChange={(e) => setEpicSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="epic-filter-list">
                                    <label className="epic-filter-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedEpics.includes('no-epic')}
                                            onChange={() => {
                                                setSelectedEpics(prev =>
                                                    prev.includes('no-epic')
                                                        ? prev.filter(id => id !== 'no-epic')
                                                        : [...prev, 'no-epic']
                                                )
                                            }}
                                        />
                                        <span>No epic</span>
                                    </label>
                                    {epics
                                        .filter(epic =>
                                            epic.summary.toLowerCase().includes(epicSearchQuery.toLowerCase()) ||
                                            epic.key.toLowerCase().includes(epicSearchQuery.toLowerCase())
                                        )
                                        .map(epic => (
                                            <label key={epic.id} className="epic-filter-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEpics.includes(epic.id)}
                                                    onChange={() => {
                                                        setSelectedEpics(prev =>
                                                            prev.includes(epic.id)
                                                                ? prev.filter(id => id !== epic.id)
                                                                : [...prev, epic.id]
                                                        )
                                                    }}
                                                />
                                                <div className="epic-filter-info">
                                                    <span className="epic-filter-name">{epic.summary}</span>
                                                    <span className="epic-filter-key">{epic.key}</span>
                                                </div>
                                            </label>
                                        ))
                                    }
                                </div>
                                <div className="epic-filter-footer">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => setSelectedEpics([])}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Global Faceted Filter Menu */}
                    <div className="filter-popover-container" style={{ position: 'relative' }}>
                        <button
                            ref={filterButtonRef}
                            className={`btn btn-sm btn-secondary ${facetedFilterCount > 0 ? 'has-filters' : ''}`}
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <Filter size={14} />
                            Filter
                            {facetedFilterCount > 0 && <span className="filter-count">{facetedFilterCount}</span>}
                        </button>
                        <FacetedFilterMenu
                            isOpen={showFilterMenu}
                            onClose={() => setShowFilterMenu(false)}
                            anchorRef={filterButtonRef}
                            issues={issues}
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
                                assignee: new Set(selectedAssignees),
                                epic: new Set(selectedEpics),
                                game: filterGames,
                                department: filterDepartments,
                                labels: filterLabels,
                                reporter: filterReporters
                            }}
                            onFilterChange={(field, values) => {
                                const arr = Array.from(values)
                                if (field === 'type') setFilterTypes(values)
                                else if (field === 'status') setFilterStatuses(values)
                                else if (field === 'priority') setFilterPriorities(values)
                                else if (field === 'assignee') setSelectedAssignees(arr)
                                else if (field === 'epic') setSelectedEpics(arr)
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
                                // Apply all filter criteria from saved filter
                                setFilterTypes(new Set(filterData.type || []))
                                setFilterStatuses(new Set(filterData.status || []))
                                setFilterPriorities(new Set(filterData.priority || []))
                                setSelectedAssignees(filterData.assignee || [])
                                setSelectedEpics(filterData.epic || [])
                                setFilterGames(new Set(filterData.game || []))
                                setFilterDepartments(new Set(filterData.department || []))
                                setFilterLabels(new Set(filterData.labels || []))
                                setFilterReporters(new Set(filterData.reporter || []))
                            }}
                        />
                    </div>

                    {hasFilters && (
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    )}

                    {/* View Settings Menu */}
                    <ViewSettingsMenu />

                    {/* Create Sprint Button */}
                    <div className="toolbar-spacer" />
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={handleCreateSprint}
                    >
                        <Plus size={14} />
                        Create Sprint
                    </button>
                </div>

                {/* Sprint Sections */}
                <div className="sprint-list">
                    {/* Active Sprint */}
                    {activeSprint && (
                        <SprintSection
                            sprint={activeSprint}
                            issues={getSprintIssues(activeSprint.id)}
                        />
                    )}

                    {/* Future Sprints */}
                    {futureSprints.map(sprint => (
                        <SprintSection
                            key={sprint.id}
                            sprint={sprint}
                            issues={getSprintIssues(sprint.id)}
                        />
                    ))}

                    {/* Backlog */}
                    <SprintSection
                        isBacklog
                        issues={backlogIssues}
                    />
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIssues.size > 0 && (
                <div className="bulk-action-bar">
                    <button className="bulk-action-close" onClick={() => setSelectedIssues(new Set())}>
                        <X size={16} />
                    </button>
                    <span className="bulk-action-count">{selectedIssues.size} selected</span>
                    <div className="bulk-action-buttons">
                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal delete-confirm-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Issues</h3>
                            <button className="btn btn-icon btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete {selectedIssues.size} selected issue{selectedIssues.size > 1 ? 's' : ''}?</p>
                            <p className="text-secondary text-sm">This action will move the issues to trash. You can restore them from Settings &gt; Trash.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    softDeleteIssues(Array.from(selectedIssues))
                                    setSelectedIssues(new Set())
                                    setShowDeleteConfirm(false)
                                }}
                            >
                                <Trash2 size={14} />
                                Delete Issues
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Issue Context Menu (right-click) */}
            {issueContextMenu && (
                <div
                    className="issue-context-menu"
                    style={{
                        position: 'fixed',
                        left: issueContextMenu.x,
                        top: issueContextMenu.y,
                        zIndex: 1000
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-header">
                        <MoveRight size={14} />
                        Move to Sprint
                    </div>
                    <button
                        className="context-menu-item"
                        onClick={() => handleMoveToSprint(issueContextMenu.issueId, null)}
                    >
                        Backlog
                    </button>
                    {sprints.filter(s => s.state !== 'closed').map(sprint => (
                        <button
                            key={sprint.id}
                            className="context-menu-item"
                            onClick={() => handleMoveToSprint(issueContextMenu.issueId, sprint.id)}
                        >
                            {sprint.name}
                            {sprint.state === 'active' && <span className="sprint-badge active">Active</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
