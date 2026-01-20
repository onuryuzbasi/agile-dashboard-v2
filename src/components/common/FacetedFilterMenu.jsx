import { useState, useRef, useEffect, useMemo } from 'react'
import {
    ChevronDown,
    ChevronRight,
    X,
    Check,
    User,
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Zap,
    Gamepad2,
    Building2,
    Tag,
    Save,
    Bookmark,
    Trash2,
    Circle
} from 'lucide-react'
import { getIconByName } from '../../config/fieldConfig'

/**
 * FacetedFilterMenu - A comprehensive faceted filter dropdown
 * 
 * Props:
 * - issues: Array of issue objects to extract filter options from
 * - users: Array of user objects
 * - sprints: Array of sprint objects
 * - games: Array of game objects
 * - departments: Array of department objects
 * - fieldConfig: Object containing { priorities, statuses, issueTypes, labels }
 * - filters: Object containing current filter state
 * - onFilterChange: Callback (fieldName, newSet) => void
 * - onClearAll: Callback to clear all filters
 * - isOpen: Boolean controlling visibility
 * - onClose: Callback to close menu
 */
export default function FacetedFilterMenu({
    issues = [],
    users = [],
    sprints = [],
    games = [],
    departments = [],
    fieldConfig = {},
    filters = {},
    onFilterChange,
    onClearAll,
    isOpen,
    onClose,
    savedFilters = [],
    onSaveFilter,
    onDeleteSavedFilter,
    onApplySavedFilter
}) {
    const menuRef = useRef(null)
    const [collapsedSections, setCollapsedSections] = useState(new Set())
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [filterName, setFilterName] = useState('')
    const [savedFiltersCollapsed, setSavedFiltersCollapsed] = useState(false)

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose?.()
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    // Toggle section collapse
    const toggleSection = (section) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            if (next.has(section)) {
                next.delete(section)
            } else {
                next.add(section)
            }
            return next
        })
    }

    // Toggle filter value
    const toggleValue = (field, value) => {
        const currentSet = filters[field] || new Set()
        const newSet = new Set(currentSet)
        if (newSet.has(value)) {
            newSet.delete(value)
        } else {
            newSet.add(value)
        }
        onFilterChange?.(field, newSet)
    }

    // Extract unique values dynamically from issues
    const dynamicOptions = useMemo(() => {
        const typeSet = new Set()
        const statusSet = new Set()
        const prioritySet = new Set()
        const assigneeSet = new Set()
        const sprintSet = new Set()
        const gameSet = new Set()
        const departmentSet = new Set()
        const labelSet = new Set()
        const reporterSet = new Set()
        const epicSet = new Set()

        issues.forEach(issue => {
            if (issue.type) typeSet.add(issue.type)
            if (issue.status) statusSet.add(issue.status)
            if (issue.priority) prioritySet.add(issue.priority)

            if (issue.assigneeId) assigneeSet.add(issue.assigneeId)
            else assigneeSet.add('unassigned')

            if (issue.sprintId) sprintSet.add(issue.sprintId)
            else sprintSet.add('backlog')

            if (issue.gameId) gameSet.add(issue.gameId)
            else gameSet.add('no-game')

            if (issue.departmentId) departmentSet.add(issue.departmentId)
            else departmentSet.add('no-department')

            if (issue.reporterId) reporterSet.add(issue.reporterId)

            // Collect labels (array field)
            if (issue.labels && Array.isArray(issue.labels)) {
                issue.labels.forEach(label => labelSet.add(label))
            }

            // Collect parent epics
            if (issue.parentId) epicSet.add(issue.parentId)
            else if (issue.type !== 'epic') epicSet.add('no-epic')
        })

        // Also add epics themselves to the epic filter options
        issues.filter(i => i.type === 'epic').forEach(epic => epicSet.add(epic.id))

        return {
            types: Array.from(typeSet),
            statuses: Array.from(statusSet),
            priorities: Array.from(prioritySet),
            assignees: Array.from(assigneeSet),
            sprints: Array.from(sprintSet),
            games: Array.from(gameSet),
            departments: Array.from(departmentSet),
            labels: Array.from(labelSet),
            reporters: Array.from(reporterSet),
            epics: Array.from(epicSet).filter(id => id !== 'no-epic' || epicSet.has('no-epic'))
        }
    }, [issues])

    // Count active filters
    const activeCount = Object.values(filters).reduce((sum, set) => sum + (set?.size || 0), 0)

    if (!isOpen) return null

    // Render section header
    const renderSectionHeader = (title, section) => {
        const isCollapsed = collapsedSections.has(section)
        const sectionFilters = filters[section]
        const selectedCount = sectionFilters?.size || 0

        return (
            <button
                className="faceted-section-header"
                onClick={() => toggleSection(section)}
            >
                <span className="faceted-section-toggle">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </span>
                <span className="faceted-section-title">{title}</span>
                {selectedCount > 0 && (
                    <span className="faceted-section-count">{selectedCount}</span>
                )}
            </button>
        )
    }

    // Render checkbox option
    const renderOption = (field, value, label, icon = null, color = null) => {
        const isSelected = filters[field]?.has(value)
        return (
            <label key={value} className={`faceted-option ${isSelected ? 'selected' : ''}`}>
                <div className={`faceted-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={12} />}
                </div>
                {icon && (
                    <span className="faceted-option-icon" style={{ color }}>
                        {icon}
                    </span>
                )}
                <span className="faceted-option-label">{label}</span>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleValue(field, value)}
                    className="sr-only"
                />
            </label>
        )
    }

    // Helper to get epic name
    const getEpicName = (epicId) => {
        if (epicId === 'no-epic') return 'No Parent Epic'
        const epic = issues.find(i => i.id === epicId && i.type === 'epic')
        return epic ? `${epic.key} - ${epic.summary}` : 'Unknown Epic'
    }

    // Handle save filter
    const handleSaveFilter = () => {
        if (!filterName.trim()) return
        // Convert Sets to Arrays for serialization
        const serializedFilters = {}
        Object.entries(filters).forEach(([key, set]) => {
            if (set && set.size > 0) {
                serializedFilters[key] = Array.from(set)
            }
        })
        // Pass as object with name and filters properties
        onSaveFilter?.({ name: filterName.trim(), filters: serializedFilters })
        setFilterName('')
        setShowSaveModal(false)
    }

    // Handle apply saved filter
    const handleApplySavedFilter = (savedFilter) => {
        onApplySavedFilter?.(savedFilter.filters)
    }

    return (
        <div className="faceted-filter-menu" ref={menuRef} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="faceted-header">
                <span className="faceted-title">Filters</span>
                {activeCount > 0 && (
                    <button className="faceted-clear-btn" onClick={onClearAll}>
                        Clear all ({activeCount})
                    </button>
                )}
                <button className="faceted-close-btn" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="faceted-content">
                {/* SAVED FILTERS Section - Always visible */}
                <div className="faceted-section faceted-saved-section">
                    <button
                        className="faceted-section-header"
                        onClick={() => setSavedFiltersCollapsed(!savedFiltersCollapsed)}
                    >
                        <span className="faceted-section-toggle">
                            {savedFiltersCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </span>
                        <Bookmark size={14} className="faceted-saved-icon" />
                        <span className="faceted-section-title">Saved Filters</span>
                        {savedFilters.length > 0 && (
                            <span className="faceted-section-count">{savedFilters.length}</span>
                        )}
                    </button>
                    {!savedFiltersCollapsed && (
                        <div className="faceted-saved-list">
                            {savedFilters.length > 0 ? (
                                savedFilters.map(saved => (
                                    <div key={saved.id} className="faceted-saved-item">
                                        <button
                                            className="faceted-saved-name"
                                            onClick={() => handleApplySavedFilter(saved)}
                                            title={`Apply: ${saved.name}`}
                                        >
                                            <Bookmark size={12} />
                                            {saved.name}
                                        </button>
                                        <button
                                            className="faceted-saved-delete"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDeleteSavedFilter?.(saved.id)
                                            }}
                                            title="Delete filter"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="faceted-saved-empty">
                                    <span>No saved filters yet</span>
                                    <span className="faceted-saved-hint">
                                        Select filters below, then click "Save Current View"
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider between Saved Filters and Filter Categories */}
                <div className="faceted-divider" />

                {/* TYPE Section */}
                <div className="faceted-section">
                    {renderSectionHeader('Type', 'type')}
                    {!collapsedSections.has('type') && (
                        <div className="faceted-options">
                            {dynamicOptions.types.map(type => {
                                const config = fieldConfig?.issueTypes?.find(t => t.key === type) || { icon: 'CheckSquare', color: '#64748b', label: type }
                                const TypeIcon = getIconByName(config.icon, CheckSquare)
                                return renderOption(
                                    'type',
                                    type,
                                    config.label || type.charAt(0).toUpperCase() + type.slice(1),
                                    <TypeIcon size={14} />,
                                    config.color
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* STATUS Section */}
                <div className="faceted-section">
                    {renderSectionHeader('Status', 'status')}
                    {!collapsedSections.has('status') && (
                        <div className="faceted-options">
                            {dynamicOptions.statuses.map(status => {
                                const config = fieldConfig?.statuses?.find(s => s.key === status) || { label: status, bgColor: '#64748b' }
                                return renderOption(
                                    'status',
                                    status,
                                    config.label,
                                    <span className="faceted-status-dot" style={{ backgroundColor: config.bgColor }} />,
                                    null
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* PRIORITY Section */}
                <div className="faceted-section">
                    {renderSectionHeader('Priority', 'priority')}
                    {!collapsedSections.has('priority') && (
                        <div className="faceted-options">
                            {dynamicOptions.priorities.map(priority => {
                                const config = fieldConfig?.priorities?.find(p => p.key === priority) || { icon: 'Minus', color: '#64748b', label: priority }
                                const PriorityIcon = getIconByName(config.icon, Minus)
                                return renderOption(
                                    'priority',
                                    priority,
                                    config.label,
                                    <PriorityIcon size={14} />,
                                    config.color
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ASSIGNEE Section */}
                <div className="faceted-section">
                    {renderSectionHeader('Assignee', 'assignee')}
                    {!collapsedSections.has('assignee') && (
                        <div className="faceted-options">
                            {dynamicOptions.assignees.map(assigneeId => {
                                if (assigneeId === 'unassigned') {
                                    return renderOption(
                                        'assignee',
                                        'unassigned',
                                        'Unassigned',
                                        <User size={14} className="text-secondary" />,
                                        null
                                    )
                                }
                                const user = users.find(u => u.id === assigneeId)
                                return renderOption(
                                    'assignee',
                                    assigneeId,
                                    user?.name || 'Unknown',
                                    <div className="avatar xs">{user?.name?.charAt(0) || '?'}</div>,
                                    null
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* REPORTER Section */}
                {dynamicOptions.reporters.length > 0 && (
                    <div className="faceted-section">
                        {renderSectionHeader('Reporter', 'reporter')}
                        {!collapsedSections.has('reporter') && (
                            <div className="faceted-options">
                                {dynamicOptions.reporters.map(reporterId => {
                                    const user = users.find(u => u.id === reporterId)
                                    return renderOption(
                                        'reporter',
                                        reporterId,
                                        user?.name || 'Unknown',
                                        <div className="avatar xs">{user?.name?.charAt(0) || '?'}</div>,
                                        null
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* SPRINT Section */}
                <div className="faceted-section">
                    {renderSectionHeader('Sprint', 'sprint')}
                    {!collapsedSections.has('sprint') && (
                        <div className="faceted-options">
                            {dynamicOptions.sprints.map(sprintId => {
                                if (sprintId === 'backlog') {
                                    return renderOption(
                                        'sprint',
                                        'backlog',
                                        'Backlog',
                                        null,
                                        null
                                    )
                                }
                                const sprint = sprints.find(s => s.id === sprintId)
                                return renderOption(
                                    'sprint',
                                    sprintId,
                                    sprint?.name || 'Unknown Sprint',
                                    null,
                                    null
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* EPIC/PARENT Section */}
                {dynamicOptions.epics.length > 0 && (
                    <div className="faceted-section">
                        {renderSectionHeader('Epic', 'epic')}
                        {!collapsedSections.has('epic') && (
                            <div className="faceted-options">
                                {dynamicOptions.epics.map(epicId => {
                                    return renderOption(
                                        'epic',
                                        epicId,
                                        getEpicName(epicId),
                                        <Zap size={14} />,
                                        '#a855f7'
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* GAME Section */}
                {dynamicOptions.games.length > 0 && (
                    <div className="faceted-section">
                        {renderSectionHeader('Game', 'game')}
                        {!collapsedSections.has('game') && (
                            <div className="faceted-options">
                                {dynamicOptions.games.map(gameId => {
                                    if (gameId === 'no-game') {
                                        return renderOption(
                                            'game',
                                            'no-game',
                                            'No Game',
                                            <Gamepad2 size={14} className="text-secondary" />,
                                            null
                                        )
                                    }
                                    const game = games.find(g => g.id === gameId)
                                    return renderOption(
                                        'game',
                                        gameId,
                                        game?.name || 'Unknown Game',
                                        <Gamepad2 size={14} />,
                                        '#f97316'
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* DEPARTMENT Section */}
                {dynamicOptions.departments.length > 0 && (
                    <div className="faceted-section">
                        {renderSectionHeader('Department', 'department')}
                        {!collapsedSections.has('department') && (
                            <div className="faceted-options">
                                {dynamicOptions.departments.map(deptId => {
                                    if (deptId === 'no-department') {
                                        return renderOption(
                                            'department',
                                            'no-department',
                                            'No Department',
                                            <Building2 size={14} className="text-secondary" />,
                                            null
                                        )
                                    }
                                    const dept = departments.find(d => d.id === deptId)
                                    return renderOption(
                                        'department',
                                        deptId,
                                        dept?.name || 'Unknown Department',
                                        <Building2 size={14} />,
                                        '#6366f1'
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* LABELS Section */}
                {dynamicOptions.labels.length > 0 && (
                    <div className="faceted-section">
                        {renderSectionHeader('Labels', 'label')}
                        {!collapsedSections.has('label') && (
                            <div className="faceted-options">
                                {dynamicOptions.labels.map(label => {
                                    return renderOption(
                                        'label',
                                        label,
                                        label,
                                        <Tag size={14} />,
                                        '#10b981'
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer with Save Current View button */}
            <div className="faceted-footer">
                <button
                    className="faceted-save-btn"
                    onClick={() => setShowSaveModal(true)}
                    disabled={activeCount === 0}
                    title={activeCount === 0 ? 'Select filters first' : 'Save current filter settings'}
                >
                    <Save size={14} />
                    Save Current View
                    {activeCount > 0 && <span className="save-filter-count">({activeCount})</span>}
                </button>
                <span className="faceted-hint">
                    OR within groups • AND between groups
                </span>
            </div>

            {/* Save Filter Modal */}
            {showSaveModal && (
                <div className="faceted-save-modal">
                    <div className="faceted-save-modal-header">
                        <span>Save Current Filter</span>
                        <button onClick={() => setShowSaveModal(false)}>
                            <X size={14} />
                        </button>
                    </div>
                    <div className="faceted-save-modal-body">
                        <input
                            type="text"
                            placeholder="Filter name..."
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
                            autoFocus
                        />
                        <button
                            className="faceted-save-confirm-btn"
                            onClick={handleSaveFilter}
                            disabled={!filterName.trim()}
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

