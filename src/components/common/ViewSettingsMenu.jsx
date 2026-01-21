import { useState, useRef, useEffect } from 'react'
import { Settings, Check } from 'lucide-react'
import { useProjectStore } from '../../stores/projectStore'

const fieldOptions = [
    { key: 'labels', label: 'Labels' },
    { key: 'status', label: 'Status' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'estimate', label: 'Story Points' },
    { key: 'priority', label: 'Priority' },
    { key: 'assignee', label: 'Assignee' }
]

export default function ViewSettingsMenu() {
    const { cardFieldVisibility, setCardFieldVisibility } = useProjectStore()
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleField = (field) => {
        setCardFieldVisibility(field, !cardFieldVisibility[field])
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
                        {fieldOptions.map(option => (
                            <button
                                key={option.key}
                                className={`view-settings-option ${cardFieldVisibility[option.key] ? 'active' : ''}`}
                                onClick={() => toggleField(option.key)}
                            >
                                <span className="option-checkbox">
                                    {cardFieldVisibility[option.key] && <Check size={12} />}
                                </span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
