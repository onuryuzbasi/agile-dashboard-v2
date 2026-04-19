import { useLocation } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Bell, Plus, Menu, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
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
    const { profile, user, signOut } = useAuth()
    const {
        getCurrentProject,
        openCreateIssueModal,
        toggleMobileSidebar
    } = useProjectStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const userMenuRef = useRef(null)

    const project = getCurrentProject()
    const displayName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
    const displayEmail = user?.email || ''
    const avatarUrl = profile?.avatar || user?.user_metadata?.avatar_url
    const pageTitle = pageTitles[location.pathname] || 'Agile Dashboard'

    // Close user menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleCreateClick = () => {
        setShowTemplateSelector(true)
    }

    const handleTemplateSelect = (prefilledData) => {
        openCreateIssueModal(prefilledData.type || 'story', prefilledData)
    }

    const handleLogout = async () => {
        setShowUserMenu(false)
        await signOut()
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

                    {/* Create Issue Button */}
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        <Plus size={18} />
                        <span>Create</span>
                    </button>

                    {/* Notifications */}
                    <button className="btn btn-icon btn-ghost" title="Notifications">
                        <Bell size={20} />
                    </button>

                    {/* User Avatar & Dropdown */}
                    <div className="user-menu-wrapper" ref={userMenuRef}>
                        <button
                            className="avatar-btn"
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            title={displayName}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName} className="avatar-img" />
                            ) : (
                                <div className="avatar">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </button>

                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="user-dropdown-info">
                                    <span className="user-dropdown-name">{displayName}</span>
                                    {displayEmail && (
                                        <span className="user-dropdown-email">{displayEmail}</span>
                                    )}
                                </div>
                                <div className="user-dropdown-divider" />
                                <button className="user-dropdown-item logout" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Çıkış Yap</span>
                                </button>
                            </div>
                        )}
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

