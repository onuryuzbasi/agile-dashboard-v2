import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('Missing Supabase environment variables — running in offline/local mode')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        storageKey: 'agile-dashboard-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        // Disable Web Locks to prevent AbortError
        lock: (name, acquireTimeout, fn) => {
            // Execute immediately without Web Locks
            return fn()
        }
    }
})

// Helper to handle Supabase errors
export const handleSupabaseError = (error) => {
    console.error('Supabase error:', error)
    throw error
}
