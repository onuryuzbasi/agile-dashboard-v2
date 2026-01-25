import { useLocation } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { useState } from 'react'
import TemplateSelectorModal from '../common/TemplateSelectorModal'

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/board': 'Board',
    '/backlog': 'Backlog',
    '/sprints': 'Sprints',
    '/settings': 'Settings'
}

export default function Header() {
    const location = useLocation()
    const {
        getCurrentProject,
        users,
        openCreateIssueModal,
        toggleMobileSidebar,
        issueTemplates
    } = useProjectStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)

    const project = getCurrentProject()
    const currentUser = users[0] // Mock current user
    const pageTitle = pageTitles[location.pathname] || 'Agile Dashboard'

    // Always open template selector - even if empty, users can create first template
    const handleCreateClick = () => {
        setShowTemplateSelector(true)
    }

    // Handle template selection - open create modal with prefilled data
    const handleTemplateSelect = (prefilledData) => {
        openCreateIssueModal(prefilledData.type || 'story', prefilledData)
    }

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <button
                        className="btn btn-icon btn-ghost lg:hidden"
                        onClick={toggleMobileSidebar}
                    >
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

                    {/* Create Issue Button - Opens Template Selector */}
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

            {/* Template Selector Modal */}
            {showTemplateSelector && (
                <TemplateSelectorModal
                    onClose={() => setShowTemplateSelector(false)}
                    onSelectTemplate={handleTemplateSelect}
                />
            )}
        </>
    )
}

