import { useProjectStore } from '../stores/projectStore'
import {
    Plus,
    Play,
    CheckCircle2,
    Calendar,
    Target,
    Zap
} from 'lucide-react'

export default function Sprints() {
    const { sprints, getSprintIssues, startSprint, completeSprint, setCurrentSprint } = useProjectStore()

    const getSprintStats = (sprintId) => {
        const issues = getSprintIssues(sprintId)
        return {
            total: issues.length,
            done: issues.filter(i => i.status === 'done').length,
            points: issues.reduce((sum, i) => sum + (i.originalEstimate || 0), 0),
            completedPoints: issues.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.originalEstimate || 0), 0)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set'
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const SprintCard = ({ sprint }) => {
        const stats = getSprintStats(sprint.id)
        const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

        return (
            <div className="card animate-fade-in" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="card-header mb-4">
                    <div className="flex items-center gap-3">
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 'var(--radius-md)',
                                background: sprint.state === 'active'
                                    ? 'var(--accent-light)'
                                    : sprint.state === 'closed'
                                        ? 'var(--success-light)'
                                        : 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: sprint.state === 'active'
                                    ? 'var(--accent)'
                                    : sprint.state === 'closed'
                                        ? 'var(--success)'
                                        : 'var(--text-tertiary)'
                            }}
                        >
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold">{sprint.name}</h3>
                            <span className={`badge ${sprint.state === 'active' ? 'badge-task' :
                                sprint.state === 'closed' ? 'badge-story' :
                                    'badge-subtask'
                                }`}>
                                {sprint.state === 'active' ? 'Active' :
                                    sprint.state === 'closed' ? 'Completed' :
                                        'Future'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {sprint.state === 'future' && (
                            <button
                                className="btn btn-primary"
                                onClick={() => startSprint(sprint.id)}
                            >
                                <Play size={16} />
                                Start Sprint
                            </button>
                        )}
                        {sprint.state === 'active' && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => completeSprint(sprint.id)}
                            >
                                <CheckCircle2 size={16} />
                                Complete Sprint
                            </button>
                        )}
                    </div>
                </div>

                {/* Sprint Goal */}
                {sprint.goal && (
                    <div
                        className="mb-4"
                        style={{
                            padding: 'var(--space-3)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}
                    >
                        <div className="text-xs text-secondary mb-1 flex items-center gap-2">
                            <Target size={12} />
                            Sprint Goal
                        </div>
                        <div className="text-sm">{sprint.goal}</div>
                    </div>
                )}

                {/* Dates */}
                <div
                    className="flex gap-6 mb-4 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Start: {formatDate(sprint.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>End: {formatDate(sprint.endDate)}</span>
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-secondary">Progress</span>
                        <span className="font-medium">{stats.done}/{stats.total} issues · {stats.completedPoints}h/{stats.points}h</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                        <div
                            style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: sprint.state === 'closed' ? 'var(--success)' : 'var(--accent)',
                                borderRadius: 'var(--radius-full)',
                                transition: 'width 0.5s ease'
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const activeSprints = sprints.filter(s => s.state === 'active')
    const futureSprints = sprints.filter(s => s.state === 'future')
    const closedSprints = sprints.filter(s => s.state === 'closed')

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sprints</h1>
                    <p className="text-secondary">
                        Manage your team's sprints and track progress
                    </p>
                </div>

                <button className="btn btn-primary">
                    <Plus size={18} />
                    Create Sprint
                </button>
            </div>

            {/* Active Sprints */}
            {activeSprints.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4">Active Sprint</h2>
                    {activeSprints.map(sprint => (
                        <SprintCard key={sprint.id} sprint={sprint} />
                    ))}
                </div>
            )}

            {/* Future Sprints */}
            {futureSprints.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-4">Upcoming Sprints</h2>
                    {futureSprints.map(sprint => (
                        <SprintCard key={sprint.id} sprint={sprint} />
                    ))}
                </div>
            )}

            {/* Closed Sprints */}
            {closedSprints.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Completed Sprints</h2>
                    {closedSprints.map(sprint => (
                        <SprintCard key={sprint.id} sprint={sprint} />
                    ))}
                </div>
            )}

            {sprints.length === 0 && (
                <div
                    className="card"
                    style={{
                        padding: 'var(--space-10)',
                        textAlign: 'center'
                    }}
                >
                    <Zap size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }} />
                    <h3 className="mb-2">No sprints yet</h3>
                    <p className="text-secondary mb-4">Create your first sprint to start planning</p>
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Create Sprint
                    </button>
                </div>
            )}
        </div>
    )
}
