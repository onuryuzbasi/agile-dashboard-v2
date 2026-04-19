import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from 'lucide-react'

// Date Picker Component - Shared across all modals
export function DatePicker({ value, onChange, onClose }) {
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date())
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDaysInMonth = (date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days = []

        let startDay = firstDay.getDay()
        startDay = startDay === 0 ? 6 : startDay - 1

        const prevMonth = new Date(year, month, 0)
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonth.getDate() - i),
                isCurrentMonth: false
            })
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }

        return days
    }

    const days = getDaysInMonth(viewDate)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

    const handleSelect = (date) => {
        // Return YYYY-MM-DD format string
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        onChange(`${year}-${month}-${day}`)
        onClose()
    }

    const isSelected = (date) => {
        if (!value) return false
        const selected = new Date(value)
        return date.toDateString() === selected.toDateString()
    }

    const isToday = (date) => {
        return date.toDateString() === today.toDateString()
    }

    return (
        <div className="shared-date-picker" onClick={e => e.stopPropagation()}>
            <div className="shared-date-picker-header">
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))}>
                    <ChevronsLeft size={16} />
                </button>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                    <ChevronLeft size={16} />
                </button>
                <span className="shared-date-picker-title">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                    <ChevronRight size={16} />
                </button>
                <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))}>
                    <ChevronsRight size={16} />
                </button>
            </div>
            <div className="shared-date-picker-weekdays">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                    <div key={d} className="shared-date-picker-weekday">{d}</div>
                ))}
            </div>
            <div className="shared-date-picker-days">
                {days.map((day, i) => (
                    <button
                        type="button"
                        key={i}
                        className={`shared-date-picker-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isSelected(day.date) ? 'selected' : ''} ${isToday(day.date) ? 'today' : ''}`}
                        onClick={() => handleSelect(day.date)}
                    >
                        {day.date.getDate()}
                    </button>
                ))}
            </div>
            <div className="shared-date-picker-footer">
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => {
                    onChange('')
                    onClose()
                }}>
                    Clear
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleSelect(new Date())}>
                    Today
                </button>
            </div>
        </div>
    )
}

// Date Input with Picker - wraps an input field with a popup calendar
export function DateInputWithPicker({ label, value, onChange, placeholder = "Select date..." }) {
    const [showPicker, setShowPicker] = useState(false)

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return ''
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        } catch {
            return dateStr
        }
    }

    return (
        <div className="input-group date-input-with-picker">
            {label && <label className="input-label">{label}</label>}
            <div className="date-input-wrapper" style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="input"
                    value={formatDisplayDate(value)}
                    onClick={() => setShowPicker(true)}
                    readOnly
                    placeholder={placeholder}
                    style={{ cursor: 'pointer' }}
                />
                <button
                    type="button"
                    className="date-input-icon"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    <Calendar size={16} />
                </button>
                {showPicker && (
                    <>
                        <div
                            className="date-picker-backdrop"
                            onClick={() => setShowPicker(false)}
                        />
                        <DatePicker
                            value={value}
                            onChange={onChange}
                            onClose={() => setShowPicker(false)}
                        />
                    </>
                )}
            </div>
        </div>
    )
}
