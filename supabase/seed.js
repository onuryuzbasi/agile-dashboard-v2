/**
 * Seed script for Supabase database
 * Run with: node supabase/seed.js
 */

const SUPABASE_URL = 'https://jilndujidaiuoctdjmnz.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbG5kdWppZGFpdW9jdGRqbW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0MjcwMywiZXhwIjoyMDg0MzE4NzAzfQ.v6BmWYHqoM4FbXoXj7Ro4EeJ0H8Nw6TkFNx0VPhxcPI'

async function insertData(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const text = await response.text()
        console.error(`Insert into ${table} failed:`, text)
        return null
    }

    return response.json()
}

async function upsertData(table, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        const text = await response.text()
        console.error(`Upsert into ${table} failed:`, text)
        return null
    }

    return response.json()
}

async function main() {
    console.log('Seeding Supabase database...\n')

    // 1. Seed Users
    console.log('Seeding users...')
    const users = await upsertData('users', [
        { name: 'Alex Johnson', email: 'alex@example.com' },
        { name: 'Sarah Chen', email: 'sarah@example.com' },
        { name: 'Mike Wilson', email: 'mike@example.com' }
    ])
    console.log('Users:', users?.length || 0, 'rows')

    // 2. Seed Departments
    console.log('Seeding departments...')
    const departments = await upsertData('departments', [
        { name: 'Engineering', code: 'ENG', sort_order: 1 },
        { name: 'Design', code: 'DES', sort_order: 2 },
        { name: 'Product', code: 'PRD', sort_order: 3 },
        { name: 'QA', code: 'QA', sort_order: 4 }
    ])
    console.log('Departments:', departments?.length || 0, 'rows')

    // 3. Seed Games
    console.log('Seeding games...')
    const games = await upsertData('games', [
        { name: 'Royal Quest', code: 'RQ' },
        { name: 'Zen Master', code: 'ZM' },
        { name: 'Star Voyage', code: 'SV' }
    ])
    console.log('Games:', games?.length || 0, 'rows')

    // 4. Seed Priorities
    console.log('Seeding priorities...')
    const priorities = await upsertData('priorities', [
        { key: 'highest', label: 'Highest', color: '#CD1316', icon: 'ArrowUp', sort_order: 1 },
        { key: 'high', label: 'High', color: '#E97F33', icon: 'ArrowUp', sort_order: 2 },
        { key: 'medium', label: 'Medium', color: '#E9A233', icon: 'Minus', sort_order: 3 },
        { key: 'low', label: 'Low', color: '#2D8738', icon: 'ArrowDown', sort_order: 4 },
        { key: 'lowest', label: 'Lowest', color: '#57A55A', icon: 'ArrowDown', sort_order: 5 }
    ])
    console.log('Priorities:', priorities?.length || 0, 'rows')

    // 5. Seed Statuses
    console.log('Seeding statuses...')
    const statuses = await upsertData('statuses', [
        { key: 'todo', label: 'TO DO', bg_color: '#DFE1E6', text_color: '#42526E', sort_order: 1 },
        { key: 'progress', label: 'IN PROGRESS', bg_color: '#0052CC', text_color: '#FFFFFF', sort_order: 2 },
        { key: 'review', label: 'IN REVIEW', bg_color: '#FF991F', text_color: '#172B4D', sort_order: 3 },
        { key: 'done', label: 'DONE', bg_color: '#00875A', text_color: '#FFFFFF', sort_order: 4 }
    ])
    console.log('Statuses:', statuses?.length || 0, 'rows')

    // 6. Seed Issue Types
    console.log('Seeding issue types...')
    const issueTypes = await upsertData('issue_types', [
        { key: 'story', label: 'Story', icon: 'BookOpen', color: '#36B37E', bg_color: '#E3FCEF', sort_order: 1 },
        { key: 'bug', label: 'Bug', icon: 'Bug', color: '#FF5630', bg_color: '#FFEBE6', sort_order: 2 },
        { key: 'task', label: 'Task', icon: 'CheckSquare', color: '#4FADE6', bg_color: '#DEEBFF', sort_order: 3 },
        { key: 'epic', label: 'Epic', icon: 'Layers', color: '#904EE2', bg_color: '#EAE6FF', sort_order: 4 },
        { key: 'subtask', label: 'Subtask', icon: 'ListTree', color: '#4FADE6', bg_color: '#DEEBFF', sort_order: 5 }
    ])
    console.log('Issue Types:', issueTypes?.length || 0, 'rows')

    // 7. Seed Labels
    console.log('Seeding labels...')
    const labels = await upsertData('labels', [
        { name: 'frontend', color: '#36B37E' },
        { name: 'backend', color: '#0052CC' },
        { name: 'security', color: '#FF5630' },
        { name: 'ux', color: '#6554C0' },
        { name: 'core', color: '#FF991F' },
        { name: 'auth', color: '#00B8D9' }
    ])
    console.log('Labels:', labels?.length || 0, 'rows')

    // 8. Seed Project
    console.log('Seeding projects...')
    const projects = await upsertData('projects', [
        { key: 'AGILE', name: 'Agile Dashboard', description: 'Internal project management tool' }
    ])
    console.log('Projects:', projects?.length || 0, 'rows')

    // Get IDs for references
    if (!users || !projects) {
        console.error('Failed to seed base data')
        return
    }

    const userMap = {}
    users.forEach(u => userMap[u.email.split('@')[0]] = u.id)

    const deptMap = {}
    departments?.forEach(d => deptMap[d.code] = d.id)

    const gameMap = {}
    games?.forEach(g => gameMap[g.code] = g.id)

    const projectId = projects[0].id

    // 9. Seed Sprints
    console.log('Seeding sprints...')
    const sprints = await upsertData('sprints', [
        {
            project_id: projectId,
            name: 'Sprint 1',
            goal: 'Complete core dashboard features and initial UI',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            state: 'active'
        },
        {
            project_id: projectId,
            name: 'Sprint 2',
            goal: 'Add advanced filtering and timeline view',
            start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            state: 'planned'
        }
    ])
    console.log('Sprints:', sprints?.length || 0, 'rows')

    const sprintId = sprints?.[0]?.id

    // 10. Seed Issues
    console.log('Seeding issues...')
    const issues = await insertData('issues', [
        {
            key: 'AGILE-1',
            project_id: projectId,
            type: 'epic',
            status: 'done',
            priority: 'high',
            summary: 'User Authentication System',
            description: 'Implement complete user authentication with login, register, and password reset',
            assignee_id: userMap['alex'],
            reporter_id: userMap['alex'],
            sprint_id: sprintId,
            story_points: 13,
            labels: ['security', 'core'],
            start_date: '2026-01-10',
            due_date: '2026-01-28',
            game_id: gameMap['RQ'],
            department_id: deptMap['ENG']
        },
        {
            key: 'AGILE-2',
            project_id: projectId,
            type: 'story',
            status: 'done',
            priority: 'high',
            summary: 'Implement Login Form',
            description: 'Create login form with email and password fields',
            assignee_id: userMap['sarah'],
            reporter_id: userMap['alex'],
            sprint_id: sprintId,
            story_points: 8,
            labels: ['frontend', 'ux'],
            start_date: '2026-01-12',
            due_date: '2026-01-20',
            game_id: gameMap['RQ'],
            department_id: deptMap['ENG']
        },
        {
            key: 'AGILE-3',
            project_id: projectId,
            type: 'story',
            status: 'done',
            priority: 'highest',
            summary: 'Implement Registration Flow',
            description: 'Create user registration with email verification',
            assignee_id: userMap['mike'],
            reporter_id: userMap['alex'],
            sprint_id: sprintId,
            story_points: 5,
            labels: ['frontend', 'auth'],
            start_date: '2026-01-14',
            due_date: '2026-01-22',
            game_id: gameMap['RQ'],
            department_id: deptMap['ENG']
        },
        {
            key: 'AGILE-4',
            project_id: projectId,
            type: 'epic',
            status: 'progress',
            priority: 'medium',
            summary: 'Gameplay Matchmaking System',
            description: 'Build matchmaking system for multiplayer games',
            assignee_id: userMap['mike'],
            reporter_id: userMap['alex'],
            sprint_id: sprintId,
            story_points: 21,
            labels: ['gameplay'],
            start_date: '2026-01-08',
            due_date: '2026-02-05',
            game_id: gameMap['ZM'],
            department_id: deptMap['DES']
        },
        {
            key: 'AGILE-5',
            project_id: projectId,
            type: 'epic',
            status: 'done',
            priority: 'high',
            summary: 'Level Difficulty Seed Dream Design',
            description: 'Design and implement dynamic difficulty scaling',
            assignee_id: userMap['sarah'],
            reporter_id: userMap['alex'],
            sprint_id: sprintId,
            story_points: 13,
            labels: ['gameplay', 'zen'],
            start_date: '2026-01-05',
            due_date: '2026-02-10',
            game_id: gameMap['ZM'],
            department_id: deptMap['ENG']
        }
    ])
    console.log('Issues:', issues?.length || 0, 'rows')

    console.log('\n✅ Database seeding complete!')
}

main().catch(console.error)
