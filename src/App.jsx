import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useProjectStore } from './stores/projectStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import Board from './pages/Board'
import Backlog from './pages/Backlog'
import Sprints from './pages/Sprints'
import List from './pages/List'
import ListTemplate from './pages/ListTemplate'
import Settings from './pages/Settings'
import Whiteboard from './pages/Whiteboard'
import IssueModal from './components/board/IssueModal'

function App() {
    const { theme, sidebarCollapsed, selectedIssue, setSelectedIssue } = useProjectStore()

    // Initialize theme on mount
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [theme])

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
                            <Route path="/list" element={<List />} />
                            <Route path="/list-template" element={<ListTemplate />} />
                            <Route path="/whiteboard" element={<Whiteboard />} />
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
            </div>
        </BrowserRouter>
    )
}

export default App
