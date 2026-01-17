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

const initialIssues = [
    {
        id: 'issue-1',
        key: 'AGILE-1',
        projectId: 'proj-1',
        type: 'epic',
        status: 'todo',
        priority: 'high',
        summary: 'User Authentication System',
        description: 'Implement complete user authentication with login, register, and password reset',
        assigneeId: 'user-1',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 13,
        labels: ['security', 'core'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-2',
        key: 'AGILE-2',
        projectId: 'proj-1',
        type: 'story',
        status: 'progress',
        priority: 'high',
        summary: 'Implement Kanban Board Drag & Drop',
        description: 'Add ability to drag and drop issues between columns on the Kanban board',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 8,
        labels: ['frontend', 'ux'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-3',
        key: 'AGILE-3',
        projectId: 'proj-1',
        type: 'bug',
        status: 'review',
        priority: 'highest',
        summary: 'Fix responsive sidebar on mobile devices',
        description: 'Sidebar does not collapse correctly on screens smaller than 768px',
        assigneeId: 'user-1',
        reporterId: 'user-2',
        sprintId: 'sprint-1',
        storyPoints: 3,
        labels: ['bug', 'mobile'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-4',
        key: 'AGILE-4',
        projectId: 'proj-1',
        type: 'task',
        status: 'done',
        priority: 'medium',
        summary: 'Setup CI/CD pipeline with GitHub Actions',
        description: 'Configure automated testing and deployment workflow',
        assigneeId: 'user-3',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 5,
        labels: ['devops'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-5',
        key: 'AGILE-5',
        projectId: 'proj-1',
        type: 'story',
        status: 'todo',
        priority: 'medium',
        summary: 'Create Sprint Planning View',
        description: 'Design and implement the sprint planning interface with drag-drop from backlog',
        assigneeId: 'user-2',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 8,
        labels: ['frontend'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-6',
        key: 'AGILE-6',
        projectId: 'proj-1',
        type: 'task',
        status: 'todo',
        priority: 'low',
        summary: 'Add dark mode toggle',
        description: 'Implement theme switcher with system preference detection',
        assigneeId: null,
        reporterId: 'user-1',
        sprintId: null,
        storyPoints: 3,
        labels: ['enhancement', 'ux'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-7',
        key: 'AGILE-7',
        projectId: 'proj-1',
        type: 'story',
        status: 'progress',
        priority: 'high',
        summary: 'Build Issue Detail Modal',
        description: 'Create modal component for viewing and editing issue details',
        assigneeId: 'user-1',
        reporterId: 'user-1',
        sprintId: 'sprint-1',
        storyPoints: 5,
        labels: ['frontend'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'issue-8',
        key: 'AGILE-8',
        projectId: 'proj-1',
        type: 'subtask',
        status: 'done',
        priority: 'medium',
        summary: 'Design color palette and tokens',
        description: 'Define CSS custom properties for consistent theming',
        assigneeId: 'user-2',
        reporterId: 'user-2',
        sprintId: 'sprint-1',
        parentId: 'issue-2',
        storyPoints: 2,
        labels: ['design'],
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
            currentProjectId: 'proj-1',
            currentSprintId: 'sprint-1',
            theme: 'light',
            sidebarCollapsed: false,
            selectedIssue: null,

            // Project actions
            setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
            addProject: (project) => set((state) => ({
                projects: [...state.projects, { ...project, id: `proj-${Date.now()}`, createdAt: new Date().toISOString() }]
            })),

            // Issue actions
            addIssue: (issue) => {
                const state = get()

                // Get the game code for the key prefix
                let keyPrefix = 'ALL'
                if (issue.game) {
                    const game = state.games.find(g => g.id === issue.game)
                    if (game && game.code) {
                        keyPrefix = game.code.toUpperCase()
                    }
                }

                // Count existing issues with the same prefix
                const existingWithPrefix = state.issues.filter(i =>
                    i.key && i.key.startsWith(keyPrefix + '-')
                ).length

                const newIssue = {
                    ...issue,
                    id: `issue-${Date.now()}`,
                    key: `${keyPrefix}-${existingWithPrefix + 1}`,
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
