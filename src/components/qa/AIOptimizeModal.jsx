import { useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    Sparkles,
    Loader2,
    TestTube2,
    Target,
    Users,
    BarChart3,
    ChevronRight,
    Check,
    AlertCircle,
    Lightbulb
} from 'lucide-react'
import aiOptimizer from '../../lib/aiOptimizer'

/**
 * AI Optimization Modal
 * Provides AI-powered QA optimization features
 */
export default function AIOptimizeModal({ isOpen, onClose }) {
    const { issues, users, testSuites, getBugs } = useProjectStore()
    const [activeTab, setActiveTab] = useState('coverage')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState(null)
    const [selectedIssue, setSelectedIssue] = useState(null)

    const bugs = getBugs?.() || issues.filter(i => i.type === 'bug' && !i.isDeleted)

    if (!isOpen) return null

    const tabs = [
        { id: 'coverage', label: 'Coverage Analysis', icon: BarChart3 },
        { id: 'testcases', label: 'Generate Tests', icon: TestTube2 },
        { id: 'priority', label: 'Bug Priority', icon: Target },
        { id: 'assignee', label: 'Smart Assignment', icon: Users }
    ]

    const handleAnalyzeCoverage = async () => {
        setLoading(true)
        setError(null)
        try {
            const analysis = await aiOptimizer.analyzeTestCoverage(testSuites, issues)
            setResults({ type: 'coverage', data: analysis })
        } catch (err) {
            setError('Failed to analyze coverage. Please try again.')
        }
        setLoading(false)
    }

    const handleGenerateTestCases = async (issue) => {
        setLoading(true)
        setError(null)
        try {
            const testCases = await aiOptimizer.generateTestCasesForIssue(issue)
            setResults({ type: 'testcases', data: testCases, issue })
        } catch (err) {
            setError('Failed to generate test cases. Please try again.')
        }
        setLoading(false)
    }

    const handleSuggestPriority = async (bug) => {
        setLoading(true)
        setError(null)
        try {
            const suggestion = await aiOptimizer.suggestBugPriority(bug)
            setResults({ type: 'priority', data: suggestion, bug })
        } catch (err) {
            setError('Failed to suggest priority. Please try again.')
        }
        setLoading(false)
    }

    const handleSuggestAssignee = async (bug) => {
        setLoading(true)
        setError(null)
        try {
            const suggestion = await aiOptimizer.suggestBugAssignee(bug, users, issues)
            setResults({ type: 'assignee', data: suggestion, bug })
        } catch (err) {
            setError('Failed to suggest assignee. Please try again.')
        }
        setLoading(false)
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'coverage':
                return (
                    <div className="ai-tab-content">
                        <p className="ai-description">
                            Analyze your test coverage and get AI-powered recommendations
                            for improving your QA process.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleAnalyzeCoverage}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                            Analyze Coverage
                        </button>

                        {results?.type === 'coverage' && results.data && (
                            <div className="ai-results">
                                <div className="coverage-score">
                                    <span className="score-value">{results.data.coverageScore}%</span>
                                    <span className="score-label">Coverage Score</span>
                                </div>

                                <div className="ai-section">
                                    <h4><Lightbulb size={16} /> Recommendations</h4>
                                    <ul className="recommendation-list">
                                        {results.data.recommendations?.map((rec, i) => (
                                            <li key={i}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>

                                {results.data.priorityAreas?.length > 0 && (
                                    <div className="ai-section">
                                        <h4><Target size={16} /> Priority Areas</h4>
                                        <div className="priority-tags">
                                            {results.data.priorityAreas.map((area, i) => (
                                                <span key={i} className="priority-tag">{area}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )

            case 'testcases':
                return (
                    <div className="ai-tab-content">
                        <p className="ai-description">
                            Select an issue to automatically generate test cases using AI.
                        </p>

                        <div className="issue-selector">
                            <label>Select Issue:</label>
                            <select
                                className="input select"
                                value={selectedIssue?.id || ''}
                                onChange={(e) => {
                                    const issue = issues.find(i => i.id === e.target.value)
                                    setSelectedIssue(issue)
                                }}
                            >
                                <option value="">Choose an issue...</option>
                                {issues.filter(i => !i.isDeleted).slice(0, 20).map(issue => (
                                    <option key={issue.id} value={issue.id}>
                                        {issue.key} - {issue.summary.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => handleGenerateTestCases(selectedIssue)}
                            disabled={loading || !selectedIssue}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <TestTube2 size={18} />}
                            Generate Test Cases
                        </button>

                        {results?.type === 'testcases' && results.data?.length > 0 && (
                            <div className="ai-results">
                                <h4>Generated Test Cases for {results.issue?.key}</h4>
                                <div className="test-case-list">
                                    {results.data.map((tc, i) => (
                                        <div key={i} className="generated-test-case">
                                            <div className="tc-header">
                                                <Check size={14} />
                                                <strong>{tc.title}</strong>
                                            </div>
                                            <div className="tc-steps">
                                                <span className="label">Steps:</span>
                                                <ol>
                                                    {tc.steps?.map((step, j) => (
                                                        <li key={j}>{step}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                            <div className="tc-expected">
                                                <span className="label">Expected:</span>
                                                <p>{tc.expected}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'priority':
                return (
                    <div className="ai-tab-content">
                        <p className="ai-description">
                            Get AI-suggested TIS priority scores for your bugs.
                        </p>

                        <div className="issue-selector">
                            <label>Select Bug:</label>
                            <select
                                className="input select"
                                value={selectedIssue?.id || ''}
                                onChange={(e) => {
                                    const bug = bugs.find(b => b.id === e.target.value)
                                    setSelectedIssue(bug)
                                }}
                            >
                                <option value="">Choose a bug...</option>
                                {bugs.slice(0, 20).map(bug => (
                                    <option key={bug.id} value={bug.id}>
                                        {bug.key} - {bug.summary.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => handleSuggestPriority(selectedIssue)}
                            disabled={loading || !selectedIssue}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <Target size={18} />}
                            Suggest Priority
                        </button>

                        {results?.type === 'priority' && results.data && (
                            <div className="ai-results">
                                <h4>Priority Suggestion for {results.bug?.key}</h4>
                                <div className="priority-suggestion">
                                    <div className="tis-preview">
                                        <div className="tis-dim">
                                            <span className="dim-label">Impact</span>
                                            <span className="dim-value">{results.data.impact}</span>
                                        </div>
                                        <div className="tis-dim">
                                            <span className="dim-label">Size</span>
                                            <span className="dim-value">{results.data.size}</span>
                                        </div>
                                        <div className="tis-dim">
                                            <span className="dim-label">Urgency</span>
                                            <span className="dim-value">{results.data.urgency}</span>
                                        </div>
                                    </div>
                                    <p className="reasoning">{results.data.reasoning}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'assignee':
                return (
                    <div className="ai-tab-content">
                        <p className="ai-description">
                            Get AI-powered assignee recommendations based on team expertise.
                        </p>

                        <div className="issue-selector">
                            <label>Select Bug:</label>
                            <select
                                className="input select"
                                value={selectedIssue?.id || ''}
                                onChange={(e) => {
                                    const bug = bugs.find(b => b.id === e.target.value)
                                    setSelectedIssue(bug)
                                }}
                            >
                                <option value="">Choose a bug...</option>
                                {bugs.filter(b => !b.assigneeId).slice(0, 20).map(bug => (
                                    <option key={bug.id} value={bug.id}>
                                        {bug.key} - {bug.summary.substring(0, 50)}...
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => handleSuggestAssignee(selectedIssue)}
                            disabled={loading || !selectedIssue}
                        >
                            {loading ? <Loader2 className="spin" size={18} /> : <Users size={18} />}
                            Suggest Assignee
                        </button>

                        {results?.type === 'assignee' && results.data && (
                            <div className="ai-results">
                                <h4>Assignment Suggestion for {results.bug?.key}</h4>
                                <div className="assignee-suggestion">
                                    <div className="suggested-user">
                                        <Users size={24} />
                                        <div className="user-info">
                                            <strong>{results.data.suggestedName}</strong>
                                            <span className={`confidence ${results.data.confidence}`}>
                                                {results.data.confidence} confidence
                                            </span>
                                        </div>
                                    </div>
                                    <p className="reasoning">{results.data.reason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal ai-optimize-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-accent" />
                        <h3>AI Optimization</h3>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body ai-modal-body">
                    {!aiOptimizer.isAIEnabled() && (
                        <div className="ai-warning">
                            <AlertCircle size={18} />
                            <span>
                                AI features require VITE_GEMINI_API_KEY.
                                Add it to your .env file to enable AI optimization.
                            </span>
                        </div>
                    )}

                    <div className="ai-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`ai-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tab.id)
                                    setResults(null)
                                    setError(null)
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="ai-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {renderTabContent()}
                </div>
            </div>
        </div>
    )
}
