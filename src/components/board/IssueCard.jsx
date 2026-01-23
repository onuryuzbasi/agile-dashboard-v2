import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProjectStore } from '../../stores/projectStore'
import {
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Gamepad2,
    Building2,
    Calendar,
    ListChecks
} from 'lucide-react'

const typeIcons = {
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    epic: Layers,
    subtask: ListTree
}

const priorityConfig = {
    highest: { icon: ArrowUp, color: 'var(--priority-highest)', label: 'Highest' },
    high: { icon: ArrowUp, color: 'var(--priority-high)', label: 'High' },
    medium: { icon: Minus, color: 'var(--priority-medium)', label: 'Medium' },
    low: { icon: ArrowDown, color: 'var(--priority-low)', label: 'Low' },
    lowest: { icon: ArrowDown, color: 'var(--priority-lowest)', label: 'Lowest' }
}

export default function IssueCard({ issue, isDragging = false }) {
    const {
        setSelectedIssue,
        getUserById,
        cardFieldVisibility,
        games,
        departments,
        fieldConfig
    } = useProjectStore()

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({ id: issue.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const TypeIcon = typeIcons[issue.type] || CheckSquare
    const PriorityIcon = priorityConfig[issue.priority]?.icon || Minus
    const priorityColor = priorityConfig[issue.priority]?.color || 'var(--text-tertiary)'
    const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null

    // Get game and department names
    const game = issue.gameId ? games?.find(g => g.id === issue.gameId) : null
    const department = issue.departmentId ? departments?.find(d => d.id === issue.departmentId) : null

    // Get status config for display
    const statusConfig = fieldConfig?.statuses?.find(s => s.key === issue.status)

    const handleClick = (e) => {
        // Don't open modal if dragging
        if (!isSortableDragging && !isDragging) {
            setSelectedIssue(issue)
        }
    }

    // Format due date
    const formatDueDate = (dateStr) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        const now = new Date()
        const isOverdue = date < now && issue.status !== 'done'
        const month = date.toLocaleDateString('en-US', { month: 'short' })
        const day = date.getDate()
        return { text: `${month} ${day}`, isOverdue }
    }

    const dueDate = formatDueDate(issue.dueDate)

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`issue-card ${isSortableDragging || isDragging ? 'dragging' : ''}`}
            onClick={handleClick}
        >
            {/* Header with type icon and key */}
            <div className="issue-card-header">
                <div className={`issue-type-icon ${issue.type}`}>
                    <TypeIcon size={10} />
                </div>
                <span className="issue-key">{issue.key}</span>
            </div>

            {/* Title */}
            <div className="issue-title">{issue.summary}</div>

            {/* Labels */}
            {cardFieldVisibility?.labels && issue.labels?.length > 0 && (
                <div className="issue-card-labels">
                    {issue.labels.slice(0, 3).map((label, idx) => (
                        <span key={idx} className="issue-label-mini">
                            {typeof label === 'string' ? label : label.name}
                        </span>
                    ))}
                    {issue.labels.length > 3 && (
                        <span className="issue-label-more">+{issue.labels.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer with meta info */}
            <div className="issue-card-footer">
                <div className="issue-meta">
                    {/* Status Badge */}
                    {cardFieldVisibility?.status && statusConfig && (
                        <span
                            className="issue-status-mini"
                            style={{
                                backgroundColor: statusConfig.bgColor,
                                color: statusConfig.textColor
                            }}
                        >
                            {statusConfig.label}
                        </span>
                    )}

                    {/* Priority */}
                    {cardFieldVisibility?.priority && (
                        <span
                            className="tooltip"
                            data-tooltip={priorityConfig[issue.priority]?.label}
                            style={{ color: priorityColor }}
                        >
                            <PriorityIcon size={14} />
                        </span>
                    )}

                    {/* Story Points - Always show when set */}
                    {issue.storyPoints && (
                        <span className="story-points">{issue.storyPoints}</span>
                    )}

                    {/* Due Date */}
                    {cardFieldVisibility?.dueDate && dueDate && (
                        <span className={`issue-due-mini ${dueDate.isOverdue ? 'overdue' : ''}`}>
                            <Calendar size={12} />
                            {dueDate.text}
                        </span>
                    )}

                    {/* Department */}
                    {cardFieldVisibility?.department && department && (
                        <span className="issue-dept-mini tooltip" data-tooltip={department.name}>
                            <Building2 size={12} />
                            <span>{department.code || department.name.substring(0, 3)}</span>
                        </span>
                    )}

                    {/* Game */}
                    {cardFieldVisibility?.game && game && (
                        <span className="issue-game-mini tooltip" data-tooltip={game.name}>
                            <Gamepad2 size={12} />
                            <span>{game.code || game.name.substring(0, 3)}</span>
                        </span>
                    )}

                    {/* Checklist Progress */}
                    {cardFieldVisibility?.checklist && issue.checklist?.length > 0 && (
                        <div className="issue-checklist-mini">
                            <ListChecks size={12} />
                            <div className="checklist-mini-bar">
                                <div
                                    className="checklist-mini-fill"
                                    style={{
                                        width: `${(issue.checklist.filter(i => i.checked).length / issue.checklist.length) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="checklist-mini-count">
                                {issue.checklist.filter(i => i.checked).length}/{issue.checklist.length}
                            </span>
                        </div>
                    )}
                </div>

                {/* Assignee */}
                {cardFieldVisibility?.assignee && assignee && (
                    <div className="avatar sm" title={assignee.name}>
                        {assignee.avatar ? (
                            <img src={assignee.avatar} alt={assignee.name} />
                        ) : (
                            assignee.name.charAt(0)
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
