import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Initial mock data for demonstration
const initialProjects = [
    {
        id: 'proj-1',
        key: 'AGILE',
        name: 'Agile Dashboard',
        description: 'Internal project management tool',
        createdAt: new Date().toISOString()
    }
]

const initialDepartments = [
    { id: 'dept-1', name: 'Engineering', code: 'ENG' },
    { id: 'dept-2', name: 'Design', code: 'DES' },
    { id: 'dept-3', name: 'Product', code: 'PRD' },
    { id: 'dept-4', name: 'QA', code: 'QA' }
]

// Field Configuration - Centralized configurable fields
const initialFieldConfig = {
    priorities: [
        { id: 'pri-1', key: 'highest', label: 'Highest', color: '#CD1316', icon: 'ArrowUp', order: 1 },
        { id: 'pri-2', key: 'high', label: 'High', color: '#E97F33', icon: 'ArrowUp', order: 2 },
        { id: 'pri-3', key: 'medium', label: 'Medium', color: '#E9A233', icon: 'Minus', order: 3 },
        { id: 'pri-4', key: 'low', label: 'Low', color: '#2D8738', icon: 'ArrowDown', order: 4 },
        { id: 'pri-5', key: 'lowest', label: 'Lowest', color: '#57A55A', icon: 'ArrowDown', order: 5 }
    ],
    statuses: [
        { id: 'sta-1', key: 'todo', label: 'TO DO', bgColor: '#DFE1E6', textColor: '#42526E' },
        { id: 'sta-2', key: 'progress', label: 'IN PROGRESS', bgColor: '#0052CC', textColor: '#FFFFFF' },
        { id: 'sta-3', key: 'review', label: 'IN REVIEW', bgColor: '#FF991F', textColor: '#172B4D' },
        { id: 'sta-4', key: 'done', label: 'DONE', bgColor: '#00875A', textColor: '#FFFFFF' }
    ],
    issueTypes: [
        { id: 'type-1', key: 'story', label: 'Story', icon: 'BookOpen', color: '#36B37E', bgColor: '#E3FCEF' },
        { id: 'type-2', key: 'bug', label: 'Bug', icon: 'Bug', color: '#FF5630', bgColor: '#FFEBE6' },
        { id: 'type-3', key: 'task', label: 'Task', icon: 'CheckSquare', color: '#4FADE6', bgColor: '#DEEBFF' },
        { id: 'type-4', key: 'epic', label: 'Epic', icon: 'Layers', color: '#904EE2', bgColor: '#EAE6FF' },
        { id: 'type-5', key: 'subtask', label: 'Subtask', icon: 'ListTree', color: '#4FADE6', bgColor: '#DEEBFF' }
    ],
    labels: [
        { id: 'lbl-1', name: 'frontend', color: '#36B37E' },
        { id: 'lbl-2', name: 'backend', color: '#0052CC' },
        { id: 'lbl-3', name: 'security', color: '#FF5630' },
        { id: 'lbl-4', name: 'ux', color: '#6554C0' },
        { id: 'lbl-5', name: 'core', color: '#FF991F' },
        { id: 'lbl-6', name: 'auth', color: '#00B8D9' }
    ]
}

const initialIssues = [
    {
        id: 'issue-1',
        key: 'AGILE-1',
        projectId: 'proj-1',
        type: 'epic',
        status: 'done',
        priority: 'high',
        summary: 'User Authentication System',
        description: 'Implement complete user authentication with login, register, and password reset',
        assigneeId: 'user-1',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 13,
        labels: ['security', 'core'],
        startDate: '2026-01-10',
        dueDate: '2026-01-28',
        gameId: 'game-1',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-2',
        key: 'AGILE-2',
        projectId: 'proj-1',
        type: 'story',
        status: 'done',
        priority: 'high',
        summary: 'Implement Login Form',
        description: 'Create login form with email and password fields',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        parentId: 'issue-1',
        storyPoints: 8,
        labels: ['frontend', 'ux'],
        startDate: '2026-01-12',
        dueDate: '2026-01-20',
        gameId: 'game-1',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-3',
        key: 'AGILE-3',
        projectId: 'proj-1',
        type: 'story',
        status: 'done',
        priority: 'highest',
        summary: 'Implement Registration Flow',
        description: 'Create user registration with email verification',
        assigneeId: 'user-1',
        reporterId: 'user-2',
        sprintId: 'sprint-1',
        parentId: 'issue-1',
        storyPoints: 3,
        labels: ['frontend', 'auth'],
        startDate: '2026-01-14',
        dueDate: '2026-01-22',
        gameId: 'game-1',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-4',
        key: 'AGILE-4',
        projectId: 'proj-1',
        type: 'epic',
        status: 'progress',
        priority: 'medium',
        summary: 'Gameplay Matchland',
        description: 'Implement core gameplay features for Matchland game mode',
        assigneeId: 'user-3',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 21,
        labels: ['gameplay'],
        startDate: '2026-01-08',
        dueDate: '2026-02-05',
        gameId: 'game-2',
        departmentId: 'dept-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-5',
        key: 'AGILE-5',
        projectId: 'proj-1',
        type: 'epic',
        status: 'done',
        priority: 'high',
        summary: 'Level Difficulty Seed Dream Design',
        description: 'Design level difficulty progression and dream seed mechanics',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 13,
        labels: ['design', 'gameplay'],
        startDate: '2026-01-06',
        dueDate: '2026-01-30',
        gameId: 'game-1',
        departmentId: 'dept-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-6',
        key: 'AGILE-6',
        projectId: 'proj-1',
        type: 'epic',
        status: 'done',
        priority: 'medium',
        summary: 'Archery Arena - Zen',
        description: 'Create zen mode for archery arena with calming mechanics',
        assigneeId: 'user-1',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 8,
        labels: ['gameplay', 'zen'],
        startDate: '2026-01-05',
        dueDate: '2026-02-10',
        gameId: 'game-2',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-7',
        key: 'AGILE-7',
        projectId: 'proj-1',
        type: 'story',
        status: 'done',
        priority: 'high',
        summary: 'Password Reset Flow',
        description: 'Implement password reset with email verification',
        assigneeId: 'user-1',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        parentId: 'issue-1',
        storyPoints: 5,
        labels: ['frontend', 'auth'],
        startDate: '2026-01-18',
        dueDate: '2026-01-26',
        gameId: 'game-1',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-8',
        key: 'AGILE-8',
        projectId: 'proj-1',
        type: 'story',
        status: 'done',
        priority: 'medium',
        summary: 'Session Token Management',
        description: 'Implement JWT token refresh and session management',
        assigneeId: 'user-2',
        reporterId: 'user-2',
        sprintId: 'sprint-1',
        parentId: 'issue-1',
        storyPoints: 5,
        labels: ['backend', 'auth'],
        startDate: '2026-01-20',
        dueDate: '2026-01-28',
        gameId: 'game-1',
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-9',
        key: 'AGILE-9',
        projectId: 'proj-1',
        type: 'bug',
        status: 'todo',
        priority: 'high',
        summary: 'Fix Mobile Responsive Layout',
        description: 'Fix layout issues on mobile devices',
        assigneeId: 'user-3',
        reporterId: 'user-1',
        sprintId: null,
        storyPoints: 3,
        labels: ['bug', 'mobile'],
        startDate: '2026-01-22',
        dueDate: '2026-01-30',
        gameId: null,
        departmentId: 'dept-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-10',
        key: 'AGILE-10',
        projectId: 'proj-1',
        type: 'task',
        status: 'progress',
        priority: 'medium',
        summary: 'Update Documentation',
        description: 'Update API documentation and user guides',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        sprintId: null,
        storyPoints: 2,
        labels: ['docs'],
        startDate: '2026-01-15',
        dueDate: '2026-01-25',
        gameId: null,
        departmentId: 'dept-3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
]

const initialSprints = [
    {
        id: 'sprint-1',
        projectId: 'proj-1',
        name: 'Sprint 1',
        goal: 'Complete core dashboard features and initial UI',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        state: 'active'
    },
    {
        id: 'sprint-2',
        projectId: 'proj-1',
        name: 'Sprint 2',
        goal: 'Jira integration and data sync',
        startDate: null,
        endDate: null,
        state: 'future'
    }
]

const initialUsers = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@example.com', avatar: null },
    { id: 'user-2', name: 'Sarah Chen', email: 'sarah@example.com', avatar: null },
    { id: 'user-3', name: 'Mike Wilson', email: 'mike@example.com', avatar: null }
]

const initialGames = [
    { id: 'game-1', name: 'Royal Quest', code: 'RQ' },
    { id: 'game-2', name: 'Zen Master', code: 'ZM' },
    { id: 'game-3', name: 'Star Voyage', code: 'SV' }
]

export const useProjectStore = create(
    persist(
        (set, get) => ({
            // State
            projects: initialProjects,
            issues: initialIssues,
            sprints: initialSprints,
            users: initialUsers,
            games: initialGames,
            departments: initialDepartments,
            fieldConfig: initialFieldConfig, // Centralized field configuration
            currentProjectId: 'proj-1',
            currentSprintId: 'sprint-1',
            theme: 'light',
            sidebarCollapsed: false,
            selectedIssue: null,
            createIssueModalOpen: false,
            createIssueDefaultType: 'story',
            savedFilters: [], // Array of { id, name, filters }

            // Project actions
            setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
            addProject: (project) => set((state) => ({
                projects: [...state.projects, { ...project, id: `proj-${Date.now()}`, createdAt: new Date().toISOString() }]
            })),

            // Field Configuration Actions
            addFieldConfigItem: (fieldType, item) => set((state) => ({
                fieldConfig: {
                    ...state.fieldConfig,
                    [fieldType]: [...state.fieldConfig[fieldType], { ...item, id: `${fieldType.slice(0, 3)}-${Date.now()}` }]
                }
            })),
            updateFieldConfigItem: (fieldType, itemId, updates) => set((state) => ({
                fieldConfig: {
                    ...state.fieldConfig,
                    [fieldType]: state.fieldConfig[fieldType].map(item =>
                        item.id === itemId ? { ...item, ...updates } : item
                    )
                }
            })),
            deleteFieldConfigItem: (fieldType, itemId) => set((state) => ({
                fieldConfig: {
                    ...state.fieldConfig,
                    [fieldType]: state.fieldConfig[fieldType].filter(item => item.id !== itemId)
                }
            })),

            // Department Actions (using fieldConfig pattern)
            addDepartment: (dept) => set((state) => ({
                departments: [...state.departments, { ...dept, id: `dept-${Date.now()}` }]
            })),
            updateDepartment: (deptId, updates) => set((state) => ({
                departments: state.departments.map(d => d.id === deptId ? { ...d, ...updates } : d)
            })),
            deleteDepartment: (deptId) => set((state) => ({
                departments: state.departments.filter(d => d.id !== deptId)
            })),

            // Issue actions
            addIssue: (issue) => {
                const state = get()
                const project = state.projects.find(p => p.id === state.currentProjectId)
                const issueCount = state.issues.filter(i => i.projectId === state.currentProjectId).length
                const newIssue = {
                    ...issue,
                    id: `issue-${Date.now()}`,
                    key: `${project?.key || 'AGILE'}-${issueCount + 1}`,
                    projectId: state.currentProjectId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
                set({ issues: [...state.issues, newIssue] })
                return newIssue
            },

            updateIssue: (issueId, updates) => set((state) => ({
                issues: state.issues.map(issue =>
                    issue.id === issueId
                        ? { ...issue, ...updates, updatedAt: new Date().toISOString() }
                        : issue
                )
            })),

            deleteIssue: (issueId) => set((state) => ({
                issues: state.issues.filter(issue => issue.id !== issueId)
            })),

            moveIssue: (issueId, newStatus) => set((state) => ({
                issues: state.issues.map(issue =>
                    issue.id === issueId
                        ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() }
                        : issue
                )
            })),

            setSelectedIssue: (issue) => set({ selectedIssue: issue }),

            // Create Issue Modal
            openCreateModal: (defaultType = 'story') => set({
                createIssueModalOpen: true,
                createIssueDefaultType: defaultType
            }),
            closeCreateModal: () => set({
                createIssueModalOpen: false,
                createIssueDefaultType: 'story'
            }),

            // Saved Filters
            addSavedFilter: (name, filters) => set((state) => ({
                savedFilters: [
                    ...state.savedFilters,
                    {
                        id: `filter-${Date.now()}`,
                        name,
                        filters, // Object with arrays for each field
                        createdAt: new Date().toISOString()
                    }
                ]
            })),
            removeSavedFilter: (filterId) => set((state) => ({
                savedFilters: state.savedFilters.filter(f => f.id !== filterId)
            })),

            // Soft delete issues (move to trash)
            softDeleteIssues: (issueIds) => set((state) => ({
                issues: state.issues.map(issue =>
                    issueIds.includes(issue.id)
                        ? { ...issue, isDeleted: true, deletedAt: new Date().toISOString() }
                        : issue
                )
            })),

            // Restore issue from trash
            restoreIssue: (issueId) => set((state) => ({
                issues: state.issues.map(issue =>
                    issue.id === issueId
                        ? { ...issue, isDeleted: false, deletedAt: null }
                        : issue
                )
            })),

            // Permanently delete issue
            permanentlyDeleteIssue: (issueId) => set((state) => ({
                issues: state.issues.filter(issue => issue.id !== issueId)
            })),

            // Get deleted issues
            getDeletedIssues: () => {
                const state = get()
                return state.issues.filter(i => i.isDeleted)
            },

            // Add work log to an issue
            addWorkLog: (issueId, workLog) => set((state) => ({
                issues: state.issues.map(issue =>
                    issue.id === issueId
                        ? {
                            ...issue,
                            workLogs: [
                                ...(issue.workLogs || []),
                                {
                                    id: `log-${Date.now()}`,
                                    ...workLog,
                                    createdAt: new Date().toISOString()
                                }
                            ],
                            updatedAt: new Date().toISOString()
                        }
                        : issue
                )
            })),

            // Remove work log from an issue
            removeWorkLog: (issueId, workLogId) => set((state) => ({
                issues: state.issues.map(issue =>
                    issue.id === issueId
                        ? {
                            ...issue,
                            workLogs: (issue.workLogs || []).filter(log => log.id !== workLogId),
                            updatedAt: new Date().toISOString()
                        }
                        : issue
                )
            })),

            // Sprint actions
            setCurrentSprint: (sprintId) => set({ currentSprintId: sprintId }),

            addSprint: (sprint) => set((state) => ({
                sprints: [...state.sprints, {
                    ...sprint,
                    id: `sprint-${Date.now()}`,
                    projectId: state.currentProjectId,
                    state: 'future'
                }]
            })),

            startSprint: (sprintId) => set((state) => ({
                sprints: state.sprints.map(sprint =>
                    sprint.id === sprintId
                        ? { ...sprint, state: 'active', startDate: new Date().toISOString() }
                        : sprint.state === 'active'
                            ? { ...sprint, state: 'closed' }
                            : sprint
                )
            })),

            completeSprint: (sprintId) => set((state) => ({
                sprints: state.sprints.map(sprint =>
                    sprint.id === sprintId
                        ? { ...sprint, state: 'closed' }
                        : sprint
                )
            })),

            deleteSprint: (sprintId) => set((state) => ({
                sprints: state.sprints.filter(sprint => sprint.id !== sprintId),
                // Move issues from deleted sprint to backlog
                issues: state.issues.map(issue =>
                    issue.sprintId === sprintId
                        ? { ...issue, sprintId: null }
                        : issue
                )
            })),

            updateSprint: (sprintId, updates) => set((state) => ({
                sprints: state.sprints.map(sprint =>
                    sprint.id === sprintId
                        ? { ...sprint, ...updates }
                        : sprint
                )
            })),

            // Theme actions
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light'
                document.documentElement.setAttribute('data-theme', newTheme)
                return { theme: newTheme }
            }),

            // Sidebar
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

            // Getters
            getCurrentProject: () => {
                const state = get()
                return state.projects.find(p => p.id === state.currentProjectId)
            },

            getProjectIssues: () => {
                const state = get()
                return state.issues.filter(i => i.projectId === state.currentProjectId)
            },

            getSprintIssues: (sprintId) => {
                const state = get()
                return state.issues.filter(i => i.sprintId === sprintId)
            },

            getBacklogIssues: () => {
                const state = get()
                return state.issues.filter(i => i.projectId === state.currentProjectId && !i.sprintId)
            },

            getUserById: (userId) => {
                const state = get()
                return state.users.find(u => u.id === userId)
            },

            // Import from Jira (placeholder)
            importFromJira: async (jiraData) => {
                // This will be implemented when Jira integration is added
                console.log('Importing from Jira:', jiraData)
            },

            // Game actions
            addGame: (game) => set((state) => ({
                games: [...state.games, { ...game, id: `game-${Date.now()}` }]
            })),

            updateGame: (gameId, updates) => set((state) => ({
                games: state.games.map(game =>
                    game.id === gameId ? { ...game, ...updates } : game
                )
            })),

            deleteGame: (gameId) => set((state) => ({
                games: state.games.filter(game => game.id !== gameId)
            })),

            getGameById: (gameId) => {
                const state = get()
                return state.games.find(g => g.id === gameId)
            }
        }),
        {
            name: 'agile-dashboard-storage',
            partialize: (state) => ({
                projects: state.projects,
                issues: state.issues,
                sprints: state.sprints,
                users: state.users,
                games: state.games,
                departments: state.departments,
                fieldConfig: state.fieldConfig,
                savedFilters: state.savedFilters,
                theme: state.theme,
                currentProjectId: state.currentProjectId
            })
        }
    )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
    const storedState = localStorage.getItem('agile-dashboard-storage')
    if (storedState) {
        try {
            const parsed = JSON.parse(storedState)
            if (parsed.state?.theme) {
                document.documentElement.setAttribute('data-theme', parsed.state.theme)
            }
        } catch (e) {
            // Ignore parse errors
        }
    }
}
