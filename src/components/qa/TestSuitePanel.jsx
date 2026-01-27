import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import TestCaseModal from './TestCaseModal'
import {
    ChevronDown,
    ChevronRight,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    MoreHorizontal,
    Trash2,
    Edit,
    Link2
} from 'lucide-react'

export default function TestSuitePanel({ suites, testCases, issues, users, selectedSprintId }) {
    const { addTestCase, deleteTestSuite, updateTestCase } = useProjectStore()

    // Track expanded suites
    const [expandedSuites, setExpandedSuites] = useState(new Set())

    // Modal state
    const [selectedTestCase, setSelectedTestCase] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalSuiteId, setModalSuiteId] = useState(null)

    // Toggle suite expansion
    const toggleSuite = (suiteId) => {
        setExpandedSuites(prev => {
            const next = new Set(prev)
            if (next.has(suiteId)) {
                next.delete(suiteId)
            } else {
                next.add(suiteId)
            }
            return next
        })
    }

    // Get test cases for a suite
    const getTestCasesForSuite = (suiteId) => {
        return testCases.filter(tc => tc.suiteId === suiteId)
    }

    // Get status icon and color
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'passed':
                return { icon: CheckCircle2, color: 'var(--color-success)', label: 'Passed' }
            case 'failed':
                return { icon: XCircle, color: 'var(--color-error)', label: 'Failed' }
            case 'blocked':
                return { icon: AlertCircle, color: 'var(--color-warning)', label: 'Blocked' }
            default:
                return { icon: Clock, color: 'var(--color-text-tertiary)', label: 'Pending' }
        }
    }

    // Get suite statistics
    const getSuiteStats = (suiteId) => {
        const cases = getTestCasesForSuite(suiteId)
        const passed = cases.filter(tc => tc.status === 'passed').length
        const failed = cases.filter(tc => tc.status === 'failed').length
        const pending = cases.filter(tc => tc.status === 'pending').length
        const total = cases.length
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
        return { passed, failed, pending, total, passRate }
    }

    // Handle creating new test case
    const handleAddTestCase = async (suiteId) => {
        setModalSuiteId(suiteId)
        setSelectedTestCase(null)
        setIsModalOpen(true)
    }

    // Handle editing test case
    const handleEditTestCase = (testCase) => {
        setSelectedTestCase(testCase)
        setModalSuiteId(testCase.suiteId)
        setIsModalOpen(true)
    }

    // Handle quick status change
    const handleStatusChange = async (testCaseId, newStatus) => {
        await updateTestCase(testCaseId, { status: newStatus })
    }

    // Handle delete suite
    const handleDeleteSuite = async (suiteId) => {
        if (confirm('Bu test suite\'i ve tüm test case\'lerini silmek istediğinizden emin misiniz?')) {
            await deleteTestSuite(suiteId)
        }
    }

    // Get linked issue keys
    const getLinkedIssueKeys = (linkedIssueIds) => {
        if (!linkedIssueIds || linkedIssueIds.length === 0) return []
        return linkedIssueIds
            .map(id => issues.find(i => i.id === id))
            .filter(Boolean)
            .map(i => i.key)
    }

    if (suites.length === 0) {
        return (
            <div className="qa-empty-state">
                <div className="qa-empty-icon">📋</div>
                <h3>Henüz Test Suite Yok</h3>
                <p>İlk test suite'inizi oluşturmak için "New Suite" butonuna tıklayın.</p>
            </div>
        )
    }

    return (
        <div className="test-suite-panel">
            {suites.map(suite => {
                const isExpanded = expandedSuites.has(suite.id)
                const suiteCases = getTestCasesForSuite(suite.id)
                const stats = getSuiteStats(suite.id)

                return (
                    <div key={suite.id} className="test-suite-card">
                        {/* Suite Header */}
                        <div
                            className="test-suite-header"
                            onClick={() => toggleSuite(suite.id)}
                        >
                            <div className="test-suite-toggle">
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>

                            <div className="test-suite-icon">📁</div>

                            <div className="test-suite-info">
                                <span className="test-suite-name">{suite.name}</span>
                                <span className="test-suite-count">
                                    {stats.total} case{stats.total !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Stats Bar */}
                            <div className="test-suite-stats">
                                {stats.passed > 0 && (
                                    <span className="stat-badge stat-passed">
                                        <CheckCircle2 size={12} /> {stats.passed}
                                    </span>
                                )}
                                {stats.failed > 0 && (
                                    <span className="stat-badge stat-failed">
                                        <XCircle size={12} /> {stats.failed}
                                    </span>
                                )}
                                {stats.pending > 0 && (
                                    <span className="stat-badge stat-pending">
                                        <Clock size={12} /> {stats.pending}
                                    </span>
                                )}
                                <span className="stat-passrate">
                                    {stats.passRate}%
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="test-suite-actions" onClick={e => e.stopPropagation()}>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleAddTestCase(suite.id)}
                                    title="Add Test Case"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    className="btn-icon btn-danger"
                                    onClick={() => handleDeleteSuite(suite.id)}
                                    title="Delete Suite"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Suite Content (Test Cases) */}
                        {isExpanded && (
                            <div className="test-suite-content">
                                {suiteCases.length === 0 ? (
                                    <div className="test-case-empty">
                                        <p>Bu suite'te henüz test case yok.</p>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => handleAddTestCase(suite.id)}
                                        >
                                            <Plus size={14} /> İlk Test Case'i Ekle
                                        </button>
                                    </div>
                                ) : (
                                    <div className="test-case-list">
                                        {suiteCases.map(tc => {
                                            const statusDisplay = getStatusDisplay(tc.status)
                                            const StatusIcon = statusDisplay.icon
                                            const linkedKeys = getLinkedIssueKeys(tc.linkedIssueIds)

                                            return (
                                                <div
                                                    key={tc.id}
                                                    className="test-case-row"
                                                    onClick={() => handleEditTestCase(tc)}
                                                >
                                                    {/* Status Badge */}
                                                    <div
                                                        className="test-case-status"
                                                        style={{ color: statusDisplay.color }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <StatusIcon size={18} />
                                                    </div>

                                                    {/* Title */}
                                                    <div className="test-case-title">
                                                        {tc.title}
                                                    </div>

                                                    {/* Linked Issues */}
                                                    {linkedKeys.length > 0 && (
                                                        <div className="test-case-links">
                                                            <Link2 size={12} />
                                                            {linkedKeys.slice(0, 2).join(', ')}
                                                            {linkedKeys.length > 2 && ` +${linkedKeys.length - 2}`}
                                                        </div>
                                                    )}

                                                    {/* Steps Count */}
                                                    <div className="test-case-steps-count">
                                                        {tc.steps?.length || 0} step{(tc.steps?.length || 0) !== 1 ? 's' : ''}
                                                    </div>

                                                    {/* Quick Status Buttons */}
                                                    <div className="test-case-quick-actions" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className={`quick-status-btn ${tc.status === 'passed' ? 'active' : ''}`}
                                                            onClick={() => handleStatusChange(tc.id, 'passed')}
                                                            title="Mark as Passed"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button
                                                            className={`quick-status-btn fail ${tc.status === 'failed' ? 'active' : ''}`}
                                                            onClick={() => handleStatusChange(tc.id, 'failed')}
                                                            title="Mark as Failed"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}

            {/* Test Case Modal */}
            {isModalOpen && (
                <TestCaseModal
                    testCase={selectedTestCase}
                    suiteId={modalSuiteId}
                    issues={issues}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedTestCase(null)
                        setModalSuiteId(null)
                    }}
                />
            )}
        </div>
    )
}
