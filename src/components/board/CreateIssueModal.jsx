import { useState, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { X, Zap, BookOpen, Bug, CheckSquare, Layers } from 'lucide-react'
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

    const [formData, setFormData] = useState({
        type: 'story',
        summary: '',
        description: '',
        priority: 'medium',
        assigneeId: '',
        reporterId: '',
        sprintId: '',
        parentId: '',
        status: 'todo',
        departmentId: '',
        gameId: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Default reporter to first user (or could be current logged-in user)
    const defaultReporterId = users?.[0]?.id || ''

    // Reset form when modal opens with default type and context defaults
    useEffect(() => {
        if (createIssueModalOpen) {
            // Debug logging as requested
            console.log('📋 CreateIssueModal - Applying Defaults from Filters:', {
                createIssueDefaultType,
                createIssueDefaults
            })

            // Determine type: use defaults.type if set, otherwise use createIssueDefaultType, fallback to 'story'
            const resolvedType = createIssueDefaults?.type || createIssueDefaultType || 'story'

            const newFormData = {
                type: resolvedType,
                summary: '',
                description: '',
                priority: createIssueDefaults?.priority || 'medium',
                assigneeId: createIssueDefaults?.assigneeId || '',
                reporterId: defaultReporterId,
                sprintId: createIssueDefaults?.sprintId || '',
                parentId: createIssueDefaults?.epicId || '',
                // NEW: Status from filters (for inline create status alignment)
                status: createIssueDefaults?.status || 'todo',
                // NEW: Department and Game from filters
                departmentId: createIssueDefaults?.departmentId || '',
                gameId: createIssueDefaults?.gameId || ''
            }

            console.log('✅ CreateIssueModal - Form initialized with:', newFormData)
            setFormData(newFormData)
        }
    }, [createIssueModalOpen, createIssueDefaultType, createIssueDefaults, defaultReporterId])

    if (!createIssueModalOpen) return null

    const epics = issues.filter(issue => issue.type === 'epic' && !issue.isDeleted)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.summary.trim()) return

        setIsSubmitting(true)

        try {
            const newIssue = {
                type: formData.type,
                summary: formData.summary.trim(),
                description: formData.description.trim(),
                priority: formData.priority,
                status: formData.status || 'todo', // Use form status from filter defaults
                assigneeId: formData.assigneeId || null,
                reporterId: formData.reporterId || null,
                sprintId: formData.sprintId || null,
                parentId: formData.type !== 'epic' && formData.parentId ? formData.parentId : null,
                departmentId: formData.departmentId || null,
                gameId: formData.gameId || null,
                startDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }

            // Await the async addIssue call
            await addIssue(newIssue)

            // Close modal after successful creation
            closeCreateIssueModal()
        } catch (error) {
            console.error('Failed to create issue:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!isSubmitting) {
            closeCreateIssueModal()
        }
    }

    const selectedType = typeOptions.find(t => t.value === formData.type)
    const TypeIcon = selectedType?.icon || BookOpen

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

                    {/* Two Column Layout: Priority & Reporter */}
                    <div className="form-row">
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
                    </div>

                    <div className="form-row">
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
                    </div>

                    {/* Parent Epic (only for non-epics) */}
                    {formData.type !== 'epic' && (
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
                    )}

                    {/* Department and Game Row */}
                    <div className="form-row">
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
                    </div>

                    {/* Actions */}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!formData.summary.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Issue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
