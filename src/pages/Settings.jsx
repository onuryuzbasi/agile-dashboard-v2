import { useState } from 'react'
import { useProjectStore } from '../stores/projectStore'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
    Save,
    Sliders,
    ArrowUp,
    ArrowDown,
    Minus,
    Tag,
    Building2,
    Circle,
    GripVertical
} from 'lucide-react'

// Icon mapping for dynamic icon rendering
const iconMap = {
    BookOpen, Bug, CheckSquare, Layers, ListTree,
    ArrowUp, ArrowDown, Minus, Tag, Circle
}

// Color presets for easy selection
const colorPresets = [
    '#CD1316', '#E97F33', '#E9A233', '#2D8738', '#57A55A',
    '#36B37E', '#0052CC', '#6554C0', '#FF5630', '#FF991F',
    '#00B8D9', '#4FADE6', '#904EE2', '#42526E', '#DFE1E6'
]

const typeIcons = {
    story: { icon: BookOpen, color: 'var(--story)' },
    bug: { icon: Bug, color: 'var(--bug)' },
    task: { icon: CheckSquare, color: 'var(--task)' },
    epic: { icon: Layers, color: 'var(--epic)' },
    subtask: { icon: ListTree, color: 'var(--subtask)' }
}

// SettingSection component - defined outside to prevent re-mounting on state changes
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

// Sortable Field Item Component
function SortableFieldItem({ id, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
    }

    return (
        <div ref={setNodeRef} style={style} className="field-item sortable-item">
            <div className="drag-handle" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </div>
            {children}
        </div>
    )
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
        departments,
        fieldConfig,
        addGame,
        updateGame,
        deleteGame,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        addFieldConfigItem,
        updateFieldConfigItem,
        deleteFieldConfigItem,
        reorderFieldConfigItem,
        reorderDepartments,
        restoreIssue,
        permanentlyDeleteIssue
    } = useProjectStore()

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Handle drag end for reordering
    const handleDragEnd = (event, fieldType, items) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex(item => item.id === active.id)
            const newIndex = items.findIndex(item => item.id === over.id)
            const newOrder = arrayMove(items, oldIndex, newIndex)
            if (fieldType === 'departments') {
                reorderDepartments(newOrder)
            } else {
                reorderFieldConfigItem(fieldType, newOrder)
            }
        }
    }

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

    // Field Manager state
    const [newFieldValue, setNewFieldValue] = useState({})
    const [editingFieldItem, setEditingFieldItem] = useState(null)
    const [editFieldValue, setEditFieldValue] = useState({})

    // Get deleted issues
    const deletedIssues = issues.filter(i => i.isDeleted)

    // Field Manager handlers
    const handleAddFieldItem = (fieldType, defaults = {}) => {
        const value = newFieldValue[fieldType]
        if (!value?.name && !value?.label && !value?.key) return

        const item = {
            key: value.key || value.name?.toLowerCase().replace(/\s+/g, '_') || `item-${Date.now()}`,
            label: value.label || value.name,
            name: value.name,
            color: value.color || colorPresets[Math.floor(Math.random() * colorPresets.length)],
            ...defaults,
            ...value
        }
        addFieldConfigItem(fieldType, item)
        setNewFieldValue({ ...newFieldValue, [fieldType]: {} })
    }

    const handleEditFieldItem = (fieldType, item) => {
        setEditingFieldItem(`${fieldType}-${item.id}`)
        setEditFieldValue({ [fieldType]: { ...item } })
    }

    const handleSaveFieldItem = (fieldType, itemId) => {
        const updates = editFieldValue[fieldType]
        if (updates) {
            updateFieldConfigItem(fieldType, itemId, updates)
        }
        setEditingFieldItem(null)
        setEditFieldValue({})
    }

    const handleDeleteFieldItem = (fieldType, itemId, itemName) => {
        if (confirm(`Delete "${itemName}"? Issues using this value may be affected.`)) {
            deleteFieldConfigItem(fieldType, itemId)
        }
    }

    // Department handlers
    const handleAddDepartment = () => {
        const value = newFieldValue.departments
        if (!value?.name) return
        addDepartment({ name: value.name, code: value.code || value.name.slice(0, 3).toUpperCase() })
        setNewFieldValue({ ...newFieldValue, departments: {} })
    }

    const handleSaveDepartment = (deptId) => {
        const updates = editFieldValue.departments
        if (updates) {
            updateDepartment(deptId, updates)
        }
        setEditingFieldItem(null)
        setEditFieldValue({})
    }

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
                    className={`settings-tab ${activeTab === 'fields' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fields')}
                >
                    <Sliders size={16} />
                    Field Manager
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

            {activeTab === 'fields' && (
                <div className="field-manager">
                    {/* Statuses Section */}
                    <SettingSection
                        icon={CheckSquare}
                        title="Statuses"
                        description="Configure workflow statuses for issues"
                    >
                        <div className="field-manager-add">
                            <input
                                type="text"
                                className="input"
                                placeholder="Status name (e.g., Testing)"
                                value={newFieldValue.statuses?.label || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    statuses: { ...newFieldValue.statuses, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                                })}
                            />
                            <div className="color-picker-mini">
                                {colorPresets.slice(0, 8).map(color => (
                                    <button
                                        key={color}
                                        className={`color-dot ${newFieldValue.statuses?.bgColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewFieldValue({
                                            ...newFieldValue,
                                            statuses: { ...newFieldValue.statuses, bgColor: color, textColor: '#FFFFFF' }
                                        })}
                                    />
                                ))}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleAddFieldItem('statuses', { textColor: '#FFFFFF' })}
                                disabled={!newFieldValue.statuses?.label}
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleDragEnd(event, 'statuses', fieldConfig?.statuses || [])}
                        >
                            <SortableContext
                                items={(fieldConfig?.statuses || []).map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="field-manager-list">
                                    {fieldConfig?.statuses?.map(status => (
                                        <SortableFieldItem key={status.id} id={status.id}>
                                            {editingFieldItem === `statuses-${status.id}` ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={editFieldValue.statuses?.label || ''}
                                                        onChange={e => setEditFieldValue({
                                                            ...editFieldValue,
                                                            statuses: { ...editFieldValue.statuses, label: e.target.value }
                                                        })}
                                                        autoFocus
                                                    />
                                                    <div className="color-picker-mini">
                                                        {colorPresets.slice(0, 8).map(color => (
                                                            <button
                                                                key={color}
                                                                className={`color-dot ${editFieldValue.statuses?.bgColor === color ? 'selected' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => setEditFieldValue({
                                                                    ...editFieldValue,
                                                                    statuses: { ...editFieldValue.statuses, bgColor: color }
                                                                })}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button className="btn btn-sm btn-primary" onClick={() => handleSaveFieldItem('statuses', status.id)}>
                                                        <Save size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-ghost" onClick={() => setEditingFieldItem(null)}>
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span
                                                        className="field-item-badge"
                                                        style={{ backgroundColor: status.bgColor, color: status.textColor }}
                                                    >
                                                        {status.label}
                                                    </span>
                                                    <span className="field-item-key">{status.key}</span>
                                                    <div className="field-item-actions">
                                                        <button className="btn btn-sm btn-ghost" onClick={() => handleEditFieldItem('statuses', status)}>
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => handleDeleteFieldItem('statuses', status.id, status.label)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </SortableFieldItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </SettingSection>

                    {/* Priorities Section */}
                    <SettingSection
                        icon={ArrowUp}
                        title="Priorities"
                        description="Configure priority levels for issues"
                    >
                        <div className="field-manager-add">
                            <input
                                type="text"
                                className="input"
                                placeholder="Priority name (e.g., Critical)"
                                value={newFieldValue.priorities?.label || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    priorities: { ...newFieldValue.priorities, label: e.target.value, key: e.target.value.toLowerCase() }
                                })}
                            />
                            <div className="color-picker-mini">
                                {colorPresets.slice(0, 8).map(color => (
                                    <button
                                        key={color}
                                        className={`color-dot ${newFieldValue.priorities?.color === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewFieldValue({
                                            ...newFieldValue,
                                            priorities: { ...newFieldValue.priorities, color }
                                        })}
                                    />
                                ))}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleAddFieldItem('priorities', { icon: 'Minus', order: (fieldConfig?.priorities?.length || 0) + 1 })}
                                disabled={!newFieldValue.priorities?.label}
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleDragEnd(event, 'priorities', fieldConfig?.priorities || [])}
                        >
                            <SortableContext
                                items={(fieldConfig?.priorities || []).map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="field-manager-list">
                                    {fieldConfig?.priorities?.map(priority => {
                                        const IconComp = iconMap[priority.icon] || Minus
                                        return (
                                            <SortableFieldItem key={priority.id} id={priority.id}>
                                                {editingFieldItem === `priorities-${priority.id}` ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            className="input"
                                                            value={editFieldValue.priorities?.label || ''}
                                                            onChange={e => setEditFieldValue({
                                                                ...editFieldValue,
                                                                priorities: { ...editFieldValue.priorities, label: e.target.value }
                                                            })}
                                                            autoFocus
                                                        />
                                                        <div className="color-picker-mini">
                                                            {colorPresets.slice(0, 8).map(color => (
                                                                <button
                                                                    key={color}
                                                                    className={`color-dot ${editFieldValue.priorities?.color === color ? 'selected' : ''}`}
                                                                    style={{ backgroundColor: color }}
                                                                    onClick={() => setEditFieldValue({
                                                                        ...editFieldValue,
                                                                        priorities: { ...editFieldValue.priorities, color }
                                                                    })}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button className="btn btn-sm btn-primary" onClick={() => handleSaveFieldItem('priorities', priority.id)}>
                                                            <Save size={14} />
                                                        </button>
                                                        <button className="btn btn-sm btn-ghost" onClick={() => setEditingFieldItem(null)}>
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconComp size={16} style={{ color: priority.color }} />
                                                        <span className="field-item-label" style={{ color: priority.color }}>{priority.label}</span>
                                                        <span className="field-item-key">{priority.key}</span>
                                                        <div className="field-item-actions">
                                                            <button className="btn btn-sm btn-ghost" onClick={() => handleEditFieldItem('priorities', priority)}>
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => handleDeleteFieldItem('priorities', priority.id, priority.label)}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </SortableFieldItem>
                                        )
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </SettingSection>

                    {/* Issue Types Section */}
                    <SettingSection
                        icon={Layers}
                        title="Issue Types"
                        description="Configure types of issues (Story, Bug, Task, etc.)"
                    >
                        <div className="field-manager-add">
                            <input
                                type="text"
                                className="input"
                                placeholder="Type name (e.g., Feature)"
                                value={newFieldValue.issueTypes?.label || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    issueTypes: { ...newFieldValue.issueTypes, label: e.target.value, key: e.target.value.toLowerCase() }
                                })}
                            />
                            <div className="color-picker-mini">
                                {colorPresets.slice(0, 8).map(color => (
                                    <button
                                        key={color}
                                        className={`color-dot ${newFieldValue.issueTypes?.color === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewFieldValue({
                                            ...newFieldValue,
                                            issueTypes: { ...newFieldValue.issueTypes, color, bgColor: color + '22' }
                                        })}
                                    />
                                ))}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleAddFieldItem('issueTypes', { icon: 'CheckSquare' })}
                                disabled={!newFieldValue.issueTypes?.label}
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                        <div className="field-manager-list">
                            {fieldConfig?.issueTypes?.map(type => {
                                const IconComp = iconMap[type.icon] || CheckSquare
                                return (
                                    <div key={type.id} className="field-item">
                                        {editingFieldItem === `issueTypes-${type.id}` ? (
                                            <>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    value={editFieldValue.issueTypes?.label || ''}
                                                    onChange={e => setEditFieldValue({
                                                        ...editFieldValue,
                                                        issueTypes: { ...editFieldValue.issueTypes, label: e.target.value }
                                                    })}
                                                    autoFocus
                                                />
                                                <div className="color-picker-mini">
                                                    {colorPresets.slice(0, 8).map(color => (
                                                        <button
                                                            key={color}
                                                            className={`color-dot ${editFieldValue.issueTypes?.color === color ? 'selected' : ''}`}
                                                            style={{ backgroundColor: color }}
                                                            onClick={() => setEditFieldValue({
                                                                ...editFieldValue,
                                                                issueTypes: { ...editFieldValue.issueTypes, color }
                                                            })}
                                                        />
                                                    ))}
                                                </div>
                                                <button className="btn btn-sm btn-primary" onClick={() => handleSaveFieldItem('issueTypes', type.id)}>
                                                    <Save size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-ghost" onClick={() => setEditingFieldItem(null)}>
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="field-item-icon" style={{ backgroundColor: type.bgColor || type.color + '22' }}>
                                                    <IconComp size={14} style={{ color: type.color }} />
                                                </div>
                                                <span className="field-item-label">{type.label}</span>
                                                <span className="field-item-key">{type.key}</span>
                                                <div className="field-item-actions">
                                                    <button className="btn btn-sm btn-ghost" onClick={() => handleEditFieldItem('issueTypes', type)}>
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => handleDeleteFieldItem('issueTypes', type.id, type.label)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </SettingSection>

                    {/* Departments Section */}
                    <SettingSection
                        icon={Building2}
                        title="Departments"
                        description="Configure departments for issue assignment"
                    >
                        <div className="field-manager-add">
                            <input
                                type="text"
                                className="input"
                                placeholder="Department name"
                                value={newFieldValue.departments?.name || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    departments: { ...newFieldValue.departments, name: e.target.value }
                                })}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="Code"
                                value={newFieldValue.departments?.code || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    departments: { ...newFieldValue.departments, code: e.target.value.toUpperCase() }
                                })}
                                style={{ width: 80 }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleAddDepartment}
                                disabled={!newFieldValue.departments?.name}
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                        <div className="field-manager-list">
                            {departments?.map(dept => (
                                <div key={dept.id} className="field-item">
                                    {editingFieldItem === `departments-${dept.id}` ? (
                                        <>
                                            <input
                                                type="text"
                                                className="input"
                                                value={editFieldValue.departments?.name || ''}
                                                onChange={e => setEditFieldValue({
                                                    ...editFieldValue,
                                                    departments: { ...editFieldValue.departments, name: e.target.value }
                                                })}
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                className="input"
                                                value={editFieldValue.departments?.code || ''}
                                                onChange={e => setEditFieldValue({
                                                    ...editFieldValue,
                                                    departments: { ...editFieldValue.departments, code: e.target.value.toUpperCase() }
                                                })}
                                                style={{ width: 80 }}
                                            />
                                            <button className="btn btn-sm btn-primary" onClick={() => handleSaveDepartment(dept.id)}>
                                                <Save size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingFieldItem(null)}>
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Building2 size={16} style={{ color: 'var(--accent)' }} />
                                            <span className="field-item-label">{dept.name}</span>
                                            <span className="field-item-key">{dept.code}</span>
                                            <div className="field-item-actions">
                                                <button className="btn btn-sm btn-ghost" onClick={() => {
                                                    setEditingFieldItem(`departments-${dept.id}`)
                                                    setEditFieldValue({ departments: { ...dept } })
                                                }}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => {
                                                    if (confirm(`Delete department "${dept.name}"?`)) {
                                                        deleteDepartment(dept.id)
                                                    }
                                                }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </SettingSection>

                    {/* Labels Section */}
                    <SettingSection
                        icon={Tag}
                        title="Labels"
                        description="Configure labels/tags for issues"
                    >
                        <div className="field-manager-add">
                            <input
                                type="text"
                                className="input"
                                placeholder="Label name (e.g., documentation)"
                                value={newFieldValue.labels?.name || ''}
                                onChange={e => setNewFieldValue({
                                    ...newFieldValue,
                                    labels: { ...newFieldValue.labels, name: e.target.value }
                                })}
                            />
                            <div className="color-picker-mini">
                                {colorPresets.slice(0, 8).map(color => (
                                    <button
                                        key={color}
                                        className={`color-dot ${newFieldValue.labels?.color === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewFieldValue({
                                            ...newFieldValue,
                                            labels: { ...newFieldValue.labels, color }
                                        })}
                                    />
                                ))}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => handleAddFieldItem('labels')}
                                disabled={!newFieldValue.labels?.name}
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                        <div className="field-manager-list field-manager-labels">
                            {fieldConfig?.labels?.map(label => (
                                <div key={label.id} className="field-item-chip">
                                    {editingFieldItem === `labels-${label.id}` ? (
                                        <>
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={editFieldValue.labels?.name || ''}
                                                onChange={e => setEditFieldValue({
                                                    ...editFieldValue,
                                                    labels: { ...editFieldValue.labels, name: e.target.value }
                                                })}
                                                autoFocus
                                            />
                                            <button className="btn btn-sm btn-primary" onClick={() => handleSaveFieldItem('labels', label.id)}>
                                                <Save size={12} />
                                            </button>
                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingFieldItem(null)}>
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className="label-chip"
                                                style={{ backgroundColor: label.color + '22', color: label.color, borderColor: label.color }}
                                            >
                                                {label.name}
                                            </span>
                                            <button className="chip-edit" onClick={() => handleEditFieldItem('labels', label)}>
                                                <Pencil size={10} />
                                            </button>
                                            <button className="chip-delete" onClick={() => handleDeleteFieldItem('labels', label.id, label.name)}>
                                                <X size={10} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </SettingSection>
                </div>
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
