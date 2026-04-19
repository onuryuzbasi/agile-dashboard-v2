import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
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
    Settings,
    Plus,
    Pencil,
    Save,
    X,
    Trash2,
    GripVertical,
    CheckSquare
} from 'lucide-react'

// Color presets for status selection
const colorPresets = [
    '#CD1316', '#E97F33', '#E9A233', '#2D8738', '#57A55A',
    '#36B37E', '#0052CC', '#6554C0', '#FF5630', '#FF991F',
    '#00B8D9', '#4FADE6', '#904EE2', '#42526E', '#DFE1E6'
]

// Sortable Status Item component
const SortableStatusItem = ({ id, children }) => {
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
        <div
            ref={setNodeRef}
            style={style}
            className="field-manager-item"
        >
            <button
                className="btn btn-ghost btn-sm drag-handle"
                {...attributes}
                {...listeners}
            >
                <GripVertical size={14} />
            </button>
            {children}
        </div>
    )
}

export default function StatusSettingsPopover({ isOpen, onClose }) {
    const {
        fieldConfig,
        addFieldConfigItem,
        updateFieldConfigItem,
        deleteFieldConfigItem,
        reorderFieldConfigItem,
        showConfirmModal
    } = useProjectStore()

    const popoverRef = useRef(null)
    const [newStatus, setNewStatus] = useState({ label: '', bgColor: '#0052CC', textColor: '#FFFFFF' })
    const [editingStatus, setEditingStatus] = useState(null)
    const [editValue, setEditValue] = useState({})

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    )

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    // Handle drag end for reordering
    const handleDragEnd = (event) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const items = fieldConfig?.statuses || []
            const oldIndex = items.findIndex(item => item.id === active.id)
            const newIndex = items.findIndex(item => item.id === over.id)
            const newOrder = arrayMove(items, oldIndex, newIndex)
            reorderFieldConfigItem('statuses', newOrder)
        }
    }

    // Add new status
    const handleAddStatus = () => {
        if (!newStatus.label.trim()) return

        const item = {
            key: newStatus.label.toLowerCase().replace(/\s+/g, '_'),
            label: newStatus.label,
            bgColor: newStatus.bgColor,
            textColor: newStatus.textColor || '#FFFFFF'
        }

        addFieldConfigItem('statuses', item)
        setNewStatus({ label: '', bgColor: '#0052CC', textColor: '#FFFFFF' })
    }

    // Start editing a status
    const handleEditStatus = (status) => {
        setEditingStatus(status.id)
        setEditValue({ ...status })
    }

    // Save edited status
    const handleSaveStatus = (statusId) => {
        if (editValue) {
            updateFieldConfigItem('statuses', statusId, editValue)
        }
        setEditingStatus(null)
        setEditValue({})
    }

    // Delete status with confirmation
    const handleDeleteStatus = (status) => {
        showConfirmModal({
            title: `Delete "${status.label}"?`,
            message: 'Issues using this status may be affected. This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: () => deleteFieldConfigItem('statuses', status.id)
        })
    }

    if (!isOpen) return null

    const statuses = fieldConfig?.statuses || []

    return (
        <div
            ref={popoverRef}
            className="status-settings-popover"
            onClick={e => e.stopPropagation()}
        >
            <div className="status-settings-header">
                <div className="flex items-center gap-2">
                    <CheckSquare size={18} />
                    <span className="font-semibold">Manage Statuses</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            <div className="status-settings-content">
                {/* Add New Status */}
                <div className="status-add-form">
                    <input
                        type="text"
                        className="input"
                        placeholder="Status name (e.g., Testing)"
                        value={newStatus.label}
                        onChange={e => setNewStatus({ ...newStatus, label: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddStatus()}
                    />
                    <div className="color-picker-mini">
                        {colorPresets.slice(0, 8).map(color => (
                            <button
                                key={color}
                                className={`color-dot ${newStatus.bgColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewStatus({ ...newStatus, bgColor: color })}
                            />
                        ))}
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleAddStatus}
                        disabled={!newStatus.label.trim()}
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>

                {/* Status List with Drag & Drop */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={statuses.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="status-list">
                            {statuses.map(status => (
                                <SortableStatusItem key={status.id} id={status.id}>
                                    {editingStatus === status.id ? (
                                        <>
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={editValue.label || ''}
                                                onChange={e => setEditValue({ ...editValue, label: e.target.value })}
                                                autoFocus
                                            />
                                            <div className="color-picker-mini">
                                                {colorPresets.slice(0, 6).map(color => (
                                                    <button
                                                        key={color}
                                                        className={`color-dot ${editValue.bgColor === color ? 'selected' : ''}`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => setEditValue({ ...editValue, bgColor: color })}
                                                    />
                                                ))}
                                            </div>
                                            <button className="btn btn-sm btn-primary" onClick={() => handleSaveStatus(status.id)}>
                                                <Save size={12} />
                                            </button>
                                            <button className="btn btn-sm btn-ghost" onClick={() => setEditingStatus(null)}>
                                                <X size={12} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: status.bgColor, color: status.textColor }}
                                            >
                                                {status.label}
                                            </span>
                                            <span className="status-key">{status.key}</span>
                                            <div className="status-actions">
                                                <button className="btn btn-sm btn-ghost" onClick={() => handleEditStatus(status)}>
                                                    <Pencil size={12} />
                                                </button>
                                                <button className="btn btn-sm btn-ghost btn-danger-text" onClick={() => handleDeleteStatus(status)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </SortableStatusItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>

                {statuses.length === 0 && (
                    <div className="status-empty">
                        <p className="text-secondary text-sm">No statuses configured yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
