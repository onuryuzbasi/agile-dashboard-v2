import KanbanBoard from '../components/board/KanbanBoard'
import { useProjectStore } from '../stores/projectStore'
import { Filter, MoreHorizontal } from 'lucide-react'

export default function Board() {
    const { sprints, currentSprintId, setCurrentSprint } = useProjectStore()
    const activeSprints = sprints.filter(s => s.state !== 'closed')

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Board</h1>
                    <p className="text-secondary">
                        Drag and drop issues to update their status
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sprint Selector */}
                    <select
                        className="input select"
                        value={currentSprintId || ''}
                        onChange={(e) => setCurrentSprint(e.target.value)}
                        style={{ width: 'auto', minWidth: 150 }}
                    >
                        <option value="">All Issues</option>
                        {activeSprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.name}
                                {sprint.state === 'active' && ' (Active)'}
                            </option>
                        ))}
                    </select>

                    {/* Filter Button */}
                    <button className="btn btn-secondary">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard />
        </div>
    )
}
