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
    History,
    ListChecks,
    Check,
    AlertTriangle,
    Send
} from 'lucide-react'
import { getIconByName } from '../../config/fieldConfig'
import TISScoreInput from '../qa/TISScoreInput'

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
        addChecklistItem,
        updateChecklistItem,
        removeChecklistItem,
        users,
        sprints,
        issues,
        games,
        departments,
        fieldConfig,
        getUserById,
        addComment,
        triggerCelebration
    } = useProjectStore()

    // Get reactive issue from store (for real-time updates like worklogs)
    const currentIssue = issues.find(i => i.id === issue.id) || issue

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
        gameId: issue.gameId || '',
        parentId: issue.parentId || '',
        departmentId: issue.departmentId || '',
        startDate: issue.startDate || '',
        dueDate: issue.dueDate || '',
        // Bug-specific TIS fields
        tis_impact: issue.tis_impact || 1,
        tis_size: issue.tis_size || 1,
        tis_time: issue.tis_time || 1,
        retest_status: issue.retest_status || 'pending',
        found_in_build: issue.found_in_build || '',
        fixed_in_build: issue.fixed_in_build || ''
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

    // Checklist state
    const [checklistExpanded, setChecklistExpanded] = useState(true)
    const [newChecklistItem, setNewChecklistItem] = useState('')

    // Comment state
    const [newComment, setNewComment] = useState('')
    const [showMentionList, setShowMentionList] = useState(false)
    const [filteredUsers, setFilteredUsers] = useState([])
    const [mentionCursorIndex, setMentionCursorIndex] = useState(0)

    // Helper to resolve display labels for history entries (handles missing or UUID labels)
    const resolveHistoryLabel = (entry, labelType) => {
        const label = labelType === 'old' ? entry.oldLabel : entry.newLabel
        const value = labelType === 'old' ? entry.oldValue : entry.newValue

        // If label exists and is not a UUID, use it
        if (label && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(label)) {
            return label
        }

        // Otherwise, resolve from value
        if (value === null || value === undefined || value === '') return 'None'

        switch (entry.field) {
            case 'sprintId':
                const sprint = sprints.find(s => s.id === value)
                return sprint?.name || 'Backlog'
            case 'assigneeId':
            case 'reporterId':
                const user = users.find(u => u.id === value)
                return user?.name || 'Unassigned'
            case 'parentId':
                const parent = issues.find(i => i.id === value)
                return parent?.key || 'None'
            case 'gameId':
                const game = games?.find(g => g.id === value)
                return game?.name || 'None'
            case 'departmentId':
                const dept = departments?.find(d => d.id === value)
                return dept?.name || 'None'
            default:
                return label || String(value)
        }
    }

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    // Checklist warning state (for status change with incomplete items)
    const [showChecklistWarning, setShowChecklistWarning] = useState(false)
    const [pendingStatusChange, setPendingStatusChange] = useState(null)

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
        // Check for incomplete checklist items when status is being changed
        if (field === 'status' && value !== formData.status) {
            const checklist = issue.checklist || []
            const incompleteItems = checklist.filter(item => !item.checked)

            if (incompleteItems.length > 0) {
                // Store the pending status change and show warning
                setPendingStatusChange(value)
                setShowChecklistWarning(true)
                return // Don't apply the change yet
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }))
        setIsEditing(true)
    }

    // Handle confirming status change despite incomplete checklist
    const confirmStatusChange = () => {
        if (pendingStatusChange) {
            setFormData(prev => ({ ...prev, status: pendingStatusChange }))
            setIsEditing(true)
        }
        setShowChecklistWarning(false)
        setPendingStatusChange(null)
    }

    // Cancel the pending status change
    const cancelStatusChange = () => {
        setShowChecklistWarning(false)
        setPendingStatusChange(null)
    }

    const handleSave = () => {
        // Sanitize formData: convert empty strings to null for UUID fields
        const sanitizedData = {
            ...formData,
            storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
            originalEstimate: formData.originalEstimate ? parseInt(formData.originalEstimate) : null,
            sprintId: formData.sprintId || null,
            assigneeId: formData.assigneeId || null,
            reporterId: formData.reporterId || null,
            parentId: formData.parentId || null,
            gameId: formData.gameId || null,
            departmentId: formData.departmentId || null,
            startDate: formData.startDate || null,
            dueDate: formData.dueDate || null
        }

        updateIssue(issue.id, sanitizedData)
        setIsEditing(false)

        // Trigger celebration if status changed to Done
        if (sanitizedData.status === 'done' && issue.status !== 'done') {
            triggerCelebration(true)
        }
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

    // Comment handlers
    const handleCommentChange = (e) => {
        const val = e.target.value
        setNewComment(val)

        const selectionStart = e.target.selectionStart
        const textBeforeCursor = val.substring(0, selectionStart)
        const lastAt = textBeforeCursor.lastIndexOf('@')

        if (lastAt !== -1) {
            const query = textBeforeCursor.substring(lastAt + 1)

            if (!query.includes('\n') && query.length < 20) {
                const matches = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
                setFilteredUsers(matches)
                if (matches.length > 0) {
                    setShowMentionList(true)
                    setMentionCursorIndex(lastAt)
                } else {
                    setShowMentionList(false)
                }
            } else {
                setShowMentionList(false)
            }
        } else {
            setShowMentionList(false)
        }
    }

    const selectUser = (user) => {
        const val = newComment
        const prefix = val.substring(0, mentionCursorIndex)
        // Simple append for now
        const newVal = prefix + `@${user.name} `
        setNewComment(newVal)
        setShowMentionList(false)
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return
        addComment(issue.id, newComment.trim())
        setNewComment('')
        setActivityLogExpanded(true)
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

                    {/* Comment Section */}
                    <div className="input-group mb-4 relative-container" style={{ position: 'relative' }}>
                        <div className="flex items-center justify-between mb-1">
                            <label className="input-label">Comments</label>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative-container" style={{ position: 'relative' }}>
                                <textarea
                                    className="input"
                                    rows={2}
                                    value={newComment}
                                    onChange={handleCommentChange}
                                    placeholder="Write a comment... (Type @ to mention)"
                                    style={{ resize: 'vertical', minHeight: '60px' }}
                                />
                                {showMentionList && filteredUsers.length > 0 && (
                                    <div className="mention-list" style={{ bottom: '100%', left: 0, marginBottom: 5 }}>
                                        {filteredUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="mention-item"
                                                onClick={() => selectUser(user)}
                                            >
                                                <div className="avatar xs">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span>{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ height: 'fit-content', alignSelf: 'flex-end' }}
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                            >
                                <Send size={16} />
                            </button>
                        </div>
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
                                {sprints
                                    .filter(sprint => sprint.state !== 'closed')
                                    .map(sprint => (
                                        <option key={sprint.id} value={sprint.id}>
                                            {sprint.name}{sprint.state === 'active' ? ' (Active)' : ''}
                                        </option>
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
                                value={formData.gameId}
                                onChange={(e) => handleChange('gameId', e.target.value)}
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
                                value={formData.departmentId}
                                onChange={(e) => handleChange('departmentId', e.target.value)}
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

                    {/* Bug-specific: TIS Score & AAB Tracking */}
                    {formData.type === 'bug' && (
                        <div className="bug-fields-section">
                            <h4 className="section-title">
                                <Bug size={16} />
                                Bug Priority (TIS Score)
                            </h4>

                            <TISScoreInput
                                impact={formData.tis_impact}
                                size={formData.tis_size}
                                time={formData.tis_time}
                                onChange={({ impact, size, time }) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        tis_impact: impact,
                                        tis_size: size,
                                        tis_time: time
                                    }))
                                    setIsEditing(true)
                                }}
                            />

                            {/* AAB Version Tracking */}
                            <div className="aab-tracking-grid">
                                <div className="input-group">
                                    <label className="input-label">Found in Build</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., 1.2.3"
                                        value={formData.found_in_build}
                                        onChange={(e) => handleChange('found_in_build', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Fixed in Build</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g., 1.2.4"
                                        value={formData.fixed_in_build}
                                        onChange={(e) => handleChange('fixed_in_build', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Retest Status</label>
                                    <select
                                        className="input select"
                                        value={formData.retest_status}
                                        onChange={(e) => handleChange('retest_status', e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="passed">Passed</option>
                                        <option value="failed">Failed</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {/* Checklist Section */}
                    <div className="checklist-section">
                        <div
                            className="checklist-header"
                            onClick={() => setChecklistExpanded(!checklistExpanded)}
                        >
                            <div className="checklist-title">
                                {checklistExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <ListChecks size={16} />
                                <span>Checklist</span>
                                <span className="checklist-count">
                                    {(currentIssue.checklist || []).filter(i => i.checked).length}/{(currentIssue.checklist || []).length}
                                </span>
                            </div>
                        </div>

                        {checklistExpanded && (
                            <div className="checklist-content">
                                {/* Progress bar */}
                                {(currentIssue.checklist || []).length > 0 && (
                                    <div className="checklist-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${Math.round(
                                                        ((currentIssue.checklist || []).filter(i => i.checked).length /
                                                            (currentIssue.checklist || []).length) * 100
                                                    )}%`
                                                }}
                                            />
                                        </div>
                                        <span className="progress-text">
                                            {Math.round(
                                                ((currentIssue.checklist || []).filter(i => i.checked).length /
                                                    (currentIssue.checklist || []).length) * 100
                                            )}%
                                        </span>
                                    </div>
                                )}

                                {/* Checklist items */}
                                <div className="checklist-list">
                                    {(currentIssue.checklist || []).map(item => (
                                        <div key={item.id} className={`checklist-item ${item.checked ? 'checked' : ''}`}>
                                            <button
                                                className="checklist-checkbox"
                                                onClick={() => updateChecklistItem(issue.id, item.id, { checked: !item.checked })}
                                                aria-label={item.checked ? 'Uncheck item' : 'Check item'}
                                            >
                                                {item.checked && <Check size={12} />}
                                            </button>
                                            <span className="checklist-item-text">{item.text}</span>
                                            <button
                                                className="btn btn-icon btn-ghost btn-sm checklist-item-remove"
                                                onClick={() => removeChecklistItem(issue.id, item.id)}
                                                title="Remove item"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add new item */}
                                <div className="checklist-add">
                                    <input
                                        type="text"
                                        className="input checklist-add-input"
                                        placeholder="Add an item..."
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newChecklistItem.trim()) {
                                                addChecklistItem(issue.id, newChecklistItem)
                                                setNewChecklistItem('')
                                            }
                                        }}
                                    />
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            if (newChecklistItem.trim()) {
                                                addChecklistItem(issue.id, newChecklistItem)
                                                setNewChecklistItem('')
                                            }
                                        }}
                                        disabled={!newChecklistItem.trim()}
                                    >
                                        <Plus size={14} />
                                        Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Work Log Section */}
                    <div className="work-log-section">
                        <div className="work-log-header">
                            <div className="work-log-title">
                                <Clock size={16} />
                                <span>Work Log</span>
                                <span className="work-log-count">
                                    {(currentIssue.workLogs || []).length} entries
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
                        {(currentIssue.workLogs || []).length > 0 && (
                            <div className="work-log-list">
                                {(currentIssue.workLogs || []).map(log => {
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
                        {(currentIssue.workLogs || []).length > 0 && (
                            <div className="work-log-total">
                                Total logged: {(() => {
                                    const totalMinutes = (currentIssue.workLogs || []).reduce((sum, log) => sum + log.timeSpent, 0)
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
                                    {(currentIssue.history || []).length} changes
                                </span>
                            </div>
                        </div>

                        {activityLogExpanded && (
                            <div className="activity-log-content">
                                {(currentIssue.history || []).length === 0 ? (
                                    <div className="activity-log-empty">
                                        No activity recorded yet.
                                    </div>
                                ) : (
                                    <div className="activity-log-list">
                                        {[...(currentIssue.history || [])]
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
                                                                    '{resolveHistoryLabel(entry, 'old')}'
                                                                </span>
                                                                {' to '}
                                                                <span className="activity-log-value new">
                                                                    '{resolveHistoryLabel(entry, 'new')}'
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

            {/* Checklist Warning Modal */}
            {showChecklistWarning && (
                <div className="delete-confirm-overlay" onClick={cancelStatusChange}>
                    <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-confirm-header" style={{ color: 'var(--warning)' }}>
                            <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
                            <h3>Tamamlanmamış Maddeler</h3>
                        </div>
                        <div className="delete-confirm-body">
                            <p>Checklistte tamamlanmayan maddeler var.</p>
                            <p className="delete-note" style={{ marginTop: '8px' }}>
                                {(issue.checklist || []).filter(item => !item.checked).length} tamamlanmamış madde bulunuyor.
                            </p>
                        </div>
                        <div className="delete-confirm-actions">
                            <button className="btn btn-secondary" onClick={cancelStatusChange}>
                                <ListChecks size={14} />
                                Kontrol Et
                            </button>
                            <button className="btn btn-primary" onClick={confirmStatusChange}>
                                <Check size={14} />
                                Devam Et
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
