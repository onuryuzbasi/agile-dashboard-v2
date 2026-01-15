import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import IssueCard from './IssueCard'

const statusConfig = {
    todo: { label: 'To Do', className: 'todo' },
    progress: { label: 'In Progress', className: 'progress' },
    review: { label: 'In Review', className: 'review' },
    done: { label: 'Done', className: 'done' }
}

export default function KanbanColumn({ status, issues }) {
    const { setNodeRef, isOver } = useDroppable({
        id: status
    })

    const config = statusConfig[status] || { label: status, className: '' }

    return (
        <div
            ref={setNodeRef}
            className={`kanban-column ${config.className} ${isOver ? 'drag-over' : ''}`}
        >
            <div className="kanban-column-header">
                <div className="kanban-column-title">
                    <span>{config.label}</span>
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
