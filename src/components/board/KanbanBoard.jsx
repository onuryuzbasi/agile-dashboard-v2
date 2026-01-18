import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import KanbanColumn from './KanbanColumn'
import IssueCard from './IssueCard'
import { ChevronDown, ChevronRight, User, Zap, Building2 } from 'lucide-react'

export default function KanbanBoard({ filters = {}, groupBy = 'none' }) {
    const {
        getSprintIssues,
        currentSprintId,
        moveIssue,
        updateIssue,
        issues,
        fieldConfig,
        users,
        departments
    } = useProjectStore()

    const [activeIssue, setActiveIssue] = useState(null)
    const [collapsedSwimlanes, setCollapsedSwimlanes] = useState(new Set())

    // Get status keys dynamically from fieldConfig
    const statuses = useMemo(() => {
        return fieldConfig?.statuses?.map(s => s.key) || ['todo', 'progress', 'review', 'done']
    }, [fieldConfig])

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

    // Get issues for current sprint
    const sprintIssues = useMemo(() => {
        return currentSprintId
            ? getSprintIssues(currentSprintId)
            : issues.filter(i => i.projectId === 'proj-1' && !i.isDeleted)
    }, [currentSprintId, getSprintIssues, issues])

    // Apply filters to issues
    const filteredIssues = useMemo(() => {
        return sprintIssues.filter(issue => {
            // Check each filter category
            for (const [field, values] of Object.entries(filters)) {
                if (!values || values.size === 0) continue

                let issueValue
                switch (field) {
                    case 'type':
                        issueValue = issue.type
                        break
                    case 'status':
                        issueValue = issue.status
                        break
                    case 'priority':
                        issueValue = issue.priority
                        break
                    case 'assignee':
                        issueValue = issue.assigneeId || 'unassigned'
                        break
                    case 'reporter':
                        issueValue = issue.reporterId
                        break
                    case 'sprint':
                        issueValue = issue.sprintId || 'backlog'
                        break
                    case 'epic':
                        issueValue = issue.parentId || 'no-epic'
                        break
                    case 'game':
                        issueValue = issue.gameId || 'no-game'
                        break
                    case 'department':
                        issueValue = issue.department || 'no-department'
                        break
                    case 'label':
                        // For labels, check if any of issue's labels match filter
                        if (issue.labels && Array.isArray(issue.labels)) {
                            const hasMatch = issue.labels.some(l => values.has(l))
                            if (!hasMatch) return false
                        } else {
                            return false
                        }
                        continue
                    default:
                        continue
                }

                if (!values.has(issueValue)) return false
            }
            return true
        })
    }, [sprintIssues, filters])

    // Generate swimlanes based on groupBy
    const swimlanes = useMemo(() => {
        if (groupBy === 'none') {
            return [{ key: 'all', label: null, issues: filteredIssues, icon: null }]
        }

        const lanes = {}
        const noGroupKey = groupBy === 'epic' ? 'no-epic' : groupBy === 'assignee' ? 'unassigned' : 'no-department'

        filteredIssues.forEach(issue => {
            let laneKey, laneLabel, laneIcon

            switch (groupBy) {
                case 'epic':
                    if (issue.type === 'epic') return // Don't show epics in swimlanes
                    laneKey = issue.parentId || 'no-epic'
                    const parentEpic = issues.find(i => i.id === issue.parentId && i.type === 'epic')
                    laneLabel = parentEpic ? `${parentEpic.key}: ${parentEpic.summary}` : 'Issues without Epic'
                    laneIcon = Zap
                    break
                case 'assignee':
                    laneKey = issue.assigneeId || 'unassigned'
                    const assignee = users?.find(u => u.id === issue.assigneeId)
                    laneLabel = assignee ? assignee.name : 'Unassigned'
                    laneIcon = User
                    break
                case 'department':
                    laneKey = issue.department || 'no-department'
                    const dept = departments?.find(d => d.id === issue.department)
                    laneLabel = dept ? dept.name : 'No Department'
                    laneIcon = Building2
                    break
                default:
                    laneKey = 'all'
                    laneLabel = null
                    laneIcon = null
            }

            if (!lanes[laneKey]) {
                lanes[laneKey] = { key: laneKey, label: laneLabel, issues: [], icon: laneIcon }
            }
            lanes[laneKey].issues.push(issue)
        })

        // Sort lanes: put "no-epic", "unassigned", "no-department" at the end
        const laneArray = Object.values(lanes)
        return laneArray.sort((a, b) => {
            if (a.key === noGroupKey) return 1
            if (b.key === noGroupKey) return -1
            return a.label?.localeCompare(b.label) || 0
        })
    }, [filteredIssues, groupBy, issues, users, departments])

    // Toggle swimlane collapse
    const toggleSwimlane = (laneKey) => {
        setCollapsedSwimlanes(prev => {
            const next = new Set(prev)
            if (next.has(laneKey)) {
                next.delete(laneKey)
            } else {
                next.add(laneKey)
            }
            return next
        })
    }

    const handleDragStart = (event) => {
        const { active } = event
        const issue = filteredIssues.find(i => i.id === active.id)
        setActiveIssue(issue)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveIssue(null)

        if (!over) return

        const activeIssueData = filteredIssues.find(i => i.id === active.id)
        if (!activeIssueData) return

        const overId = over.id.toString()

        // Parse the drop target
        // Format: "swimlane-{laneKey}-status-{statusKey}" or just "{statusKey}" for no swimlanes
        let targetStatus = null
        let targetSwimlane = null

        if (overId.startsWith('swimlane-')) {
            // Cross-dimensional drop
            const parts = overId.split('-status-')
            if (parts.length === 2) {
                targetSwimlane = parts[0].replace('swimlane-', '')
                targetStatus = parts[1]
            }
        } else if (statuses.includes(overId)) {
            // Direct column drop (no swimlanes or same swimlane)
            targetStatus = overId
        } else {
            // Dropped on another issue
            const overIssue = filteredIssues.find(i => i.id === overId)
            if (overIssue) {
                targetStatus = overIssue.status
                // If grouped, get the swimlane from the target issue
                if (groupBy === 'assignee') targetSwimlane = overIssue.assigneeId || 'unassigned'
                if (groupBy === 'epic') targetSwimlane = overIssue.parentId || 'no-epic'
                if (groupBy === 'department') targetSwimlane = overIssue.department || 'no-department'
            }
        }

        if (!targetStatus) return

        // Prepare updates
        const updates = {}
        let needsUpdate = false

        // Update status if changed
        if (targetStatus && activeIssueData.status !== targetStatus) {
            updates.status = targetStatus
            needsUpdate = true
        }

        // Update swimlane grouping field if cross-dimensional drag
        if (targetSwimlane && groupBy !== 'none') {
            switch (groupBy) {
                case 'assignee':
                    const currentAssignee = activeIssueData.assigneeId || 'unassigned'
                    if (currentAssignee !== targetSwimlane) {
                        updates.assigneeId = targetSwimlane === 'unassigned' ? null : targetSwimlane
                        needsUpdate = true
                    }
                    break
                case 'epic':
                    const currentEpic = activeIssueData.parentId || 'no-epic'
                    if (currentEpic !== targetSwimlane) {
                        updates.parentId = targetSwimlane === 'no-epic' ? null : targetSwimlane
                        needsUpdate = true
                    }
                    break
                case 'department':
                    const currentDept = activeIssueData.department || 'no-department'
                    if (currentDept !== targetSwimlane) {
                        updates.department = targetSwimlane === 'no-department' ? null : targetSwimlane
                        needsUpdate = true
                    }
                    break
            }
        }

        // Apply updates
        if (needsUpdate) {
            if (Object.keys(updates).length === 1 && updates.status) {
                // Only status changed - use moveIssue for history tracking
                moveIssue(active.id, updates.status)
            } else {
                // Multiple fields changed - use updateIssue
                updateIssue(active.id, updates)
            }
        }
    }

    const handleDragOver = (event) => {
        // Could add hover feedback here
    }

    // Render a single swimlane
    const renderSwimlane = (lane) => {
        const isCollapsed = collapsedSwimlanes.has(lane.key)
        const Icon = lane.icon

        // Group issues by status within this swimlane
        const issuesByStatus = statuses.reduce((acc, status) => {
            acc[status] = lane.issues.filter(issue => issue.status === status)
            return acc
        }, {})

        return (
            <div key={lane.key} className={`kanban-swimlane ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Swimlane Header - Only show if we have grouping */}
                {lane.label && (
                    <div className="kanban-swimlane-header" onClick={() => toggleSwimlane(lane.key)}>
                        <div className="kanban-swimlane-toggle">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {Icon && <Icon size={16} className="kanban-swimlane-icon" />}
                        <span className="kanban-swimlane-label">{lane.label}</span>
                        <span className="kanban-swimlane-count">{lane.issues.length}</span>
                    </div>
                )}

                {/* Swimlane Columns - Hidden when collapsed */}
                {!isCollapsed && (
                    <div className="kanban-swimlane-columns">
                        {statuses.map((status) => (
                            <KanbanColumn
                                key={`${lane.key}-${status}`}
                                id={groupBy !== 'none' ? `swimlane-${lane.key}-status-${status}` : status}
                                status={status}
                                issues={issuesByStatus[status] || []}
                                fieldConfig={fieldConfig}
                                compact={groupBy !== 'none'}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className={`kanban-board ${groupBy !== 'none' ? 'with-swimlanes' : ''}`}>
                {groupBy === 'none' ? (
                    // No grouping - render simple columns
                    <>
                        {statuses.map((status) => {
                            const columnIssues = filteredIssues.filter(issue => issue.status === status)
                            return (
                                <KanbanColumn
                                    key={status}
                                    id={status}
                                    status={status}
                                    issues={columnIssues}
                                    fieldConfig={fieldConfig}
                                />
                            )
                        })}
                    </>
                ) : (
                    // With grouping - render swimlanes
                    <>
                        {/* Column Headers (show once at top) */}
                        <div className="kanban-swimlane-column-headers">
                            <div className="kanban-swimlane-header-spacer" />
                            {statuses.map(status => {
                                const statusConfig = fieldConfig?.statuses?.find(s => s.key === status)
                                return (
                                    <div key={status} className="kanban-column-header-cell">
                                        <span
                                            className="status-badge"
                                            style={{ backgroundColor: statusConfig?.bgColor, color: statusConfig?.textColor }}
                                        >
                                            {statusConfig?.label || status}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Swimlane Rows */}
                        <div className="kanban-swimlanes">
                            {swimlanes.map(lane => renderSwimlane(lane))}
                        </div>
                    </>
                )}
            </div>

            <DragOverlay>
                {activeIssue ? (
                    <IssueCard issue={activeIssue} isDragging />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
