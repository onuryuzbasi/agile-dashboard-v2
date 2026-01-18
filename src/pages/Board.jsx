import { useState, useMemo } from 'react'
import KanbanBoard from '../components/board/KanbanBoard'
import FacetedFilterMenu from '../components/common/FacetedFilterMenu'
import { useProjectStore } from '../stores/projectStore'
import { Filter, Layers, ChevronDown, User, Building2, Zap } from 'lucide-react'

export default function Board() {
    const {
        sprints,
        currentSprintId,
        setCurrentSprint,
        issues,
        users,
        games,
        departments,
        fieldConfig,
        savedFilters,
        addSavedFilter,
        deleteSavedFilter
    } = useProjectStore()

    // Filter state
    const [filters, setFilters] = useState({})
    const [showFilterMenu, setShowFilterMenu] = useState(false)

    // Group By state
    const [groupBy, setGroupBy] = useState('none') // 'none' | 'epic' | 'assignee' | 'department'
    const [showGroupByMenu, setShowGroupByMenu] = useState(false)

    const activeSprints = sprints.filter(s => s.state !== 'closed')

    // Handle filter change
    const handleFilterChange = (field, values) => {
        setFilters(prev => ({
            ...prev,
            [field]: values
        }))
    }

    // Clear all filters
    const handleClearAllFilters = () => {
        setFilters({})
    }

    // Save filter
    const handleSaveFilter = (name, filterData) => {
        addSavedFilter?.({ name, filters: filterData })
    }

    // Delete saved filter
    const handleDeleteSavedFilter = (filterId) => {
        deleteSavedFilter?.(filterId)
    }

    // Apply saved filter
    const handleApplySavedFilter = (filterData) => {
        // Convert arrays back to Sets
        const restoredFilters = {}
        Object.entries(filterData).forEach(([key, values]) => {
            restoredFilters[key] = new Set(values)
        })
        setFilters(restoredFilters)
    }

    // Count active filters
    const activeFilterCount = Object.values(filters).reduce((sum, set) => sum + (set?.size || 0), 0)

    // Group By options
    const groupByOptions = [
        { value: 'none', label: 'None', icon: null },
        { value: 'epic', label: 'Epic', icon: Zap },
        { value: 'assignee', label: 'Assignee', icon: User },
        { value: 'department', label: 'Department', icon: Building2 }
    ]

    const selectedGroupBy = groupByOptions.find(g => g.value === groupBy)

    return (
        <div className="animate-fade-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Board</h1>
                    <p className="text-secondary">
                        Drag and drop issues to update their status
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sprint Selector */}
                    <select
                        className="input select"
                        value={currentSprintId || ''}
                        onChange={(e) => setCurrentSprint(e.target.value)}
                        style={{ width: 'auto', minWidth: 150 }}
                    >
                        <option value="">All Issues</option>
                        {activeSprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.name}
                                {sprint.state === 'active' && ' (Active)'}
                            </option>
                        ))}
                    </select>

                    {/* Group By Dropdown */}
                    <div className="board-groupby-container">
                        <button
                            className={`btn btn-secondary ${groupBy !== 'none' ? 'active' : ''}`}
                            onClick={() => setShowGroupByMenu(!showGroupByMenu)}
                        >
                            <Layers size={16} />
                            Group: {selectedGroupBy?.label}
                            <ChevronDown size={14} />
                        </button>
                        {showGroupByMenu && (
                            <div className="board-groupby-menu" onClick={e => e.stopPropagation()}>
                                <div className="board-groupby-header">Group By</div>
                                {groupByOptions.map(option => {
                                    const Icon = option.icon
                                    return (
                                        <button
                                            key={option.value}
                                            className={`board-groupby-option ${groupBy === option.value ? 'selected' : ''}`}
                                            onClick={() => {
                                                setGroupBy(option.value)
                                                setShowGroupByMenu(false)
                                            }}
                                        >
                                            {Icon && <Icon size={14} />}
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Filter Button */}
                    <div className="board-filter-container">
                        <button
                            className={`btn btn-secondary ${activeFilterCount > 0 ? 'active' : ''}`}
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <Filter size={16} />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="filter-badge">{activeFilterCount}</span>
                            )}
                        </button>
                        <FacetedFilterMenu
                            issues={issues}
                            users={users}
                            sprints={sprints}
                            games={games}
                            departments={departments}
                            fieldConfig={fieldConfig}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearAll={handleClearAllFilters}
                            isOpen={showFilterMenu}
                            onClose={() => setShowFilterMenu(false)}
                            savedFilters={savedFilters || []}
                            onSaveFilter={handleSaveFilter}
                            onDeleteSavedFilter={handleDeleteSavedFilter}
                            onApplySavedFilter={handleApplySavedFilter}
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard filters={filters} groupBy={groupBy} />
        </div>
    )
}
