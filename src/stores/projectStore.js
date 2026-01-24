import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

// Empty initial state - will be populated from Supabase
const emptyState = {
    projects: [],
    issues: [],
    deletedIssues: [],
    sprints: [],
    users: [],
    games: [],
    departments: [],
    fieldConfig: {
        priorities: [],
        statuses: [],
        issueTypes: [],
        labels: []
    },
    currentProjectId: null,
    currentSprintId: null,
    theme: 'dark',
    sidebarCollapsed: false,
    selectedIssue: null,
    createIssueModalOpen: false,
    createIssueDefaultType: 'story',
    createIssueDefaults: {},
    // Global filter defaults for Create Issue modal (populated by active page)
    activeFilterDefaults: {},
    // Team defaults for card field visibility (fetched from Supabase team_settings)
    teamCardFieldDefaults: null,
    // Current card field visibility (merged from personal > team > defaults)
    cardFieldVisibility: {
        labels: true,
        status: true,
        dueDate: true,
        estimate: true,
        priority: true,
        assignee: true,
        checklist: true,  // Checklist progress
        game: false,      // Custom field from games table
        department: false, // Custom field from departments table
        reporter: false,   // Standard field
        startDate: false   // Standard field
    },
    savedFilters: [],
    // Global confirmation modal state
    confirmModal: {
        isOpen: false,
        title: 'Confirm',
        message: 'Are you sure?',
        variant: 'danger',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        isLoading: false
    },
    isLoading: true,
    isInitialized: false
}

// Helper to convert snake_case to camelCase
const toCamelCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase)
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            acc[camelKey] = toCamelCase(obj[key])
            return acc
        }, {})
    }
    return obj
}

// Helper to convert camelCase to snake_case for database
const toSnakeCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase)
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            acc[snakeKey] = toSnakeCase(obj[key])
            return acc
        }, {})
    }
    return obj
}

export const useProjectStore = create(
    persist(
        (set, get) => ({
            ...emptyState,

            // Initialize from Supabase
            initFromSupabase: async () => {
                try {
                    set({ isLoading: true })

                    // Fetch all data in parallel
                    const [
                        { data: projects },
                        { data: users },
                        { data: departments },
                        { data: games },
                        { data: sprints },
                        { data: priorities },
                        { data: statuses },
                        { data: issueTypes },
                        { data: labels },
                        { data: issues },
                        { data: savedFilters },
                        { data: deletedIssues }
                    ] = await Promise.all([
                        supabase.from('projects').select('*'),
                        supabase.from('users').select('*'),
                        supabase.from('departments').select('*').order('sort_order'),
                        supabase.from('games').select('*'),
                        supabase.from('sprints').select('*'),
                        supabase.from('priorities').select('*').order('sort_order'),
                        supabase.from('statuses').select('*').order('sort_order'),
                        supabase.from('issue_types').select('*').order('sort_order'),
                        supabase.from('labels').select('*'),
                        supabase.from('issues').select('*').eq('is_deleted', false),
                        supabase.from('saved_filters').select('*'),
                        supabase.from('issues').select('*').eq('is_deleted', true)
                    ])

                    // Transform to camelCase and set state
                    set({
                        projects: toCamelCase(projects || []),
                        users: toCamelCase(users || []),
                        departments: toCamelCase(departments || []),
                        games: toCamelCase(games || []),
                        sprints: toCamelCase(sprints || []),
                        issues: toCamelCase(issues || []),
                        deletedIssues: toCamelCase(deletedIssues || []),
                        savedFilters: toCamelCase(savedFilters || []),
                        fieldConfig: {
                            priorities: toCamelCase(priorities || []).map(p => ({
                                id: p.id,
                                key: p.key,
                                label: p.label,
                                color: p.color,
                                icon: p.icon,
                                order: p.sortOrder
                            })),
                            statuses: toCamelCase(statuses || []).map(s => ({
                                id: s.id,
                                key: s.key,
                                label: s.label,
                                bgColor: s.bgColor,
                                textColor: s.textColor
                            })),
                            issueTypes: toCamelCase(issueTypes || []).map(t => ({
                                id: t.id,
                                key: t.key,
                                label: t.label,
                                icon: t.icon,
                                color: t.color,
                                bgColor: t.bgColor
                            })),
                            labels: toCamelCase(labels || []).map(l => ({
                                id: l.id,
                                name: l.name,
                                color: l.color
                            }))
                        },
                        currentProjectId: projects?.[0]?.id || null,
                        currentSprintId: sprints?.find(s => s.state === 'active')?.id || sprints?.[0]?.id || null,
                        isLoading: false,
                        isInitialized: true
                    })

                    console.log('✅ Supabase data loaded successfully')
                } catch (error) {
                    console.error('Failed to load from Supabase:', error)
                    set({ isLoading: false, isInitialized: true })
                }
            },

            // Project actions
            setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
            setCurrentSprint: (sprintId) => set({ currentSprintId: sprintId }),

            // Helper methods used by components
            getCurrentProject: () => {
                const state = get()
                return state.projects.find(p => p.id === state.currentProjectId)
            },

            getProjectIssues: () => {
                const state = get()
                return state.issues.filter(i => i.projectId === state.currentProjectId)
            },

            // Alias for openCreateIssueModal (used by Header)
            // When defaults not passed explicitly, uses activeFilterDefaults from current page
            openCreateModal: (defaultType = 'story', defaults = null) => {
                const state = get()
                const finalDefaults = defaults || state.activeFilterDefaults || {}
                set({
                    createIssueModalOpen: true,
                    createIssueDefaultType: defaultType,
                    createIssueDefaults: finalDefaults
                })
            },

            // Set active filter defaults (called by pages when filters change)
            setActiveFilterDefaults: (defaults) => set({ activeFilterDefaults: defaults || {} }),

            // Issue actions
            addIssue: async (issue) => {
                const state = get()
                const project = state.projects.find(p => p.id === state.currentProjectId)
                const projectPrefix = project?.key || 'AGILE'

                // Query Supabase for max key number (including deleted issues) to avoid conflicts
                let maxKeyNum = 0
                try {
                    const { data: allIssues } = await supabase
                        .from('issues')
                        .select('key')
                        .eq('project_id', state.currentProjectId)

                    if (allIssues) {
                        maxKeyNum = allIssues.reduce((max, issue) => {
                            if (!issue.key) return max
                            const match = issue.key.match(/-(\d+)$/)
                            if (match) {
                                const num = parseInt(match[1], 10)
                                return num > max ? num : max
                            }
                            return max
                        }, 0)
                    }
                } catch (error) {
                    console.error('Failed to query max key, falling back to local state:', error)
                    // Fallback to local state
                    const projectIssues = state.issues.filter(i => i.projectId === state.currentProjectId)
                    maxKeyNum = projectIssues.reduce((max, issue) => {
                        if (!issue.key) return max
                        const match = issue.key.match(/-(\d+)$/)
                        if (match) {
                            const num = parseInt(match[1], 10)
                            return num > max ? num : max
                        }
                        return max
                    }, 0)
                }

                const newIssue = {
                    key: `${projectPrefix}-${maxKeyNum + 1}`,
                    project_id: state.currentProjectId,
                    type: issue.type || 'story',
                    status: issue.status || 'todo',
                    priority: issue.priority || 'medium',
                    summary: issue.summary,
                    description: issue.description || '',
                    assignee_id: issue.assigneeId || null,
                    reporter_id: issue.reporterId || null,
                    sprint_id: issue.sprintId !== undefined ? issue.sprintId : state.currentSprintId,
                    parent_id: issue.parentId || null,
                    story_points: issue.storyPoints || null,
                    original_estimate: issue.originalEstimate || null,
                    labels: issue.labels || [],
                    game_id: issue.gameId || null,
                    department_id: issue.departmentId || null,
                    start_date: issue.startDate || null,
                    due_date: issue.dueDate || null,
                    work_logs: [],
                    history: [],
                    checklist: []
                }

                // Optimistic update
                const tempId = `temp-${Date.now()}`
                const optimisticIssue = { ...toCamelCase(newIssue), id: tempId }
                set({ issues: [...state.issues, optimisticIssue] })

                // Sync to Supabase
                const { data, error } = await supabase
                    .from('issues')
                    .insert(newIssue)
                    .select()
                    .single()

                if (error) {
                    console.error('Failed to create issue:', error)
                    // Rollback
                    set({ issues: state.issues })
                    return null
                }

                // Replace temp with real data
                set({
                    issues: get().issues.map(i =>
                        i.id === tempId ? toCamelCase(data) : i
                    )
                })

                return toCamelCase(data)
            },

            updateIssue: async (issueId, updates, userId = null) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                // Generate history entries for changed fields
                const fieldLabels = {
                    summary: 'Summary', description: 'Description', type: 'Type',
                    status: 'Status', priority: 'Priority', assigneeId: 'Assignee',
                    reporterId: 'Reporter', sprintId: 'Sprint', storyPoints: 'Story Points',
                    parentId: 'Parent', gameId: 'Game', departmentId: 'Department',
                    startDate: 'Start Date', dueDate: 'Due Date', originalEstimate: 'Estimate'
                }

                // Helper to get human-readable label for a field value
                const getReadableLabel = (field, value) => {
                    if (value === null || value === undefined || value === '') return 'None'

                    switch (field) {
                        case 'sprintId':
                            const sprint = state.sprints.find(s => s.id === value)
                            return sprint?.name || 'Backlog'
                        case 'assigneeId':
                        case 'reporterId':
                            const user = state.users.find(u => u.id === value)
                            return user?.name || 'Unassigned'
                        case 'parentId':
                            const parent = state.issues.find(i => i.id === value)
                            return parent?.key || 'None'
                        case 'gameId':
                            const game = state.games?.find(g => g.id === value)
                            return game?.name || 'None'
                        case 'departmentId':
                            const dept = state.departments?.find(d => d.id === value)
                            return dept?.name || 'None'
                        case 'status':
                            const statusConfig = state.fieldConfig?.statuses?.find(s => s.key === value)
                            return statusConfig?.label || value
                        case 'priority':
                            const priorityConfig = state.fieldConfig?.priorities?.find(p => p.key === value)
                            return priorityConfig?.label || value
                        case 'type':
                            const typeConfig = state.fieldConfig?.issueTypes?.find(t => t.key === value)
                            return typeConfig?.label || value
                        default:
                            return String(value)
                    }
                }

                const historyEntries = []
                const trackedFields = Object.keys(fieldLabels)

                for (const field of trackedFields) {
                    if (updates[field] !== undefined && updates[field] !== issue[field]) {
                        historyEntries.push({
                            id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            userId: userId || state.users[0]?.id,
                            timestamp: new Date().toISOString(),
                            field,
                            fieldLabel: fieldLabels[field],
                            oldValue: issue[field],
                            newValue: updates[field],
                            oldLabel: getReadableLabel(field, issue[field]),
                            newLabel: getReadableLabel(field, updates[field])
                        })
                    }
                }

                const newHistory = [...(issue.history || []), ...historyEntries]

                // Optimistic update
                const updatedIssue = {
                    ...issue,
                    ...updates,
                    history: newHistory,
                    updatedAt: new Date().toISOString()
                }
                set({
                    issues: state.issues.map(i => i.id === issueId ? updatedIssue : i)
                })

                // Sync to Supabase
                const dbUpdates = toSnakeCase({
                    ...updates,
                    history: newHistory,
                    updatedAt: new Date().toISOString()
                })

                const { error } = await supabase
                    .from('issues')
                    .update(dbUpdates)
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to update issue:', error)
                    // Keep optimistic update for now - could rollback
                }
            },

            deleteIssue: async (issueId) => {
                const state = get()
                const issueToDelete = state.issues.find(i => i.id === issueId)

                // Optimistic soft delete - move to deletedIssues
                set({
                    issues: state.issues.filter(i => i.id !== issueId),
                    deletedIssues: issueToDelete
                        ? [...state.deletedIssues, { ...issueToDelete, isDeleted: true, deletedAt: new Date().toISOString() }]
                        : state.deletedIssues
                })

                // Sync to Supabase (soft delete)
                const { error } = await supabase
                    .from('issues')
                    .update({ is_deleted: true })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to delete issue:', error)
                }
            },

            // Soft delete multiple issues at once (bulk delete)
            softDeleteIssues: async (issueIds) => {
                if (!issueIds || issueIds.length === 0) return

                const state = get()

                // Optimistic update - remove all selected issues from local state
                set({
                    issues: state.issues.filter(i => !issueIds.includes(i.id))
                })

                try {
                    // Sync to Supabase - soft delete all selected issues
                    const { error } = await supabase
                        .from('issues')
                        .update({ is_deleted: true })
                        .in('id', issueIds)

                    if (error) {
                        console.error('Failed to bulk delete issues:', error)
                        // Rollback on error
                        set({ issues: state.issues })
                    }
                } catch (error) {
                    console.error('Failed to bulk delete issues:', error)
                    set({ issues: state.issues })
                }
            },

            // Restore a deleted issue from trash
            restoreIssue: async (issueId) => {
                const state = get()
                const issueToRestore = state.deletedIssues.find(i => i.id === issueId)

                if (!issueToRestore) return

                // Optimistic restore - move back to issues
                const restoredIssue = { ...issueToRestore, isDeleted: false, deletedAt: null }
                set({
                    deletedIssues: state.deletedIssues.filter(i => i.id !== issueId),
                    issues: [...state.issues, restoredIssue]
                })

                // Sync to Supabase
                const { error } = await supabase
                    .from('issues')
                    .update({ is_deleted: false })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to restore issue:', error)
                    // Rollback on error
                    set({ deletedIssues: state.deletedIssues, issues: state.issues })
                }
            },

            // Permanently delete an issue from trash
            permanentlyDeleteIssue: async (issueId) => {
                const state = get()

                // Optimistic delete
                set({
                    deletedIssues: state.deletedIssues.filter(i => i.id !== issueId)
                })

                // Sync to Supabase - actually delete the row
                const { error } = await supabase
                    .from('issues')
                    .delete()
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to permanently delete issue:', error)
                    // Rollback on error
                    set({ deletedIssues: state.deletedIssues })
                }
            },

            moveIssue: async (issueId, newStatus) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue || issue.status === newStatus) return

                // Create history entry
                const historyEntry = {
                    id: `hist-${Date.now()}`,
                    userId: state.users[0]?.id,
                    timestamp: new Date().toISOString(),
                    field: 'status',
                    fieldLabel: 'Status',
                    oldValue: issue.status,
                    newValue: newStatus,
                    oldLabel: state.fieldConfig.statuses.find(s => s.key === issue.status)?.label || issue.status,
                    newLabel: state.fieldConfig.statuses.find(s => s.key === newStatus)?.label || newStatus
                }

                const newHistory = [...(issue.history || []), historyEntry]

                // Optimistic update
                set({
                    issues: state.issues.map(i =>
                        i.id === issueId
                            ? { ...i, status: newStatus, history: newHistory, updatedAt: new Date().toISOString() }
                            : i
                    )
                })

                // Sync to Supabase
                const { error } = await supabase
                    .from('issues')
                    .update({
                        status: newStatus,
                        history: newHistory,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to move issue:', error)
                }
            },

            // Sprint actions
            getSprintIssues: (sprintId) => {
                return get().issues.filter(i => i.sprintId === sprintId)
            },

            // Backlog issues (no sprint assigned)
            getBacklogIssues: () => {
                return get().issues.filter(i => !i.sprintId)
            },

            // Add new sprint
            addSprint: async (sprintData) => {
                const state = get()
                const tempId = `temp-${Date.now()}`
                const newSprint = {
                    id: tempId,
                    name: sprintData.name || `Sprint ${state.sprints.length + 1}`,
                    goal: sprintData.goal || '',
                    startDate: sprintData.startDate || new Date().toISOString(),
                    endDate: sprintData.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    state: 'future',
                    projectId: state.currentProjectId
                }

                // Optimistic update
                set({ sprints: [...state.sprints, newSprint] })

                try {
                    const { data, error } = await supabase
                        .from('sprints')
                        .insert({
                            name: newSprint.name,
                            goal: newSprint.goal,
                            start_date: newSprint.startDate,
                            end_date: newSprint.endDate,
                            state: newSprint.state,
                            project_id: newSprint.projectId
                        })
                        .select()
                        .single()

                    if (error) throw error

                    // Replace temp ID with real ID
                    set({
                        sprints: get().sprints.map(s =>
                            s.id === tempId ? toCamelCase(data) : s
                        )
                    })
                    return toCamelCase(data)
                } catch (error) {
                    console.error('Failed to create sprint:', error)
                    // Rollback on error
                    set({ sprints: state.sprints })
                    return null
                }
            },

            // Update sprint (name, goal, dates)
            updateSprint: async (sprintId, updates) => {
                const state = get()
                const sprintToUpdate = state.sprints.find(s => s.id === sprintId)
                if (!sprintToUpdate) {
                    console.error('Sprint not found:', sprintId)
                    return false
                }

                // Optimistic update
                set({
                    sprints: state.sprints.map(s =>
                        s.id === sprintId ? { ...s, ...updates } : s
                    )
                })

                try {
                    const { error } = await supabase
                        .from('sprints')
                        .update({
                            name: updates.name !== undefined ? updates.name : sprintToUpdate.name,
                            goal: updates.goal !== undefined ? updates.goal : sprintToUpdate.goal,
                            start_date: updates.startDate !== undefined ? updates.startDate : sprintToUpdate.startDate,
                            end_date: updates.endDate !== undefined ? updates.endDate : sprintToUpdate.endDate
                        })
                        .eq('id', sprintId)

                    if (error) throw error
                    console.log('✅ Sprint updated successfully')
                    return true
                } catch (error) {
                    console.error('Failed to update sprint:', error)
                    set({ sprints: state.sprints })
                    return false
                }
            },
            startSprint: async (sprintId) => {
                const state = get()

                // First, complete any currently active sprint
                const activeSprint = state.sprints.find(s => s.state === 'active')
                if (activeSprint) {
                    await get().completeSprint(activeSprint.id)
                }

                // Optimistic update
                set({
                    sprints: get().sprints.map(s =>
                        s.id === sprintId ? { ...s, state: 'active' } : s
                    )
                })

                try {
                    const { error } = await supabase
                        .from('sprints')
                        .update({ state: 'active' })
                        .eq('id', sprintId)

                    if (error) throw error
                } catch (error) {
                    console.error('Failed to start sprint:', error)
                    set({ sprints: state.sprints })
                }
            },

            // Complete sprint (change state to 'closed')
            // Incomplete issues (status !== 'done') are moved to the next sprint
            completeSprint: async (sprintId) => {
                const state = get()
                const { issues, sprints, fieldConfig } = state

                // Find the "done" status key (usually 'done' but could be configured differently)
                const doneStatus = fieldConfig.statuses?.find(s =>
                    s.key === 'done' || s.label?.toLowerCase() === 'done'
                )
                const doneStatusKey = doneStatus?.key || 'done'

                // Find incomplete issues in this sprint
                const incompleteIssues = issues.filter(issue =>
                    issue.sprintId === sprintId &&
                    issue.status !== doneStatusKey &&
                    !issue.isDeleted
                )

                // Find the next available sprint (future or planned sprint, not the one being completed)
                const currentSprint = sprints.find(s => s.id === sprintId)
                const nextSprint = sprints
                    .filter(s => s.id !== sprintId && s.state !== 'closed')
                    .sort((a, b) => {
                        // Prefer 'active' sprints, then by start date
                        if (a.state === 'active' && b.state !== 'active') return -1
                        if (b.state === 'active' && a.state !== 'active') return 1
                        return new Date(a.startDate || 0) - new Date(b.startDate || 0)
                    })[0]

                // Move incomplete issues to next sprint (or backlog if no next sprint)
                const targetSprintId = nextSprint?.id || null


                if (incompleteIssues.length > 0) {
                    console.log(`📦 Moving ${incompleteIssues.length} incomplete issues to ${nextSprint?.name || 'Backlog'}`)

                    // Optimistic update for issues
                    set({
                        issues: issues.map(issue =>
                            incompleteIssues.find(i => i.id === issue.id)
                                ? { ...issue, sprintId: targetSprintId }
                                : issue
                        )
                    })

                    // Sync issues to Supabase
                    for (const issue of incompleteIssues) {
                        const { error } = await supabase
                            .from('issues')
                            .update({ sprint_id: targetSprintId })
                            .eq('id', issue.id)

                        if (error) {
                            console.error('Failed to move issue to next sprint:', error)
                        }
                    }
                }

                // Mark sprint as closed
                set({
                    sprints: get().sprints.map(s =>
                        s.id === sprintId ? { ...s, state: 'closed' } : s
                    )
                })

                try {
                    const { error } = await supabase
                        .from('sprints')
                        .update({ state: 'closed' })
                        .eq('id', sprintId)

                    if (error) throw error

                    console.log(`✅ Sprint completed. ${incompleteIssues.length} issues moved to ${nextSprint?.name || 'Backlog'}`)
                } catch (error) {
                    console.error('Failed to complete sprint:', error)
                    set({ sprints: state.sprints, issues: state.issues })
                }
            },

            // Delete sprint (move issues to backlog first)
            deleteSprint: async (sprintId) => {
                console.log('🗑️ deleteSprint called with:', sprintId)
                const state = get()
                const sprintToDelete = state.sprints.find(s => s.id === sprintId)
                if (!sprintToDelete) {
                    console.error('❌ Sprint not found:', sprintId)
                    return false
                }

                console.log('📋 Found sprint to delete:', sprintToDelete.name)

                // Move all issues from this sprint to backlog
                const issuesInSprint = state.issues.filter(i => i.sprintId === sprintId)
                console.log(`📦 ${issuesInSprint.length} issues will be moved to backlog`)

                // Optimistic update - remove sprint and clear sprintId from issues
                set({
                    sprints: state.sprints.filter(s => s.id !== sprintId),
                    issues: state.issues.map(i =>
                        i.sprintId === sprintId ? { ...i, sprintId: null } : i
                    )
                })
                console.log('✅ Local state updated optimistically')

                try {
                    // Update issues to remove sprint reference
                    if (issuesInSprint.length > 0) {
                        console.log('📤 Updating issues in Supabase...')
                        const { error: issueError } = await supabase
                            .from('issues')
                            .update({ sprint_id: null })
                            .eq('sprint_id', sprintId)

                        if (issueError) {
                            console.error('❌ Failed to update issues:', issueError)
                        } else {
                            console.log('✅ Issues updated in Supabase')
                        }
                    }

                    // Delete the sprint
                    console.log('📤 Deleting sprint from Supabase...')
                    const { error } = await supabase
                        .from('sprints')
                        .delete()
                        .eq('id', sprintId)

                    if (error) {
                        console.error('❌ Supabase delete error:', error)
                        throw error
                    }

                    console.log('✅ Sprint deleted successfully from Supabase')
                    return true
                } catch (error) {
                    console.error('❌ Failed to delete sprint:', error)
                    // Rollback optimistic update
                    set({ sprints: state.sprints, issues: state.issues })
                    console.log('🔄 Rolled back local state')
                    return false
                }
            },

            // User actions
            getUserById: (userId) => {
                return get().users.find(u => u.id === userId)
            },

            // Field Config actions (sync to Supabase)
            addFieldConfigItem: async (fieldType, item) => {
                const state = get()
                const tableMap = {
                    priorities: 'priorities',
                    statuses: 'statuses',
                    issueTypes: 'issue_types',
                    labels: 'labels'
                }

                // Optimistic update
                const tempId = `temp-${Date.now()}`
                set({
                    fieldConfig: {
                        ...state.fieldConfig,
                        [fieldType]: [...state.fieldConfig[fieldType], { ...item, id: tempId }]
                    }
                })

                // Sync to Supabase
                const { data, error } = await supabase
                    .from(tableMap[fieldType])
                    .insert(toSnakeCase(item))
                    .select()
                    .single()

                if (error) {
                    console.error(`Failed to add ${fieldType}:`, error)
                    set({ fieldConfig: state.fieldConfig })
                    return
                }

                // Replace temp with real
                set({
                    fieldConfig: {
                        ...get().fieldConfig,
                        [fieldType]: get().fieldConfig[fieldType].map(i =>
                            i.id === tempId ? toCamelCase(data) : i
                        )
                    }
                })
            },

            updateFieldConfigItem: async (fieldType, itemId, updates) => {
                const state = get()
                const tableMap = {
                    priorities: 'priorities',
                    statuses: 'statuses',
                    issueTypes: 'issue_types',
                    labels: 'labels'
                }

                // Optimistic update
                set({
                    fieldConfig: {
                        ...state.fieldConfig,
                        [fieldType]: state.fieldConfig[fieldType].map(item =>
                            item.id === itemId ? { ...item, ...updates } : item
                        )
                    }
                })

                // Sync to Supabase
                const { error } = await supabase
                    .from(tableMap[fieldType])
                    .update(toSnakeCase(updates))
                    .eq('id', itemId)

                if (error) {
                    console.error(`Failed to update ${fieldType}:`, error)
                }
            },

            deleteFieldConfigItem: async (fieldType, itemId) => {
                const state = get()
                const tableMap = {
                    priorities: 'priorities',
                    statuses: 'statuses',
                    issueTypes: 'issue_types',
                    labels: 'labels'
                }

                // Optimistic update
                set({
                    fieldConfig: {
                        ...state.fieldConfig,
                        [fieldType]: state.fieldConfig[fieldType].filter(item => item.id !== itemId)
                    }
                })

                // Sync to Supabase
                const { error } = await supabase
                    .from(tableMap[fieldType])
                    .delete()
                    .eq('id', itemId)

                if (error) {
                    console.error(`Failed to delete ${fieldType}:`, error)
                }
            },

            reorderFieldConfigItem: async (fieldType, newOrder) => {
                const tableMap = {
                    priorities: 'priorities',
                    statuses: 'statuses',
                    issueTypes: 'issue_types',
                    labels: 'labels'
                }

                // Optimistic update with sort_order
                const orderedItems = newOrder.map((item, index) => ({ ...item, sortOrder: index }))
                set((state) => ({
                    fieldConfig: {
                        ...state.fieldConfig,
                        [fieldType]: orderedItems
                    }
                }))

                // Sync sort_order to Supabase
                const tableName = tableMap[fieldType]
                if (tableName) {
                    for (let i = 0; i < newOrder.length; i++) {
                        const item = newOrder[i]
                        if (item.id && !String(item.id).startsWith('temp-')) {
                            const { error } = await supabase
                                .from(tableName)
                                .update({ sort_order: i })
                                .eq('id', item.id)

                            if (error) {
                                console.error(`Failed to update sort_order for ${fieldType}:`, error)
                            }
                        }
                    }
                }
            },

            // Department actions
            addDepartment: async (dept) => {
                const state = get()
                const tempId = `temp-${Date.now()}`

                set({
                    departments: [...state.departments, { ...dept, id: tempId }]
                })

                const { data, error } = await supabase
                    .from('departments')
                    .insert(toSnakeCase(dept))
                    .select()
                    .single()

                if (error) {
                    console.error('Failed to add department:', error)
                    set({ departments: state.departments })
                    return
                }

                set({
                    departments: get().departments.map(d =>
                        d.id === tempId ? toCamelCase(data) : d
                    )
                })
            },

            updateDepartment: async (deptId, updates) => {
                const state = get()

                set({
                    departments: state.departments.map(d =>
                        d.id === deptId ? { ...d, ...updates } : d
                    )
                })

                const { error } = await supabase
                    .from('departments')
                    .update(toSnakeCase(updates))
                    .eq('id', deptId)

                if (error) {
                    console.error('Failed to update department:', error)
                }
            },

            deleteDepartment: async (deptId) => {
                const state = get()

                set({
                    departments: state.departments.filter(d => d.id !== deptId)
                })

                const { error } = await supabase
                    .from('departments')
                    .delete()
                    .eq('id', deptId)

                if (error) {
                    console.error('Failed to delete department:', error)
                }
            },

            reorderDepartments: (newOrder) => set({ departments: newOrder }),

            // Game actions
            addGame: async (game) => {
                const state = get()
                const tempId = `temp-${Date.now()}`

                set({
                    games: [...state.games, { ...game, id: tempId }]
                })

                const { data, error } = await supabase
                    .from('games')
                    .insert(toSnakeCase(game))
                    .select()
                    .single()

                if (error) {
                    console.error('Failed to add game:', error)
                    set({ games: state.games })
                    return
                }

                set({
                    games: get().games.map(g =>
                        g.id === tempId ? toCamelCase(data) : g
                    )
                })
            },

            updateGame: async (gameId, updates) => {
                const state = get()

                set({
                    games: state.games.map(g =>
                        g.id === gameId ? { ...g, ...updates } : g
                    )
                })

                const { error } = await supabase
                    .from('games')
                    .update(toSnakeCase(updates))
                    .eq('id', gameId)

                if (error) {
                    console.error('Failed to update game:', error)
                }
            },

            deleteGame: async (gameId) => {
                const state = get()

                set({
                    games: state.games.filter(g => g.id !== gameId)
                })

                const { error } = await supabase
                    .from('games')
                    .delete()
                    .eq('id', gameId)

                if (error) {
                    console.error('Failed to delete game:', error)
                }
            },

            // Saved Filters
            addSavedFilter: async (filter) => {
                const state = get()
                const tempId = `temp-${Date.now()}`
                const newFilter = { ...filter, id: tempId }

                set({
                    savedFilters: [...state.savedFilters, newFilter]
                })

                const { data, error } = await supabase
                    .from('saved_filters')
                    .insert({
                        name: filter.name,
                        filters: filter.filters,
                        user_id: state.users[0]?.id
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Failed to save filter:', error)
                    set({ savedFilters: state.savedFilters })
                    return
                }

                set({
                    savedFilters: get().savedFilters.map(f =>
                        f.id === tempId ? toCamelCase(data) : f
                    )
                })
            },

            deleteSavedFilter: async (filterId) => {
                const state = get()

                set({
                    savedFilters: state.savedFilters.filter(f => f.id !== filterId)
                })

                const { error } = await supabase
                    .from('saved_filters')
                    .delete()
                    .eq('id', filterId)

                if (error) {
                    console.error('Failed to delete filter:', error)
                }
            },

            // UI state
            setTheme: (theme) => set({ theme }),
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'dark' ? 'light' : 'dark'
            })),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSelectedIssue: (issue) => set({ selectedIssue: issue }),
            openCreateIssueModal: (defaultType = 'story', defaults = {}) => set({
                createIssueModalOpen: true,
                createIssueDefaultType: defaultType,
                createIssueDefaults: defaults
            }),
            closeCreateIssueModal: () => set({ createIssueModalOpen: false, createIssueDefaults: {} }),

            // Confirmation modal actions
            showConfirmModal: (config) => set({
                confirmModal: {
                    isOpen: true,
                    title: config.title || 'Confirm',
                    message: config.message || 'Are you sure?',
                    variant: config.variant || 'danger',
                    confirmText: config.confirmText || 'Confirm',
                    cancelText: config.cancelText || 'Cancel',
                    onConfirm: config.onConfirm || (() => { }),
                    isLoading: false
                }
            }),
            hideConfirmModal: () => set((state) => ({
                confirmModal: {
                    ...state.confirmModal,
                    isOpen: false,
                    onConfirm: null
                }
            })),

            // Card Field Visibility - local toggle (immediate UI feedback)
            setCardFieldVisibility: (field, visible) => set((state) => ({
                cardFieldVisibility: {
                    ...state.cardFieldVisibility,
                    [field]: visible
                }
            })),

            // Set all card field visibility at once
            setAllCardFieldVisibility: (visibility) => set({ cardFieldVisibility: visibility }),

            // Save personal card field preferences to localStorage
            savePersonalCardFields: () => {
                const state = get()
                localStorage.setItem('cardFieldVisibility', JSON.stringify(state.cardFieldVisibility))
            },

            // Load personal card fields from localStorage, falling back to team defaults
            loadCardFieldPreferences: async () => {
                const state = get()

                // Try localStorage first (personal preference)
                const personal = localStorage.getItem('cardFieldVisibility')
                if (personal) {
                    try {
                        const parsed = JSON.parse(personal)
                        set({ cardFieldVisibility: { ...state.cardFieldVisibility, ...parsed } })
                        return
                    } catch (e) {
                        console.warn('Invalid personal card field preferences in localStorage')
                    }
                }

                // Fall back to team defaults if loaded
                if (state.teamCardFieldDefaults) {
                    set({ cardFieldVisibility: { ...state.cardFieldVisibility, ...state.teamCardFieldDefaults } })
                }
            },

            // Load team card field defaults from Supabase
            loadTeamSettings: async () => {
                const state = get()
                if (!state.currentProjectId) return

                const { data, error } = await supabase
                    .from('team_settings')
                    .select('setting_value')
                    .eq('project_id', state.currentProjectId)
                    .eq('setting_key', 'cardFieldVisibility')
                    .single()

                if (!error && data?.setting_value) {
                    set({ teamCardFieldDefaults: data.setting_value })

                    // If no personal preference, apply team defaults
                    const personal = localStorage.getItem('cardFieldVisibility')
                    if (!personal) {
                        set({ cardFieldVisibility: { ...state.cardFieldVisibility, ...data.setting_value } })
                    }
                }
            },

            // Save card field visibility as team default to Supabase
            saveTeamCardFieldDefaults: async () => {
                const state = get()
                if (!state.currentProjectId) return

                const { error } = await supabase
                    .from('team_settings')
                    .upsert({
                        project_id: state.currentProjectId,
                        setting_key: 'cardFieldVisibility',
                        setting_value: state.cardFieldVisibility,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'project_id,setting_key' })

                if (error) {
                    console.error('Failed to save team card field defaults:', error)
                    throw error
                }

                set({ teamCardFieldDefaults: state.cardFieldVisibility })
            },

            // Get list of available card fields dynamically
            getAvailableCardFields: () => {
                const state = get()
                const fields = [
                    { key: 'labels', label: 'Labels', category: 'standard' },
                    { key: 'status', label: 'Status', category: 'standard' },
                    { key: 'dueDate', label: 'Due Date', category: 'standard' },
                    { key: 'startDate', label: 'Start Date', category: 'standard' },
                    { key: 'estimate', label: 'Story Points', category: 'standard' },
                    { key: 'priority', label: 'Priority', category: 'standard' },
                    { key: 'assignee', label: 'Assignee', category: 'standard' },
                    { key: 'reporter', label: 'Reporter', category: 'standard' },
                    { key: 'checklist', label: 'Checklist', category: 'standard' }
                ]

                // Add custom fields from games/departments if they exist
                if (state.games?.length > 0) {
                    fields.push({ key: 'game', label: 'Game', category: 'custom' })
                }
                if (state.departments?.length > 0) {
                    fields.push({ key: 'department', label: 'Department', category: 'custom' })
                }

                return fields
            },

            // Work Log
            addWorkLog: async (issueId, workLog) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                const newWorkLog = {
                    ...workLog,
                    id: `wl-${Date.now()}`,
                    createdAt: new Date().toISOString()
                }

                const newWorkLogs = [...(issue.workLogs || []), newWorkLog]

                set({
                    issues: state.issues.map(i =>
                        i.id === issueId ? { ...i, workLogs: newWorkLogs } : i
                    )
                })

                const { error } = await supabase
                    .from('issues')
                    .update({ work_logs: newWorkLogs })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to add work log:', error)
                }
            },

            removeWorkLog: async (issueId, workLogId) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                const newWorkLogs = (issue.workLogs || []).filter(w => w.id !== workLogId)

                set({
                    issues: state.issues.map(i =>
                        i.id === issueId ? { ...i, workLogs: newWorkLogs } : i
                    )
                })

                const { error } = await supabase
                    .from('issues')
                    .update({ work_logs: newWorkLogs })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to remove work log:', error)
                }
            },

            // Checklist Management
            addChecklistItem: async (issueId, text) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                const newItem = {
                    id: `cl-${Date.now()}`,
                    text: text.trim(),
                    checked: false,
                    createdAt: new Date().toISOString()
                }

                const newChecklist = [...(issue.checklist || []), newItem]

                set({
                    issues: state.issues.map(i =>
                        i.id === issueId ? { ...i, checklist: newChecklist } : i
                    )
                })

                const { error } = await supabase
                    .from('issues')
                    .update({ checklist: newChecklist })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to add checklist item:', error)
                }

                return newItem
            },

            updateChecklistItem: async (issueId, itemId, updates) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                const newChecklist = (issue.checklist || []).map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                )

                set({
                    issues: state.issues.map(i =>
                        i.id === issueId ? { ...i, checklist: newChecklist } : i
                    )
                })

                const { error } = await supabase
                    .from('issues')
                    .update({ checklist: newChecklist })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to update checklist item:', error)
                }
            },

            removeChecklistItem: async (issueId, itemId) => {
                const state = get()
                const issue = state.issues.find(i => i.id === issueId)
                if (!issue) return

                const newChecklist = (issue.checklist || []).filter(item => item.id !== itemId)

                set({
                    issues: state.issues.map(i =>
                        i.id === issueId ? { ...i, checklist: newChecklist } : i
                    )
                })

                const { error } = await supabase
                    .from('issues')
                    .update({ checklist: newChecklist })
                    .eq('id', issueId)

                if (error) {
                    console.error('Failed to remove checklist item:', error)
                }
            }
        }),
        {
            name: 'agile-dashboard-store',
            // Persist UI state and saved filters (data comes from Supabase)
            partialize: (state) => ({
                theme: state.theme,
                sidebarCollapsed: state.sidebarCollapsed,
                currentProjectId: state.currentProjectId,
                currentSprintId: state.currentSprintId,
                savedFilters: state.savedFilters,
                cardFieldVisibility: state.cardFieldVisibility
            })
        }
    )
)
