import { useMemo, useState, useEffect } from 'react'
import { useProjectStore } from '../stores/projectStore'
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    Zap,
    Target,
    Users,
    History,
    MessageSquare,
    Edit3,
    Plus,
    ArrowRight,
    BookOpen,
    Bug,
    CheckSquare,
    Layers
} from 'lucide-react'
import { getAllViolations, load, STORAGE_KEY } from './Roadmap'

// Type icons mapping
const typeIcons = {
    epic: Zap,
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    subtask: Layers
}

const typeColors = {
    epic: '#a855f7',
    story: '#22c55e',
    bug: '#ef4444',
    task: '#3b82f6',
    subtask: '#64748b'
}

export default function Dashboard() {
    const {
        getProjectIssues,
        getCurrentProject,
        sprints,
        users,
        currentSprintId,
        setSelectedIssue
    } = useProjectStore()

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

    // Collect all recent activities from all issues
    const recentActivities = useMemo(() => {
        const activities = []

        issues.forEach(issue => {
            // Add history entries
            if (issue.history && Array.isArray(issue.history)) {
                issue.history.forEach(entry => {
                    activities.push({
                        id: entry.id || `${issue.id}-${entry.timestamp}`,
                        type: 'change',
                        issueId: issue.id,
                        issueKey: issue.key,
                        issueSummary: issue.summary,
                        issueType: issue.type,
                        userId: entry.userId,
                        timestamp: entry.timestamp,
                        field: entry.field,
                        fieldLabel: entry.fieldLabel,
                        oldLabel: entry.oldLabel,
                        newLabel: entry.newLabel
                    })
                })
            }

            // Add comments as activities
            if (issue.comments && Array.isArray(issue.comments)) {
                issue.comments.forEach(comment => {
                    activities.push({
                        id: comment.id || `comment-${issue.id}-${comment.timestamp}`,
                        type: 'comment',
                        issueId: issue.id,
                        issueKey: issue.key,
                        issueSummary: issue.summary,
                        issueType: issue.type,
                        userId: comment.userId,
                        timestamp: comment.timestamp,
                        text: comment.text
                    })
                })
            }

            // Add issue creation as activity (use createdAt)
            if (issue.createdAt) {
                activities.push({
                    id: `created-${issue.id}`,
                    type: 'created',
                    issueId: issue.id,
                    issueKey: issue.key,
                    issueSummary: issue.summary,
                    issueType: issue.type,
                    userId: issue.reporterId,
                    timestamp: issue.createdAt
                })
            }
        })

        // Sort by timestamp descending (most recent first)
        activities.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0)
            const dateB = new Date(b.timestamp || 0)
            return dateB - dateA
        })

        // Return last 50 activities
        return activities.slice(0, 50)
    }, [issues])

    const getUserName = (userId) => {
        if (!userId) return 'Unknown'
        const user = users.find(u => u.id === userId)
        return user?.name || 'Unknown'
    }

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return ''
        const now = new Date()
        const date = new Date(timestamp)
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    const handleIssueClick = (issueId) => {
        const issue = issues.find(i => i.id === issueId)
        if (issue) {
            setSelectedIssue(issue)
        }
    }

    const getActivityIcon = (activity) => {
        switch (activity.type) {
            case 'comment':
                return <MessageSquare size={14} />
            case 'created':
                return <Plus size={14} />
            default:
                return <Edit3 size={14} />
        }
    }

    const getActivityDescription = (activity) => {
        switch (activity.type) {
            case 'comment':
                return (
                    <span className="activity-desc">
                        added a comment: <span className="activity-comment-text">"{activity.text?.substring(0, 60)}{activity.text?.length > 60 ? '...' : ''}"</span>
                    </span>
                )
            case 'created':
                return <span className="activity-desc">created this issue</span>
            default:
                return (
                    <span className="activity-desc">
                        changed <strong>{activity.fieldLabel || activity.field}</strong>
                        {activity.oldLabel && (
                            <> from <span className="activity-old-value">{activity.oldLabel}</span></>
                        )}
                        {activity.newLabel && (
                            <> to <span className="activity-new-value">{activity.newLabel}</span></>
                        )}
                    </span>
                )
        }
    }

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

            {/* Roadmap Dependency Warnings */}
            <RoadmapWarnings />

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

            {/* Recent Activity Section */}
            <div className="card animate-slide-up" style={{ marginTop: 'var(--space-6)' }}>
                <div className="card-header mb-4">
                    <h3 className="card-title flex items-center gap-2">
                        <History size={18} style={{ color: 'var(--accent)' }} />
                        Recent Activity
                    </h3>
                    <span className="text-sm text-secondary">{recentActivities.length} activities</span>
                </div>

                <div className="recent-activity-list">
                    {recentActivities.length === 0 ? (
                        <div className="text-center text-tertiary" style={{ padding: 'var(--space-8)' }}>
                            No recent activity
                        </div>
                    ) : (
                        recentActivities.map(activity => {
                            const TypeIcon = typeIcons[activity.issueType] || CheckSquare
                            const typeColor = typeColors[activity.issueType] || '#64748b'

                            return (
                                <div key={activity.id} className="activity-item">
                                    <div className="activity-icon" style={{ color: typeColor }}>
                                        {getActivityIcon(activity)}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-header">
                                            <span className="activity-user">{getUserName(activity.userId)}</span>
                                            {getActivityDescription(activity)}
                                        </div>
                                        <div className="activity-issue-link" onClick={() => handleIssueClick(activity.issueId)}>
                                            <TypeIcon size={14} style={{ color: typeColor }} />
                                            <span className="activity-issue-key">{activity.issueKey}</span>
                                            <span className="activity-issue-summary">{activity.issueSummary}</span>
                                            <ArrowRight size={12} className="activity-arrow" />
                                        </div>
                                    </div>
                                    <div className="activity-time">
                                        {formatTimeAgo(activity.timestamp)}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Roadmap Dependency Warning Widget ───
function RoadmapWarnings() {
    const [violations, setViolations] = useState([])

    useEffect(() => {
        const data = load(STORAGE_KEY)
        if (data) setViolations(getAllViolations(data))

        // Listen for storage changes
        const handler = (e) => {
            if (e.key === 'agile-roadmap-data') {
                try { setViolations(getAllViolations(JSON.parse(e.newValue))) } catch {}
            }
        }
        window.addEventListener('storage', handler)
        return () => window.removeEventListener('storage', handler)
    }, [])

    if (violations.length === 0) return null

    return (
        <div className="card animate-slide-up dash-dep-warn">
            <div className="card-header mb-4">
                <h3 className="card-title flex items-center gap-2">
                    <AlertCircle size={18} style={{ color: 'var(--danger, #ef4444)' }} />
                    Roadmap Conflicts
                </h3>
                <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    {violations.length} issue{violations.length > 1 ? 's' : ''}
                </span>
            </div>
            <div className="dash-dep-list">
                {violations.map((v, i) => (
                    <div key={i} className="dash-dep-item">
                        <div className="dash-dep-dot" style={{ background: v.projectColor }} />
                        <div className="dash-dep-info">
                            <span className="dash-dep-project">{v.projectName}</span>
                            <span className="dash-dep-msg">{v.message}</span>
                        </div>
                    </div>
                ))}
            </div>
            <a href="/roadmap" className="dash-dep-link">Open Roadmap to fix →</a>
        </div>
    )
}
