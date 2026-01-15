import { useState } from 'react'
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
    Save
} from 'lucide-react'

const typeIcons = {
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    epic: Layers,
    subtask: ListTree
}

const typeOptions = [
    { value: 'story', label: 'Story', color: 'var(--story)' },
    { value: 'bug', label: 'Bug', color: 'var(--bug)' },
    { value: 'task', label: 'Task', color: 'var(--task)' },
    { value: 'epic', label: 'Epic', color: 'var(--epic)' },
    { value: 'subtask', label: 'Subtask', color: 'var(--subtask)' }
]

const priorityOptions = [
    { value: 'highest', label: 'Highest', color: 'var(--priority-highest)' },
    { value: 'high', label: 'High', color: 'var(--priority-high)' },
    { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
    { value: 'low', label: 'Low', color: 'var(--priority-low)' },
    { value: 'lowest', label: 'Lowest', color: 'var(--priority-lowest)' }
]

const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'progress', label: 'In Progress' },
    { value: 'review', label: 'In Review' },
    { value: 'done', label: 'Done' }
]

export default function IssueModal({ issue, onClose }) {
    const { updateIssue, deleteIssue, users, sprints, getUserById } = useProjectStore()

    const [formData, setFormData] = useState({
        summary: issue.summary,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId || '',
        sprintId: issue.sprintId || '',
        storyPoints: issue.storyPoints || ''
    })

    const [isEditing, setIsEditing] = useState(false)

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsEditing(true)
    }

    const handleSave = () => {
        updateIssue(issue.id, {
            ...formData,
            storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null
        })
        setIsEditing(false)
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this issue?')) {
            deleteIssue(issue.id)
            onClose()
        }
    }

    const TypeIcon = typeIcons[formData.type] || CheckSquare
    const assignee = formData.assigneeId ? getUserById(formData.assigneeId) : null
    const currentSprint = formData.sprintId
        ? sprints.find(s => s.id === formData.sprintId)
        : null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
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
                            rows={4}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a description..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Grid of fields */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 'var(--space-4)'
                    }}>
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

                        {/* Story Points */}
                        <div className="input-group">
                            <label className="input-label">Story Points</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="100"
                                value={formData.storyPoints}
                                onChange={(e) => handleChange('storyPoints', e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Labels */}
                    {issue.labels && issue.labels.length > 0 && (
                        <div className="mt-4">
                            <label className="input-label mb-2">Labels</label>
                            <div className="flex gap-2 flex-wrap">
                                {issue.labels.map(label => (
                                    <span
                                        key={label}
                                        className="badge"
                                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                                    >
                                        <Tag size={12} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
        </div>
    )
}
