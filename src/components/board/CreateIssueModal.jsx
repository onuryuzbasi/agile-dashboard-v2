import { useState, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { X, Zap, BookOpen, Bug, CheckSquare, Layers } from 'lucide-react'

const typeOptions = [
    { value: 'epic', label: 'Epic', icon: Zap, color: '#a855f7' },
    { value: 'story', label: 'Story', icon: BookOpen, color: '#22c55e' },
    { value: 'bug', label: 'Bug', icon: Bug, color: '#ef4444' },
    { value: 'task', label: 'Task', icon: CheckSquare, color: '#3b82f6' },
    { value: 'subtask', label: 'Subtask', icon: Layers, color: '#64748b' }
]

const priorityOptions = [
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
        closeCreateModal,
        addIssue,
        users,
        sprints,
        issues
    } = useProjectStore()

    const [formData, setFormData] = useState({
        type: 'story',
        summary: '',
        description: '',
        priority: 'medium',
        assigneeId: '',
        sprintId: '',
        parentId: '',
        storyPoints: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset form when modal opens with default type
    useEffect(() => {
        if (createIssueModalOpen) {
            setFormData(prev => ({
                ...prev,
                type: createIssueDefaultType,
                summary: '',
                description: '',
                priority: 'medium',
                assigneeId: '',
                sprintId: '',
                parentId: '',
                storyPoints: ''
            }))
        }
    }, [createIssueModalOpen, createIssueDefaultType])

    if (!createIssueModalOpen) return null

    const epics = issues.filter(issue => issue.type === 'epic' && !issue.isDeleted)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.summary.trim()) return

        setIsSubmitting(true)

        const newIssue = {
            type: formData.type,
            summary: formData.summary.trim(),
            description: formData.description.trim(),
            priority: formData.priority,
            status: 'todo',
            assigneeId: formData.assigneeId || null,
            sprintId: formData.sprintId || null,
            parentId: formData.type !== 'epic' && formData.parentId ? formData.parentId : null,
            storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
            startDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }

        addIssue(newIssue)
        setIsSubmitting(false)
        closeCreateModal()
    }

    const selectedType = typeOptions.find(t => t.value === formData.type)
    const TypeIcon = selectedType?.icon || BookOpen

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeCreateModal()}>
            <div className="create-issue-modal">
                <div className="modal-header">
                    <div className="modal-title-row">
                        <TypeIcon size={20} style={{ color: selectedType?.color }} />
                        <h2>Create Issue</h2>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={closeCreateModal}>
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
                        />
                    </div>

                    {/* Two Column Layout */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                className="input"
                                value={formData.priority}
                                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                {priorityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Story Points</label>
                            <input
                                type="number"
                                className="input"
                                placeholder="Points"
                                min="0"
                                value={formData.storyPoints}
                                onChange={(e) => setFormData(prev => ({ ...prev, storyPoints: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Assignee</label>
                            <select
                                className="input"
                                value={formData.assigneeId}
                                onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
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
                            >
                                <option value="">None</option>
                                {epics.map(epic => (
                                    <option key={epic.id} value={epic.id}>{epic.key} - {epic.summary}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
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
