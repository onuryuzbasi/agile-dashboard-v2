import { useState, useEffect } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useProjectStore } from '../../stores/projectStore'
import { X, Layers, StickyNote, Square, Type } from 'lucide-react'

const typeIcons = {
    sticky: StickyNote,
    epic: Layers,
    shape: Square,
    text: Type
}

const priorityOptions = [
    { value: 'highest', label: 'Highest', color: 'var(--priority-highest)' },
    { value: 'high', label: 'High', color: 'var(--priority-high)' },
    { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
    { value: 'low', label: 'Low', color: 'var(--priority-low)' },
    { value: 'lowest', label: 'Lowest', color: 'var(--priority-lowest)' }
]

export default function ElementEditor() {
    const { selectedIds, getSelectedElements, updateElement, clearSelection } = useCanvasStore()
    const { users } = useProjectStore()

    const selectedElements = getSelectedElements()
    const element = selectedElements.length === 1 ? selectedElements[0] : null

    const [formData, setFormData] = useState({
        content: '',
        priority: 'medium',
        assigneeId: '',
        fill: '',
        stroke: ''
    })

    // Initialize form when selection changes
    useEffect(() => {
        if (element) {
            setFormData({
                content: element.content || '',
                priority: element.priority || 'medium',
                assigneeId: element.assigneeId || '',
                fill: element.fill || '',
                stroke: element.stroke || ''
            })
        }
    }, [element?.id])

    if (!element) {
        if (selectedIds.length > 1) {
            return (
                <div className="element-editor">
                    <div className="editor-header">
                        <span className="font-medium">{selectedIds.length} elements selected</span>
                    </div>
                    <div className="editor-body">
                        <p className="text-sm text-secondary">
                            Select a single element to edit its properties.
                        </p>
                    </div>
                </div>
            )
        }
        return null
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        updateElement(element.id, { [field]: value })
    }

    const Icon = typeIcons[element.type] || Square

    return (
        <div className="element-editor">
            <div className="editor-header">
                <div className="flex items-center gap-2">
                    <Icon size={16} style={{ color: element.stroke }} />
                    <span className="font-medium capitalize">{element.type}</span>
                </div>
                <button
                    className="btn btn-icon btn-ghost sm"
                    onClick={clearSelection}
                >
                    <X size={16} />
                </button>
            </div>

            <div className="editor-body">
                {/* Content */}
                {element.type !== 'connector' && (
                    <div className="input-group mb-3">
                        <label className="input-label">
                            {element.type === 'epic' ? 'Epic Title' : 'Content'}
                        </label>
                        <textarea
                            className="input"
                            rows={element.type === 'sticky' ? 4 : 2}
                            value={formData.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder={element.type === 'epic' ? 'Enter epic title...' : 'Enter text...'}
                        />
                    </div>
                )}

                {/* Epic-specific fields */}
                {element.type === 'epic' && (
                    <>
                        <div className="input-group mb-3">
                            <label className="input-label">Priority</label>
                            <select
                                className="input select"
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                {priorityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group mb-3">
                            <label className="input-label">Assignee</label>
                            <select
                                className="input select"
                                value={formData.assigneeId}
                                onChange={(e) => handleChange('assigneeId', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        {element.issueId && (
                            <div
                                className="mb-3 p-2 rounded"
                                style={{
                                    background: 'var(--success-light)',
                                    color: 'var(--success)',
                                    fontSize: 'var(--font-size-xs)'
                                }}
                            >
                                ✓ Linked to issue board
                            </div>
                        )}
                    </>
                )}

                {/* Style options */}
                <div className="input-group mb-3">
                    <label className="input-label">Background Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={formData.fill || '#ffffff'}
                            onChange={(e) => handleChange('fill', e.target.value)}
                            style={{
                                width: 32,
                                height: 32,
                                padding: 0,
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                            }}
                        />
                        <input
                            type="text"
                            className="input"
                            value={formData.fill}
                            onChange={(e) => handleChange('fill', e.target.value)}
                            placeholder="#hex"
                        />
                    </div>
                </div>

                <div className="input-group mb-3">
                    <label className="input-label">Border Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={formData.stroke || '#000000'}
                            onChange={(e) => handleChange('stroke', e.target.value)}
                            style={{
                                width: 32,
                                height: 32,
                                padding: 0,
                                border: '1px solid var(--border-primary)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                            }}
                        />
                        <input
                            type="text"
                            className="input"
                            value={formData.stroke}
                            onChange={(e) => handleChange('stroke', e.target.value)}
                            placeholder="#hex"
                        />
                    </div>
                </div>

                {/* Dimensions */}
                <div className="text-xs text-tertiary mt-4">
                    Position: {Math.round(element.x)}, {Math.round(element.y)}
                    <br />
                    Size: {Math.round(element.width)} × {Math.round(element.height)}
                </div>
            </div>
        </div>
    )
}
