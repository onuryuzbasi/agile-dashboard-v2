import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import KanbanColumn from './KanbanColumn'
import IssueCard from './IssueCard'

const statuses = ['todo', 'progress', 'review', 'done']

export default function KanbanBoard() {
    const { getSprintIssues, currentSprintId, moveIssue, issues } = useProjectStore()
    const [activeIssue, setActiveIssue] = useState(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Get issues for current sprint
    const sprintIssues = currentSprintId
        ? getSprintIssues(currentSprintId)
        : issues.filter(i => i.projectId === 'proj-1')

    // Group issues by status
    const issuesByStatus = statuses.reduce((acc, status) => {
        acc[status] = sprintIssues.filter(issue => issue.status === status)
        return acc
    }, {})

    const handleDragStart = (event) => {
        const { active } = event
        const issue = sprintIssues.find(i => i.id === active.id)
        setActiveIssue(issue)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveIssue(null)

        if (!over) return

        const activeIssue = sprintIssues.find(i => i.id === active.id)
        if (!activeIssue) return

        // Check if dropped on a column
        if (statuses.includes(over.id)) {
            if (activeIssue.status !== over.id) {
                moveIssue(active.id, over.id)
            }
            return
        }

        // Check if dropped on another issue
        const overIssue = sprintIssues.find(i => i.id === over.id)
        if (overIssue && activeIssue.status !== overIssue.status) {
            moveIssue(active.id, overIssue.status)
        }
    }

    const handleDragOver = (event) => {
        const { active, over } = event

        if (!over) return

        const activeIssue = sprintIssues.find(i => i.id === active.id)
        if (!activeIssue) return

        // If over a column
        if (statuses.includes(over.id)) {
            return
        }

        // If over another issue
        const overIssue = sprintIssues.find(i => i.id === over.id)
        if (overIssue && activeIssue.status !== overIssue.status) {
            // Could add reordering logic here
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="kanban-board">
                {statuses.map((status) => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        issues={issuesByStatus[status]}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeIssue ? (
                    <IssueCard issue={activeIssue} isDragging />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
