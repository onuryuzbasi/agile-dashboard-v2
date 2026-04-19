import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

export default function SprintEditModal({ sprint, onClose }) {
    const { updateSprint } = useProjectStore()

    const [name, setName] = useState(sprint?.name || '')
    const [goal, setGoal] = useState(sprint?.goal || '')
    const [startDate, setStartDate] = useState(sprint?.startDate?.split('T')[0] || '')
    const [endDate, setEndDate] = useState(sprint?.endDate?.split('T')[0] || '')
    const [saving, setSaving] = useState(false)

    // Reset form when sprint changes
    useEffect(() => {
        if (sprint) {
            setName(sprint.name || '')
            setGoal(sprint.goal || '')
            setStartDate(sprint.startDate?.split('T')[0] || '')
            setEndDate(sprint.endDate?.split('T')[0] || '')
        }
    }, [sprint])

    if (!sprint) return null

    const handleSave = async () => {
        if (!name.trim()) return

        setSaving(true)
        await updateSprint(sprint.id, {
            name: name.trim(),
            goal: goal.trim(),
            startDate: startDate ? new Date(startDate).toISOString() : sprint.startDate,
            endDate: endDate ? new Date(endDate).toISOString() : sprint.endDate
        })
        setSaving(false)
        onClose()
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="sprint-edit-modal">
                <div className="sprint-edit-modal-header">
                    <h2>Edit Sprint</h2>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="sprint-edit-modal-body">
                    {/* Sprint Name */}
                    <div className="form-group">
                        <label htmlFor="sprint-name">Sprint Name</label>
                        <input
                            id="sprint-name"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Sprint name"
                            autoFocus
                        />
                    </div>

                    {/* Sprint Goal */}
                    <div className="form-group">
                        <label htmlFor="sprint-goal">Sprint Goal</label>
                        <textarea
                            id="sprint-goal"
                            className="form-textarea"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="What is the goal of this sprint?"
                            rows={3}
                        />
                    </div>

                    {/* Date Range */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="sprint-start">
                                <Calendar size={14} />
                                Start Date
                            </label>
                            <input
                                id="sprint-start"
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="sprint-end">
                                <Calendar size={14} />
                                End Date
                            </label>
                            <input
                                id="sprint-end"
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="sprint-edit-modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}
