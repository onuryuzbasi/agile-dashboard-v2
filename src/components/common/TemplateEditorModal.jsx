import { useState } from 'react'
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
    Save
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
    { name: 'Sparkles', icon: Sparkles, label: 'Feature' }
]

export default function TemplateEditorModal({ onClose, onSave }) {
    const {
        fieldConfig,
        addIssueTemplate,
        closeTemplateEditor
    } = useProjectStore()

    const [templateName, setTemplateName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState('FileText')
    const [isSaving, setIsSaving] = useState(false)

    // Prefilled data state
    const [prefilledData, setPrefilledData] = useState({
        type: '',
        status: '',
        priority: '',
        description: ''
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
                    {/* Template Name */}
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

                    {/* Icon Selector */}
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
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="template-divider" />

                    <h3 className="template-section-title">Prefilled Fields</h3>
                    <p className="template-section-desc">
                        Values below will be automatically filled when using this template
                    </p>

                    {/* Issue Type */}
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

                    {/* Priority */}
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

                    {/* Status */}
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

                    {/* Description */}
                    <div className="template-field">
                        <label>Description Template</label>
                        <textarea
                            value={prefilledData.description}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Enter description template text..."
                            className="template-textarea"
                            rows={4}
                        />
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
