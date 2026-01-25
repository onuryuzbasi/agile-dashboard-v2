import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    FileText,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    Zap,
    Target,
    Sparkles,
    Save,
    BookOpen,
    GitBranch,
    Clock
} from 'lucide-react'
import './TemplateEditorModal.css'

// Available icons for templates
const availableIcons = [
    { name: 'FileText', icon: FileText, label: 'Document' },
    { name: 'Bug', icon: Bug, label: 'Bug' },
    { name: 'CheckSquare', icon: CheckSquare, label: 'Task' },
    { name: 'Layers', icon: Layers, label: 'Epic' },
    { name: 'ListTree', icon: ListTree, label: 'Subtask' },
    { name: 'Zap', icon: Zap, label: 'Quick' },
    { name: 'Target', icon: Target, label: 'Goal' },
    { name: 'Sparkles', icon: Sparkles, label: 'Feature' },
    { name: 'BookOpen', icon: BookOpen, label: 'Story' },
    { name: 'GitBranch', icon: GitBranch, label: 'Branch' },
    { name: 'Clock', icon: Clock, label: 'Scheduled' }
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
    const [selectedIcon, setSelectedIcon] = useState('FileText')
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

    // Prefilled data state - ALL system fields
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
        originalEstimate: ''
    })

    const handleFieldChange = (field, value) => {
        setPrefilledData(prev => ({
            ...prev,
            [field]: value
        }))
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
                        </div>
                    </div>

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
