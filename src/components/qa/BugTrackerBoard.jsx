import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    AlertCircle,
    User,
    Clock,
    ArrowRight,
    MoreHorizontal
} from 'lucide-react'

export default function BugTrackerBoard({ bugs, bugStatuses, users }) {
    const { updateIssue, calculateTISScore, setSelectedIssue } = useProjectStore()

    // Define bug columns (simplified from 9 statuses)
    const columns = [
        { key: 'new', label: 'New', statuses: ['new'] },
        { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed', 'assigned'] },
        { key: 'in_dev', label: 'In Dev', statuses: ['in_dev'] },
        { key: 'retest', label: 'Retest', statuses: ['ready_retest', 'retesting'] },
        { key: 'closed', label: 'Closed', statuses: ['passed', 'failed', 'closed'] }
    ]

    // Get bugs for a column
    const getBugsForColumn = (columnStatuses) => {
        return bugs
            .filter(bug => columnStatuses.includes(bug.status) || columnStatuses.includes(bug.retestStatus))
            .sort((a, b) => {
                // Sort by TIS score (higher first)
                const scoreA = calculateTISScore(a)
                const scoreB = calculateTISScore(b)
                return scoreB - scoreA
            })
    }

    // Get TIS score display
    const getTISDisplay = (bug) => {
        const score = calculateTISScore(bug)
        let color = 'var(--color-success)'
        let label = 'Low'

        if (score >= 6) {
            color = 'var(--color-error)'
            label = 'Critical'
        } else if (score >= 3) {
            color = 'var(--color-warning)'
            label = 'Medium'
        }

        return { score, color, label }
    }

    // Get user by ID
    const getUserById = (userId) => {
        return users.find(u => u.id === userId)
    }

    // Handle drag start
    const handleDragStart = (e, bugId) => {
        e.dataTransfer.setData('bugId', bugId)
    }

    // Handle drop
    const handleDrop = async (e, targetStatus) => {
        e.preventDefault()
        const bugId = e.dataTransfer.getData('bugId')
        if (bugId) {
            await updateIssue(bugId, { status: targetStatus })
        }
    }

    // Handle drag over
    const handleDragOver = (e) => {
        e.preventDefault()
    }

    // Handle click to open bug details
    const handleBugClick = (bug) => {
        setSelectedIssue(bug)
    }

    if (bugs.length === 0) {
        return (
            <div className="qa-empty-state">
                <div className="qa-empty-icon">🎉</div>
                <h3>Hiç Bug Yok!</h3>
                <p>Tüm testler geçti veya henüz bug kaydedilmedi.</p>
            </div>
        )
    }

    return (
        <div className="bug-tracker-board">
            {columns.map(column => {
                const columnBugs = getBugsForColumn(column.statuses)

                return (
                    <div
                        key={column.key}
                        className="bug-column"
                        onDrop={(e) => handleDrop(e, column.statuses[0])}
                        onDragOver={handleDragOver}
                    >
                        {/* Column Header */}
                        <div className="bug-column-header">
                            <span className="bug-column-title">{column.label}</span>
                            <span className="bug-column-count">{columnBugs.length}</span>
                        </div>

                        {/* Bug Cards */}
                        <div className="bug-column-content">
                            {columnBugs.map(bug => {
                                const tis = getTISDisplay(bug)
                                const assignee = getUserById(bug.assigneeId)

                                return (
                                    <div
                                        key={bug.id}
                                        className="bug-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, bug.id)}
                                        onClick={() => handleBugClick(bug)}
                                    >
                                        {/* Header */}
                                        <div className="bug-card-header">
                                            <span className="bug-key">{bug.key}</span>
                                            <span
                                                className="tis-badge"
                                                style={{ backgroundColor: tis.color }}
                                                title={`TIS: ${tis.score} (${tis.label})`}
                                            >
                                                {tis.score}
                                            </span>
                                        </div>

                                        {/* Summary */}
                                        <div className="bug-card-summary">
                                            {bug.summary}
                                        </div>

                                        {/* Footer */}
                                        <div className="bug-card-footer">
                                            {/* AAB Version */}
                                            {bug.foundInBuild && (
                                                <span className="bug-build-tag">
                                                    v{bug.foundInBuild}
                                                </span>
                                            )}

                                            {/* Assignee */}
                                            {assignee && (
                                                <div className="bug-assignee" title={assignee.name}>
                                                    {assignee.avatar ? (
                                                        <img src={assignee.avatar} alt={assignee.name} />
                                                    ) : (
                                                        <User size={14} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
