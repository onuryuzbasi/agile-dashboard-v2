import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useProjectStore } from './stores/projectStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Backlog from './pages/Backlog'
import Sprints from './pages/Sprints'
// List page removed - using ListTemplate instead
import ListTemplate from './pages/ListTemplate'
import Settings from './pages/Settings'
import Whiteboard from './pages/Whiteboard'
import Timeline from './pages/Timeline'
import QA from './pages/QA'
import IssueModal from './components/board/IssueModal'
import CreateIssueModal from './components/board/CreateIssueModal'
import ConfirmationModal from './components/common/ConfirmationModal'
import TemplateEditorModal from './components/common/TemplateEditorModal'
import Confetti from './components/common/Confetti'

function App() {
    const {
        theme,
        sidebarCollapsed,
        selectedIssue,
        setSelectedIssue,
        isLoading,
        isInitialized,
        initFromSupabase,
        templateEditorOpen
    } = useProjectStore()

    // Initialize from Supabase on mount
    useEffect(() => {
        initFromSupabase()
    }, [initFromSupabase])

    // Initialize theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Show loading screen while fetching data
    if (!isInitialized) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" />
                <p>Loading Agile Dashboard...</p>
            </div>
        )
    }

    return (
        <BrowserRouter>
            <div className="app-layout">
                <Sidebar />
                <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <Header />
                    <main className="page-container">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/board" element={<Board />} />
                            <Route path="/backlog" element={<Backlog />} />
                            <Route path="/sprints" element={<Sprints />} />
                            <Route path="/list" element={<Navigate to="/list-template" replace />} />
                            <Route path="/list-template" element={<ListTemplate />} />
                            <Route path="/timeline" element={<Timeline />} />
                            <Route path="/whiteboard" element={<Whiteboard />} />
                            <Route path="/qa" element={<QA />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>
                </div>

                {/* Issue Detail Modal */}
                {selectedIssue && (
                    <IssueModal
                        issue={selectedIssue}
                        onClose={() => setSelectedIssue(null)}
                    />
                )}

                {/* Create Issue Modal */}
                <CreateIssueModal />

                {/* Global Confirmation Modal */}
                <ConfirmationModal />

                {/* Template Editor Modal */}
                {templateEditorOpen && <TemplateEditorModal />}

                {/* Celebration Animation */}
                <Confetti />
            </div>
        </BrowserRouter>
    )
}

export default App

