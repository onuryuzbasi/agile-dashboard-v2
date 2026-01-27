import { useState, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Link2,
    Bug
} from 'lucide-react'

export default function TestCaseModal({ testCase, suiteId, issues, onClose }) {
    const { addTestCase, updateTestCase, addIssue } = useProjectStore()

    const isEditing = !!testCase

    // Form state
    const [title, setTitle] = useState(testCase?.title || '')
    const [steps, setSteps] = useState(testCase?.steps || [])
    const [status, setStatus] = useState(testCase?.status || 'pending')
    const [linkedIssueIds, setLinkedIssueIds] = useState(testCase?.linkedIssueIds || [])
    const [notes, setNotes] = useState(testCase?.notes || '')
    const [isSaving, setIsSaving] = useState(false)

    // Add new step
    const handleAddStep = () => {
        setSteps([...steps, {
            step: steps.length + 1,
            action: '',
            expected: ''
        }])
    }

    // Update step
    const handleUpdateStep = (index, field, value) => {
        const newSteps = [...steps]
        newSteps[index] = { ...newSteps[index], [field]: value }
        setSteps(newSteps)
    }

    // Remove step
    const handleRemoveStep = (index) => {
        const newSteps = steps.filter((_, i) => i !== index)
        // Re-number steps
        newSteps.forEach((step, i) => step.step = i + 1)
        setSteps(newSteps)
    }

    // Toggle issue link
    const handleToggleIssue = (issueId) => {
        if (linkedIssueIds.includes(issueId)) {
            setLinkedIssueIds(linkedIssueIds.filter(id => id !== issueId))
        } else {
            setLinkedIssueIds([...linkedIssueIds, issueId])
        }
    }

    // Save test case
    const handleSave = async () => {
        if (!title.trim()) {
            alert('Test case başlığı gerekli!')
            return
        }

        setIsSaving(true)
        try {
            if (isEditing) {
                await updateTestCase(testCase.id, {
                    title,
                    steps,
                    status,
                    linkedIssueIds,
                    notes
                })
            } else {
                await addTestCase({
                    suiteId,
                    title,
                    steps,
                    linkedIssueIds,
                    notes
                })
            }
            onClose()
        } catch (error) {
            console.error('Failed to save test case:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Create bug from failed test
    const handleCreateBug = async () => {
        const bugSummary = `[BUG] ${title} - Test Failed`
        const bugDescription = `Bu bug, test case "${title}" başarısız olduğunda otomatik oluşturuldu.\n\nTest Steps:\n${steps.map(s => `${s.step}. ${s.action} → ${s.expected}`).join('\n')}\n\nNotes: ${notes}`

        const newBug = await addIssue({
            type: 'bug',
            summary: bugSummary,
            description: bugDescription,
            status: 'todo',
            priority: 'high'
        })

        if (newBug) {
            await updateTestCase(testCase.id, { foundBugId: newBug.id })
            alert(`Bug oluşturuldu: ${newBug.key}`)
        }
    }

    // Get status options
    const statusOptions = [
        { value: 'pending', label: 'Pending', icon: Clock, color: 'var(--color-text-tertiary)' },
        { value: 'passed', label: 'Passed', icon: CheckCircle2, color: 'var(--color-success)' },
        { value: 'failed', label: 'Failed', icon: XCircle, color: 'var(--color-error)' },
        { value: 'blocked', label: 'Blocked', icon: AlertCircle, color: 'var(--color-warning)' }
    ]

    // Filter issues that can be linked (stories, tasks, not bugs)
    const linkableIssues = issues.filter(i =>
        !i.isDeleted &&
        i.type !== 'bug' &&
        i.type !== 'subtask'
    ).slice(0, 20) // Limit for performance

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>{isEditing ? 'Edit Test Case' : 'New Test Case'}</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="modal-content test-case-modal-content">
                    {/* Title */}
                    <div className="form-group">
                        <label className="form-label">Test Case Title *</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Login with valid credentials"
                            autoFocus
                        />
                    </div>

                    {/* Status */}
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <div className="status-toggle-group">
                            {statusOptions.map(opt => {
                                const Icon = opt.icon
                                return (
                                    <button
                                        key={opt.value}
                                        className={`status-toggle ${status === opt.value ? 'active' : ''}`}
                                        onClick={() => setStatus(opt.value)}
                                        style={status === opt.value ? { borderColor: opt.color, color: opt.color } : {}}
                                    >
                                        <Icon size={16} />
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="form-group">
                        <label className="form-label">Test Steps</label>
                        <div className="test-steps-editor">
                            {steps.map((step, index) => (
                                <div key={index} className="test-step-row">
                                    <span className="step-number">{step.step}</span>
                                    <input
                                        type="text"
                                        className="input step-action"
                                        value={step.action}
                                        onChange={e => handleUpdateStep(index, 'action', e.target.value)}
                                        placeholder="Action (e.g., Click login button)"
                                    />
                                    <span className="step-arrow">→</span>
                                    <input
                                        type="text"
                                        className="input step-expected"
                                        value={step.expected}
                                        onChange={e => handleUpdateStep(index, 'expected', e.target.value)}
                                        placeholder="Expected result"
                                    />
                                    <button
                                        className="btn-icon btn-danger"
                                        onClick={() => handleRemoveStep(index)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={handleAddStep}
                            >
                                <Plus size={14} /> Add Step
                            </button>
                        </div>
                    </div>

                    {/* Linked Issues */}
                    <div className="form-group">
                        <label className="form-label">
                            <Link2 size={14} /> Linked Issues
                        </label>
                        <div className="linked-issues-grid">
                            {linkableIssues.map(issue => (
                                <label key={issue.id} className="linked-issue-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={linkedIssueIds.includes(issue.id)}
                                        onChange={() => handleToggleIssue(issue.id)}
                                    />
                                    <span className="issue-key">{issue.key}</span>
                                    <span className="issue-summary">{issue.summary}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Notes</label>
                        <textarea
                            className="input textarea"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Additional notes or observations..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {isEditing && status === 'failed' && (
                        <button
                            className="btn btn-danger"
                            onClick={handleCreateBug}
                        >
                            <Bug size={16} /> Create Bug
                        </button>
                    )}
                    <div className="flex-1" />
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    )
}
