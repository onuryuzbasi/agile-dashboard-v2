import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import {
    X,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Calendar,
    User,
    Tag,
    Trash2,
    Save,
    Plus,
    ChevronDown,
    ChevronRight,
    Clock,
    Building2,
    Gamepad2,
    Link2,
    Search
} from 'lucide-react'

const typeIcons = {
    story: BookOpen,
    bug: Bug,
    task: CheckSquare,
    epic: Layers,
    subtask: ListTree
}

const priorityIcons = {
    highest: ArrowUp,
    high: ArrowUp,
    medium: Minus,
    low: ArrowDown,
    lowest: ArrowDown
}

const typeOptions = [
    { value: 'story', label: 'Story', color: 'var(--story)' },
    { value: 'bug', label: 'Bug', color: 'var(--bug)' },
    { value: 'task', label: 'Task', color: 'var(--task)' },
    { value: 'epic', label: 'Epic', color: 'var(--epic)' },
    { value: 'subtask', label: 'Subtask', color: 'var(--subtask)' }
]

const priorityOptions = [
    { value: 'highest', label: 'Highest', color: 'var(--priority-highest)' },
    { value: 'high', label: 'High', color: 'var(--priority-high)' },
    { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
    { value: 'low', label: 'Low', color: 'var(--priority-low)' },
    { value: 'lowest', label: 'Lowest', color: 'var(--priority-lowest)' }
]

const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'var(--status-todo)' },
    { value: 'progress', label: 'In Progress', color: 'var(--status-progress)' },
    { value: 'review', label: 'In Review', color: 'var(--status-review)' },
    { value: 'done', label: 'Done', color: 'var(--status-done)' }
]

const departmentOptions = [
    { value: '', label: 'None' },
    { value: 'development', label: 'Development' },
    { value: 'design', label: 'Design' }
]

// SearchableDropdown Component
function SearchableDropdown({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    renderOption,
    renderSelected,
    showSearch = true,
    createButton,
    emptyText = 'No options found'
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    )

    // Find selected option
    const selectedOption = options.find(opt => opt.value === value)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
                setSearch('')
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && showSearch && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen, showSearch])

    const handleSelect = (opt) => {
        onChange(opt.value)
        setIsOpen(false)
        setSearch('')
    }

    return (
        <div className="searchable-dropdown" ref={dropdownRef}>
            <button
                type="button"
                className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {renderSelected ? (
                    renderSelected(selectedOption)
                ) : (
                    <span className={selectedOption ? '' : 'placeholder'}>
                        {selectedOption?.label || placeholder}
                    </span>
                )}
                <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
            </button>

            {isOpen && (
                <div className="searchable-dropdown-menu" onClick={e => e.stopPropagation()}>
                    {showSearch && (
                        <div className="searchable-dropdown-search">
                            <Search size={14} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="searchable-dropdown-options">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`searchable-dropdown-option ${value === opt.value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt)}
                                >
                                    {renderOption ? renderOption(opt) : opt.label}
                                </button>
                            ))
                        ) : (
                            <div className="searchable-dropdown-empty">{emptyText}</div>
                        )}
                    </div>
                    {createButton && (
                        <>
                            <div className="searchable-dropdown-divider" />
                            {createButton}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// DatePicker Component with Calendar
function DatePickerField({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
    const dropdownRef = useRef(null)

    const selectedDate = value ? new Date(value) : null

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()

    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const handleDateSelect = (day) => {
        if (day) {
            const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
            onChange(newDate.toISOString().split('T')[0])
            setIsOpen(false)
        }
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return 'Select date'
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="searchable-dropdown date-picker" ref={dropdownRef}>
            <button
                type="button"
                className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar size={14} />
                <span className={value ? '' : 'placeholder'}>{formatDisplayDate(value)}</span>
                <ChevronDown size={14} className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`} />
            </button>

            {isOpen && (
                <div className="searchable-dropdown-menu calendar-menu" onClick={e => e.stopPropagation()}>
                    <div className="calendar-header">
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                        >
                            ‹
                        </button>
                        <span>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button
                            type="button"
                            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                        >
                            ›
                        </button>
                    </div>
                    <div className="calendar-weekdays">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <span key={day}>{day}</span>
                        ))}
                    </div>
                    <div className="calendar-days">
                        {days.map((day, idx) => {
                            const isSelected = selectedDate &&
                                day === selectedDate.getDate() &&
                                viewDate.getMonth() === selectedDate.getMonth() &&
                                viewDate.getFullYear() === selectedDate.getFullYear()
                            const isToday = day &&
                                day === new Date().getDate() &&
                                viewDate.getMonth() === new Date().getMonth() &&
                                viewDate.getFullYear() === new Date().getFullYear()
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!day ? 'empty' : ''}`}
                                    onClick={() => handleDateSelect(day)}
                                    disabled={!day}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                    <div className="calendar-footer">
                        <button type="button" onClick={() => {
                            onChange('')
                            setIsOpen(false)
                        }}>
                            Clear
                        </button>
                        <button type="button" onClick={() => {
                            const today = new Date().toISOString().split('T')[0]
                            onChange(today)
                            setIsOpen(false)
                        }}>
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function IssueModal({ issue, onClose }) {
    const { updateIssue, deleteIssue, addIssue, addWorkLog, removeWorkLog, users, sprints, issues, getUserById } = useProjectStore()

    const [formData, setFormData] = useState({
        summary: issue.summary,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId || '',
        reporterId: issue.reporterId || '',
        sprintId: issue.sprintId || '',
        storyPoints: issue.storyPoints || '',
        originalEstimate: issue.originalEstimate || '',
        game: issue.game || '',
        parentId: issue.parentId || '',
        department: issue.department || '',
        startDate: issue.startDate || '',
        dueDate: issue.dueDate || ''
    })

    const [isEditing, setIsEditing] = useState(false)
    const [childItemsExpanded, setChildItemsExpanded] = useState(true)
    const [newChildSummary, setNewChildSummary] = useState('')
    const [showAddChild, setShowAddChild] = useState(false)
    const [showParentDropdown, setShowParentDropdown] = useState(false)
    const [newEpicName, setNewEpicName] = useState('')
    const [showCreateEpic, setShowCreateEpic] = useState(false)

    // Work log state
    const [showWorkLogForm, setShowWorkLogForm] = useState(false)
    const [workLogHours, setWorkLogHours] = useState('')
    const [workLogMinutes, setWorkLogMinutes] = useState('')
    const [workLogDescription, setWorkLogDescription] = useState('')
    const [workLogDate, setWorkLogDate] = useState(new Date().toISOString().split('T')[0])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setIsEditing(true)
    }

    const handleSave = () => {
        updateIssue(issue.id, {
            ...formData,
            storyPoints: formData.storyPoints ? parseInt(formData.storyPoints) : null,
            originalEstimate: formData.originalEstimate ? parseInt(formData.originalEstimate) : null
        })
        setIsEditing(false)
    }

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this issue?')) {
            deleteIssue(issue.id)
            onClose()
        }
    }

    const handleAddChild = () => {
        if (!newChildSummary.trim()) return

        addIssue({
            type: 'task',
            status: 'todo',
            priority: 'medium',
            summary: newChildSummary.trim(),
            description: '',
            parentId: issue.id,
            sprintId: formData.sprintId,
            assigneeId: null,
            storyPoints: null,
            labels: [],
            reporterId: issue.reporterId
        })

        setNewChildSummary('')
        setShowAddChild(false)
    }

    // Get child issues for epics
    const childIssues = formData.type === 'epic'
        ? issues.filter(i => i.parentId === issue.id && !i.isDeleted)
        : []

    // Calculate progress for epic
    const completedChildren = childIssues.filter(i => i.status === 'done').length
    const progressPercent = childIssues.length > 0
        ? Math.round((completedChildren / childIssues.length) * 100)
        : 0

    // Get available epics for parent selection (only show if not epic type)
    const availableEpics = issues.filter(i => i.type === 'epic' && i.id !== issue.id && !i.isDeleted)

    const TypeIcon = typeIcons[formData.type] || CheckSquare
    const assignee = formData.assigneeId ? getUserById(formData.assigneeId) : null
    const reporter = formData.reporterId ? getUserById(formData.reporterId) : null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal issue-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className={`issue-type-icon ${formData.type}`} style={{ width: 24, height: 24 }}>
                            <TypeIcon size={14} />
                        </div>
                        <span className="text-secondary text-sm font-medium">{issue.key}</span>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Summary */}
                    <div className="input-group mb-4">
                        <label className="input-label">Summary</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.summary}
                            onChange={(e) => handleChange('summary', e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="input-group mb-4">
                        <label className="input-label">Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a description..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Grid of fields - Row 1 */}
                    <div className="issue-fields-grid">
                        {/* Type */}
                        <div className="input-group">
                            <label className="input-label">Type</label>
                            <SearchableDropdown
                                options={typeOptions}
                                value={formData.type}
                                onChange={(val) => handleChange('type', val)}
                                placeholder="Select type"
                                searchPlaceholder="Search types..."
                                renderOption={(opt) => {
                                    const Icon = typeIcons[opt.value] || CheckSquare
                                    return (
                                        <div className="dropdown-option-with-icon">
                                            <span className={`issue-type-icon ${opt.value}`} style={{ width: 18, height: 18 }}>
                                                <Icon size={11} />
                                            </span>
                                            {opt.label}
                                        </div>
                                    )
                                }}
                                renderSelected={(opt) => {
                                    if (!opt) return <span className="placeholder">Select type</span>
                                    const Icon = typeIcons[opt.value] || CheckSquare
                                    return (
                                        <div className="dropdown-option-with-icon">
                                            <span className={`issue-type-icon ${opt.value}`} style={{ width: 18, height: 18 }}>
                                                <Icon size={11} />
                                            </span>
                                            {opt.label}
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        {/* Status */}
                        <div className="input-group">
                            <label className="input-label">Status</label>
                            <SearchableDropdown
                                options={statusOptions}
                                value={formData.status}
                                onChange={(val) => handleChange('status', val)}
                                placeholder="Select status"
                                searchPlaceholder="Search status..."
                                renderOption={(opt) => (
                                    <div className="dropdown-option-with-badge">
                                        <span className={`status-badge ${opt.value}`}>
                                            {opt.label.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                renderSelected={(opt) => {
                                    if (!opt) return <span className="placeholder">Select status</span>
                                    return (
                                        <span className={`status-badge ${opt.value}`}>
                                            {opt.label.toUpperCase()}
                                        </span>
                                    )
                                }}
                            />
                        </div>

                        {/* Priority */}
                        <div className="input-group">
                            <label className="input-label">Priority</label>
                            <SearchableDropdown
                                options={priorityOptions}
                                value={formData.priority}
                                onChange={(val) => handleChange('priority', val)}
                                placeholder="Select priority"
                                searchPlaceholder="Search priority..."
                                renderOption={(opt) => {
                                    const Icon = priorityIcons[opt.value] || Minus
                                    return (
                                        <div className="dropdown-option-with-icon">
                                            <Icon size={14} style={{ color: opt.color }} />
                                            {opt.label}
                                        </div>
                                    )
                                }}
                                renderSelected={(opt) => {
                                    if (!opt) return <span className="placeholder">Select priority</span>
                                    const Icon = priorityIcons[opt.value] || Minus
                                    return (
                                        <div className="dropdown-option-with-icon">
                                            <Icon size={14} style={{ color: opt.color }} />
                                            {opt.label}
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        {/* Reporter */}
                        <div className="input-group">
                            <label className="input-label">Reporter</label>
                            <SearchableDropdown
                                options={[
                                    { value: '', label: 'Unassigned' },
                                    ...users.map(u => ({ value: u.id, label: u.name, avatar: u.avatar }))
                                ]}
                                value={formData.reporterId}
                                onChange={(val) => handleChange('reporterId', val)}
                                placeholder="Select reporter"
                                searchPlaceholder="Search users..."
                                renderOption={(opt) => (
                                    <div className="dropdown-option-with-avatar">
                                        {opt.value ? (
                                            <span className="avatar xs">{opt.label.charAt(0)}</span>
                                        ) : (
                                            <span className="avatar xs unassigned">?</span>
                                        )}
                                        {opt.label}
                                    </div>
                                )}
                                renderSelected={(opt) => {
                                    if (!opt) return <span className="placeholder">Select reporter</span>
                                    return (
                                        <div className="dropdown-option-with-avatar">
                                            {opt.value ? (
                                                <span className="avatar xs">{opt.label.charAt(0)}</span>
                                            ) : (
                                                <span className="avatar xs unassigned">?</span>
                                            )}
                                            {opt.label}
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        {/* Assignee */}
                        <div className="input-group">
                            <label className="input-label">Assignee</label>
                            <SearchableDropdown
                                options={[
                                    { value: '', label: 'Unassigned' },
                                    ...users.map(u => ({ value: u.id, label: u.name, avatar: u.avatar }))
                                ]}
                                value={formData.assigneeId}
                                onChange={(val) => handleChange('assigneeId', val)}
                                placeholder="Select assignee"
                                searchPlaceholder="Search users..."
                                renderOption={(opt) => (
                                    <div className="dropdown-option-with-avatar">
                                        {opt.value ? (
                                            <span className="avatar xs">{opt.label.charAt(0)}</span>
                                        ) : (
                                            <span className="avatar xs unassigned">?</span>
                                        )}
                                        {opt.label}
                                    </div>
                                )}
                                renderSelected={(opt) => {
                                    if (!opt) return <span className="placeholder">Select assignee</span>
                                    return (
                                        <div className="dropdown-option-with-avatar">
                                            {opt.value ? (
                                                <span className="avatar xs">{opt.label.charAt(0)}</span>
                                            ) : (
                                                <span className="avatar xs unassigned">?</span>
                                            )}
                                            {opt.label}
                                        </div>
                                    )
                                }}
                            />
                        </div>

                        {/* Sprint */}
                        <div className="input-group">
                            <label className="input-label">Sprint</label>
                            <SearchableDropdown
                                options={[
                                    { value: '', label: 'Backlog' },
                                    ...sprints.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                value={formData.sprintId}
                                onChange={(val) => handleChange('sprintId', val)}
                                placeholder="Select sprint"
                                searchPlaceholder="Search sprints..."
                            />
                        </div>

                        {/* Original Estimate */}
                        <div className="input-group">
                            <label className="input-label">Original Estimate (hours)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                value={formData.originalEstimate}
                                onChange={(e) => handleChange('originalEstimate', e.target.value)}
                                placeholder="0"
                            />
                        </div>

                        {/* Game */}
                        <div className="input-group">
                            <label className="input-label">Game</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.game}
                                onChange={(e) => handleChange('game', e.target.value)}
                                placeholder="Enter game name..."
                            />
                        </div>

                        {/* Parent/Epic - only show for non-epic types */}
                        {formData.type !== 'epic' && (
                            <div className="input-group">
                                <label className="input-label">Parent (Epic)</label>
                                <SearchableDropdown
                                    options={[
                                        { value: '', label: 'None' },
                                        ...availableEpics.map(e => ({
                                            value: e.id,
                                            label: `${e.key} - ${e.summary.length > 30 ? e.summary.substring(0, 30) + '...' : e.summary}`,
                                            key: e.key,
                                            summary: e.summary
                                        }))
                                    ]}
                                    value={formData.parentId}
                                    onChange={(val) => handleChange('parentId', val)}
                                    placeholder="Select epic"
                                    searchPlaceholder="Search epics..."
                                    emptyText="No epics found"
                                    renderOption={(opt) => (
                                        <div className="dropdown-option-epic">
                                            {opt.key && (
                                                <span className="epic-key">{opt.key}</span>
                                            )}
                                            <span className="epic-summary">{opt.summary || opt.label}</span>
                                        </div>
                                    )}
                                    renderSelected={(opt) => {
                                        if (!opt || !opt.value) return <span>None</span>
                                        return (
                                            <div className="dropdown-option-epic">
                                                <span className="epic-key">{opt.key}</span>
                                                <span className="epic-summary">{opt.summary?.substring(0, 20) || opt.label}</span>
                                            </div>
                                        )
                                    }}
                                    createButton={
                                        showCreateEpic ? (
                                            <div className="create-epic-form">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="Enter epic name..."
                                                    value={newEpicName}
                                                    onChange={(e) => setNewEpicName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newEpicName.trim()) {
                                                            const newEpic = addIssue({
                                                                type: 'epic',
                                                                status: 'todo',
                                                                priority: 'medium',
                                                                summary: newEpicName.trim(),
                                                                description: '',
                                                                sprintId: null,
                                                                storyPoints: null,
                                                                labels: [],
                                                                reporterId: issue.reporterId
                                                            })
                                                            handleChange('parentId', newEpic.id)
                                                            setNewEpicName('')
                                                            setShowCreateEpic(false)
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setShowCreateEpic(false)
                                                            setNewEpicName('')
                                                        }
                                                    }}
                                                    autoFocus
                                                    onClick={e => e.stopPropagation()}
                                                />
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (newEpicName.trim()) {
                                                            const newEpic = addIssue({
                                                                type: 'epic',
                                                                status: 'todo',
                                                                priority: 'medium',
                                                                summary: newEpicName.trim(),
                                                                description: '',
                                                                sprintId: null,
                                                                storyPoints: null,
                                                                labels: [],
                                                                reporterId: issue.reporterId
                                                            })
                                                            handleChange('parentId', newEpic.id)
                                                            setNewEpicName('')
                                                            setShowCreateEpic(false)
                                                        }
                                                    }}
                                                >
                                                    Create
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="searchable-dropdown-option create-epic-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setShowCreateEpic(true)
                                                }}
                                            >
                                                <Plus size={14} />
                                                Create Epic
                                            </button>
                                        )
                                    }
                                />
                            </div>
                        )}

                        {/* Department */}
                        <div className="input-group">
                            <label className="input-label">Department</label>
                            <SearchableDropdown
                                options={departmentOptions}
                                value={formData.department}
                                onChange={(val) => handleChange('department', val)}
                                placeholder="Select department"
                                searchPlaceholder="Search departments..."
                            />
                        </div>

                        {/* Start Date */}
                        <div className="input-group">
                            <label className="input-label">Start Date</label>
                            <DatePickerField
                                value={formData.startDate}
                                onChange={(val) => handleChange('startDate', val)}
                            />
                        </div>

                        {/* Due Date */}
                        <div className="input-group">
                            <label className="input-label">Due Date</label>
                            <DatePickerField
                                value={formData.dueDate}
                                onChange={(val) => handleChange('dueDate', val)}
                            />
                        </div>
                    </div>

                    {/* Child Work Items - Only for Epics */}
                    {formData.type === 'epic' && (
                        <div className="child-items-section">
                            <div className="child-items-header" onClick={() => setChildItemsExpanded(!childItemsExpanded)}>
                                {childItemsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span>Child work items</span>
                                <span className="child-items-count">{childIssues.length}</span>
                                <button
                                    className="btn btn-icon btn-ghost btn-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowAddChild(true)
                                    }}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {childItemsExpanded && (
                                <>
                                    {/* Progress bar */}
                                    {childIssues.length > 0 && (
                                        <div className="child-items-progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="progress-text">{progressPercent}% Done</span>
                                        </div>
                                    )}

                                    {/* Child items table */}
                                    {childIssues.length > 0 && (
                                        <div className="child-items-table">
                                            <div className="child-items-table-header">
                                                <span>Work</span>
                                                <span>Pri...</span>
                                                <span>As...</span>
                                                <span>Status</span>
                                            </div>
                                            {childIssues.map(child => {
                                                const ChildTypeIcon = typeIcons[child.type] || CheckSquare
                                                const childAssignee = child.assigneeId ? getUserById(child.assigneeId) : null
                                                return (
                                                    <div key={child.id} className="child-item-row">
                                                        <div className="child-item-work">
                                                            <span className={`issue-type-icon ${child.type}`} style={{ width: 16, height: 16 }}>
                                                                <ChildTypeIcon size={10} />
                                                            </span>
                                                            <span className="child-item-key">{child.key}</span>
                                                            <span className="child-item-summary">{child.summary}</span>
                                                        </div>
                                                        <div className="child-item-priority">
                                                            {child.priority === 'medium' && <Minus size={12} />}
                                                            {child.priority === 'high' && <ArrowUp size={12} />}
                                                            {child.priority === 'low' && <ArrowDown size={12} />}
                                                        </div>
                                                        <div className="child-item-assignee">
                                                            {childAssignee ? (
                                                                <span className="avatar xs">{childAssignee.name.charAt(0)}</span>
                                                            ) : (
                                                                <span className="avatar xs">?</span>
                                                            )}
                                                        </div>
                                                        <div className="child-item-status">
                                                            <span className={`status-badge ${child.status}`}>
                                                                {child.status === 'todo' && 'TO DO'}
                                                                {child.status === 'progress' && 'IN PROGRESS'}
                                                                {child.status === 'review' && 'IN REVIEW'}
                                                                {child.status === 'done' && 'DONE'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Add child input */}
                                    {showAddChild && (
                                        <div className="add-child-row">
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Enter task summary..."
                                                value={newChildSummary}
                                                onChange={(e) => setNewChildSummary(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddChild()
                                                    if (e.key === 'Escape') {
                                                        setShowAddChild(false)
                                                        setNewChildSummary('')
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <button className="btn btn-sm btn-primary" onClick={handleAddChild}>
                                                Add
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => {
                                                    setShowAddChild(false)
                                                    setNewChildSummary('')
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {childIssues.length === 0 && !showAddChild && (
                                        <div className="child-items-empty">
                                            No child items yet. Click + to add one.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Work Log Section */}
                    <div className="work-log-section">
                        <div className="work-log-header">
                            <div className="work-log-title">
                                <Clock size={16} />
                                <span>Work Log</span>
                                <span className="work-log-count">
                                    {(issue.workLogs || []).length} entries
                                </span>
                            </div>
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setShowWorkLogForm(!showWorkLogForm)}
                            >
                                <Plus size={14} />
                                Log Time
                            </button>
                        </div>

                        {/* Work Log Form */}
                        {showWorkLogForm && (
                            <div className="work-log-form">
                                <div className="work-log-time-inputs">
                                    <div className="input-group">
                                        <label className="input-label">Hours</label>
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            placeholder="0"
                                            value={workLogHours}
                                            onChange={(e) => setWorkLogHours(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Minutes</label>
                                        <input
                                            type="number"
                                            className="input"
                                            min="0"
                                            max="59"
                                            placeholder="0"
                                            value={workLogMinutes}
                                            onChange={(e) => setWorkLogMinutes(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Date</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={workLogDate}
                                            onChange={(e) => setWorkLogDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Description (optional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="What did you work on?"
                                        value={workLogDescription}
                                        onChange={(e) => setWorkLogDescription(e.target.value)}
                                    />
                                </div>
                                <div className="work-log-form-actions">
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                            const hours = parseInt(workLogHours) || 0
                                            const minutes = parseInt(workLogMinutes) || 0
                                            if (hours > 0 || minutes > 0) {
                                                addWorkLog(issue.id, {
                                                    timeSpent: hours * 60 + minutes, // Store in minutes
                                                    description: workLogDescription,
                                                    date: workLogDate,
                                                    userId: formData.assigneeId || 'user-1'
                                                })
                                                setWorkLogHours('')
                                                setWorkLogMinutes('')
                                                setWorkLogDescription('')
                                                setWorkLogDate(new Date().toISOString().split('T')[0])
                                                setShowWorkLogForm(false)
                                            }
                                        }}
                                        disabled={!workLogHours && !workLogMinutes}
                                    >
                                        Log Time
                                    </button>
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={() => {
                                            setShowWorkLogForm(false)
                                            setWorkLogHours('')
                                            setWorkLogMinutes('')
                                            setWorkLogDescription('')
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Work Log List */}
                        {(issue.workLogs || []).length > 0 && (
                            <div className="work-log-list">
                                {(issue.workLogs || []).map(log => {
                                    const logUser = getUserById(log.userId)
                                    const hours = Math.floor(log.timeSpent / 60)
                                    const minutes = log.timeSpent % 60
                                    const timeDisplay = hours > 0
                                        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                                        : `${minutes}m`

                                    return (
                                        <div key={log.id} className="work-log-item">
                                            <div className="work-log-item-avatar">
                                                <span className="avatar sm">
                                                    {logUser?.name?.charAt(0) || '?'}
                                                </span>
                                            </div>
                                            <div className="work-log-item-content">
                                                <div className="work-log-item-header">
                                                    <span className="work-log-user">{logUser?.name || 'Unknown'}</span>
                                                    <span className="work-log-time">{timeDisplay}</span>
                                                    <span className="work-log-date">
                                                        {new Date(log.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                {log.description && (
                                                    <div className="work-log-description">{log.description}</div>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-icon btn-ghost btn-sm work-log-remove"
                                                onClick={() => removeWorkLog(issue.id, log.id)}
                                                title="Remove log"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Total Time */}
                        {(issue.workLogs || []).length > 0 && (
                            <div className="work-log-total">
                                Total logged: {(() => {
                                    const totalMinutes = (issue.workLogs || []).reduce((sum, log) => sum + log.timeSpent, 0)
                                    const hours = Math.floor(totalMinutes / 60)
                                    const minutes = totalMinutes % 60
                                    return hours > 0
                                        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
                                        : `${minutes}m`
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <div
                        className="mt-4 pt-4"
                        style={{ borderTop: '1px solid var(--border-primary)' }}
                    >
                        <div className="text-xs text-tertiary">
                            Created: {new Date(issue.createdAt).toLocaleDateString()}
                            {issue.updatedAt !== issue.createdAt && (
                                <> · Updated: {new Date(issue.updatedAt).toLocaleDateString()}</>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-ghost btn-danger" onClick={handleDelete}>
                        <Trash2 size={16} />
                        Delete
                    </button>
                    <div className="flex gap-2">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!isEditing}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
