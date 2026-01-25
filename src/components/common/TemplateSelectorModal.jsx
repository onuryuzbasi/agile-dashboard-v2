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
    Plus,
    Trash2
} from 'lucide-react'
import './TemplateSelectorModal.css'

// Icon mapping for templates
const iconMap = {
    FileText,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    Zap,
    Target,
    Sparkles
}

export default function TemplateSelectorModal({ onClose, onSelectTemplate }) {
    const {
        issueTemplates,
        deleteIssueTemplate,
        openTemplateEditor,
        showConfirmModal
    } = useProjectStore()

    const [hoveredId, setHoveredId] = useState(null)

    const handleSelectTemplate = (template) => {
        onSelectTemplate(template.prefilledData || {})
        onClose()
    }

    const handleStartFromScratch = () => {
        onSelectTemplate({})
        onClose()
    }

    const handleCreateTemplate = () => {
        onClose()
        openTemplateEditor()
    }

    const handleDeleteTemplate = (e, templateId, templateName) => {
        e.stopPropagation()
        showConfirmModal({
            title: 'Delete Template',
            message: `Are you sure you want to delete "${templateName}"? This action cannot be undone.`,
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                await deleteIssueTemplate(templateId)
            }
        })
    }

    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName] || FileText
        return <IconComponent size={24} />
    }

    const getPreviewFields = (prefilledData) => {
        if (!prefilledData) return []
        const fields = []
        if (prefilledData.type) fields.push({ label: 'Type', value: prefilledData.type })
        if (prefilledData.priority) fields.push({ label: 'Priority', value: prefilledData.priority })
        if (prefilledData.status) fields.push({ label: 'Status', value: prefilledData.status })
        return fields.slice(0, 3)
    }

    return (
        <div className="template-selector-overlay" onClick={onClose}>
            <div className="template-selector-modal" onClick={e => e.stopPropagation()}>
                <div className="template-selector-header">
                    <h2>Choose a Template</h2>
                    <button className="template-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <p className="template-selector-subtitle">
                    Start with a template or create from scratch
                </p>

                <div className="template-grid">
                    {/* Start from Scratch Card */}
                    <div
                        className="template-card scratch-card"
                        onClick={handleStartFromScratch}
                    >
                        <div className="template-card-icon scratch-icon">
                            <Plus size={28} />
                        </div>
                        <div className="template-card-content">
                            <h3>Start from Scratch</h3>
                            <p>Create a blank issue</p>
                        </div>
                    </div>

                    {/* Template Cards */}
                    {issueTemplates.map(template => (
                        <div
                            key={template.id}
                            className="template-card"
                            onClick={() => handleSelectTemplate(template)}
                            onMouseEnter={() => setHoveredId(template.id)}
                            onMouseLeave={() => setHoveredId(null)}
                        >
                            <div className="template-card-icon">
                                {getIcon(template.icon)}
                            </div>
                            <div className="template-card-content">
                                <h3>{template.name}</h3>
                                <div className="template-preview-fields">
                                    {getPreviewFields(template.prefilledData).map((field, idx) => (
                                        <span key={idx} className="preview-tag">
                                            {field.value}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {hoveredId === template.id && (
                                <button
                                    className="template-delete-btn"
                                    onClick={(e) => handleDeleteTemplate(e, template.id, template.name)}
                                    title="Delete template"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="template-selector-footer">
                    <button
                        className="create-template-btn"
                        onClick={handleCreateTemplate}
                    >
                        <Sparkles size={16} />
                        Create New Template
                    </button>
                </div>
            </div>
        </div>
    )
}
