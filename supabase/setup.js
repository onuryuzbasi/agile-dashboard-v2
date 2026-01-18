/**
 * Script to setup Supabase database tables
 * Run with: node supabase/setup.js
 */

const SUPABASE_URL = 'https://jilndujidaiuoctdjmnz.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppbG5kdWppZGFpdW9jdGRqbW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0MjcwMywiZXhwIjoyMDg0MzE4NzAzfQ.v6BmWYHqoM4FbXoXj7Ro4EeJ0H8Nw6TkFNx0VPhxcPI'

async function executeSQL(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query: sql })
    })

    if (!response.ok) {
        const text = await response.text()
        throw new Error(`SQL execution failed: ${response.status} - ${text}`)
    }

    return response.json()
}

// Since Supabase REST API doesn't support raw SQL, we'll insert data directly
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

async function checkTableExists(table) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        method: 'GET',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        }
    })

    return response.ok
}

async function main() {
    console.log('Checking Supabase connection...')

    // Check if tables exist by trying to query them
    const tables = ['projects', 'users', 'departments', 'games', 'sprints', 'priorities', 'statuses', 'issue_types', 'labels', 'issues']

    for (const table of tables) {
        const exists = await checkTableExists(table)
        console.log(`Table '${table}': ${exists ? 'EXISTS' : 'NOT FOUND'}`)
    }

    console.log('\nIf tables are NOT FOUND, please run the SQL schema in Supabase SQL Editor.')
    console.log('Schema file: supabase/schema.sql')
}

main().catch(console.error)
