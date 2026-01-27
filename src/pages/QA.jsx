import { useState, useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'
import TestSuitePanel from '../components/qa/TestSuitePanel'
import BugTrackerBoard from '../components/qa/BugTrackerBoard'
import AnalyticsPanel from '../components/qa/AnalyticsPanel'
import {
    TestTube2,
    Bug,
    BarChart3,
    ChevronDown,
    Plus,
    Sparkles
} from 'lucide-react'

export default function QA() {
    const {
        sprints,
        currentSprintId,
        setCurrentSprint,
        testSuites,
        testCases,
        issues,
        users,
        bugStatuses,
        addTestSuite
    } = useProjectStore()

    // Tab state
    const [activeTab, setActiveTab] = useState('suites') // 'suites' | 'bugs' | 'analytics'

    // Sprint filter for QA
    const [selectedSprintId, setSelectedSprintId] = useState(currentSprintId || 'all')

    const activeSprints = sprints.filter(s => s.state !== 'closed')

    // Filter test suites by sprint
    const filteredSuites = useMemo(() => {
        if (selectedSprintId === 'all') return testSuites
        return testSuites.filter(ts => ts.sprintId === selectedSprintId)
    }, [testSuites, selectedSprintId])

    // Get bugs (issues with type = 'bug')
    const bugs = useMemo(() => {
        return issues.filter(i => i.type === 'bug' && !i.isDeleted)
    }, [issues])

    // Handle creating new test suite
    const handleCreateSuite = async () => {
        const name = prompt('Test Suite adı:')
        if (name?.trim()) {
            await addTestSuite({
                name: name.trim(),
                sprintId: selectedSprintId !== 'all' ? selectedSprintId : null
            })
        }
    }

    const tabs = [
        { id: 'suites', label: 'Test Suites', icon: TestTube2, count: filteredSuites.length },
        { id: 'bugs', label: 'Bug Tracker', icon: Bug, count: bugs.length },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null }
    ]

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">QA Dashboard</h1>
                    <p className="text-secondary">
                        Manage test cases, track bugs, and analyze QA metrics
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Sprint Selector */}
                    <select
                        className="input select"
                        value={selectedSprintId}
                        onChange={(e) => setSelectedSprintId(e.target.value)}
                        style={{ width: 'auto', minWidth: 150 }}
                    >
                        <option value="all">All Sprints</option>
                        {activeSprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.name}
                                {sprint.state === 'active' && ' (Active)'}
                            </option>
                        ))}
                    </select>

                    {/* Action Buttons */}
                    {activeTab === 'suites' && (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateSuite}
                            >
                                <Plus size={16} />
                                New Suite
                            </button>
                            <button
                                className="btn btn-secondary"
                                title="AI Test Case Optimizer"
                            >
                                <Sparkles size={16} />
                                Optimize
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="qa-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            className={`qa-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            {tab.label}
                            {tab.count !== null && (
                                <span className="qa-tab-count">{tab.count}</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="qa-content">
                {activeTab === 'suites' && (
                    <TestSuitePanel
                        suites={filteredSuites}
                        testCases={testCases}
                        issues={issues}
                        users={users}
                        selectedSprintId={selectedSprintId}
                    />
                )}
                {activeTab === 'bugs' && (
                    <BugTrackerBoard
                        bugs={bugs}
                        bugStatuses={bugStatuses}
                        users={users}
                    />
                )}
                {activeTab === 'analytics' && (
                    <AnalyticsPanel
                        bugs={bugs}
                        testCases={testCases}
                        sprints={sprints}
                        selectedSprintId={selectedSprintId}
                    />
                )}
            </div>
        </div>
    )
}
