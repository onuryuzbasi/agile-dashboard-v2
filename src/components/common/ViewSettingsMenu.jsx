import { useState, useRef, useEffect } from 'react'
import { Settings, Check, User, Globe, AlertCircle } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

export default function ViewSettingsMenu() {
    const {
        cardFieldVisibility,
        setCardFieldVisibility,
        savePersonalCardFields,
        saveTeamCardFieldDefaults,
        getAvailableCardFields
    } = useProjectStore()

    const [isOpen, setIsOpen] = useState(false)
    const [saving, setSaving] = useState(null) // 'personal' | 'team' | null
    const [showTeamConfirm, setShowTeamConfirm] = useState(false)
    const menuRef = useRef(null)

    // Get dynamic field list
    const availableFields = getAvailableCardFields()

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false)
                setShowTeamConfirm(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleField = (field) => {
        setCardFieldVisibility(field, !cardFieldVisibility[field])
    }

    const handleSavePersonal = async () => {
        setSaving('personal')
        try {
            savePersonalCardFields()
            setTimeout(() => setSaving(null), 1000)
        } catch (e) {
            console.error('Failed to save personal preferences:', e)
            setSaving(null)
        }
    }

    const handleSaveTeam = async () => {
        if (!showTeamConfirm) {
            setShowTeamConfirm(true)
            return
        }

        setSaving('team')
        setShowTeamConfirm(false)
        try {
            await saveTeamCardFieldDefaults()
            setTimeout(() => setSaving(null), 1000)
        } catch (e) {
            console.error('Failed to save team defaults:', e)
            setSaving(null)
        }
    }

    return (
        <div className="view-settings-menu" ref={menuRef}>
            <button
                className="btn btn-icon btn-ghost sm"
                onClick={() => setIsOpen(!isOpen)}
                title="View settings"
            >
                <Settings size={16} />
            </button>

            {isOpen && (
                <div className="view-settings-dropdown">
                    <div className="view-settings-header">
                        <span>Show on cards</span>
                    </div>
                    <div className="view-settings-options">
                        {availableFields.map(option => (
                            <button
                                key={option.key}
                                className={`view-settings-option ${cardFieldVisibility[option.key] ? 'active' : ''}`}
                                onClick={() => toggleField(option.key)}
                            >
                                <span className="option-checkbox">
                                    {cardFieldVisibility[option.key] && <Check size={12} />}
                                </span>
                                <span className="option-label">{option.label}</span>
                                {option.category === 'custom' && (
                                    <span className="option-badge">Custom</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="view-settings-divider" />

                    <div className="view-settings-footer">
                        <button
                            className={`view-settings-save-btn personal ${saving === 'personal' ? 'saving' : ''}`}
                            onClick={handleSavePersonal}
                            disabled={saving !== null}
                        >
                            <User size={14} />
                            <span>{saving === 'personal' ? 'Saved!' : 'Save for Me'}</span>
                        </button>

                        <button
                            className={`view-settings-save-btn team ${saving === 'team' ? 'saving' : ''} ${showTeamConfirm ? 'confirm' : ''}`}
                            onClick={handleSaveTeam}
                            disabled={saving !== null}
                        >
                            {showTeamConfirm ? (
                                <>
                                    <AlertCircle size={14} />
                                    <span>Confirm? (All users)</span>
                                </>
                            ) : (
                                <>
                                    <Globe size={14} />
                                    <span>{saving === 'team' ? 'Saved!' : 'Save as Team Default'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
