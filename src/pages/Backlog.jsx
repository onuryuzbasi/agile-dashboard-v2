import { useProjectStore } from '../stores/projectStore'
import {
    Plus,
    GripVertical,
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
    highest: { icon: ArrowUp, color: 'var(--priority-highest)' },
    high: { icon: ArrowUp, color: 'var(--priority-high)' },
    medium: { icon: Minus, color: 'var(--priority-medium)' },
    low: { icon: ArrowDown, color: 'var(--priority-low)' },
    lowest: { icon: ArrowDown, color: 'var(--priority-lowest)' }
}

export default function Backlog() {
    const { getBacklogIssues, getSprintIssues, sprints, currentSprintId, setSelectedIssue, getUserById } = useProjectStore()

    const backlogIssues = getBacklogIssues()
    const activeSprint = sprints.find(s => s.state === 'active')
    const sprintIssues = activeSprint ? getSprintIssues(activeSprint.id) : []

    const IssueRow = ({ issue }) => {
        const TypeIcon = typeIcons[issue.type] || CheckSquare
        const PriorityIcon = priorityConfig[issue.priority]?.icon || Minus
        const priorityColor = priorityConfig[issue.priority]?.color
        const assignee = issue.assigneeId ? getUserById(issue.assigneeId) : null

        return (
            <div
                className="card"
                style={{
                    padding: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)'
                }}
                onClick={() => setSelectedIssue(issue)}
            >
                <GripVertical size={16} style={{ color: 'var(--text-tertiary)', cursor: 'grab' }} />

                <div className={`issue-type-icon ${issue.type}`}>
                    <TypeIcon size={10} />
                </div>

                <span className="text-xs text-tertiary font-medium" style={{ minWidth: 80 }}>
                    {issue.key}
                </span>

                <span className="flex-1 text-sm truncate">{issue.summary}</span>

                <span style={{ color: priorityColor }}>
                    <PriorityIcon size={14} />
                </span>

                {issue.storyPoints && (
                    <span className="story-points">{issue.storyPoints}</span>
                )}

                {assignee && (
                    <div className="avatar sm" title={assignee.name}>
                        {assignee.name.charAt(0)}
                    </div>
                )}
            </div>
        )
    }

    const IssueSection = ({ title, issues, badge, badgeClass }) => (
        <div className="mb-6">
            <div
                className="flex items-center justify-between mb-3"
                style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)'
                }}
            >
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{title}</h3>
                    {badge && (
                        <span className={`badge ${badgeClass}`}>{badge}</span>
                    )}
                    <span className="text-sm text-tertiary">
                        {issues.length} issues · {issues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)} points
                    </span>
                </div>
                <button className="btn btn-sm btn-ghost">
                    <Plus size={14} />
                    Add Issue
                </button>
            </div>

            {issues.length > 0 ? (
                issues.map(issue => <IssueRow key={issue.id} issue={issue} />)
            ) : (
                <div
                    style={{
                        padding: 'var(--space-6)',
                        textAlign: 'center',
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px dashed var(--border-primary)'
                    }}
                >
                    No issues. Drag issues here or create new ones.
                </div>
            )}
        </div>
    )

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Backlog</h1>
                    <p className="text-secondary">
                        Plan and prioritize your work
                    </p>
                </div>

                <button className="btn btn-primary">
                    <Plus size={18} />
                    Create Issue
                </button>
            </div>

            {/* Active Sprint */}
            {activeSprint && (
                <IssueSection
                    title={activeSprint.name}
                    issues={sprintIssues}
                    badge="Active"
                    badgeClass="badge-task"
                />
            )}

            {/* Future Sprints */}
            {sprints.filter(s => s.state === 'future').map(sprint => (
                <IssueSection
                    key={sprint.id}
                    title={sprint.name}
                    issues={getSprintIssues(sprint.id)}
                    badge="Future"
                    badgeClass="badge-subtask"
                />
            ))}

            {/* Backlog */}
            <IssueSection
                title="Backlog"
                issues={backlogIssues}
            />
        </div>
    )
}
