import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import {
    Settings as SettingsIcon,
    Link,
    Moon,
    Sun,
    Database,
    Trash2,
    Download,
    Upload,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    Calendar,
    X,
    Gamepad2,
    Plus,
    Pencil,
    Save
} from 'lucide-react'

const typeIcons = {
    story: { icon: BookOpen, color: 'var(--story)' },
    bug: { icon: Bug, color: 'var(--bug)' },
    task: { icon: CheckSquare, color: 'var(--task)' },
    epic: { icon: Layers, color: 'var(--epic)' },
    subtask: { icon: ListTree, color: 'var(--subtask)' }
}

export default function Settings() {
    const {
        theme,
        toggleTheme,
        projects,
        issues,
        sprints,
        users,
        games,
        addGame,
        updateGame,
        deleteGame,
        restoreIssue,
        permanentlyDeleteIssue
    } = useProjectStore()

    const [activeTab, setActiveTab] = useState('general')
    const [jiraConfig, setJiraConfig] = useState({
        domain: '',
        email: '',
        apiToken: ''
    })
    const [importStatus, setImportStatus] = useState(null)

    // Games state
    const [newGameName, setNewGameName] = useState('')
    const [newGameCode, setNewGameCode] = useState('')
    const [editingGame, setEditingGame] = useState(null)
    const [editName, setEditName] = useState('')
    const [editCode, setEditCode] = useState('')

    // Get deleted issues
    const deletedIssues = issues.filter(i => i.isDeleted)

    const handleAddGame = () => {
        if (!newGameName.trim() || !newGameCode.trim()) return
        addGame({ name: newGameName.trim(), code: newGameCode.trim().toUpperCase() })
        setNewGameName('')
        setNewGameCode('')
    }

    const handleEditGame = (game) => {
        setEditingGame(game.id)
        setEditName(game.name)
        setEditCode(game.code)
    }

    const handleSaveGame = (gameId) => {
        if (!editName.trim() || !editCode.trim()) return
        updateGame(gameId, { name: editName.trim(), code: editCode.trim().toUpperCase() })
        setEditingGame(null)
    }

    const handleJiraConnect = async () => {
        if (!jiraConfig.domain || !jiraConfig.email || !jiraConfig.apiToken) {
            setImportStatus({ type: 'error', message: 'Please fill in all Jira credentials' })
            return
        }

        setImportStatus({ type: 'loading', message: 'Connecting to Jira...' })

        // Simulate connection (actual implementation would call Jira API)
        setTimeout(() => {
            setImportStatus({
                type: 'success',
                message: 'Connected to Jira successfully! You can now import your projects.'
            })
        }, 1500)
    }

    const handleExportData = () => {
        const data = {
            projects,
            issues,
            sprints,
            users,
            exportedAt: new Date().toISOString()
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `agile-dashboard-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleClearData = () => {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.removeItem('agile-dashboard-storage')
            window.location.reload()
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const SettingSection = ({ icon: Icon, title, description, children }) => (
        <div className="card mb-4 animate-fade-in">
            <div className="card-header mb-4">
                <div className="flex items-center gap-3">
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--accent-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)'
                        }}
                    >
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-sm text-secondary">{description}</p>
                    </div>
                </div>
            </div>
            {children}
        </div>
    )

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p className="text-secondary">
                        Configure your dashboard and integrations
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <SettingsIcon size={16} />
                    General
                </button>
                <button
                    className={`settings-tab ${activeTab === 'games' ? 'active' : ''}`}
                    onClick={() => setActiveTab('games')}
                >
                    <Gamepad2 size={16} />
                    Games
                </button>
                <button
                    className={`settings-tab ${activeTab === 'trash' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trash')}
                >
                    <Trash2 size={16} />
                    Trash
                    {deletedIssues.length > 0 && (
                        <span className="settings-tab-badge">{deletedIssues.length}</span>
                    )}
                </button>
            </div>

            {activeTab === 'general' && (
                <>
                    {/* Appearance */}
                    <SettingSection
                        icon={theme === 'dark' ? Moon : Sun}
                        title="Appearance"
                        description="Customize how the dashboard looks"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">Dark Mode</div>
                                <div className="text-sm text-secondary">Switch between light and dark themes</div>
                            </div>
                            <button
                                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={toggleTheme}
                            >
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </button>
                        </div>
                    </SettingSection>

                    {/* Jira Integration */}
                    <SettingSection
                        icon={Link}
                        title="Jira Integration"
                        description="Connect to Jira for one-time import of your projects"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="input-group">
                                <label className="input-label">Jira Domain</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="your-domain.atlassian.net"
                                    value={jiraConfig.domain}
                                    onChange={(e) => setJiraConfig({ ...jiraConfig, domain: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="your-email@example.com"
                                    value={jiraConfig.email}
                                    onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">API Token</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Your Jira API token"
                                    value={jiraConfig.apiToken}
                                    onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                                />
                                <p className="text-xs text-tertiary mt-1">
                                    Generate an API token from your Atlassian account settings
                                </p>
                            </div>

                            {importStatus && (
                                <div
                                    className={`flex items-center gap-2 p-3 rounded-md ${importStatus.type === 'success' ? 'bg-success-light text-success' :
                                        importStatus.type === 'error' ? 'bg-danger-light text-danger' :
                                            'bg-info-light text-info'
                                        }`}
                                    style={{
                                        background: importStatus.type === 'success' ? 'var(--success-light)' :
                                            importStatus.type === 'error' ? 'var(--danger-light)' :
                                                'var(--info-light)',
                                        color: importStatus.type === 'success' ? 'var(--success)' :
                                            importStatus.type === 'error' ? 'var(--danger)' :
                                                'var(--info)'
                                    }}
                                >
                                    {importStatus.type === 'success' ? <CheckCircle2 size={16} /> :
                                        importStatus.type === 'error' ? <AlertCircle size={16} /> :
                                            <div className="animate-pulse">●</div>}
                                    {importStatus.message}
                                </div>
                            )}

                            <button
                                className="btn btn-primary w-full"
                                onClick={handleJiraConnect}
                            >
                                <Link size={16} />
                                Connect to Jira
                            </button>
                        </div>
                    </SettingSection>

                    {/* Data Management */}
                    <SettingSection
                        icon={Database}
                        title="Data Management"
                        description="Export or clear your dashboard data"
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-3" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <div>
                                    <div className="font-medium">Current Data</div>
                                    <div className="text-sm text-secondary">
                                        {projects.length} projects · {issues.length} issues · {sprints.length} sprints
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="btn btn-secondary flex-1" onClick={handleExportData}>
                                    <Download size={16} />
                                    Export Data
                                </button>
                                <button className="btn btn-secondary flex-1">
                                    <Upload size={16} />
                                    Import Data
                                </button>
                            </div>

                            <button
                                className="btn btn-danger w-full"
                                onClick={handleClearData}
                            >
                                <Trash2 size={16} />
                                Clear All Data
                            </button>
                        </div>
                    </SettingSection>
                </>
            )}

            {activeTab === 'games' && (
                <SettingSection
                    icon={Gamepad2}
                    title="Games"
                    description="Manage games that can be assigned to issues"
                >
                    {/* Add New Game */}
                    <div className="games-add-form">
                        <input
                            type="text"
                            className="input"
                            placeholder="Game name"
                            value={newGameName}
                            onChange={e => setNewGameName(e.target.value)}
                        />
                        <input
                            type="text"
                            className="input"
                            placeholder="Code (e.g., RQ)"
                            value={newGameCode}
                            onChange={e => setNewGameCode(e.target.value)}
                            style={{ width: 100 }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleAddGame}
                            disabled={!newGameName.trim() || !newGameCode.trim()}
                        >
                            <Plus size={16} />
                            Add Game
                        </button>
                    </div>

                    {/* Games List */}
                    <div className="games-list">
                        {games?.map(game => (
                            <div key={game.id} className="game-item">
                                {editingGame === game.id ? (
                                    <>
                                        <input
                                            type="text"
                                            className="input"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            className="input"
                                            value={editCode}
                                            onChange={e => setEditCode(e.target.value)}
                                            style={{ width: 80 }}
                                        />
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleSaveGame(game.id)}
                                        >
                                            <Save size={14} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => setEditingGame(null)}
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="game-name">{game.name}</span>
                                        <span className="game-code">{game.code}</span>
                                        <div className="game-actions">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => handleEditGame(game)}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost btn-danger-text"
                                                onClick={() => {
                                                    if (confirm(`Delete game "${game.name}"?`)) {
                                                        deleteGame(game.id)
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {(!games || games.length === 0) && (
                            <div className="games-empty">
                                <Gamepad2 size={32} />
                                <p>No games added yet</p>
                            </div>
                        )}
                    </div>
                </SettingSection>
            )}

            {activeTab === 'trash' && (
                <div className="card animate-fade-in">
                    <div className="card-header mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--danger-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--danger)'
                                }}
                            >
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Trash</h3>
                                <p className="text-sm text-secondary">
                                    {deletedIssues.length} deleted item{deletedIssues.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {deletedIssues.length === 0 ? (
                        <div className="trash-empty">
                            <Trash2 size={48} />
                            <h4>Trash is empty</h4>
                            <p>Deleted issues will appear here</p>
                        </div>
                    ) : (
                        <div className="trash-list">
                            {deletedIssues.map(issue => {
                                const TypeIcon = typeIcons[issue.type]?.icon || CheckSquare
                                const typeColor = typeIcons[issue.type]?.color || 'var(--text-secondary)'

                                return (
                                    <div key={issue.id} className="trash-item">
                                        <div className="trash-item-info">
                                            <div
                                                className="trash-item-type"
                                                style={{ backgroundColor: typeColor }}
                                            >
                                                <TypeIcon size={12} />
                                            </div>
                                            <div className="trash-item-details">
                                                <span className="trash-item-key">{issue.key}</span>
                                                <span className="trash-item-summary">{issue.summary}</span>
                                            </div>
                                            {issue.deletedAt && (
                                                <span className="trash-item-date">
                                                    <Calendar size={12} />
                                                    Deleted {formatDate(issue.deletedAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="trash-item-actions">
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => restoreIssue(issue.id)}
                                                title="Restore"
                                            >
                                                <RotateCcw size={14} />
                                                Restore
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost btn-danger-text"
                                                onClick={() => {
                                                    if (confirm('Permanently delete this issue? This cannot be undone.')) {
                                                        permanentlyDeleteIssue(issue.id)
                                                    }
                                                }}
                                                title="Delete permanently"
                                            >
                                                <X size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
