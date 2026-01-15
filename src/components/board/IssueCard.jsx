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
    Minus
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
    const { setSelectedIssue, getUserById } = useProjectStore()

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

    const handleClick = (e) => {
        // Don't open modal if dragging
        if (!isSortableDragging && !isDragging) {
            setSelectedIssue(issue)
        }
    }

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

            {/* Footer with meta info */}
            <div className="issue-card-footer">
                <div className="issue-meta">
                    {/* Priority */}
                    <span
                        className="tooltip"
                        data-tooltip={priorityConfig[issue.priority]?.label}
                        style={{ color: priorityColor }}
                    >
                        <PriorityIcon size={14} />
                    </span>

                    {/* Story Points */}
                    {issue.storyPoints && (
                        <span className="story-points">{issue.storyPoints}</span>
                    )}
                </div>

                {/* Assignee */}
                {assignee && (
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
