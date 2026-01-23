import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Calendar,
    User,
    Tag,
    Trash2,
    Save,
    Plus,
    ChevronDown,
    ChevronRight,
    Clock,
    Building2,
    Gamepad2,
    Link2,
    History
} from 'lucide-react'
import { getIconByName } from '../../config/fieldConfig'

// Keep typeIcons for rendering (will use fieldConfig where applicable)
const typeIconsDefault = {
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    epic: Layers,
    subtask: ListTree
}

export default function IssueModal({ issue, onClose }) {
    const {
        updateIssue,
        deleteIssue,
        addIssue,
        addWorkLog,
        removeWorkLog,
        users,
        sprints,
        issues,
        games,
        departments,
        fieldConfig,
        getUserById
    } = useProjectStore()

    // Build dynamic options from fieldConfig
    const typeOptions = useMemo(() => {
        return fieldConfig?.issueTypes?.map(t => ({
            value: t.key,
            label: t.label,
            color: t.color
        })) || [
                { value: 'story', label: 'Story', color: 'var(--story)' },
                { value: 'bug', label: 'Bug', color: 'var(--bug)' },
                { value: 'task', label: 'Task', color: 'var(--task)' },
                { value: 'epic', label: 'Epic', color: 'var(--epic)' },
                { value: 'subtask', label: 'Subtask', color: 'var(--subtask)' }
            ]
    }, [fieldConfig])

    const priorityOptions = useMemo(() => {
        return fieldConfig?.priorities?.map(p => ({
            value: p.key,
            label: p.label,
            color: p.color
        })) || [
                { value: 'highest', label: 'Highest', color: 'var(--priority-highest)' },
                { value: 'high', label: 'High', color: 'var(--priority-high)' },
                { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
                { value: 'low', label: 'Low', color: 'var(--priority-low)' },
                { value: 'lowest', label: 'Lowest', color: 'var(--priority-lowest)' }
            ]
    }, [fieldConfig])

    const statusOptions = useMemo(() => {
        return fieldConfig?.statuses?.map(s => ({
            value: s.key,
            label: s.label
        })) || [
                { value: 'todo', label: 'To Do' },
                { value: 'progress', label: 'In Progress' },
                { value: 'review', label: 'In Review' },
                { value: 'done', label: 'Done' }
            ]
    }, [fieldConfig])

    const departmentOptions = useMemo(() => {
        const opts = [{ value: '', label: 'None' }]
        if (departments) {
            departments.forEach(d => {
                opts.push({ value: d.id, label: d.name })
            })
        }
        return opts
    }, [departments])

    // Get type icon (using fieldConfig if available)
    const getTypeIcon = (typeKey) => {
        const typeConfig = fieldConfig?.issueTypes?.find(t => t.key === typeKey)
        if (typeConfig?.icon) {
            return getIconByName(typeConfig.icon, CheckSquare)
        }
        return typeIconsDefault[typeKey] || CheckSquare
    }

    const [formData, setFormData] = useState({
        summary: issue.summary,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId || '',
        reporterId: issue.reporterId || '',
        sprintId: issue.sprintId || '',
        storyPoints: issue.storyPoints || '',
        originalEstimate: issue.originalEstimate || '',
        game: issue.game || '',
        parentId: issue.parentId || '',
        department: issue.department || '',
        startDate: issue.startDate || '',
        dueDate: issue.dueDate || ''
    })

    const [isEditing, setIsEditing] = useState(false)
    const [childItemsExpanded, setChildItemsExpanded] = useState(true)
    const [newChildSummary, setNewChildSummary] = useState('')
    const [newChildType, setNewChildType] = useState('story')
    const [newChildAssigneeId, setNewChildAssigneeId] = useState('')
    const [showAddChild, setShowAddChild] = useState(false)
    const [showParentDropdown, setShowParentDropdown] = useState(false)
    const [newEpicName, setNewEpicName] = useState('')
    const [showCreateEpic, setShowCreateEpic] = useState(false)

    // Work log state
    const [showWorkLogForm, setShowWorkLogForm] = useState(false)
    const [workLogHours, setWorkLogHours] = useState('')
    const [workLogMinutes, setWorkLogMinutes] = useState('')
    const [workLogDescription, setWorkLogDescription] = useState('')
    const [workLogDate, setWorkLogDate] = useState(new Date().toISOString().split('T')[0])

    // Activity log state
    const [activityLogExpanded, setActivityLogExpanded] = useState(false)

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Helper function for relative time display
    const getRelativeTime = (timestamp) => {
        const now = new Date()
        const date = new Date(timestamp)
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsEditing(true)
    }

    const handleSave = () => {
        updateIssue(issue.id, {
            ...formData,
            storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
            originalEstimate: formData.originalEstimate ? parseInt(formData.originalEstimate) : null
        })
        setIsEditing(false)
    }

    const handleDelete = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = () => {
        deleteIssue(issue.id)
        setShowDeleteConfirm(false)
        onClose()
    }

    const handleAddChild = async () => {
        if (!newChildSummary.trim()) return

        await addIssue({
            type: newChildType,
            status: 'todo',
            priority: 'medium',
            summary: newChildSummary.trim(),
            description: '',
            parentId: issue.id,
            sprintId: formData.sprintId,
            assigneeId: newChildAssigneeId || null,
            storyPoints: null,
            labels: [],
            reporterId: issue.reporterId
        })

        // Reset form
        setNewChildSummary('')
        setNewChildType('story')
        setNewChildAssigneeId('')
        setShowAddChild(false)
    }

    // Get child issues for epics
    const childIssues = formData.type === 'epic'
        ? issues.filter(i => i.parentId === issue.id && !i.isDeleted)
        : []

    // Calculate progress for epic
    const completedChildren = childIssues.filter(i => i.status === 'done').length
    const progressPercent = childIssues.length > 0
        ? Math.round((completedChildren / childIssues.length) * 100)
        : 0

    // Get available epics for parent selection (only show if not epic type)
    const availableEpics = issues.filter(i => i.type === 'epic' && i.id !== issue.id && !i.isDeleted)

    const TypeIcon = getTypeIcon(formData.type)
    const assignee = formData.assigneeId ? getUserById(formData.assigneeId) : null
    const reporter = formData.reporterId ? getUserById(formData.reporterId) : null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal issue-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className={`issue-type-icon ${formData.type}`} style={{ width: 24, height: 24 }}>
                            <TypeIcon size={14} />
                        </div>
                        <span className="text-secondary text-sm font-medium">{issue.key}</span>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Summary */}
                    <div className="input-group mb-4">
                        <label className="input-label">Summary</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.summary}
                            onChange={(e) => handleChange('summary', e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="input-group mb-4">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a description..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Grid of fields - Row 1 */}
                    <div className="issue-fields-grid">
                        {/* Type */}
                        <div className="input-group">
                            <label className="input-label">Type</label>
                            <select
                                className="input select"
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <select
                                className="input select"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="input-group">
                            <label className="input-label">Priority</label>
                            <select
                                className="input select"
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                {priorityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Reporter */}
                        <div className="input-group">
                            <label className="input-label">Reporter</label>
                            <select
                                className="input select"
                                value={formData.reporterId}
                                onChange={(e) => handleChange('reporterId', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div className="input-group">
                            <label className="input-label">Assignee</label>
                            <select
                                className="input select"
                                value={formData.assigneeId}
                                onChange={(e) => handleChange('assigneeId', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sprint */}
                        <div className="input-group">
                            <label className="input-label">Sprint</label>
                            <select
                                className="input select"
                                value={formData.sprintId}
                                onChange={(e) => handleChange('sprintId', e.target.value)}
                            >
                                <option value="">Backlog</option>
                                {sprints.map(sprint => (
                                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Original Estimate */}
                        <div className="input-group">
                            <label className="input-label">Original Estimate (hours)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                value={formData.originalEstimate}
                                onChange={(e) => handleChange('originalEstimate', e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        {/* Game */}
                        <div className="input-group">
                            <label className="input-label">Game</label>
                            <select
                                className="input select"
                                value={formData.game}
                                onChange={(e) => handleChange('game', e.target.value)}
                            >
                                <option value="">None</option>
                                {games?.map(game => (
                                    <option key={game.id} value={game.id}>{game.name} ({game.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Parent/Epic - only show for non-epic types */}
                        {formData.type !== 'epic' && (
                            <div className="input-group">
                                <label className="input-label">Parent (Epic)</label>
                                <div className="parent-dropdown-container">
                                    <button
                                        type="button"
                                        className="input select parent-dropdown-btn"
                                        onClick={() => setShowParentDropdown(!showParentDropdown)}
                                    >
                                        {formData.parentId
                                            ? availableEpics.find(e => e.id === formData.parentId)?.summary || 'Select Epic'
                                            : 'None'
                                        }
                                        <ChevronDown size={14} />
                                    </button>
                                    {showParentDropdown && (
                                        <div className="parent-dropdown-menu" onClick={e => e.stopPropagation()}>
                                            <button
                                                className={`parent-dropdown-item ${!formData.parentId ? 'selected' : ''}`}
                                                onClick={() => {
                                                    handleChange('parentId', '')
                                                    setShowParentDropdown(false)
                                                }}
                                            >
                                                ✓ None
                                            </button>
                                            {availableEpics.map(epic => (
                                                <button
                                                    key={epic.id}
                                                    className={`parent-dropdown-item ${formData.parentId === epic.id ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        handleChange('parentId', epic.id)
                                                        setShowParentDropdown(false)
                                                    }}
                                                >
                                                    {epic.key} - {epic.summary.length > 40 ? epic.summary.substring(0, 40) + '...' : epic.summary}
                                                </button>
                                            ))}
                                            <div className="parent-dropdown-divider" />
                                            {showCreateEpic ? (
                                                <div className="create-epic-form">
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        placeholder="Enter epic name..."
                                                        value={newEpicName}
                                                        onChange={(e) => setNewEpicName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newEpicName.trim()) {
                                                                const newEpic = addIssue({
                                                                    type: 'epic',
                                                                    status: 'todo',
                                                                    priority: 'medium',
                                                                    summary: newEpicName.trim(),
                                                                    description: '',
                                                                    sprintId: null,
                                                                    storyPoints: null,
                                                                    labels: [],
                                                                    reporterId: issue.reporterId
                                                                })
                                                                handleChange('parentId', newEpic.id)
                                                                setNewEpicName('')
                                                                setShowCreateEpic(false)
                                                                setShowParentDropdown(false)
                                                            }
                                                            if (e.key === 'Escape') {
                                                                setShowCreateEpic(false)
                                                                setNewEpicName('')
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            if (newEpicName.trim()) {
                                                                const newEpic = addIssue({
                                                                    type: 'epic',
                                                                    status: 'todo',
                                                                    priority: 'medium',
                                                                    summary: newEpicName.trim(),
                                                                    description: '',
                                                                    sprintId: null,
                                                                    storyPoints: null,
                                                                    labels: [],
                                                                    reporterId: issue.reporterId
                                                                })
                                                                handleChange('parentId', newEpic.id)
                                                                setNewEpicName('')
                                                                setShowCreateEpic(false)
                                                                setShowParentDropdown(false)
                                                            }
                                                        }}
                                                    >
                                                        Create
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="parent-dropdown-item create-epic-btn"
                                                    onClick={() => setShowCreateEpic(true)}
                                                >
                                                    <Plus size={14} />
                                                    Create Epic
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Department */}
                        <div className="input-group">
                            <label className="input-label">Department</label>
                            <select
                                className="input select"
                                value={formData.department}
                                onChange={(e) => handleChange('department', e.target.value)}
                            >
                                {departmentOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                            />
                        </div>

                        {/* Due Date */}
                        <div className="input-group">
                            <label className="input-label">Due Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Child Work Items - Only for Epics */}
                    {formData.type === 'epic' && (
                        <div className="child-items-section">
                            <div className="child-items-header" onClick={() => setChildItemsExpanded(!childItemsExpanded)}>
                                {childItemsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span>Child work items</span>
                                <span className="child-items-count">{childIssues.length}</span>
                                <button
                                    className="btn btn-icon btn-ghost btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowAddChild(true)
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {childItemsExpanded && (
                                <>
                                    {/* Progress bar */}
                                    {childIssues.length > 0 && (
                                        <div className="child-items-progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="progress-text">{progressPercent}% Done</span>
                                        </div>
                                    )}

                                    {/* Child items table */}
                                    {childIssues.length > 0 && (
                                        <div className="child-items-table">
                                            <div className="child-items-table-header">
                                                <span>Work</span>
                                                <span>Pri...</span>
                                                <span>As...</span>
                                                <span>Status</span>
                                            </div>
                                            {childIssues.map(child => {
                                                const ChildTypeIcon = getTypeIcon(child.type)
                                                const childAssignee = child.assigneeId ? getUserById(child.assigneeId) : null
                                                return (
                                                    <div key={child.id} className="child-item-row">
                                                        <div className="child-item-work">
                                                            <span className={`issue-type-icon ${child.type}`} style={{ width: 16, height: 16 }}>
                                                                <ChildTypeIcon size={10} />
                                                            </span>
                                                            <span className="child-item-key">{child.key}</span>
                                                            <span className="child-item-summary">{child.summary}</span>
                                                        </div>
                                                        <div className="child-item-priority">
                                                            {child.priority === 'medium' && <Minus size={12} />}
                                                            {child.priority === 'high' && <ArrowUp size={12} />}
                                                            {child.priority === 'low' && <ArrowDown size={12} />}
                                                        </div>
                                                        <div className="child-item-assignee">
                                                            {childAssignee ? (
                                                                <span className="avatar xs">{childAssignee.name.charAt(0)}</span>
                                                            ) : (
                                                                <span className="avatar xs">?</span>
                                                            )}
                                                        </div>
                                                        <div className="child-item-status">
                                                            <span className={`status-badge ${child.status}`}>
                                                                {statusOptions.find(s => s.value === child.status)?.label || child.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Add child input - Enhanced inline form */}
                                    {showAddChild && (
                                        <div className="add-child-row enhanced">
                                            <select
                                                className="input add-child-type-select"
                                                value={newChildType}
                                                onChange={(e) => setNewChildType(e.target.value)}
                                                title="Issue Type"
                                            >
                                                <option value="story">Story</option>
                                                <option value="task">Task</option>
                                                <option value="bug">Bug</option>
                                            </select>
                                            <input
                                                type="text"
                                                className="input add-child-summary-input"
                                                placeholder="Enter issue summary..."
                                                value={newChildSummary}
                                                onChange={(e) => setNewChildSummary(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddChild()
                                                    if (e.key === 'Escape') {
                                                        setShowAddChild(false)
                                                        setNewChildSummary('')
                                                        setNewChildType('story')
                                                        setNewChildAssigneeId('')
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <select
                                                className="input add-child-assignee-select"
                                                value={newChildAssigneeId}
                                                onChange={(e) => setNewChildAssigneeId(e.target.value)}
                                                title="Assignee"
                                            >
                                                <option value="">Unassigned</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>{user.name}</option>
                                                ))}
                                            </select>
                                            <button className="btn btn-sm btn-primary" onClick={handleAddChild}>
                                                Add
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => {
                                                    setShowAddChild(false)
                                                    setNewChildSummary('')
                                                    setNewChildType('story')
                                                    setNewChildAssigneeId('')
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {childIssues.length === 0 && !showAddChild && (
                                        <div className="child-items-empty">
                                            No child items yet. Click + to add one.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Work Log Section */}
                    <div className="work-log-section">
                        <div className="work-log-header">
                            <div className="work-log-title">
                                <Clock size={16} />
                                <span>Work Log</span>
                                <span className="work-log-count">
                                    {(issue.workLogs || []).length} entries
                                </span>
                            </div>
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setShowWorkLogForm(!showWorkLogForm)}
                            >
                                <Plus size={14} />
                                Log Time
                            </button>
                        </div>

                        {/* Work Log Form */}
                        {showWorkLogForm && (
                            <div className="work-log-form">
                                <div className="work-log-time-inputs">
                                    <div className="input-group">
                                        <label className="input-label">Hours</label>
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            placeholder="0"
                                            value={workLogHours}
                                            onChange={(e) => setWorkLogHours(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Minutes</label>
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            max="59"
                                            placeholder="0"
                                            value={workLogMinutes}
                                            onChange={(e) => setWorkLogMinutes(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={workLogDate}
                                            onChange={(e) => setWorkLogDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description (optional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="What did you work on?"
                                        value={workLogDescription}
                                        onChange={(e) => setWorkLogDescription(e.target.value)}
                                    />
                                </div>
                                <div className="work-log-form-actions">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                            const hours = parseInt(workLogHours) || 0
                                            const minutes = parseInt(workLogMinutes) || 0
                                            if (hours > 0 || minutes > 0) {
                                                addWorkLog(issue.id, {
                                                    timeSpent: hours * 60 + minutes, // Store in minutes
                                                    description: workLogDescription,
                                                    date: workLogDate,
                                                    userId: formData.assigneeId || users[0]?.id || null
                                                })
                                                setWorkLogHours('')
                                                setWorkLogMinutes('')
                                                setWorkLogDescription('')
                                                setWorkLogDate(new Date().toISOString().split('T')[0])
                                                setShowWorkLogForm(false)
                                            }
                                        }}
                                        disabled={!workLogHours && !workLogMinutes}
                                    >
                                        Log Time
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            setShowWorkLogForm(false)
                                            setWorkLogHours('')
                                            setWorkLogMinutes('')
                                            setWorkLogDescription('')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Work Log List */}
                        {(issue.workLogs || []).length > 0 && (
                            <div className="work-log-list">
                                {(issue.workLogs || []).map(log => {
                                    const logUser = getUserById(log.userId)
                                    const hours = Math.floor(log.timeSpent / 60)
                                    const minutes = log.timeSpent % 60
                                    const timeDisplay = hours > 0
                                        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                                        : `${minutes}m`

                                    return (
                                        <div key={log.id} className="work-log-item">
                                            <div className="work-log-item-avatar">
                                                <span className="avatar sm">
                                                    {logUser?.name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div className="work-log-item-content">
                                                <div className="work-log-item-header">
                                                    <span className="work-log-user">{logUser?.name || 'Unknown'}</span>
                                                    <span className="work-log-time">{timeDisplay}</span>
                                                    <span className="work-log-date">
                                                        {new Date(log.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                {log.description && (
                                                    <div className="work-log-description">{log.description}</div>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-icon btn-ghost btn-sm work-log-remove"
                                                onClick={() => removeWorkLog(issue.id, log.id)}
                                                title="Remove log"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Total Time */}
                        {(issue.workLogs || []).length > 0 && (
                            <div className="work-log-total">
                                Total logged: {(() => {
                                    const totalMinutes = (issue.workLogs || []).reduce((sum, log) => sum + log.timeSpent, 0)
                                    const hours = Math.floor(totalMinutes / 60)
                                    const minutes = totalMinutes % 60
                                    return hours > 0
                                        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                                        : `${minutes}m`
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Activity History Section */}
                    <div className="activity-log-section">
                        <div
                            className="activity-log-header"
                            onClick={() => setActivityLogExpanded(!activityLogExpanded)}
                        >
                            <div className="activity-log-title">
                                {activityLogExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <History size={16} />
                                <span>Activity History</span>
                                <span className="activity-log-count">
                                    {(issue.history || []).length} changes
                                </span>
                            </div>
                        </div>

                        {activityLogExpanded && (
                            <div className="activity-log-content">
                                {(issue.history || []).length === 0 ? (
                                    <div className="activity-log-empty">
                                        No activity recorded yet.
                                    </div>
                                ) : (
                                    <div className="activity-log-list">
                                        {[...(issue.history || [])]
                                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                            .map(entry => {
                                                const entryUser = getUserById(entry.userId)
                                                return (
                                                    <div key={entry.id} className="activity-log-item">
                                                        <div className="activity-log-avatar">
                                                            <span className="avatar sm">
                                                                {entryUser?.name?.charAt(0) || '?'}
                                                            </span>
                                                        </div>
                                                        <div className="activity-log-details">
                                                            <div className="activity-log-text">
                                                                <span className="activity-log-user">
                                                                    {entryUser?.name || 'Unknown'}
                                                                </span>
                                                                {' changed '}
                                                                <span className="activity-log-field">
                                                                    {entry.fieldLabel}
                                                                </span>
                                                                {' from '}
                                                                <span className="activity-log-value old">
                                                                    '{entry.oldLabel}'
                                                                </span>
                                                                {' to '}
                                                                <span className="activity-log-value new">
                                                                    '{entry.newLabel}'
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="activity-log-time">
                                                            {getRelativeTime(entry.timestamp)}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Metadata */}
                    <div
                        className="mt-4 pt-4"
                        style={{ borderTop: '1px solid var(--border-primary)' }}
                    >
                        <div className="text-xs text-tertiary">
                            Created: {new Date(issue.createdAt).toLocaleDateString()}
                            {issue.updatedAt !== issue.createdAt && (
                                <> · Updated: {new Date(issue.updatedAt).toLocaleDateString()}</>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-ghost btn-danger" onClick={handleDelete}>
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!isEditing}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-confirm-header">
                            <Trash2 size={24} className="delete-confirm-icon" />
                            <h3>Delete {issue.type === 'epic' ? 'Epic' : 'Issue'}?</h3>
                        </div>
                        <div className="delete-confirm-body">
                            <p>Are you sure you want to delete <strong>{issue.key}</strong>?</p>
                            {issue.type === 'epic' && childIssues.length > 0 && (
                                <p className="delete-warning">
                                    ⚠️ This epic has {childIssues.length} child issue(s). They will become orphaned.
                                </p>
                            )}
                            <p className="delete-note">This action will move the issue to trash. You can restore it from Settings {'>'} Trash.</p>
                        </div>
                        <div className="delete-confirm-actions">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
