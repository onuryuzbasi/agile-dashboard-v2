import { useProjectStore } from '../stores/projectStore'
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Zap,
    Target,
    Users
} from 'lucide-react'

export default function Dashboard() {
    const { getProjectIssues, getCurrentProject, sprints, users, currentSprintId } = useProjectStore()

    const project = getCurrentProject()
    const issues = getProjectIssues()
    const currentSprint = sprints.find(s => s.id === currentSprintId)
    const sprintIssues = issues.filter(i => i.sprintId === currentSprintId)

    // Calculate stats
    const stats = {
        total: sprintIssues.length,
        todo: sprintIssues.filter(i => i.status === 'todo').length,
        inProgress: sprintIssues.filter(i => i.status === 'progress').length,
        inReview: sprintIssues.filter(i => i.status === 'review').length,
        done: sprintIssues.filter(i => i.status === 'done').length,
        totalPoints: sprintIssues.reduce((sum, i) => sum + (i.originalEstimate || 0), 0),
        completedPoints: sprintIssues.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.originalEstimate || 0), 0)
    }

    const completionRate = stats.total > 0
        ? Math.round((stats.done / stats.total) * 100)
        : 0

    const pointsProgress = stats.totalPoints > 0
        ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
        : 0

    const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
        <div className="card animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                    }}
                >
                    <Icon size={20} />
                </div>
                <div>
                    <div className="text-sm text-secondary">{label}</div>
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>{value}</div>
                </div>
            </div>
            {subtext && <div className="text-xs text-tertiary">{subtext}</div>}
        </div>
    )

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="text-secondary">
                        {project?.name} · {currentSprint?.name || 'No active sprint'}
                    </p>
                </div>
            </div>

            {/* Active Sprint Progress - Inner Grid */}
            {currentSprint && (
                <div className="card mb-6 animate-slide-up">
                    <div className="card-header mb-4">
                        <h3 className="card-title flex items-center gap-2">
                            <Zap size={18} style={{ color: 'var(--accent)' }} />
                            Active Sprint Progress
                        </h3>
                        <span className="badge badge-task">{currentSprint.name}</span>
                    </div>

                    <div className="dashboard-grid" style={{ marginBottom: 'var(--space-4)' }}>
                        <div>
                            <div className="text-sm text-secondary mb-2">Issues Completed</div>
                            <div className="flex items-center gap-3">
                                <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                    <div
                                        style={{
                                            width: `${completionRate}%`,
                                            height: '100%',
                                            background: 'var(--success)',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.5s ease'
                                        }}
                                    />
                                </div>
                                <span className="font-semibold">{completionRate}%</span>
                            </div>
                            <div className="text-xs text-tertiary mt-1">{stats.done} of {stats.total} issues</div>
                        </div>

                        <div>
                            <div className="text-sm text-secondary mb-2">Estimated Hours</div>
                            <div className="flex items-center gap-3">
                                <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                    <div
                                        style={{
                                            width: `${pointsProgress}%`,
                                            height: '100%',
                                            background: 'var(--accent)',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.5s ease'
                                        }}
                                    />
                                </div>
                                <span className="font-semibold">{pointsProgress}%</span>
                            </div>
                            <div className="text-xs text-tertiary mt-1">{stats.completedPoints}h of {stats.totalPoints}h</div>
                        </div>
                    </div>

                    {currentSprint.goal && (
                        <div style={{
                            padding: 'var(--space-3)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div className="text-xs text-secondary mb-1 flex items-center gap-2">
                                <Target size={12} />
                                Sprint Goal
                            </div>
                            <div className="text-sm">{currentSprint.goal}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            <div className="dashboard-grid">
                <StatCard
                    icon={Clock}
                    label="To Do"
                    value={stats.todo}
                    color="var(--status-todo)"
                    subtext="Waiting to start"
                />
                <StatCard
                    icon={TrendingUp}
                    label="In Progress"
                    value={stats.inProgress}
                    color="var(--status-progress)"
                    subtext="Currently working"
                />
                <StatCard
                    icon={AlertCircle}
                    label="In Review"
                    value={stats.inReview}
                    color="var(--status-review)"
                    subtext="Pending review"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Done"
                    value={stats.done}
                    color="var(--status-done)"
                    subtext="Completed"
                />
            </div>

            {/* Team Section */}
            <div className="card animate-slide-up">
                <div className="card-header mb-4">
                    <h3 className="card-title flex items-center gap-2">
                        <Users size={18} style={{ color: 'var(--accent)' }} />
                        Team Members
                    </h3>
                    <span className="text-sm text-secondary">{users.length} members</span>
                </div>

                <div className="flex gap-4 flex-wrap">
                    {users.map(user => {
                        const userIssues = sprintIssues.filter(i => i.assigneeId === user.id)
                        const userDone = userIssues.filter(i => i.status === 'done').length

                        return (
                            <div
                                key={user.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    minWidth: 180
                                }}
                            >
                                <div className="avatar">{user.name.charAt(0)}</div>
                                <div>
                                    <div className="font-medium text-sm">{user.name}</div>
                                    <div className="text-xs text-tertiary">
                                        {userDone}/{userIssues.length} issues done
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
