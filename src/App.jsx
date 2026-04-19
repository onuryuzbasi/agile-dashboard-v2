import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useProjectStore } from './stores/projectStore'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Backlog from './pages/Backlog'
import Sprints from './pages/Sprints'
// List page removed - using ListTemplate instead
import ListTemplate from './pages/ListTemplate'
import Settings from './pages/Settings'
import BulkCreator from './pages/BulkCreator'
import Whiteboard from './pages/Whiteboard'
import Timeline from './pages/Timeline'
import Roadmap from './pages/Roadmap'
import LoginPage from './pages/LoginPage'
import AuthCallback from './pages/AuthCallback'
import IssueModal from './components/board/IssueModal'
import CreateIssueModal from './components/board/CreateIssueModal'
import ConfirmationModal from './components/common/ConfirmationModal'
import TemplateEditorModal from './components/common/TemplateEditorModal'
import Confetti from './components/common/Confetti'

function AppContent() {
    const { session } = useAuth()
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

    // Initialize from Supabase on mount (only when authenticated)
    useEffect(() => {
        if (session) {
            initFromSupabase()
        }
    }, [session, initFromSupabase])

    // Initialize theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

    // Show loading screen while fetching data
    if (!isInitialized && session) {
        return (
            <div className="app-loading">
                <div className="loading-spinner" />
                <p>Loading Agile Dashboard...</p>
            </div>
        )
    }

    return (
        <>
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
                            <Route path="/roadmap" element={<Roadmap />} />
                            <Route path="/whiteboard" element={<Whiteboard />} />
                            <Route path="/bulk-create" element={<BulkCreator />} />
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
        </>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes */}
                <Route path="/*" element={
                    <ProtectedRoute>
                        <AppContent />
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
