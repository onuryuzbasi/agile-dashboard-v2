import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const isOfflineMode = !import.meta.env.VITE_SUPABASE_URL

export default function ProtectedRoute({ children }) {
    // In offline/local mode (no Supabase), bypass auth entirely
    if (isOfflineMode) {
        return children
    }

    const { isAuthorized, loading } = useAuth()

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading-spinner" />
                <p>Yetkilendirme kontrol ediliyor...</p>
            </div>
        )
    }

    if (!isAuthorized) {
        return <Navigate to="/login" replace />
    }

    return children
}
