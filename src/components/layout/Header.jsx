import { useLocation } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { useState } from 'react'

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/board': 'Board',
    '/backlog': 'Backlog',
    '/sprints': 'Sprints',
    '/settings': 'Settings'
}

export default function Header() {
    const location = useLocation()
    const { getCurrentProject, users, openCreateModal } = useProjectStore()
    const [searchQuery, setSearchQuery] = useState('')

    const project = getCurrentProject()
    const currentUser = users[0] // Mock current user
    const pageTitle = pageTitles[location.pathname] || 'Agile Dashboard'

    // Open create modal with Epic as default type
    const handleCreateClick = () => {
        openCreateModal('epic')
    }

    return (
        <header className="header">
            <div className="header-left">
                <button className="btn btn-icon btn-ghost lg:hidden">
                    <Menu size={20} />
                </button>

                <div>
                    <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                        {pageTitle}
                    </h1>
                    {project && (
                        <p className="text-sm text-secondary">
                            {project.name}
                        </p>
                    )}
                </div>
            </div>

            <div className="header-right">
                {/* Search */}
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search issues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Create Issue Button - WIRED TO MODAL */}
                <button className="btn btn-primary" onClick={handleCreateClick}>
                    <Plus size={18} />
                    <span>Create</span>
                </button>

                {/* Notifications */}
                <button className="btn btn-icon btn-ghost" title="Notifications">
                    <Bell size={20} />
                </button>

                {/* User Avatar */}
                <div className="avatar" title={currentUser?.name}>
                    {currentUser?.name?.charAt(0) || 'U'}
                </div>
            </div>
        </header>
    )
}

