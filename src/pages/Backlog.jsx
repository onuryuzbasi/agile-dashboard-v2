import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
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
    User
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
        addIssue,
        updateIssue,
        deleteIssue,
        addSprint
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

    // Get all epics for filter
    const epics = issues.filter(i => i.type === 'epic')

    // Filter issues (exclude epics from backlog list)
    const filterIssues = (issueList) => {
        return issueList.filter(issue => {
            // Hide epics from the backlog list
            if (issue.type === 'epic') {
                return false
            }
            // Search filter
            if (searchQuery && !issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !issue.key.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
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
            // Assignee filter
            if (selectedAssignees.length > 0 && !selectedAssignees.includes(issue.assigneeId)) {
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
    }

    const hasFilters = searchQuery || selectedEpics.length > 0 || selectedAssignees.length > 0

    // Handle inline issue creation
    const handleCreateIssue = (sprintId) => {
        if (!newIssueSummary.trim()) return

        addIssue({
            type: newIssueType,
            status: 'todo',
            priority: 'medium',
            summary: newIssueSummary.trim(),
            description: '',
            sprintId: sprintId || null,
            storyPoints: null,
            labels: [],
            assigneeId: newIssueAssignee,
            reporterId: 'user-1'
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

    // Issue Row Component
    const IssueRow = ({ issue }) => {
        const TypeIcon = typeIcons[issue.type] || CheckSquare
        const PriorityIcon = priorityConfig[issue.priority]?.icon || Minus
        const priorityColor = priorityConfig[issue.priority]?.color
        const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null

        return (
            <div
                className="backlog-issue-row"
                onClick={() => setSelectedIssue(issue)}
            >
                <GripVertical size={14} className="drag-handle" />

                <div className={`issue-type-icon ${issue.type}`}>
                    <TypeIcon size={10} />
                </div>

                <span className="issue-key">{issue.key}</span>

                <span className="issue-summary">{issue.summary}</span>

                {/* Labels */}
                {issue.labels && issue.labels.length > 0 && (
                    <div className="issue-labels">
                        {issue.labels.slice(0, 2).map(label => (
                            <span key={label} className="issue-label">{label}</span>
                        ))}
                        {issue.labels.length > 2 && (
                            <span className="issue-label">+{issue.labels.length - 2}</span>
                        )}
                    </div>
                )}

                {/* Status badge */}
                <span className={`issue-status-badge ${issue.status}`}>
                    {issue.status === 'todo' ? 'TO DO' :
                        issue.status === 'progress' ? 'IN PROGRESS' :
                            issue.status === 'review' ? 'IN REVIEW' : 'DONE'}
                </span>

                {/* Due date */}
                {issue.dueDate && (
                    <span className="issue-due-date">
                        <Calendar size={12} />
                        {formatDate(issue.dueDate)}
                    </span>
                )}

                {/* Time estimate */}
                <span className="issue-estimate">
                    {issue.storyPoints ? `${issue.storyPoints}pt` : '0m'}
                </span>

                {/* Priority */}
                <span className="issue-priority" style={{ color: priorityColor }}>
                    <PriorityIcon size={14} />
                </span>

                {/* Assignee */}
                {assignee ? (
                    <div className="avatar sm" title={assignee.name}>
                        {assignee.name.charAt(0)}
                    </div>
                ) : (
                    <div className="avatar sm unassigned" title="Unassigned">?</div>
                )}
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

                        <button className="btn btn-icon btn-ghost sm">⋯</button>
                    </div>
                </div>

                {/* Sprint Body */}
                {!isCollapsed && (
                    <div className="sprint-body">
                        {filteredIssues.length > 0 ? (
                            filteredIssues.map(issue => (
                                <IssueRow key={issue.id} issue={issue} />
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
                                <div className="inline-type-dropdown">
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
                                <div className="inline-assignee-dropdown">
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
                                            <button onClick={() => { setNewIssueAssignee(null); setShowAssigneeDropdown(false) }}>
                                                <span className="avatar xs">?</span>
                                                Unassigned
                                            </button>
                                            {users.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => { setNewIssueAssignee(user.id); setShowAssigneeDropdown(false) }}
                                                >
                                                    <span className="avatar xs">{user.name.charAt(0)}</span>
                                                    {user.name}
                                                </button>
                                            ))}
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

                <div className="epic-list">
                    <button
                        className={`epic-item ${selectedEpics.includes('no-epic') ? 'active' : ''}`}
                        onClick={(e) => toggleEpic('no-epic', e.ctrlKey || e.metaKey)}
                    >
                        <span className="epic-color" style={{ background: 'var(--text-tertiary)' }} />
                        No epic
                    </button>

                    {epics.map(epic => (
                        <div key={epic.id} className="epic-item-wrapper">
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
                        onClick={() => {
                            const newEpic = addIssue({
                                type: 'epic',
                                status: 'todo',
                                priority: 'medium',
                                summary: 'New Epic',
                                description: '',
                                sprintId: null,
                                storyPoints: null,
                                labels: [],
                                assigneeId: null,
                                reporterId: 'user-1'
                            })
                            setSelectedIssue(newEpic)
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

                    <button className="btn btn-sm btn-secondary">
                        <Filter size={14} />
                        Quick filters
                        <ChevronDown size={14} />
                    </button>

                    {hasFilters && (
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={clearFilters}
                        >
                            Clear filters
                        </button>
                    )}

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
        </div>
    )
}
