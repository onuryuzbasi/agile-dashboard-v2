import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Bootstrap admins — these are seeded into invited_emails on first load
const BOOTSTRAP_ADMIN_EMAILS = [
    'tuna@narcade.com',
    'onur@narcade.com',
    'ziprro@gmail.com'
]

const AuthContext = createContext({})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authError, setAuthError] = useState(null)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const processingRef = useRef(false)

    // Bootstrap: ensure admin emails exist in invited_emails with admin role
    useEffect(() => {
        const bootstrapAdmins = async () => {
            for (const email of BOOTSTRAP_ADMIN_EMAILS) {
                const { data } = await supabase
                    .from('invited_emails')
                    .select('id, role')
                    .eq('email', email)
                    .single()
                if (!data) {
                    await supabase.from('invited_emails').insert({ email, role: 'admin' })
                } else if (data.role !== 'admin') {
                    await supabase.from('invited_emails').update({ role: 'admin' }).eq('id', data.id)
                }
            }
        }
        bootstrapAdmins()
    }, [])

    // Check if user's email is in the invited_emails table
    const checkInvite = useCallback(async (email) => {
        try {
            const { data, error } = await supabase
                .from('invited_emails')
                .select('id, role')
                .eq('email', email.toLowerCase())
                .single()

            if (error) {
                console.warn('[Auth] checkInvite error:', error.message)
                return null
            }
            return data
        } catch (err) {
            console.error('[Auth] checkInvite exception:', err)
            return null
        }
    }, [])

    // Find or create user profile in the users table
    const ensureProfile = useCallback(async (authUser) => {
        try {
            const { data: emailProfile } = await supabase
                .from('users')
                .select('*')
                .eq('email', authUser.email)
                .single()

            if (emailProfile) return emailProfile

            const { data: newProfile, error: insertError } = await supabase
                .from('users')
                .insert({
                    email: authUser.email,
                    name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email.split('@')[0],
                    avatar: authUser.user_metadata?.avatar_url || null
                })
                .select()
                .single()

            if (insertError) {
                console.error('[Auth] Failed to create profile:', insertError.message)
                return null
            }
            return newProfile
        } catch (err) {
            console.error('[Auth] ensureProfile exception:', err)
            return null
        }
    }, [])

    // Process a valid session — validate invite & ensure profile
    const processSession = useCallback(async (currentSession) => {
        if (processingRef.current) return
        processingRef.current = true

        try {
            const email = currentSession.user.email
            console.log('[Auth] Processing session for:', email)

            const invite = await checkInvite(email)
            console.log('[Auth] Invite:', !!invite)

            if (!invite) {
                setAuthError('Bu e-posta adresi davet edilmemiş. Erişim için yöneticinize başvurun.')
                await supabase.auth.signOut()
                setSession(null)
                setUser(null)
                setProfile(null)
                setIsAuthorized(false)
                setLoading(false)
                processingRef.current = false
                return
            }

            // Invite passed — authorize immediately
            setIsAuthorized(true)
            setIsAdmin(invite.role === 'admin')
            setAuthError(null)

            // Try profile (non-blocking for auth)
            const userProfile = await ensureProfile(currentSession.user)
            console.log('[Auth] Profile:', userProfile?.email || 'failed')
            setProfile(userProfile)
        } catch (err) {
            console.error('[Auth] processSession error:', err)
        }

        setLoading(false)
        processingRef.current = false
    }, [checkInvite, ensureProfile])

    useEffect(() => {
        let mounted = true

        // Set up auth state change listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return
                console.log('[Auth] Event:', event, '| session:', !!currentSession)

                if (currentSession?.user) {
                    setSession(currentSession)
                    setUser(currentSession.user)
                    await processSession(currentSession)
                } else {
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                    setIsAuthorized(false)
                    setLoading(false)
                }
            }
        )

        // Also call getSession for initial load — but catch AbortError gracefully
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (!mounted) return
            console.log('[Auth] getSession result:', !!s)
            // If no session and still loading, clear loading
            // (onAuthStateChange should have fired, but as a safety net)
            if (!s) {
                setLoading(false)
            }
        }).catch((err) => {
            if (!mounted) return
            // Gracefully handle AbortError — just set loading to false
            console.warn('[Auth] getSession caught:', err?.name || err?.message || err)
            setLoading(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [processSession])

    // Sign in with Google
    const signInWithGoogle = async () => {
        setAuthError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        if (error) {
            console.error('[Auth] Google sign-in error:', error)
            setAuthError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.')
        }
    }

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setProfile(null)
        setAuthError(null)
        setIsAuthorized(false)
        setIsAdmin(false)
    }

    const value = {
        session,
        user,
        profile,
        loading,
        authError,
        isAuthorized,
        isAdmin,
        setAuthError,
        signInWithGoogle,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext
