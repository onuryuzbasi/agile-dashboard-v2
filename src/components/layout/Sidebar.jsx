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
    PenTool
} from 'lucide-react'

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/board', icon: Kanban, label: 'Board' },
    { path: '/backlog', icon: ListTodo, label: 'Backlog' },
    { path: '/sprints', icon: Zap, label: 'Sprints' },
    { path: '/whiteboard', icon: PenTool, label: 'Whiteboard' },
]

const settingsItem = { path: '/settings', icon: Settings, label: 'Settings' }

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, theme, toggleTheme } = useProjectStore()
    const location = useLocation()

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Kanban size={20} />
                </div>
                {!sidebarCollapsed && (
                    <span className="sidebar-brand">Agile</span>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    {!sidebarCollapsed && (
                        <div className="nav-section-title">Menu</div>
                    )}
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            title={sidebarCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </div>

                <div className="nav-section">
                    {!sidebarCollapsed && (
                        <div className="nav-section-title">Configuration</div>
                    )}
                    <NavLink
                        to={settingsItem.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                        title={sidebarCollapsed ? settingsItem.label : undefined}
                    >
                        <settingsItem.icon size={20} />
                        {!sidebarCollapsed && <span>{settingsItem.label}</span>}
                    </NavLink>
                </div>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className="nav-item w-full"
                    onClick={toggleTheme}
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    {!sidebarCollapsed && (
                        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    )}
                </button>

                <button
                    className="nav-item w-full mt-2"
                    onClick={toggleSidebar}
                    title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    {!sidebarCollapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    )
}
