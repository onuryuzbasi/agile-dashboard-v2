import { useMemo } from 'react'
import {
    BarChart3,
    Clock,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    Target,
    Bug
} from 'lucide-react'

export default function AnalyticsPanel({ bugs, testCases, sprints, selectedSprintId }) {

    // Calculate metrics
    const metrics = useMemo(() => {
        const filteredBugs = selectedSprintId !== 'all'
            ? bugs.filter(b => b.sprintId === selectedSprintId)
            : bugs

        const filteredCases = selectedSprintId !== 'all'
            ? testCases.filter(tc => {
                // Find suite for this test case and check its sprint
                return true // Simplified for now
            })
            : testCases

        // 1. Test Cycle Time (average days from bug found to closed)
        const closedBugs = filteredBugs.filter(b => b.status === 'closed')
        const avgCycleTime = closedBugs.length > 0
            ? closedBugs.reduce((sum, b) => {
                const created = new Date(b.createdAt)
                const updated = new Date(b.updatedAt)
                return sum + (updated - created) / (1000 * 60 * 60 * 24)
            }, 0) / closedBugs.length
            : 0

        // 2. Bug Reopen Rate
        const reopenedBugs = filteredBugs.filter(b => (b.history || []).some(h =>
            h.field === 'status' && h.oldValue === 'closed' && h.newValue !== 'closed'
        ))
        const reopenRate = filteredBugs.length > 0
            ? (reopenedBugs.length / filteredBugs.length) * 100
            : 0

        // 3. First Time Pass Rate (test cases that passed first try)
        const passedCases = filteredCases.filter(tc => tc.status === 'passed')
        const firstTimePass = passedCases.filter(tc => {
            const history = tc.history || []
            const statusChanges = history.filter(h => h.field === 'status')
            return statusChanges.length <= 1 // Only one status change (to passed)
        })
        const firstTimePassRate = passedCases.length > 0
            ? (firstTimePass.length / passedCases.length) * 100
            : 100

        // 4. QA Bottleneck (bugs waiting for retest)
        const waitingForQA = filteredBugs.filter(b =>
            b.status === 'ready_retest' || b.retestStatus === 'pending'
        ).length

        // 5. Average Retest Count
        const bugRetestCounts = filteredBugs.map(b => {
            const history = b.history || []
            return history.filter(h =>
                h.field === 'status' &&
                (h.newValue === 'retesting' || h.newValue === 'ready_retest')
            ).length
        })
        const avgRetestCount = bugRetestCounts.length > 0
            ? bugRetestCounts.reduce((a, b) => a + b, 0) / bugRetestCounts.length
            : 0

        // 6. Bugs by Status
        const bugsByStatus = {
            new: filteredBugs.filter(b => b.status === 'new' || b.status === 'todo').length,
            inProgress: filteredBugs.filter(b => ['in_dev', 'in_progress', 'assigned', 'confirmed'].includes(b.status)).length,
            testing: filteredBugs.filter(b => ['ready_retest', 'retesting'].includes(b.status) || b.retestStatus === 'pending').length,
            done: filteredBugs.filter(b => ['closed', 'done', 'passed'].includes(b.status)).length
        }

        // 7. Test Case Coverage
        const totalCases = filteredCases.length
        const pendingCases = filteredCases.filter(tc => tc.status === 'pending').length
        const coverageRate = totalCases > 0 ? ((totalCases - pendingCases) / totalCases) * 100 : 0

        return {
            totalBugs: filteredBugs.length,
            avgCycleTime: Math.round(avgCycleTime * 10) / 10,
            reopenRate: Math.round(reopenRate),
            firstTimePassRate: Math.round(firstTimePassRate),
            waitingForQA,
            avgRetestCount: Math.round(avgRetestCount * 10) / 10,
            bugsByStatus,
            coverageRate: Math.round(coverageRate),
            totalCases,
            passedCases: passedCases.length,
            failedCases: filteredCases.filter(tc => tc.status === 'failed').length
        }
    }, [bugs, testCases, selectedSprintId])

    return (
        <div className="analytics-panel">
            {/* Metric Cards */}
            <div className="analytics-grid">
                {/* Total Bugs */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-error-bg)' }}>
                        <Bug size={24} color="var(--color-error)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.totalBugs}</span>
                        <span className="metric-label">Total Bugs</span>
                    </div>
                </div>

                {/* Cycle Time */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                        <Clock size={24} color="var(--color-info)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.avgCycleTime}d</span>
                        <span className="metric-label">Avg Cycle Time</span>
                    </div>
                </div>

                {/* Reopen Rate */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-warning-bg)' }}>
                        <RefreshCw size={24} color="var(--color-warning)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.reopenRate}%</span>
                        <span className="metric-label">Reopen Rate</span>
                    </div>
                </div>

                {/* First Time Pass Rate */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-success-bg)' }}>
                        <CheckCircle2 size={24} color="var(--color-success)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.firstTimePassRate}%</span>
                        <span className="metric-label">First Pass Rate</span>
                    </div>
                </div>

                {/* QA Bottleneck */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-warning-bg)' }}>
                        <AlertTriangle size={24} color="var(--color-warning)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.waitingForQA}</span>
                        <span className="metric-label">Waiting for QA</span>
                    </div>
                </div>

                {/* Test Coverage */}
                <div className="metric-card">
                    <div className="metric-icon" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                        <Target size={24} color="var(--color-info)" />
                    </div>
                    <div className="metric-content">
                        <span className="metric-value">{metrics.coverageRate}%</span>
                        <span className="metric-label">Test Coverage</span>
                    </div>
                </div>
            </div>

            {/* Bug Status Distribution */}
            <div className="analytics-section">
                <h3 className="analytics-section-title">
                    <BarChart3 size={18} /> Bug Status Distribution
                </h3>
                <div className="status-distribution">
                    <div className="status-bar">
                        {metrics.totalBugs > 0 && (
                            <>
                                <div
                                    className="status-segment new"
                                    style={{ width: `${(metrics.bugsByStatus.new / metrics.totalBugs) * 100}%` }}
                                    title={`New: ${metrics.bugsByStatus.new}`}
                                />
                                <div
                                    className="status-segment in-progress"
                                    style={{ width: `${(metrics.bugsByStatus.inProgress / metrics.totalBugs) * 100}%` }}
                                    title={`In Progress: ${metrics.bugsByStatus.inProgress}`}
                                />
                                <div
                                    className="status-segment testing"
                                    style={{ width: `${(metrics.bugsByStatus.testing / metrics.totalBugs) * 100}%` }}
                                    title={`Testing: ${metrics.bugsByStatus.testing}`}
                                />
                                <div
                                    className="status-segment done"
                                    style={{ width: `${(metrics.bugsByStatus.done / metrics.totalBugs) * 100}%` }}
                                    title={`Done: ${metrics.bugsByStatus.done}`}
                                />
                            </>
                        )}
                    </div>
                    <div className="status-legend">
                        <span className="legend-item"><span className="dot new" /> New ({metrics.bugsByStatus.new})</span>
                        <span className="legend-item"><span className="dot in-progress" /> In Progress ({metrics.bugsByStatus.inProgress})</span>
                        <span className="legend-item"><span className="dot testing" /> Testing ({metrics.bugsByStatus.testing})</span>
                        <span className="legend-item"><span className="dot done" /> Done ({metrics.bugsByStatus.done})</span>
                    </div>
                </div>
            </div>

            {/* Test Cases Summary */}
            <div className="analytics-section">
                <h3 className="analytics-section-title">
                    <TrendingUp size={18} /> Test Cases Summary
                </h3>
                <div className="test-summary-grid">
                    <div className="test-summary-card">
                        <span className="test-summary-value">{metrics.totalCases}</span>
                        <span className="test-summary-label">Total Cases</span>
                    </div>
                    <div className="test-summary-card passed">
                        <span className="test-summary-value">{metrics.passedCases}</span>
                        <span className="test-summary-label">Passed</span>
                    </div>
                    <div className="test-summary-card failed">
                        <span className="test-summary-value">{metrics.failedCases}</span>
                        <span className="test-summary-label">Failed</span>
                    </div>
                    <div className="test-summary-card">
                        <span className="test-summary-value">{metrics.avgRetestCount}</span>
                        <span className="test-summary-label">Avg Retests</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
