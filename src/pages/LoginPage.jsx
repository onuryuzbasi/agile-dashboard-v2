import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Shield, Users, Zap } from 'lucide-react'

export default function LoginPage() {
    const { session, loading, authError, setAuthError, signInWithGoogle } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isSigningIn, setIsSigningIn] = useState(false)

    // Redirect if already logged in
    useEffect(() => {
        if (session && !loading) {
            navigate('/dashboard', { replace: true })
        }
    }, [session, loading, navigate])

    // Handle URL error params
    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'callback_failed') {
            setAuthError('Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.')
        } else if (error === 'unexpected') {
            setAuthError('Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.')
        }
    }, [searchParams, setAuthError])

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true)
        await signInWithGoogle()
        // Don't set isSigningIn to false here - redirect will happen
    }

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading-spinner" />
            </div>
        )
    }

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-bg">
                <div className="login-bg-orb login-bg-orb-1" />
                <div className="login-bg-orb login-bg-orb-2" />
                <div className="login-bg-orb login-bg-orb-3" />
            </div>

            <div className="login-container">
                {/* Logo & Brand */}
                <div className="login-brand">
                    <div className="login-logo">
                        <Zap size={32} />
                    </div>
                    <h1 className="login-title">Agile Dashboard</h1>
                    <p className="login-subtitle">Ekibinizin sprint ve proje yönetim platformu</p>
                </div>

                {/* Login Card */}
                <div className="login-card">
                    <div className="login-card-header">
                        <h2>Hoş Geldiniz</h2>
                        <p>Devam etmek için Google hesabınızla giriş yapın</p>
                    </div>

                    {/* Error Message */}
                    {authError && (
                        <div className="login-error">
                            <Shield size={18} />
                            <span>{authError}</span>
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        className="login-google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn}
                    >
                        {isSigningIn ? (
                            <div className="auth-loading-spinner small" />
                        ) : (
                            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        <span>{isSigningIn ? 'Yönlendiriliyor...' : 'Google ile Giriş Yap'}</span>
                    </button>

                    {/* Invite Only Notice */}
                    <div className="login-invite-notice">
                        <Users size={16} />
                        <span>Sadece davet edilen kullanıcılar erişebilir</span>
                    </div>
                </div>

                {/* Features */}
                <div className="login-features">
                    <div className="login-feature">
                        <div className="login-feature-icon">📋</div>
                        <span>Sprint Yönetimi</span>
                    </div>
                    <div className="login-feature">
                        <div className="login-feature-icon">📊</div>
                        <span>Kanban Board</span>
                    </div>
                    <div className="login-feature">
                        <div className="login-feature-icon">📅</div>
                        <span>Timeline</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
