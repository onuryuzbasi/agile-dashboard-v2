import { NavLink, useLocation } from 'react-router-dom'
import { useProjectStore } from '../../stores/projectStore'
import {
    LayoutDashboard,
    Kanban,
    ListTodo,
    Zap,
    Settings,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    PenTool,
    LayoutList,
    GanttChartSquare,
    TestTube2
} from 'lucide-react'

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/board', icon: Kanban, label: 'Board' },
    { path: '/backlog', icon: ListTodo, label: 'Backlog' },
    { path: '/sprints', icon: Zap, label: 'Sprints' },
    { path: '/list-template', icon: LayoutList, label: 'List' },
    { path: '/timeline', icon: GanttChartSquare, label: 'Timeline' },
    { path: '/whiteboard', icon: PenTool, label: 'Whiteboard' },
    { path: '/qa', icon: TestTube2, label: 'QA' },
]

const settingsItem = { path: '/settings', icon: Settings, label: 'Settings' }

export default function Sidebar() {
    const {
        sidebarCollapsed,
        toggleSidebar,
        theme,
        toggleTheme,
        mobileSidebarOpen,
        setMobileSidebarOpen
    } = useProjectStore()
    const location = useLocation()

    // Close mobile sidebar on route change
    const handleNavLinkClick = () => {
        setMobileSidebarOpen(false)
    }

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop ${mobileSidebarOpen ? 'open' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
            />

            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <Kanban size={20} />
                    </div>
                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                        <span className="sidebar-brand">Agile</span>
                    )}
                    {/* Mobile Close Button */}
                    <button
                        className="btn-icon btn-ghost lg:hidden ml-auto"
                        onClick={() => setMobileSidebarOpen(false)}
                    >
                        <ChevronLeft size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav custom-scrollbar">
                    <div className="nav-section">
                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                            <div className="nav-section-title">Menu</div>
                        )}
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleNavLinkClick}
                                className={({ isActive }) =>
                                    `nav-item hover-lift press-active ${isActive ? 'active' : ''}`
                                }
                                title={sidebarCollapsed && !mobileSidebarOpen ? item.label : undefined}
                            >
                                <item.icon size={20} />
                                {(!sidebarCollapsed || mobileSidebarOpen) && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-section">
                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                            <div className="nav-section-title">Configuration</div>
                        )}
                        <NavLink
                            to={settingsItem.path}
                            onClick={handleNavLinkClick}
                            className={({ isActive }) =>
                                `nav-item hover-lift press-active ${isActive ? 'active' : ''}`
                            }
                            title={sidebarCollapsed && !mobileSidebarOpen ? settingsItem.label : undefined}
                        >
                            <settingsItem.icon size={20} />
                            {(!sidebarCollapsed || mobileSidebarOpen) && <span>{settingsItem.label}</span>}
                        </NavLink>
                    </div>
                </nav >

                {/* Footer */}
                < div className="sidebar-footer" >
                    <button
                        className="nav-item w-full hover-lift press-active"
                        onClick={toggleTheme}
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        {(!sidebarCollapsed || mobileSidebarOpen) && (
                            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                        )}
                    </button>

                    <button
                        className="nav-item w-full mt-2 hidden lg:flex hover-lift press-active"
                        onClick={toggleSidebar}
                        title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        {!sidebarCollapsed && <span>Collapse</span>}
                    </button>
                </div >
            </aside >
        </>
    )
}
