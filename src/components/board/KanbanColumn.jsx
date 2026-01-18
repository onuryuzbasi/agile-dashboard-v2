import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import IssueCard from './IssueCard'

export default function KanbanColumn({ status, issues, fieldConfig }) {
    const { setNodeRef, isOver } = useDroppable({
        id: status
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
            className={`kanban-column ${status} ${isOver ? 'drag-over' : ''}`}
            style={{
                '--column-color': statusData.bgColor
            }}
        >
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
                    <div
                        style={{
                            padding: 'var(--space-4)',
                            textAlign: 'center',
                            color: 'var(--text-tertiary)',
                            fontSize: 'var(--font-size-sm)'
                        }}
                    >
                        No issues
                    </div>
                )}
            </div>
        </div>
    )
}

