import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

/**
 * Global Confirmation Modal
 * 
 * A reusable confirmation dialog that replaces browser's native confirm().
 * Integrates with projectStore for global state management.
 */
export default function ConfirmationModal() {
    const { confirmModal, hideConfirmModal } = useProjectStore()
    const confirmBtnRef = useRef(null)

    const {
        isOpen = false,
        title = 'Confirm',
        message = 'Are you sure?',
        variant = 'danger', // 'danger' | 'warning'
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        onConfirm = () => { },
        isLoading = false
    } = confirmModal || {}

    // Focus confirm button when modal opens
    useEffect(() => {
        if (isOpen && confirmBtnRef.current) {
            confirmBtnRef.current.focus()
        }
    }, [isOpen])

    // Handle keyboard
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                hideConfirmModal()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, hideConfirmModal])

    if (!isOpen) return null

    const handleConfirm = async () => {
        try {
            await onConfirm()
        } finally {
            hideConfirmModal()
        }
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            hideConfirmModal()
        }
    }

    const Icon = variant === 'danger' ? Trash2 : AlertTriangle
    const iconBg = variant === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)'
    const iconColor = variant === 'danger' ? 'var(--danger)' : 'var(--warning)'

    return createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="confirmation-modal-header">
                    <div
                        className="confirmation-modal-icon"
                        style={{ backgroundColor: iconBg, color: iconColor }}
                    >
                        <Icon size={24} />
                    </div>
                    <button
                        className="btn btn-icon btn-ghost confirmation-modal-close"
                        onClick={hideConfirmModal}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="confirmation-modal-body">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="confirmation-modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={hideConfirmModal}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmBtnRef}
                        className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-warning'}`}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
