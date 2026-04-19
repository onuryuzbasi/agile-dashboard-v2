import { useState, useMemo, useCallback } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { Plus, Trash2, Rocket, X, Copy, ArrowUp, ArrowDown, ArrowUpDown, Eye, EyeOff } from 'lucide-react'

const EMPTY_ROW = () => ({
    id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    isNew: true,
    summary: '',
    type: 'story',
    status: 'todo',
    priority: 'medium',
    assigneeId: '',
    reporterId: '',
    parentId: '',
    storyPoints: '',
    gameId: '',
    departmentId: '',
    startDate: '',
    dueDate: '',
    sprintId: ''
})

export default function BulkCreator() {
    const {
        addIssue,
        users,
        sprints,
        issues,
        fieldConfig,
    } = useProjectStore()

    const [newRows, setNewRows] = useState(() => Array.from({ length: 5 }, () => EMPTY_ROW()))
    const [isCreating, setIsCreating] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [createdCount, setCreatedCount] = useState(0)
    const [sortColumn, setSortColumn] = useState(null)
    const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'
    const [hideExisting, setHideExisting] = useState(false)

    // Available sprints
    const availableSprints = useMemo(() => {
        return sprints.filter(s => s.state !== 'closed')
    }, [sprints])

    // Options
    const typeOptions = useMemo(() => {
        if (fieldConfig?.issueTypes?.length > 0)
            return fieldConfig.issueTypes.map(t => ({ value: t.key, label: t.label }))
        return [
            { value: 'epic', label: 'Epic' }, { value: 'story', label: 'Story' },
            { value: 'bug', label: 'Bug' }, { value: 'task', label: 'Task' }, { value: 'subtask', label: 'Subtask' }
        ]
    }, [fieldConfig])

    const statusOptions = useMemo(() => {
        if (fieldConfig?.statuses?.length > 0)
            return fieldConfig.statuses.map(s => ({ value: s.key, label: s.label }))
        return [
            { value: 'todo', label: 'To Do' }, { value: 'progress', label: 'In Progress' },
            { value: 'review', label: 'In Review' }, { value: 'done', label: 'Done' }
        ]
    }, [fieldConfig])

    const priorityOptions = useMemo(() => {
        if (fieldConfig?.priorities?.length > 0)
            return fieldConfig.priorities.map(p => ({ value: p.key, label: p.label }))
        return [
            { value: 'highest', label: 'Highest' }, { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }, { value: 'lowest', label: 'Lowest' }
        ]
    }, [fieldConfig])

    const epics = useMemo(() => issues.filter(i => i.type === 'epic' && !i.isDeleted), [issues])

    // Existing issues from database (not deleted)
    const existingIssues = useMemo(() => issues.filter(i => !i.isDeleted), [issues])

    // All epics = DB epics + new rows with type=epic that have a summary
    const allEpics = useMemo(() => {
        const newEpicRows = newRows
            .filter(r => r.type === 'epic' && r.summary.trim())
            .map(r => ({ id: r.id, key: '✨ NEW', summary: r.summary.trim(), isNew: true }))
        const dbEpics = epics.map(e => ({ id: e.id, key: e.key, summary: e.summary, isNew: false }))
        return [...dbEpics, ...newEpicRows]
    }, [epics, newRows])

    // Lookup helpers
    const sprintMap = useMemo(() => {
        const m = new Map()
        m.set('', 'Backlog')
        sprints.forEach(s => m.set(s.id, s.name))
        return m
    }, [sprints])

    const userMap = useMemo(() => {
        const m = new Map()
        users.forEach(u => m.set(u.id, u.name))
        return m
    }, [users])

    const typeMap = useMemo(() => new Map(typeOptions.map(o => [o.value, o.label])), [typeOptions])
    const statusMap = useMemo(() => new Map(statusOptions.map(o => [o.value, o.label])), [statusOptions])
    const priorityMap = useMemo(() => new Map(priorityOptions.map(o => [o.value, o.label])), [priorityOptions])
    const epicMap = useMemo(() => new Map(allEpics.map(e => [e.id, e.key])), [allEpics])

    // Get sortable value for a column
    const getSortValue = useCallback((item, col) => {
        switch (col) {
            case 'key': return item.key || ''
            case 'summary': return (item.summary || '').toLowerCase()
            case 'sprint': return sprintMap.get(item.sprintId || '') || ''
            case 'type': return typeMap.get(item.type) || item.type || ''
            case 'status': return statusMap.get(item.status) || item.status || ''
            case 'priority': {
                const order = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 }
                return order[item.priority] ?? 5
            }
            case 'assignee': return userMap.get(item.assigneeId) || ''
            case 'epic': return epicMap.get(item.parentId) || ''
            case 'sp': return item.storyPoints ?? 999
            default: return ''
        }
    }, [sprintMap, typeMap, statusMap, userMap, epicMap])

    // Sorted existing issues
    const sortedExisting = useMemo(() => {
        if (!sortColumn) return existingIssues
        const sorted = [...existingIssues].sort((a, b) => {
            const va = getSortValue(a, sortColumn)
            const vb = getSortValue(b, sortColumn)
            if (typeof va === 'number' && typeof vb === 'number') return va - vb
            return String(va).localeCompare(String(vb))
        })
        return sortDir === 'desc' ? sorted.reverse() : sorted
    }, [existingIssues, sortColumn, sortDir, getSortValue])

    // Toggle sort
    const toggleSort = useCallback((col) => {
        setSortColumn(prev => {
            if (prev === col) {
                setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                return col
            }
            setSortDir('asc')
            return col
        })
    }, [])

    // Sort icon
    const SortIcon = ({ col }) => {
        if (sortColumn !== col) return <ArrowUpDown size={12} className="sort-icon inactive" />
        return sortDir === 'asc'
            ? <ArrowUp size={12} className="sort-icon active" />
            : <ArrowDown size={12} className="sort-icon active" />
    }

    // Row operations
    const updateRow = useCallback((rowId, field, value) => {
        setNewRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r))
    }, [])

    const addRow = useCallback(() => {
        setNewRows(prev => [...prev, EMPTY_ROW()])
    }, [])

    const removeRow = useCallback((rowId) => {
        setNewRows(prev => prev.filter(r => r.id !== rowId))
    }, [])

    const duplicateRow = useCallback((rowId) => {
        setNewRows(prev => {
            const source = prev.find(r => r.id === rowId)
            if (!source) return prev
            return [...prev, {
                ...source,
                id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                summary: source.summary + ' (copy)'
            }]
        })
    }, [])

    const clearAll = useCallback(() => {
        setNewRows(Array.from({ length: 5 }, () => EMPTY_ROW()))
        setCreatedCount(0)
    }, [])

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') { e.preventDefault(); addRow() }
    }, [addRow])

    // Valid rows
    const validNewRows = newRows.filter(r => r.summary.trim())
    const validCount = validNewRows.length

    // Bulk create — epics first, then children with mapped IDs
    const handleCreateAll = async () => {
        if (validCount === 0) return
        setIsCreating(true)
        setProgress({ current: 0, total: validCount })
        setCreatedCount(0)

        // Separate epics and non-epics
        const epicRows = validNewRows.filter(r => r.type === 'epic')
        const childRows = validNewRows.filter(r => r.type !== 'epic')
        const tempIdToRealId = new Map()

        let created = 0

        // 1. Create epics first
        for (const row of epicRows) {
            try {
                const result = await addIssue({
                    type: 'epic',
                    summary: row.summary.trim(),
                    description: '',
                    status: row.status,
                    priority: row.priority,
                    assigneeId: row.assigneeId || null,
                    reporterId: row.reporterId || null,
                    sprintId: row.sprintId || null,
                    parentId: null,
                    storyPoints: row.storyPoints ? parseInt(row.storyPoints) : null,
                    gameId: row.gameId || null,
                    departmentId: row.departmentId || null,
                    startDate: row.startDate || null,
                    dueDate: row.dueDate || null
                })
                // Map temp row ID to real DB ID
                if (result?.id) tempIdToRealId.set(row.id, result.id)
                created++
                setProgress({ current: created, total: validCount })
            } catch (err) {
                console.error('Failed to create epic:', err)
            }
        }

        // 2. Create child issues with resolved parent IDs
        for (const row of childRows) {
            try {
                let parentId = row.parentId || null
                // If parentId points to a new epic row, resolve to real ID
                if (parentId && tempIdToRealId.has(parentId)) {
                    parentId = tempIdToRealId.get(parentId)
                }
                await addIssue({
                    type: row.type,
                    summary: row.summary.trim(),
                    description: '',
                    status: row.status,
                    priority: row.priority,
                    assigneeId: row.assigneeId || null,
                    reporterId: row.reporterId || null,
                    sprintId: row.sprintId || null,
                    parentId: parentId,
                    storyPoints: row.storyPoints ? parseInt(row.storyPoints) : null,
                    gameId: row.gameId || null,
                    departmentId: row.departmentId || null,
                    startDate: row.startDate || null,
                    dueDate: row.dueDate || null
                })
                created++
                setProgress({ current: created, total: validCount })
            } catch (err) {
                console.error('Failed to create issue:', err)
            }
        }

        setCreatedCount(created)
        setIsCreating(false)
        if (created > 0) setNewRows(Array.from({ length: 3 }, () => EMPTY_ROW()))
    }

    return (
        <div className="bulk-creator-page">
            {/* Header */}
            <div className="bulk-creator-header">
                <div className="bulk-creator-title">
                    <Rocket size={22} />
                    <h1>Bulk Issue Creator</h1>
                    <span className="bulk-creator-subtitle">
                        {existingIssues.length} existing · {validCount} new ready
                    </span>
                </div>
                <div className="bulk-creator-actions-top">
                    <button
                        className={`btn btn-ghost ${hideExisting ? 'active' : ''}`}
                        onClick={() => setHideExisting(h => !h)}
                        disabled={isCreating}
                        title={hideExisting ? 'Show existing issues' : 'Hide existing issues'}
                    >
                        {hideExisting ? <EyeOff size={16} /> : <Eye size={16} />}
                        {hideExisting ? 'Show Old Issues' : 'Hide Old Issues'}
                    </button>
                    <button className="btn btn-ghost" onClick={clearAll} disabled={isCreating}>
                        <X size={16} /> Clear
                    </button>
                </div>
            </div>

            {/* Progress */}
            {isCreating && (
                <div className="bulk-progress-bar">
                    <div className="bulk-progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                    <span className="bulk-progress-text">Creating {progress.current} of {progress.total}...</span>
                </div>
            )}

            {createdCount > 0 && !isCreating && (
                <div className="bulk-success-banner">✅ Successfully created {createdCount} issues!</div>
            )}

            {/* Spreadsheet */}
            <div className="bulk-table-wrapper">
                <table className="bulk-table">
                    <thead>
                        <tr>
                            <th className="bulk-th-num">#</th>
                            <th className="bulk-th-key" onClick={() => toggleSort('key')}>
                                Key <SortIcon col="key" />
                            </th>
                            <th className="bulk-th-summary" onClick={() => toggleSort('summary')}>
                                Summary <SortIcon col="summary" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('sprint')}>
                                Sprint <SortIcon col="sprint" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('type')}>
                                Type <SortIcon col="type" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('status')}>
                                Status <SortIcon col="status" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('priority')}>
                                Priority <SortIcon col="priority" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('assignee')}>
                                Assignee <SortIcon col="assignee" />
                            </th>
                            <th className="bulk-th-select" onClick={() => toggleSort('epic')}>
                                Epic <SortIcon col="epic" />
                            </th>
                            <th className="bulk-th-narrow" onClick={() => toggleSort('sp')}>
                                SP <SortIcon col="sp" />
                            </th>
                            <th className="bulk-th-actions"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Existing issues */}
                        {!hideExisting && sortedExisting.map((issue, idx) => (
                            <tr key={issue.id} className="bulk-row existing-row">
                                <td className="bulk-cell-num">{idx + 1}</td>
                                <td className="bulk-cell-key">
                                    <span className="bulk-issue-key">{issue.key}</span>
                                </td>
                                <td className="bulk-cell-summary">
                                    <input type="text" value={issue.summary} disabled />
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.sprintId || ''} disabled>
                                        <option value="">Backlog</option>
                                        {availableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.type} disabled>
                                        {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.status} disabled>
                                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.priority} disabled>
                                        {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.assigneeId || ''} disabled>
                                        <option value="">—</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={issue.parentId || ''} disabled>
                                        <option value="">—</option>
                                        {allEpics.map(e => <option key={e.id} value={e.id}>{e.key}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-narrow">
                                    <input type="number" value={issue.storyPoints ?? ''} placeholder="—" disabled />
                                </td>
                                <td className="bulk-cell-actions"></td>
                            </tr>
                        ))}

                        {/* Separator */}
                        {!hideExisting && existingIssues.length > 0 && (
                            <tr className="bulk-separator-row">
                                <td colSpan="11">
                                    <div className="bulk-separator">
                                        <span>＋ New issues</span>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {/* New editable rows */}
                        {newRows.map((row, idx) => (
                            <tr key={row.id} className={`bulk-row new-row ${row.summary.trim() ? 'has-data' : ''}`}>
                                <td className="bulk-cell-num">
                                    <span className="new-badge">+</span>
                                </td>
                                <td className="bulk-cell-key">
                                    <span className="bulk-new-tag">NEW</span>
                                </td>
                                <td className="bulk-cell-summary">
                                    <input
                                        type="text"
                                        placeholder="What needs to be done?"
                                        value={row.summary}
                                        onChange={(e) => updateRow(row.id, 'summary', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isCreating}
                                    />
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.sprintId} onChange={(e) => updateRow(row.id, 'sprintId', e.target.value)} disabled={isCreating}>
                                        <option value="">Backlog</option>
                                        {availableSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.type} onChange={(e) => updateRow(row.id, 'type', e.target.value)} disabled={isCreating}>
                                        {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.status} onChange={(e) => updateRow(row.id, 'status', e.target.value)} disabled={isCreating}>
                                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.priority} onChange={(e) => updateRow(row.id, 'priority', e.target.value)} disabled={isCreating}>
                                        {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.assigneeId} onChange={(e) => updateRow(row.id, 'assigneeId', e.target.value)} disabled={isCreating}>
                                        <option value="">—</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-select">
                                    <select value={row.parentId} onChange={(e) => updateRow(row.id, 'parentId', e.target.value)} disabled={isCreating}>
                                        <option value="">—</option>
                                        {allEpics.map(e => <option key={e.id} value={e.id}>{e.key} — {e.summary?.slice(0, 25)}</option>)}
                                    </select>
                                </td>
                                <td className="bulk-cell-narrow">
                                    <input
                                        type="number" min="0" max="100" placeholder="—"
                                        value={row.storyPoints}
                                        onChange={(e) => updateRow(row.id, 'storyPoints', e.target.value)}
                                        disabled={isCreating}
                                    />
                                </td>
                                <td className="bulk-cell-actions">
                                    <button className="bulk-action-btn" onClick={() => duplicateRow(row.id)} disabled={isCreating} title="Duplicate">
                                        <Copy size={14} />
                                    </button>
                                    <button className="bulk-action-btn danger" onClick={() => removeRow(row.id)} disabled={isCreating} title="Remove">
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bulk-creator-footer">
                <div className="bulk-footer-left">
                    <button className="btn btn-ghost" onClick={addRow} disabled={isCreating}>
                        <Plus size={16} /> Add Row
                    </button>
                    <span className="bulk-valid-count">
                        {validCount} new issue{validCount !== 1 ? 's' : ''} ready
                    </span>
                </div>
                <button
                    className="btn btn-primary bulk-create-all-btn"
                    onClick={handleCreateAll}
                    disabled={isCreating || validCount === 0}
                >
                    <Rocket size={18} />
                    {isCreating ? `Creating ${progress.current}/${progress.total}...` : `Create All (${validCount})`}
                </button>
            </div>
        </div>
    )
}
