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
    CheckCircle2
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
        updateIssue
    } = useProjectStore()

    // Filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEpic, setSelectedEpic] = useState(null)
    const [selectedAssignees, setSelectedAssignees] = useState([])
    const [collapsedSprints, setCollapsedSprints] = useState(new Set())
    const [creatingInSection, setCreatingInSection] = useState(null)
    const [newIssueSummary, setNewIssueSummary] = useState('')
    const [expandedEpics, setExpandedEpics] = useState(new Set())
    const [editingEpicId, setEditingEpicId] = useState(null)
    const [editingEpicName, setEditingEpicName] = useState('')

    // Get all epics for filter
    const epics = issues.filter(i => i.type === 'epic')

    // Filter issues
    const filterIssues = (issueList) => {
        return issueList.filter(issue => {
            // Search filter
            if (searchQuery && !issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !issue.key.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false
            }
            // Epic filter
            if (selectedEpic && issue.type !== 'epic' && issue.epicId !== selectedEpic) {
                return false
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

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('')
        setSelectedEpic(null)
        setSelectedAssignees([])
    }

    // Toggle epic expand
    const toggleEpicExpand = (epicId) => {
        setExpandedEpics(prev => {
            const next = new Set(prev)
            if (next.has(epicId)) {
                next.delete(epicId)
            } else {
                next.add(epicId)
            }
            return next
        })
    }

    // Start editing epic name
    const startEditingEpic = (epic) => {
        setEditingEpicId(epic.id)
        setEditingEpicName(epic.summary)
    }

    // Save epic name
    const saveEpicName = () => {
        if (editingEpicId && editingEpicName.trim()) {
            updateIssue(editingEpicId, { summary: editingEpicName.trim() })
        }
        setEditingEpicId(null)
        setEditingEpicName('')
    }

    // Get epic stats
    const getEpicStats = (epicId) => {
        const epicIssues = issues.filter(i => i.epicId === epicId)
        const completed = epicIssues.filter(i => i.status === 'done').length
        const totalPoints = epicIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
        return {
            workItems: epicIssues.length,
            completed,
            estimate: totalPoints
        }
    }

    const hasFilters = searchQuery || selectedEpic || selectedAssignees.length > 0

    // Handle inline issue creation
    const handleCreateIssue = (sprintId) => {
        if (!newIssueSummary.trim()) return

        addIssue({
            type: 'task',
            status: 'todo',
            priority: 'medium',
            summary: newIssueSummary.trim(),
            description: '',
            sprintId: sprintId || null,
            storyPoints: null,
            labels: [],
            assigneeId: null,
            reporterId: 'user-1'
        })

        setNewIssueSummary('')
        setCreatingInSection(null)
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
                            <div className="inline-create">
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
                                        }
                                    }}
                                    autoFocus
                                />
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleCreateIssue(sprint?.id)}
                                >
                                    Create
                                </button>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => {
                                        setCreatingInSection(null)
                                        setNewIssueSummary('')
                                    }}
                                >
                                    Cancel
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
                        onClick={() => setSelectedEpic(null)}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="epic-list">
                    <button
                        className={`epic-item ${selectedEpic === null ? 'active' : ''}`}
                        onClick={() => setSelectedEpic(null)}
                    >
                        <span className="epic-color" style={{ background: 'var(--text-tertiary)' }} />
                        No epic
                    </button>

                    {epics.map(epic => {
                        const isExpanded = expandedEpics.has(epic.id)
                        const isEditing = editingEpicId === epic.id
                        const stats = getEpicStats(epic.id)

                        return (
                            <div key={epic.id} className="epic-expandable">
                                <div className={`epic-item-row ${selectedEpic === epic.id ? 'active' : ''}`}>
                                    <button
                                        className="epic-expand-btn"
                                        onClick={() => toggleEpicExpand(epic.id)}
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>

                                    <span className="epic-color" style={{ background: 'var(--epic)' }} />

                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="epic-name-input"
                                            value={editingEpicName}
                                            onChange={(e) => setEditingEpicName(e.target.value)}
                                            onBlur={saveEpicName}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEpicName()
                                                if (e.key === 'Escape') {
                                                    setEditingEpicId(null)
                                                    setEditingEpicName('')
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span
                                            className="epic-name"
                                            onClick={() => startEditingEpic(epic)}
                                            title="Click to edit"
                                        >
                                            {epic.summary}
                                        </span>
                                    )}

                                    <button
                                        className="epic-menu-btn"
                                        onClick={() => setSelectedIssue(epic)}
                                    >
                                        ⋯
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="epic-details">
                                        <div className="epic-detail-row">
                                            <span>Key</span>
                                            <span>{epic.key}</span>
                                        </div>
                                        <div className="epic-detail-row">
                                            <span>Work items</span>
                                            <span>{stats.workItems}</span>
                                        </div>
                                        <div className="epic-detail-row">
                                            <span>Completed</span>
                                            <span>{stats.completed}</span>
                                        </div>
                                        <div className="epic-detail-row">
                                            <span>Estimate</span>
                                            <span>{stats.estimate}pt</span>
                                        </div>

                                        <button
                                            className="btn btn-sm btn-secondary epic-detail-btn"
                                            onClick={() => setSelectedIssue(epic)}
                                        >
                                            View details
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary epic-detail-btn"
                                            onClick={() => {
                                                const newIssue = addIssue({
                                                    type: 'task',
                                                    status: 'todo',
                                                    priority: 'medium',
                                                    summary: 'New work item',
                                                    description: '',
                                                    epicId: epic.id,
                                                    sprintId: null,
                                                    storyPoints: null,
                                                    labels: [],
                                                    assigneeId: null,
                                                    reporterId: 'user-1'
                                                })
                                                setSelectedIssue(newIssue)
                                            }}
                                        >
                                            Create work item
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Create Epic Button */}
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
                            // Open the issue modal to edit
                            setSelectedIssue(newEpic)
                        }}
                    >
                        <Plus size={14} />
                        Create epic
                    </button>
                </div>
            </div>

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

                    {/* Quick Filters */}
                    <div className="toolbar-divider" />

                    <button className="btn btn-sm btn-secondary">
                        Epic
                        <ChevronDown size={14} />
                    </button>

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
