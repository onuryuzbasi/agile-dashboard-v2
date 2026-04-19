import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import IssueCard from './IssueCard'

export default function KanbanColumn({ id, status, issues, fieldConfig, compact = false }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id || status
    })

    // Get config from fieldConfig prop (dynamic from Settings)
    const statusData = fieldConfig?.statuses?.find(s => s.key === status) || {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        bgColor: '#64748b',
        textColor: '#ffffff'
    }

    return (
        <div
            ref={setNodeRef}
            className={`kanban-column ${status} ${isOver ? 'drag-over' : ''} ${compact ? 'compact' : ''} animate-fade-in-up`}
            style={{
                '--column-color': statusData.bgColor
            }}
        >
            {/* Only show column header in non-compact (non-swimlane) mode */}
            {!compact && (
                <div className="kanban-column-header">
                    <div className="kanban-column-title">
                        <span
                            className="kanban-column-label"
                            style={{
                                backgroundColor: statusData.bgColor,
                                color: statusData.textColor
                            }}
                        >
                            {statusData.label}
                        </span>
                    </div>
                    <span className="kanban-column-count">{issues.length}</span>
                </div>
            )}

            <div className="kanban-column-body">
                <SortableContext
                    items={issues.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {issues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))}
                </SortableContext>

                {issues.length === 0 && (
                    <div className="kanban-column-empty">
                        No issues
                    </div>
                )}
            </div>
        </div>
    )
}
