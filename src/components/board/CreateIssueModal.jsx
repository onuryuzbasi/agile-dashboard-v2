import { useState, useEffect, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { X, Zap, BookOpen, Bug, CheckSquare, Layers, Plus } from 'lucide-react'
import { getIconByName } from '../../config/fieldConfig'

// Fallback options if fieldConfig not loaded yet
const fallbackTypeOptions = [
    { value: 'epic', label: 'Epic', icon: Zap, color: '#a855f7' },
    { value: 'story', label: 'Story', icon: BookOpen, color: '#22c55e' },
    { value: 'bug', label: 'Bug', icon: Bug, color: '#ef4444' },
    { value: 'task', label: 'Task', icon: CheckSquare, color: '#3b82f6' },
    { value: 'subtask', label: 'Subtask', icon: Layers, color: '#64748b' }
]

const fallbackPriorityOptions = [
    { value: 'highest', label: 'Highest' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'lowest', label: 'Lowest' }
]

// Child issue type options for batch creation
const childTypeOptions = [
    { value: 'story', label: 'Story' },
    { value: 'task', label: 'Task' },
    { value: 'bug', label: 'Bug' }
]

export default function CreateIssueModal() {
    const {
        createIssueModalOpen,
        createIssueDefaultType,
        createIssueDefaults,
        closeCreateIssueModal,
        addIssue,
        users,
        sprints,
        issues,
        fieldConfig,
        departments,
        games
    } = useProjectStore()

    // Build dynamic options from fieldConfig (Supabase) or use fallbacks
    const typeOptions = (fieldConfig.issueTypes?.length > 0)
        ? fieldConfig.issueTypes.map(t => ({
            value: t.key,
            label: t.label,
            icon: getIconByName(t.icon, CheckSquare),
            color: t.color || t.bgColor || '#64748b'
        }))
        : fallbackTypeOptions

    const priorityOptions = (fieldConfig.priorities?.length > 0)
        ? fieldConfig.priorities.map(p => ({
            value: p.key,
            label: p.label
        }))
        : fallbackPriorityOptions

    // Status options from fieldConfig
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

    const [formData, setFormData] = useState({
        type: 'story',
        summary: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        reporterId: '',
        assigneeId: '',
        sprintId: '',
        originalEstimate: '',
        gameId: '',
        parentId: '',
        departmentId: '',
        startDate: '',
        dueDate: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submittingStatus, setSubmittingStatus] = useState('')

    // Draft children for batch Epic creation
    const [draftChildren, setDraftChildren] = useState([])
    const [newChildSummary, setNewChildSummary] = useState('')
    const [newChildType, setNewChildType] = useState('story')
    const [newChildAssigneeId, setNewChildAssigneeId] = useState('')

    // Default reporter to first user (or could be current logged-in user)
    const defaultReporterId = users?.[0]?.id || ''

    // Reset form when modal opens with default type and context defaults
    useEffect(() => {
        if (createIssueModalOpen) {
            // Determine type: use defaults.type if set, otherwise use createIssueDefaultType, fallback to 'story'
            const resolvedType = createIssueDefaults?.type || createIssueDefaultType || 'story'

            const newFormData = {
                type: resolvedType,
                summary: '',
                description: '',
                status: createIssueDefaults?.status || 'todo',
                priority: createIssueDefaults?.priority || 'medium',
                reporterId: defaultReporterId,
                assigneeId: createIssueDefaults?.assigneeId || '',
                sprintId: createIssueDefaults?.sprintId || '',
                originalEstimate: '',
                gameId: createIssueDefaults?.gameId || '',
                parentId: createIssueDefaults?.epicId || '',
                departmentId: createIssueDefaults?.departmentId || '',
                startDate: '',
                dueDate: ''
            }

            setFormData(newFormData)
            // Reset draft children when modal opens
            setDraftChildren([])
            setNewChildSummary('')
            setNewChildType('story')
            setNewChildAssigneeId('')
        }
    }, [createIssueModalOpen, createIssueDefaultType, createIssueDefaults, defaultReporterId])

    if (!createIssueModalOpen) return null

    const epics = issues.filter(issue => issue.type === 'epic' && !issue.isDeleted)

    // Add child to draft list with type and assignee
    const handleAddDraftChild = () => {
        if (!newChildSummary.trim()) return

        setDraftChildren(prev => [...prev, {
            id: Date.now(), // Temporary ID for key
            summary: newChildSummary.trim(),
            type: newChildType,
            assigneeId: newChildAssigneeId || null
        }])
        setNewChildSummary('')
        // Keep type and assignee for quick sequential adds
    }

    // Remove child from draft list
    const handleRemoveDraftChild = (id) => {
        setDraftChildren(prev => prev.filter(child => child.id !== id))
    }

    // Get assignee name for display
    const getAssigneeName = (assigneeId) => {
        if (!assigneeId) return null
        const user = users.find(u => u.id === assigneeId)
        return user?.name || null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.summary.trim()) return

        setIsSubmitting(true)

        try {
            // Step 1: Create the parent issue
            const isEpic = formData.type === 'epic'
            const hasChildren = isEpic && draftChildren.length > 0

            if (hasChildren) {
                setSubmittingStatus(`Creating Epic...`)
            }

            const newIssue = {
                type: formData.type,
                summary: formData.summary.trim(),
                description: formData.description.trim(),
                status: formData.status || 'todo',
                priority: formData.priority,
                assigneeId: formData.assigneeId || null,
                reporterId: formData.reporterId || null,
                sprintId: formData.sprintId || null,
                parentId: formData.type !== 'epic' && formData.parentId ? formData.parentId : null,
                departmentId: formData.departmentId || null,
                gameId: formData.gameId || null,
                originalEstimate: formData.originalEstimate ? parseInt(formData.originalEstimate) : null,
                startDate: formData.startDate || null,
                dueDate: formData.dueDate || null
            }

            // Await the async addIssue call and get the created Epic
            const createdIssue = await addIssue(newIssue)

            // Step 2: If Epic with children, create child issues
            if (hasChildren && createdIssue?.id) {
                const totalChildren = draftChildren.length

                for (let i = 0; i < draftChildren.length; i++) {
                    const child = draftChildren[i]
                    setSubmittingStatus(`Creating child ${i + 1} of ${totalChildren}...`)

                    await addIssue({
                        type: child.type,
                        summary: child.summary,
                        description: '',
                        status: 'todo',
                        priority: 'medium',
                        parentId: createdIssue.id,
                        sprintId: formData.sprintId || null, // Inherit from Epic
                        assigneeId: child.assigneeId, // Use child's assignee
                        reporterId: formData.reporterId || null,
                        departmentId: formData.departmentId || null,
                        gameId: formData.gameId || null
                    })
                }
            }

            // Close modal ONLY after successful creation
            closeCreateIssueModal()
        } catch (error) {
            console.error('Failed to create issue:', error)
            // Don't close modal on error - let user retry
        } finally {
            setIsSubmitting(false)
            setSubmittingStatus('')
        }
    }

    // Handle close - strictly NO state changes, just close the modal
    const handleClose = () => {
        if (!isSubmitting) {
            // Simply close the modal - no side effects
            closeCreateIssueModal()
        }
    }

    const selectedType = typeOptions.find(t => t.value === formData.type)
    const TypeIcon = selectedType?.icon || BookOpen
    const isEpic = formData.type === 'epic'

    // Calculate button text
    const getSubmitButtonText = () => {
        if (isSubmitting) {
            return submittingStatus || 'Creating...'
        }
        if (isEpic && draftChildren.length > 0) {
            return `Create Epic + ${draftChildren.length} Child${draftChildren.length > 1 ? 'ren' : ''}`
        }
        return 'Create Issue'
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
            <div className="create-issue-modal">
                <div className="modal-header">
                    <div className="modal-title-row">
                        <TypeIcon size={20} style={{ color: selectedType?.color }} />
                        <h2>Create Issue</h2>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={handleClose} disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="create-issue-form">
                    {/* Type Selector */}
                    <div className="form-group">
                        <label>Issue Type</label>
                        <div className="type-selector">
                            {typeOptions.map(opt => {
                                const Icon = opt.icon
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        className={`type-option ${formData.type === opt.value ? 'selected' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, type: opt.value }))}
                                        style={{ '--type-color': opt.color }}
                                        disabled={isSubmitting}
                                    >
                                        <Icon size={16} />
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="form-group">
                        <label>Summary *</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="What needs to be done?"
                            value={formData.summary}
                            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="input"
                            placeholder="Add more details..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Row 1: Status & Priority */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="input"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                className="input"
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                {priorityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Reporter & Assignee */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Reporter</label>
                            <select
                                className="input"
                                value={formData.reporterId}
                                onChange={(e) => setFormData(prev => ({ ...prev, reporterId: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="">Select Reporter</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assignee</label>
                            <select
                                className="input"
                                value={formData.assigneeId}
                                onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Sprint & Original Estimate */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Sprint</label>
                            <select
                                className="input"
                                value={formData.sprintId}
                                onChange={(e) => setFormData(prev => ({ ...prev, sprintId: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="">Backlog</option>
                                {sprints.map(sprint => (
                                    <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Original Estimate (hours)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                placeholder="0"
                                value={formData.originalEstimate}
                                onChange={(e) => setFormData(prev => ({ ...prev, originalEstimate: e.target.value }))}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Row 4: Game & Parent Epic / Department */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Game</label>
                            <select
                                className="input"
                                value={formData.gameId}
                                onChange={(e) => setFormData(prev => ({ ...prev, gameId: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="">No Game</option>
                                {(games || []).map(game => (
                                    <option key={game.id} value={game.id}>{game.name}</option>
                                ))}
                            </select>
                        </div>

                        {!isEpic ? (
                            <div className="form-group">
                                <label>Parent Epic</label>
                                <select
                                    className="input"
                                    value={formData.parentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                    disabled={isSubmitting}
                                >
                                    <option value="">None</option>
                                    {epics.map(epic => (
                                        <option key={epic.id} value={epic.id}>{epic.key} - {epic.summary}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Department</label>
                                <select
                                    className="input"
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                    disabled={isSubmitting}
                                >
                                    <option value="">No Department</option>
                                    {(departments || []).map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Row 5: Department (for non-epics) */}
                    {!isEpic && (
                        <div className="form-group">
                            <label>Department</label>
                            <select
                                className="input"
                                value={formData.departmentId}
                                onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="">No Department</option>
                                {(departments || []).map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Row 6: Start Date & Due Date */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.startDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="form-group">
                            <label>Due Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.dueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Batch Child Issues Section - Only for Epics */}
                    {isEpic && (
                        <div className="batch-children-section">
                            <label className="batch-children-label">
                                Child Issues
                                {draftChildren.length > 0 && (
                                    <span className="batch-children-count">{draftChildren.length}</span>
                                )}
                            </label>

                            {/* Add child input row - 3 fields: Type, Summary, Assignee */}
                            <div className="batch-children-input-row">
                                <select
                                    className="input batch-child-type-select"
                                    value={newChildType}
                                    onChange={(e) => setNewChildType(e.target.value)}
                                    disabled={isSubmitting}
                                    title="Issue Type"
                                >
                                    {childTypeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className="input batch-child-summary-input"
                                    placeholder="Child issue summary..."
                                    value={newChildSummary}
                                    onChange={(e) => setNewChildSummary(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddDraftChild()
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                                <select
                                    className="input batch-child-assignee-select"
                                    value={newChildAssigneeId}
                                    onChange={(e) => setNewChildAssigneeId(e.target.value)}
                                    disabled={isSubmitting}
                                    title="Assignee"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn btn-icon btn-secondary batch-child-add-btn"
                                    onClick={handleAddDraftChild}
                                    disabled={isSubmitting || !newChildSummary.trim()}
                                    title="Add child issue"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Draft children list */}
                            {draftChildren.length > 0 && (
                                <div className="batch-children-list">
                                    {draftChildren.map((child) => (
                                        <div key={child.id} className="batch-child-item">
                                            <span className={`batch-child-type-badge ${child.type}`}>
                                                {child.type}
                                            </span>
                                            <span className="batch-child-summary">{child.summary}</span>
                                            {getAssigneeName(child.assigneeId) && (
                                                <span className="batch-child-assignee">
                                                    {getAssigneeName(child.assigneeId)}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-ghost batch-child-remove-btn"
                                                onClick={() => handleRemoveDraftChild(child.id)}
                                                disabled={isSubmitting}
                                                title="Remove"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions - NO Delete button in Create mode */}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!formData.summary.trim() || isSubmitting}
                        >
                            {getSubmitButtonText()}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
