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
    AlertCircle
} from 'lucide-react'

export default function Settings() {
    const { theme, toggleTheme, projects, issues, sprints, users } = useProjectStore()
    const [jiraConfig, setJiraConfig] = useState({
        domain: '',
        email: '',
        apiToken: ''
    })
    const [importStatus, setImportStatus] = useState(null)

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
        </div>
    )
}
