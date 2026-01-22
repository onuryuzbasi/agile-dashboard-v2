/**
 * useGlobalFilterOptions Hook
 * 
 * Single Source of Truth for all filter options across the application.
 * Sources data from projectStore which fetches from Supabase.
 */
import { useMemo } from 'react'
import { useProjectStore } from '../stores/projectStore'

export function useGlobalFilterOptions() {
    const {
        users,
        departments,
        games,
        sprints,
        issues,
        fieldConfig,
        isLoading
    } = useProjectStore()

    // Derive epics from issues (type === 'epic')
    const epics = useMemo(() => {
        return issues.filter(i => i.type === 'epic')
    }, [issues])

    // Helper to normalize IDs to strings for consistent matching
    const normalizeId = (id) => id != null ? String(id) : null

    // Build normalized filter options that match what FacetedFilterMenu expects
    // CRITICAL: All IDs are normalized to strings for exact matching with CreateIssueModal dropdowns
    const filterOptions = useMemo(() => ({
        // Users for assignee/reporter filters - with 'unassigned' option
        assignees: [
            { id: 'unassigned', name: 'Unassigned' },
            ...users.map(u => ({ id: normalizeId(u.id), name: u.name }))
        ],
        reporters: users.map(u => ({ id: normalizeId(u.id), name: u.name })),

        // Departments - with 'no-department' option
        departments: [
            { id: 'no-department', name: 'No Department' },
            ...departments.map(d => ({ id: normalizeId(d.id), name: d.name }))
        ],

        // Games - with 'no-game' option
        games: [
            { id: 'no-game', name: 'No Game' },
            ...games.map(g => ({ id: normalizeId(g.id), name: g.name }))
        ],

        // Sprints - with 'backlog' option
        sprints: [
            { id: 'backlog', name: 'Backlog' },
            ...sprints.map(s => ({ id: normalizeId(s.id), name: s.name }))
        ],

        // Epics - with 'no-epic' option
        epics: [
            { id: 'no-epic', name: 'No Parent Epic' },
            ...epics.map(e => ({ id: normalizeId(e.id), name: `${e.key} - ${e.summary}` }))
        ],

        // Field config items (priorities, statuses, types, labels)
        priorities: fieldConfig.priorities || [],
        statuses: fieldConfig.statuses || [],
        issueTypes: fieldConfig.issueTypes || [],
        labels: fieldConfig.labels || []
    }), [users, departments, games, sprints, epics, fieldConfig])

    return {
        // Raw data from store
        users,
        departments,
        games,
        sprints,
        epics,
        fieldConfig,
        issues,
        isLoading,

        // Normalized options for filters
        filterOptions
    }
}

export default useGlobalFilterOptions
