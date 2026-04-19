import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallback() {
    const navigate = useNavigate()
    const { isAuthorized, authError } = useAuth()
    const [timedOut, setTimedOut] = useState(false)

    // Timeout safety
    useEffect(() => {
        const timer = setTimeout(() => {
            console.warn('[AuthCallback] Timed out')
            setTimedOut(true)
        }, 10000)
        return () => clearTimeout(timer)
    }, [])

    // React to auth changes
    useEffect(() => {
        if (isAuthorized) {
            console.log('[AuthCallback] Authorized — going to dashboard')
            navigate('/dashboard', { replace: true })
            return
        }

        if (authError) {
            console.log('[AuthCallback] Auth error:', authError)
            navigate('/login?error=callback_failed', { replace: true })
            return
        }

        if (timedOut) {
            console.log('[AuthCallback] Timed out — redirecting to login')
            navigate('/login?error=callback_failed', { replace: true })
        }
    }, [isAuthorized, authError, timedOut, navigate])

    return (
        <div className="auth-callback">
            <div className="auth-callback-card">
                <div className="auth-loading-spinner" />
                <h2>Giriş yapılıyor...</h2>
                <p>Lütfen bekleyin, yönlendiriliyorsunuz.</p>
            </div>
        </div>
    )
}
