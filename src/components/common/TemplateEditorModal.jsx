import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    FileText,
    Bug,
    CheckSquare,
    Layers,
    Zap,
    Save,
    Plus,
    Trash2,
    Clock,
    Target,
    GitBranch,
    Sparkles
} from 'lucide-react'
import './TemplateEditorModal.css'

// Reduced icons - only essential ones
const availableIcons = [
    { name: 'Layers', icon: Layers, label: 'Epic' },
    { name: 'FileText', icon: FileText, label: 'Story' },
    { name: 'Bug', icon: Bug, label: 'Bug' },
    { name: 'CheckSquare', icon: CheckSquare, label: 'Task' },
    { name: 'Zap', icon: Zap, label: 'Feature' }
]

// Child issue type options
const childTypeOptions = [
    { value: 'story', label: 'Story' },
    { value: 'task', label: 'Task' },
    { value: 'bug', label: 'Bug' }
]

// Child naming modes
const childNamingModes = [
    { value: 'custom', label: 'Custom Name' },
    { value: 'full', label: 'Use Epic Name' },
    { value: 'prefix', label: 'Epic Name + Custom Suffix' },
    { value: 'suffix', label: 'Custom Prefix + Epic Name' }
]

export default function TemplateEditorModal({ onClose, onSave }) {
    const {
        fieldConfig,
        users,
        sprints,
        issues,
        departments,
        games,
        addIssueTemplate,
        closeTemplateEditor
    } = useProjectStore()

    const [templateName, setTemplateName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState('Layers')
    const [isSaving, setIsSaving] = useState(false)

    // Epics for parent selection
    const epics = useMemo(() =>
        issues.filter(i => i.type === 'epic' && !i.isDeleted),
        [issues]
    )

    // Active sprints only
    const activeSprints = useMemo(() =>
        sprints.filter(s => s.state !== 'closed'),
        [sprints]
    )

    // Prefilled data state - ALL system fields (matching CreateIssueModal)
    const [prefilledData, setPrefilledData] = useState({
        type: '',
        status: '',
        priority: '',
        description: '',
        assigneeId: '',
        reporterId: '',
        sprintId: '',
        gameId: '',
        departmentId: '',
        parentId: '',
        originalEstimate: '',
        startDate: '',
        dueDate: ''
    })

    // Child issues template (for Epic templates)
    const [childTemplates, setChildTemplates] = useState([])
    const [newChildType, setNewChildType] = useState('story')
    const [newChildNamingMode, setNewChildNamingMode] = useState('custom')
    const [newChildName, setNewChildName] = useState('')

    const isEpicTemplate = prefilledData.type === 'epic'

    const handleFieldChange = (field, value) => {
        setPrefilledData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleAddChildTemplate = () => {
        if (newChildNamingMode === 'custom' && !newChildName.trim()) return

        setChildTemplates(prev => [...prev, {
            id: Date.now(),
            type: newChildType,
            namingMode: newChildNamingMode,
            customName: newChildNamingMode === 'custom' ? newChildName.trim() : '',
            suffix: newChildNamingMode === 'prefix' ? newChildName.trim() : '',
            prefix: newChildNamingMode === 'suffix' ? newChildName.trim() : ''
        }])
        setNewChildName('')
    }

    const handleRemoveChildTemplate = (id) => {
        setChildTemplates(prev => prev.filter(c => c.id !== id))
    }

    const getChildPreview = (child) => {
        const epicName = '[Epic Name]'
        switch (child.namingMode) {
            case 'full':
                return epicName
            case 'prefix':
                return `${epicName} - ${child.suffix || '...'}`
            case 'suffix':
                return `${child.prefix || '...'} - ${epicName}`
            case 'custom':
            default:
                return child.customName || '...'
        }
    }

    const handleSave = async () => {
        if (!templateName.trim()) {
            alert('Please enter a template name')
            return
        }

        setIsSaving(true)

        // Filter out empty values from prefilled data
        const filteredData = Object.fromEntries(
            Object.entries(prefilledData).filter(([_, v]) => v !== '' && v !== null)
        )

        // Include child templates if Epic
        if (isEpicTemplate && childTemplates.length > 0) {
            filteredData.childTemplates = childTemplates.map(c => ({
                type: c.type,
                namingMode: c.namingMode,
                customName: c.customName,
                prefix: c.prefix,
                suffix: c.suffix
            }))
        }

        const result = await addIssueTemplate({
            name: templateName.trim(),
            icon: selectedIcon,
            prefilledData: filteredData,
            isGlobal: true
        })

        setIsSaving(false)

        if (result) {
            closeTemplateEditor()
            if (onSave) onSave(result)
        }
    }

    const handleClose = () => {
        closeTemplateEditor()
        if (onClose) onClose()
    }

    return (
        <div className="template-editor-overlay" onClick={handleClose}>
            <div className="template-editor-modal" onClick={e => e.stopPropagation()}>
                <div className="template-editor-header">
                    <h2>Create New Template</h2>
                    <button className="template-close-btn" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="template-editor-content">
                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Template Identity */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <Sparkles size={16} />
                            <span>Template Identity</span>
                        </div>

                        <div className="template-field">
                            <label>Template Name *</label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Bug Report, Feature Request"
                                className="template-input"
                                autoFocus
                            />
                        </div>

                        <div className="template-field">
                            <label>Icon</label>
                            <div className="icon-selector">
                                {availableIcons.map(({ name, icon: Icon, label }) => (
                                    <button
                                        key={name}
                                        className={`icon-option ${selectedIcon === name ? 'selected' : ''}`}
                                        onClick={() => setSelectedIcon(name)}
                                        title={label}
                                    >
                                        <Icon size={18} />
                                        <span className="icon-label">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Issue Classification */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <Layers size={16} />
                            <span>Issue Classification</span>
                        </div>

                        <div className="template-field-grid">
                            <div className="template-field">
                                <label>Type</label>
                                <select
                                    value={prefilledData.type}
                                    onChange={(e) => handleFieldChange('type', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {fieldConfig.issueTypes?.map(type => (
                                        <option key={type.key} value={type.key}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="template-field">
                                <label>Priority</label>
                                <select
                                    value={prefilledData.priority}
                                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {fieldConfig.priorities?.map(priority => (
                                        <option key={priority.key} value={priority.key}>
                                            {priority.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="template-field">
                                <label>Status</label>
                                <select
                                    value={prefilledData.status}
                                    onChange={(e) => handleFieldChange('status', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {fieldConfig.statuses?.map(status => (
                                        <option key={status.key} value={status.key}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!isEpicTemplate && (
                                <div className="template-field">
                                    <label>Parent Epic</label>
                                    <select
                                        value={prefilledData.parentId}
                                        onChange={(e) => handleFieldChange('parentId', e.target.value)}
                                        className="template-select"
                                    >
                                        <option value="">-- No default --</option>
                                        {epics.map(epic => (
                                            <option key={epic.id} value={epic.id}>
                                                {epic.key} - {epic.summary?.slice(0, 30)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Child Issues (Epic only) */}
                    {/* ═══════════════════════════════════════════ */}
                    {isEpicTemplate && (
                        <div className="template-section template-section-highlight">
                            <div className="template-section-header">
                                <Plus size={16} />
                                <span>Child Issues</span>
                                {childTemplates.length > 0 && (
                                    <span className="template-badge">{childTemplates.length}</span>
                                )}
                            </div>
                            <p className="template-section-desc">
                                Define child issues that will be auto-created with this Epic
                            </p>

                            {/* Child Issue Input Row */}
                            <div className="child-template-input">
                                <select
                                    value={newChildType}
                                    onChange={(e) => setNewChildType(e.target.value)}
                                    className="template-select child-type-select"
                                >
                                    {childTypeOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                                <select
                                    value={newChildNamingMode}
                                    onChange={(e) => setNewChildNamingMode(e.target.value)}
                                    className="template-select child-naming-select"
                                >
                                    {childNamingModes.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                                {newChildNamingMode !== 'full' && (
                                    <input
                                        type="text"
                                        value={newChildName}
                                        onChange={(e) => setNewChildName(e.target.value)}
                                        placeholder={
                                            newChildNamingMode === 'custom' ? 'Issue name...' :
                                                newChildNamingMode === 'prefix' ? 'Suffix text...' :
                                                    'Prefix text...'
                                        }
                                        className="template-input child-name-input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddChildTemplate()
                                            }
                                        }}
                                    />
                                )}

                                <button
                                    type="button"
                                    className="btn btn-icon btn-primary child-add-btn"
                                    onClick={handleAddChildTemplate}
                                    disabled={newChildNamingMode === 'custom' && !newChildName.trim()}
                                    title="Add child issue"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Child Templates List */}
                            {childTemplates.length > 0 && (
                                <div className="child-templates-list">
                                    {childTemplates.map((child) => (
                                        <div key={child.id} className="child-template-item">
                                            <span className={`child-type-badge ${child.type}`}>
                                                {child.type}
                                            </span>
                                            <span className="child-template-preview">
                                                {getChildPreview(child)}
                                            </span>
                                            <span className="child-naming-mode">
                                                {childNamingModes.find(m => m.value === child.namingMode)?.label}
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-icon btn-ghost child-remove-btn"
                                                onClick={() => handleRemoveChildTemplate(child.id)}
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Assignment */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <Target size={16} />
                            <span>Assignment</span>
                        </div>

                        <div className="template-field-grid">
                            <div className="template-field">
                                <label>Assignee</label>
                                <select
                                    value={prefilledData.assigneeId}
                                    onChange={(e) => handleFieldChange('assigneeId', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="template-field">
                                <label>Reporter</label>
                                <select
                                    value={prefilledData.reporterId}
                                    onChange={(e) => handleFieldChange('reporterId', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Planning */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <Clock size={16} />
                            <span>Planning</span>
                        </div>

                        <div className="template-field-grid">
                            <div className="template-field">
                                <label>Sprint</label>
                                <select
                                    value={prefilledData.sprintId}
                                    onChange={(e) => handleFieldChange('sprintId', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {activeSprints.map(sprint => (
                                        <option key={sprint.id} value={sprint.id}>
                                            {sprint.name} {sprint.state === 'active' ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="template-field">
                                <label>Estimate (hours)</label>
                                <input
                                    type="number"
                                    value={prefilledData.originalEstimate}
                                    onChange={(e) => handleFieldChange('originalEstimate', e.target.value)}
                                    placeholder="e.g., 4"
                                    className="template-input"
                                    min="0"
                                />
                            </div>

                            <div className="template-field">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={prefilledData.startDate}
                                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                    className="template-input"
                                />
                            </div>

                            <div className="template-field">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={prefilledData.dueDate}
                                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                    className="template-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Metadata */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <GitBranch size={16} />
                            <span>Metadata</span>
                        </div>

                        <div className="template-field-grid">
                            <div className="template-field">
                                <label>Game</label>
                                <select
                                    value={prefilledData.gameId}
                                    onChange={(e) => handleFieldChange('gameId', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {(games || []).map(game => (
                                        <option key={game.id} value={game.id}>
                                            {game.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="template-field">
                                <label>Department</label>
                                <select
                                    value={prefilledData.departmentId}
                                    onChange={(e) => handleFieldChange('departmentId', e.target.value)}
                                    className="template-select"
                                >
                                    <option value="">-- No default --</option>
                                    {(departments || []).map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════ */}
                    {/* SECTION: Description Template */}
                    {/* ═══════════════════════════════════════════ */}
                    <div className="template-section">
                        <div className="template-section-header">
                            <FileText size={16} />
                            <span>Description Template</span>
                        </div>

                        <div className="template-field">
                            <textarea
                                value={prefilledData.description}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                placeholder="Enter description template text...&#10;&#10;Example:&#10;## Summary&#10;&#10;## Steps to Reproduce&#10;&#10;## Expected Behavior"
                                className="template-textarea"
                                rows={5}
                            />
                        </div>
                    </div>
                </div>

                <div className="template-editor-footer">
                    <button
                        className="template-cancel-btn"
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="template-save-btn"
                        onClick={handleSave}
                        disabled={isSaving || !templateName.trim()}
                    >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>
        </div>
    )
}
