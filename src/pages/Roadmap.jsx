import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useProjectStore } from '../stores/projectStore'
import { supabase } from '../lib/supabase'
import {
    Plus, X, ChevronLeft, ChevronRight, Rocket, Globe, Code, TestTube,
    Flag, Star, Trash2, Edit3, MoreHorizontal, Calendar, Eye, EyeOff,
    Target, Sparkles, Check, ArrowRight, Settings, Filter, AlertTriangle,
    Link2, Palette, Layers, BarChart3
} from 'lucide-react'

// ─── Constants ───
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const DEFAULT_PHASE_TYPES = [
    { key: 'development', label: 'Development', icon: 'Code', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { key: 'testing', label: 'Testing / QA', icon: 'TestTube', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { key: 'soft-launch', label: 'Soft Launch', icon: 'Rocket', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { key: 'global-launch', label: 'Global Launch', icon: 'Globe', color: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { key: 'live-ops', label: 'Live Ops', icon: 'Sparkles', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { key: 'maintenance', label: 'Maintenance', icon: 'Flag', color: '#64748b', gradient: 'linear-gradient(135deg, #64748b, #475569)' },
]

const PROJECT_COLORS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#1e40af', '#7c3aed', '#be185d',
    '#b45309', '#78716c', '#475569', '#0f766e'
]

const PROJECT_ICONS = [
    '🎮', '🚀', '🎯', '💎', '🌟', '🔥', '⚡', '🎨',
    '🏆', '🎵', '📱', '🌍', '🧩', '💡', '🛡️', '📊',
    '🎬', '🔮', '🍀', '🦾', '🧪', '📦', '🎶', '🏗️'
]

const ICON_MAP = { Code, TestTube, Rocket, Globe, Sparkles, Flag, Star, Target, Palette, Calendar }
const getIcon = (name) => ICON_MAP[name] || Code

// ─── Storage ───
const STORAGE_KEY = 'agile-roadmap-data'
const PHASE_TYPES_KEY = 'agile-roadmap-phase-types'
const generateId = () => `rm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const load = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null } }
const save = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)) } catch {} }

// ─── Supabase Sync Helpers ───
const SUPABASE_SETTING_KEYS = { [STORAGE_KEY]: 'roadmap_data', [PHASE_TYPES_KEY]: 'roadmap_phase_types' }

const loadFromSupabase = async (settingKey) => {
    try {
        const { data, error } = await supabase
            .from('team_settings')
            .select('setting_value')
            .eq('setting_key', settingKey)
            .is('project_id', null)
            .maybeSingle()
        if (error) throw error
        return data?.setting_value || null
    } catch (e) {
        console.warn(`[Roadmap] Supabase load failed for ${settingKey}:`, e.message)
        return null
    }
}

const saveToSupabase = async (settingKey, value) => {
    try {
        // Try update first (for existing rows)
        const { data: existing, error: selErr } = await supabase
            .from('team_settings')
            .select('id')
            .eq('setting_key', settingKey)
            .is('project_id', null)
            .maybeSingle()
        if (selErr) throw selErr

        if (existing) {
            const { error } = await supabase
                .from('team_settings')
                .update({ setting_value: value, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('team_settings')
                .insert({
                    setting_key: settingKey,
                    setting_value: value,
                    project_id: null,
                    updated_at: new Date().toISOString()
                })
            if (error) throw error
        }
    } catch (e) {
        console.warn(`[Roadmap] Supabase save failed for ${settingKey}:`, e.message)
    }
}

// Debounce timer refs (module-level)
const _debounceTimers = {}

const getDefaultData = (games) => {
    const year = new Date().getFullYear()
    const projects = games?.length > 0
        ? games.map((g, i) => ({ id: g.id, name: g.name, color: PROJECT_COLORS[i % PROJECT_COLORS.length], icon: PROJECT_ICONS[i % PROJECT_ICONS.length], phases: [], visible: true }))
        : [
            {
                id: generateId(), name: 'Project Alpha', color: '#3b82f6', icon: '🎮', visible: true,
                phases: [
                    { id: 'pa-dev', type: 'development', startMonth: 0, endMonth: 3, label: 'Core Development', dependsOn: null },
                    { id: 'pa-qa', type: 'testing', startMonth: 2, endMonth: 4, label: 'QA Phase', dependsOn: 'pa-dev' },
                    { id: 'pa-sl', type: 'soft-launch', startMonth: 5, endMonth: 6, label: 'Soft Launch', dependsOn: 'pa-qa' },
                    { id: 'pa-ops', type: 'live-ops', startMonth: 5, endMonth: 7, label: 'Live Operations', dependsOn: null },
                    { id: 'pa-gl', type: 'global-launch', startMonth: 8, endMonth: 11, label: 'Global Launch', dependsOn: 'pa-sl' },
                ],
            },
            {
                id: generateId(), name: 'Project Beta', color: '#8b5cf6', icon: '🚀', visible: true,
                phases: [
                    { id: 'pb-dev', type: 'development', startMonth: 2, endMonth: 6, label: 'Development', dependsOn: null },
                    { id: 'pb-test', type: 'testing', startMonth: 5, endMonth: 7, label: 'Testing', dependsOn: 'pb-dev' },
                    { id: 'pb-sl', type: 'soft-launch', startMonth: 8, endMonth: 9, label: 'Soft Launch', dependsOn: 'pb-test' },
                    { id: 'pb-gl', type: 'global-launch', startMonth: 10, endMonth: 11, label: 'Global Launch', dependsOn: 'pb-sl' },
                ],
            },
            {
                id: generateId(), name: 'Project Gamma', color: '#22c55e', icon: '🎯', visible: true,
                phases: [
                    { id: 'pg-ops', type: 'live-ops', startMonth: 0, endMonth: 5, label: 'Live Ops', dependsOn: null },
                    { id: 'pg-mnt', type: 'maintenance', startMonth: 3, endMonth: 8, label: 'Maintenance', dependsOn: null },
                    { id: 'pg-dev', type: 'development', startMonth: 6, endMonth: 11, label: 'New Features', dependsOn: 'pg-ops' },
                ],
            }
        ]
    return { year, projects }
}

// ─── Row stacking ───
function stackPhases(phases) {
    const sorted = [...phases].sort((a, b) => a.startMonth - b.startMonth || (a.endMonth - a.startMonth) - (b.endMonth - b.startMonth))
    const rows = []
    return {
        phases: sorted.map(phase => {
            for (let r = 0; r < rows.length; r++) {
                if (!rows[r].some(p => phase.startMonth <= p.endMonth && phase.endMonth >= p.startMonth)) {
                    rows[r].push(phase); return { ...phase, _row: r }
                }
            }
            rows.push([phase]); return { ...phase, _row: rows.length - 1 }
        }),
        rowCount: Math.max(rows.length, 1)
    }
}

// ─── Dependency check ───
export function checkDependencyViolation(phase, allPhases) {
    if (!phase.dependsOn) return null
    const dep = allPhases.find(p => p.id === phase.dependsOn)
    if (!dep) return null
    if (phase.startMonth <= dep.endMonth) {
        return { phase, dep, message: `"${phase.label}" starts before "${dep.label}" ends (${MONTHS[dep.endMonth]})` }
    }
    return null
}

// Collect all dependency violations across all projects
export function getAllViolations(roadmapData) {
    const violations = []
    for (const project of (roadmapData?.projects || [])) {
        for (const phase of project.phases) {
            const v = checkDependencyViolation(phase, project.phases)
            if (v) violations.push({ ...v, projectName: project.name, projectColor: project.color })
        }
    }
    return violations
}

// Get all dependent phases recursively
function getDependentChain(phaseId, phases) {
    const result = []
    const queue = [phaseId]
    while (queue.length) {
        const current = queue.shift()
        const deps = phases.filter(p => p.dependsOn === current)
        for (const d of deps) {
            if (!result.find(r => r.id === d.id)) {
                result.push(d)
                queue.push(d.id)
            }
        }
    }
    return result
}

// Cascading move: shift a phase and all its dependents
function cascadeMove(phases, phaseId, newStart, newEnd) {
    const phase = phases.find(p => p.id === phaseId)
    if (!phase) return phases
    const deltaStart = newStart - phase.startMonth
    const deltaEnd = newEnd - phase.endMonth
    const chain = getDependentChain(phaseId, phases)

    let updated = phases.map(p => {
        if (p.id === phaseId) return { ...p, startMonth: newStart, endMonth: newEnd }
        return p
    })

    // For each dependent in chain, shift by delta (but clamp to 0-11)
    if (deltaStart !== 0 || deltaEnd !== 0) {
        const shift = deltaEnd > 0 ? deltaEnd : deltaStart
        for (const dep of chain) {
            const dur = dep.endMonth - dep.startMonth
            // Only push forward if the main phase moved forward
            // or pull back if it moved back (and dependent would now have room)
            let ns = dep.startMonth + shift
            let ne = dep.endMonth + shift
            // Ensure dependent starts after its parent ends
            const parent = updated.find(p => p.id === dep.dependsOn)
            if (parent && ns <= parent.endMonth) {
                ns = parent.endMonth + 1
                ne = ns + dur
            }
            ns = Math.max(0, Math.min(11 - dur, ns))
            ne = Math.min(11, ns + dur)
            updated = updated.map(p => p.id === dep.id ? { ...p, startMonth: ns, endMonth: ne } : p)
        }
    }
    return updated
}

// Export storage helpers for Dashboard
export { load, STORAGE_KEY, PHASE_TYPES_KEY, DEFAULT_PHASE_TYPES }


// ═══════════════════════════════════════════════════════════════
// ─── PHASE MODAL ───
// ═══════════════════════════════════════════════════════════════

function PhaseModal({ isOpen, onClose, onSave, editingPhase, projectName, defaultStartMonth, phaseTypes, allPhases }) {
    const [type, setType] = useState('development')
    const [startMonth, setStartMonth] = useState(0)
    const [endMonth, setEndMonth] = useState(2)
    const [label, setLabel] = useState('')
    const [dependsOn, setDependsOn] = useState(null)
    const [warning, setWarning] = useState(null)

    useEffect(() => {
        if (!isOpen) return
        if (editingPhase) {
            setType(editingPhase.type); setStartMonth(editingPhase.startMonth)
            setEndMonth(editingPhase.endMonth); setLabel(editingPhase.label || '')
            setDependsOn(editingPhase.dependsOn || null)
        } else {
            setType('development'); setStartMonth(defaultStartMonth ?? 0)
            setEndMonth(Math.min((defaultStartMonth ?? 0) + 2, 11)); setLabel('')
            setDependsOn(null)
        }
        setWarning(null)
    }, [editingPhase, isOpen, defaultStartMonth])

    if (!isOpen) return null

    // Available deps = all phases in this project except self
    const availableDeps = (allPhases || []).filter(p => p.id !== editingPhase?.id)

    const handleSave = () => {
        const sm = Math.min(startMonth, endMonth), em = Math.max(startMonth, endMonth)
        // Check dependency
        if (dependsOn) {
            const dep = allPhases.find(p => p.id === dependsOn)
            if (dep && sm <= dep.endMonth) {
                setWarning(`This phase starts in ${MONTHS[sm]} but "${dep.label}" ends in ${MONTHS[dep.endMonth]}. Move start to ${MONTHS[dep.endMonth + 1] || 'later'} or remove the dependency.`)
                return
            }
        }
        onSave({
            id: editingPhase?.id || generateId(), type,
            startMonth: sm, endMonth: em,
            label: label.trim() || phaseTypes.find(p => p.key === type)?.label || '',
            dependsOn: dependsOn || null
        })
        onClose()
    }

    const pt = phaseTypes.find(p => p.key === type)

    return (
        <div className="roadmap-modal-overlay" onClick={onClose}>
            <div className="roadmap-modal" onClick={e => e.stopPropagation()}>
                <div className="roadmap-modal-header">
                    <h3>{editingPhase ? 'Edit Phase' : 'Add Phase'}</h3>
                    <span className="roadmap-modal-subtitle">{projectName}</span>
                    <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="roadmap-modal-body">
                    <div className="roadmap-form-group">
                        <label>Phase Type</label>
                        <div className="phase-type-grid">
                            {phaseTypes.map(p => {
                                const Icon = getIcon(p.icon)
                                return (
                                    <button key={p.key}
                                        className={`phase-type-chip ${type === p.key ? 'selected' : ''}`}
                                        style={{ '--chip-color': p.color, background: type === p.key ? p.gradient : undefined }}
                                        onClick={() => setType(p.key)}>
                                        <Icon size={14} /><span>{p.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="roadmap-form-group">
                        <label>Label</label>
                        <input type="text" className="roadmap-input" value={label}
                            onChange={e => setLabel(e.target.value)} placeholder={pt?.label} />
                    </div>

                    <div className="roadmap-form-row">
                        <div className="roadmap-form-group">
                            <label>Start</label>
                            <select className="roadmap-select" value={startMonth} onChange={e => { setStartMonth(+e.target.value); setWarning(null) }}>
                                {MONTH_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                        <ArrowRight size={16} className="form-row-arrow" />
                        <div className="roadmap-form-group">
                            <label>End</label>
                            <select className="roadmap-select" value={endMonth} onChange={e => setEndMonth(+e.target.value)}>
                                {MONTH_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dependency */}
                    <div className="roadmap-form-group">
                        <label><Link2 size={11} style={{ marginRight: 4 }} />Depends On</label>
                        <select className="roadmap-select" value={dependsOn || ''} onChange={e => { setDependsOn(e.target.value || null); setWarning(null) }}>
                            <option value="">No dependency</option>
                            {availableDeps.map(p => (
                                <option key={p.id} value={p.id}>{p.label} ({MONTHS[p.startMonth]}–{MONTHS[p.endMonth]})</option>
                            ))}
                        </select>
                    </div>

                    {warning && (
                        <div className="rm-dep-warning">
                            <AlertTriangle size={14} /> {warning}
                        </div>
                    )}

                    <div className="roadmap-form-group">
                        <label>Preview</label>
                        <div className="phase-preview-bar">
                            {MONTHS.map((m, i) => {
                                const inRange = i >= Math.min(startMonth, endMonth) && i <= Math.max(startMonth, endMonth)
                                return (
                                    <div key={i} className={`phase-preview-cell ${inRange ? 'active' : ''}`}
                                        style={inRange ? { background: pt?.gradient } : {}}>
                                        <span>{m}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="roadmap-modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        {editingPhase ? 'Update' : 'Add Phase'}
                    </button>
                </div>
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════
// ─── PROJECT MODAL ───
// ═══════════════════════════════════════════════════════════════

function ProjectModal({ isOpen, onClose, onSave }) {
    const [name, setName] = useState('')
    const [color, setColor] = useState(PROJECT_COLORS[0])

    useEffect(() => { if (isOpen) { setName(''); setColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]) } }, [isOpen])
    if (!isOpen) return null

    const handleSave = () => {
        if (!name.trim()) return
        onSave({ id: generateId(), name: name.trim(), color, phases: [], visible: true })
        onClose()
    }

    return (
        <div className="roadmap-modal-overlay" onClick={onClose}>
            <div className="roadmap-modal project-modal" onClick={e => e.stopPropagation()}>
                <div className="roadmap-modal-header">
                    <h3>Add Project</h3>
                    <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="roadmap-modal-body">
                    <div className="roadmap-form-group">
                        <label>Project Name</label>
                        <input type="text" className="roadmap-input" value={name}
                            onChange={e => setName(e.target.value)} placeholder="Project name..."
                            autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
                    </div>
                    <div className="roadmap-form-group">
                        <label>Color</label>
                        <div className="color-picker-grid">
                            {PROJECT_COLORS.map(c => (
                                <button key={c} className={`color-dot ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }} onClick={() => setColor(c)}>
                                    {color === c && <Check size={12} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="roadmap-modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>Add</button>
                </div>
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════
// ─── PHASE TYPE SETTINGS ───
// ═══════════════════════════════════════════════════════════════

const AVAIL_COLORS = [
    '#3b82f6', '#2563eb', '#8b5cf6', '#7c3aed', '#ec4899', '#db2777',
    '#22c55e', '#16a34a', '#f59e0b', '#d97706', '#ef4444', '#dc2626',
    '#06b6d4', '#0891b2', '#84cc16', '#65a30d', '#f97316', '#ea580c',
    '#6366f1', '#4f46e5', '#64748b', '#475569', '#14b8a6', '#0d9488',
]
const AVAIL_ICONS = ['Code', 'TestTube', 'Rocket', 'Globe', 'Sparkles', 'Flag', 'Star', 'Target', 'Palette', 'Calendar']

function PhaseTypeSettings({ isOpen, onClose, phaseTypes, onSave }) {
    const [types, setTypes] = useState(phaseTypes)
    const [editIdx, setEditIdx] = useState(null)

    useEffect(() => { if (isOpen) setTypes(phaseTypes) }, [isOpen, phaseTypes])
    if (!isOpen) return null

    const update = (i, u) => setTypes(p => p.map((t, j) => j === i ? { ...t, ...u } : t))
    const add = () => {
        const c = AVAIL_COLORS[types.length % AVAIL_COLORS.length]
        setTypes(p => [...p, { key: `custom-${generateId()}`, label: 'New Phase', icon: 'Code', color: c, gradient: `linear-gradient(135deg, ${c}, ${c}dd)` }])
        setEditIdx(types.length)
    }
    const remove = (i) => { setTypes(p => p.filter((_, j) => j !== i)); setEditIdx(null) }

    return (
        <div className="roadmap-modal-overlay" onClick={onClose}>
            <div className="roadmap-modal rm-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="roadmap-modal-header">
                    <Settings size={18} /><h3>Phase Types</h3>
                    <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="roadmap-modal-body rm-settings-body">
                    <div className="rm-settings-list">
                        {types.map((t, i) => {
                            const Icon = getIcon(t.icon)
                            return (
                                <div key={t.key} className={`rm-settings-item ${editIdx === i ? 'editing' : ''}`}>
                                    {editIdx === i ? (
                                        <div className="rm-settings-edit-form">
                                            <div className="rm-settings-edit-row">
                                                <div className="rm-settings-color-pick" style={{ background: t.color }} />
                                                <input className="roadmap-input" value={t.label}
                                                    onChange={e => update(i, { label: e.target.value })} autoFocus />
                                            </div>
                                            <div className="rm-settings-edit-row">
                                                <label className="rm-settings-label">Color:</label>
                                                <div className="rm-settings-colors">
                                                    {AVAIL_COLORS.map(c => (
                                                        <button key={c} className={`rm-sc-dot ${t.color === c ? 'active' : ''}`}
                                                            style={{ background: c }}
                                                            onClick={() => update(i, { color: c, gradient: `linear-gradient(135deg, ${c}, ${c}dd)` })} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="rm-settings-edit-row">
                                                <label className="rm-settings-label">Icon:</label>
                                                <div className="rm-settings-icons">
                                                    {AVAIL_ICONS.map(ic => {
                                                        const Ic = getIcon(ic)
                                                        return <button key={ic} className={`rm-si-btn ${t.icon === ic ? 'active' : ''}`}
                                                            onClick={() => update(i, { icon: ic })}><Ic size={14} /></button>
                                                    })}
                                                </div>
                                            </div>
                                            <div className="rm-settings-edit-actions">
                                                <button className="btn btn-sm btn-ghost" onClick={() => setEditIdx(null)}>Done</button>
                                                <button className="btn btn-sm btn-ghost danger" onClick={() => remove(i)}>
                                                    <Trash2 size={12} /> Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rm-settings-item-row" onClick={() => setEditIdx(i)}>
                                            <div className="rm-settings-swatch" style={{ background: t.gradient || t.color }} />
                                            <Icon size={14} style={{ color: t.color }} />
                                            <span className="rm-settings-item-label">{t.label}</span>
                                            <Edit3 size={12} className="rm-settings-edit-icon" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <button className="rm-settings-add" onClick={add}><Plus size={14} /> Add Phase Type</button>
                </div>
                <div className="roadmap-modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => { onSave(types); onClose() }}>Save</button>
                </div>
            </div>
        </div>
    )
}


// ═══════════════════════════════════════════════════════════════
// ─── INLINE RENAME ───
// ═══════════════════════════════════════════════════════════════

function InlineRename({ value, onSave, onCancel }) {
    const [text, setText] = useState(value)
    const ref = useRef(null)
    useEffect(() => { ref.current?.select() }, [])
    const commit = () => { const t = text.trim(); if (t && t !== value) onSave(t); else onCancel() }
    return <input ref={ref} className="rm-inline-rename" value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel() }}
        onBlur={commit} autoFocus />
}


// ═══════════════════════════════════════════════════════════════
// ─── MAIN ROADMAP ───
// ═══════════════════════════════════════════════════════════════

export default function Roadmap() {
    const { games } = useProjectStore()

    const [roadmapData, setRoadmapData] = useState(() => load(STORAGE_KEY) || getDefaultData(games))
    const [phaseTypes, setPhaseTypes] = useState(() => load(PHASE_TYPES_KEY) || DEFAULT_PHASE_TYPES)
    const [selectedYear, setSelectedYear] = useState(roadmapData.year || new Date().getFullYear())
    const [phaseModal, setPhaseModal] = useState({ open: false, projectId: null, editingPhase: null, defaultStartMonth: null })
    const [projectModal, setProjectModal] = useState(false)
    const [settingsModal, setSettingsModal] = useState(false)
    const [activeMenu, setActiveMenu] = useState(null)
    const [renamingProject, setRenamingProject] = useState(null)
    const [typeFilters, setTypeFilters] = useState({}) // phaseType key → false means hidden
    const [projectFilters, setProjectFilters] = useState({}) // projectId → false means hidden
    const [colorPickerProject, setColorPickerProject] = useState(null)
    const [filterOpen, setFilterOpen] = useState(false)
    const [viewTab, setViewTab] = useState('timeline') // 'timeline' | 'bigpicture' | 'phasecompare'
    const [expandedProject, setExpandedProject] = useState(null)
    const [extraYears, setExtraYears] = useState(0)
    const [comparePhaseType, setComparePhaseType] = useState(null)

    const now = new Date()
    const currentMonth = now.getMonth()
    const isCurrentYear = selectedYear === now.getFullYear()

    // ─── Persist: localStorage (immediate) + Supabase (debounced) ───
    useEffect(() => {
        const payload = { ...roadmapData, year: selectedYear }
        save(STORAGE_KEY, payload)
        // Debounced Supabase sync
        clearTimeout(_debounceTimers[STORAGE_KEY])
        _debounceTimers[STORAGE_KEY] = setTimeout(() => {
            saveToSupabase(SUPABASE_SETTING_KEYS[STORAGE_KEY], payload)
        }, 1500)
    }, [roadmapData, selectedYear])

    useEffect(() => {
        save(PHASE_TYPES_KEY, phaseTypes)
        clearTimeout(_debounceTimers[PHASE_TYPES_KEY])
        _debounceTimers[PHASE_TYPES_KEY] = setTimeout(() => {
            saveToSupabase(SUPABASE_SETTING_KEYS[PHASE_TYPES_KEY], phaseTypes)
        }, 1500)
    }, [phaseTypes])

    // ─── Load from Supabase on mount (override localStorage if cloud data exists) ───
    const [supabaseLoaded, setSupabaseLoaded] = useState(false)
    useEffect(() => {
        let cancelled = false
        ;(async () => {
            try {
                const [cloudData, cloudTypes] = await Promise.all([
                    loadFromSupabase(SUPABASE_SETTING_KEYS[STORAGE_KEY]),
                    loadFromSupabase(SUPABASE_SETTING_KEYS[PHASE_TYPES_KEY])
                ])
                if (cancelled) return
                if (cloudData) {
                    setRoadmapData(cloudData)
                    if (cloudData.year) setSelectedYear(cloudData.year)
                    console.log('☁️ Roadmap data loaded from Supabase')
                }
                if (cloudTypes) {
                    setPhaseTypes(cloudTypes)
                    console.log('☁️ Phase types loaded from Supabase')
                }
            } catch (e) {
                console.warn('[Roadmap] Supabase init failed, using localStorage:', e.message)
            }
            if (!cancelled) setSupabaseLoaded(true)
        })()
        return () => { cancelled = true }
    }, [])

    const updateProject = useCallback((pid, fn) => {
        setRoadmapData(prev => ({ ...prev, projects: prev.projects.map(p => p.id === pid ? fn(p) : p) }))
    }, [])

    // Handlers
    const handleAddPhase = useCallback((pid, phase) => {
        updateProject(pid, p => ({
            ...p,
            phases: p.phases.some(x => x.id === phase.id)
                ? p.phases.map(x => x.id === phase.id ? phase : x)
                : [...p.phases, phase]
        }))
    }, [updateProject])

    const handleDeletePhase = useCallback((pid, phaseId) => {
        updateProject(pid, p => ({
            ...p,
            phases: p.phases.filter(x => x.id !== phaseId).map(x => x.dependsOn === phaseId ? { ...x, dependsOn: null } : x)
        }))
    }, [updateProject])

    const handleResizePhase = useCallback((pid, phaseId, newStart, newEnd) => {
        setRoadmapData(prev => {
            const project = prev.projects.find(p => p.id === pid)
            if (!project) return prev
            const phase = project.phases.find(p => p.id === phaseId)
            if (!phase) return prev

            // Block if it would violate own dependency
            if (phase.dependsOn) {
                const dep = project.phases.find(p => p.id === phase.dependsOn)
                if (dep && newStart <= dep.endMonth) return prev
            }

            // Cascade: move all dependents along
            const newPhases = cascadeMove(project.phases, phaseId, newStart, newEnd)

            return {
                ...prev,
                projects: prev.projects.map(p => p.id === pid ? { ...p, phases: newPhases } : p)
            }
        })
    }, [])

    const handleAddProject = useCallback((project) => {
        setRoadmapData(prev => ({ ...prev, projects: [...prev.projects, project] }))
    }, [])

    const handleDeleteProject = useCallback((pid) => {
        setRoadmapData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== pid) }))
    }, [])

    const handleRenameProject = useCallback((pid, name) => {
        updateProject(pid, p => ({ ...p, name })); setRenamingProject(null)
    }, [updateProject])

    const handleChangeColor = useCallback((pid, c) => {
        updateProject(pid, p => ({ ...p, color: c })); setColorPickerProject(null)
    }, [updateProject])

    const handleCellClick = useCallback((pid, month) => {
        setPhaseModal({ open: true, projectId: pid, editingPhase: null, defaultStartMonth: month })
    }, [])

    useEffect(() => {
        const h = () => { setActiveMenu(null); setColorPickerProject(null) }
        document.addEventListener('click', h)
        return () => document.removeEventListener('click', h)
    }, [])

    const activeProjectData = phaseModal.projectId ? roadmapData.projects.find(p => p.id === phaseModal.projectId) : null
    const todayPercent = isCurrentYear ? ((currentMonth + now.getDate() / 31) / 12) * 100 : null
    const BAR_H = 28, BAR_GAP = 4
    const scrollRef = useRef(null)

    // Scroll to today on mount
    useEffect(() => {
        if (isCurrentYear && scrollRef.current) {
            const monthWidth = scrollRef.current.scrollWidth / 12
            scrollRef.current.scrollLeft = Math.max(0, currentMonth * monthWidth - scrollRef.current.clientWidth / 3)
        }
    }, [isCurrentYear, currentMonth])

    const scrollTimeline = (dir) => {
        if (!scrollRef.current) return
        const amount = scrollRef.current.clientWidth * 0.4
        scrollRef.current.scrollBy({ left: dir * amount, behavior: 'smooth' })
    }

    // Filter visible projects
    const visibleProjects = roadmapData.projects
        .filter(p => projectFilters[p.id] !== false)
        .sort((a, b) => {
            const aStart = a.phases.length ? Math.min(...a.phases.map(p => p.startMonth)) : 99
            const bStart = b.phases.length ? Math.min(...b.phases.map(p => p.startMonth)) : 99
            return aStart - bStart
        })

    // Precompute row heights for synced sidebar/timeline/actions
    const rowHeights = useMemo(() => {
        const map = {}
        visibleProjects.forEach(project => {
            const filtered = project.phases.filter(p => typeFilters[p.type] !== false)
            const { rowCount } = stackPhases(filtered)
            map[project.id] = Math.max(60, rowCount * (BAR_H + BAR_GAP) + BAR_GAP + 4)
        })
        return map
    }, [visibleProjects, typeFilters, phaseTypes])

    return (
        <div className="rm-page">
            {/* Compact Header */}
            <div className="rm-top-bar">
                <div className="rm-top-left">
                    <h1 className="rm-title">Roadmap</h1>
                    <div className="rm-tab-switcher">
                        <button className={`rm-tab ${viewTab === 'timeline' ? 'active' : ''}`}
                            onClick={() => setViewTab('timeline')}>
                            <Calendar size={13} /> Timeline
                        </button>
                        <button className={`rm-tab ${viewTab === 'bigpicture' ? 'active' : ''}`}
                            onClick={() => setViewTab('bigpicture')}>
                            <Layers size={13} /> Big Picture
                        </button>
                        <button className={`rm-tab ${viewTab === 'phasecompare' ? 'active' : ''}`}
                            onClick={() => { setViewTab('phasecompare'); if (!comparePhaseType && phaseTypes.length) setComparePhaseType(phaseTypes[0].key) }}>
                            <BarChart3 size={13} /> Phase Calendar
                        </button>
                    </div>
                </div>
                <div className="rm-top-right">
                    {viewTab === 'timeline' && (
                        <>
                            <div className="rm-year-nav">
                                <button className="btn-icon btn-ghost" onClick={() => setSelectedYear(y => y - 1)}><ChevronLeft size={16} /></button>
                                <span className="rm-year">{selectedYear}</span>
                                <button className="btn-icon btn-ghost" onClick={() => setSelectedYear(y => y + 1)}><ChevronRight size={16} /></button>
                            </div>
                            <div className="rm-scroll-controls-inline">
                                <button className="rm-scroll-btn" onClick={() => scrollTimeline(-1)} title="Scroll left"><ChevronLeft size={14} /></button>
                                {isCurrentYear && (
                                    <button className="rm-scroll-today-btn" onClick={() => {
                                        if (scrollRef.current) {
                                            const mw = scrollRef.current.scrollWidth / 12
                                            scrollRef.current.scrollTo({ left: Math.max(0, currentMonth * mw - scrollRef.current.clientWidth / 3), behavior: 'smooth' })
                                        }
                                    }}>Today</button>
                                )}
                                <button className="rm-scroll-btn" onClick={() => scrollTimeline(1)} title="Scroll right"><ChevronRight size={14} /></button>
                            </div>
                        </>
                    )}

                    {/* Filter dropdown */}
                    <div className="rm-filter-dropdown-wrap">
                        <button className={`btn btn-ghost rm-filter-toggle ${filterOpen ? 'open' : ''}`}
                            onClick={() => setFilterOpen(o => !o)}>
                            <Filter size={14} />
                            <span>Filters</span>
                            {(Object.values(typeFilters).some(v => v === false) || Object.values(projectFilters).some(v => v === false)) && (
                                <span className="rm-filter-badge" />
                            )}
                        </button>
                        {filterOpen && (
                            <div className="rm-filter-panel" onClick={e => e.stopPropagation()}>
                                <div className="rm-filter-section">
                                    <div className="rm-filter-section-head">
                                        <span className="rm-filter-section-title">Phase Type</span>
                                        <div className="rm-filter-quick">
                                            <button className="rm-fq-btn" onClick={() => setTypeFilters({})}>All</button>
                                            <button className="rm-fq-btn" onClick={() => { const o = {}; phaseTypes.forEach(pt => o[pt.key] = false); setTypeFilters(o) }}>None</button>
                                        </div>
                                    </div>
                                    <div className="rm-filter-chips">
                                        {phaseTypes.map(pt => {
                                            const Icon = getIcon(pt.icon); const on = typeFilters[pt.key] !== false
                                            return (
                                                <button key={pt.key} className={`rm-filter-chip ${on ? 'active' : 'inactive'}`}
                                                    style={{ '--fc': pt.color, borderColor: on ? pt.color : undefined }}
                                                    onClick={() => setTypeFilters(p => ({ ...p, [pt.key]: !on }))}>
                                                    <Icon size={11} /><span>{pt.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                {roadmapData.projects.length > 1 && (
                                    <div className="rm-filter-section">
                                        <div className="rm-filter-section-head">
                                            <span className="rm-filter-section-title">Projects</span>
                                            <div className="rm-filter-quick">
                                                <button className="rm-fq-btn" onClick={() => setProjectFilters({})}>All</button>
                                                <button className="rm-fq-btn" onClick={() => { const o = {}; roadmapData.projects.forEach(p => o[p.id] = false); setProjectFilters(o) }}>None</button>
                                            </div>
                                        </div>
                                        <div className="rm-filter-chips">
                                            {roadmapData.projects.map(proj => {
                                                const on = projectFilters[proj.id] !== false
                                                return (
                                                    <button key={proj.id} className={`rm-filter-chip ${on ? 'active' : 'inactive'}`}
                                                        style={{ '--fc': proj.color, borderColor: on ? proj.color : undefined }}
                                                        onClick={() => setProjectFilters(p => ({ ...p, [proj.id]: !on }))}>
                                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />
                                                        <span>{proj.name}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="btn btn-ghost" onClick={() => setSettingsModal(true)}><Settings size={16} /> Phases</button>
                    <button className="btn btn-primary" onClick={() => setProjectModal(true)}><Plus size={16} /> Add Project</button>
                </div>
            </div>

            {/* ════ Big Picture View ════ */}
            {viewTab === 'bigpicture' && (
                <div className="rm-bigpic">
                    {(() => {
                        const thisYear = new Date().getFullYear()
                        const baseYears = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2]
                        const years = [...baseYears, ...Array.from({ length: extraYears }, (_, i) => thisYear + 3 + i)]
                        const thisMonth = new Date().getMonth()
                        const projects = visibleProjects

                        return (
                            <>
                            <div className="rm-bigpic-grid">
                                {/* Header row: months */}
                                <div className="rm-bigpic-corner">Year</div>
                                {MONTHS.map((m, i) => (
                                    <div key={m} className={`rm-bigpic-mhead ${thisYear === years[1] && i === thisMonth ? 'now' : ''}`}>{m}</div>
                                ))}

                                {/* Year rows */}
                                {years.map(year => (
                                    <React.Fragment key={year}>
                                        <div className={`rm-bigpic-year ${year === thisYear ? 'current' : ''}`}>
                                            <span>{year}</span>
                                        </div>
                                        {MONTHS.map((_, mi) => {
                                            const isNow = year === thisYear && mi === thisMonth
                                            const milestones = []
                                            projects.forEach(proj => {
                                                const phases = proj.phases || []
                                                if (!phases.length) return

                                                // Project start: earliest phase startMonth
                                                const minStart = Math.min(...phases.map(p => p.startMonth))
                                                if (mi === minStart && year === selectedYear) {
                                                    milestones.push({ type: 'start', project: proj, label: 'Start' })
                                                }

                                                // Project finish: latest phase endMonth
                                                const maxEnd = Math.max(...phases.map(p => p.endMonth))
                                                if (mi === maxEnd && year === selectedYear) {
                                                    milestones.push({ type: 'finish', project: proj, label: 'Finish' })
                                                }
                                            })

                                            return (
                                                <div key={mi} className={`rm-bigpic-cell ${isNow ? 'now' : ''} ${mi % 3 === 0 ? 'q-start' : ''}`}>
                                                    {milestones.map((ms, idx) => (
                                                        <div key={idx} className={`rm-bigpic-dot ${ms.type}`}
                                                            style={{ '--dot-color': ms.project.color, cursor: 'grab' }}
                                                            title={`${ms.project.name} — ${ms.label} (drag to move)`}
                                                            onMouseDown={e => {
                                                                e.preventDefault()
                                                                const grid = e.currentTarget.closest('.rm-bigpic-grid')
                                                                if (!grid) return
                                                                // Find all month header cells to get column positions
                                                                const headers = grid.querySelectorAll('.rm-bigpic-mhead')
                                                                const colRects = Array.from(headers).map(h => h.getBoundingClientRect())

                                                                // Create ghost element
                                                                const ghost = e.currentTarget.cloneNode(true)
                                                                ghost.className += ' rm-bigpic-drag-ghost'
                                                                ghost.style.position = 'fixed'
                                                                ghost.style.pointerEvents = 'none'
                                                                ghost.style.zIndex = '9999'
                                                                ghost.style.opacity = '0.85'
                                                                ghost.style.transform = 'scale(1.05)'
                                                                ghost.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
                                                                document.body.appendChild(ghost)

                                                                // Highlight element
                                                                const highlight = document.createElement('div')
                                                                highlight.className = 'rm-bigpic-drop-highlight'
                                                                document.body.appendChild(highlight)

                                                                let targetMonth = mi
                                                                const dotW = e.currentTarget.offsetWidth
                                                                const offsetX = e.clientX - e.currentTarget.getBoundingClientRect().left

                                                                // Dim source
                                                                e.currentTarget.style.opacity = '0.3'
                                                                const srcEl = e.currentTarget
                                                                document.body.style.cursor = 'grabbing'
                                                                document.body.style.userSelect = 'none'

                                                                const onMove = ev => {
                                                                    ghost.style.left = (ev.clientX - offsetX) + 'px'
                                                                    ghost.style.top = (ev.clientY - 12) + 'px'

                                                                    // Find which column we're over
                                                                    for (let ci = 0; ci < colRects.length; ci++) {
                                                                        const r = colRects[ci]
                                                                        if (ev.clientX >= r.left && ev.clientX < r.right) {
                                                                            targetMonth = ci
                                                                            highlight.style.left = r.left + 'px'
                                                                            highlight.style.top = r.top + 'px'
                                                                            highlight.style.width = r.width + 'px'
                                                                            highlight.style.height = (grid.getBoundingClientRect().bottom - r.top) + 'px'
                                                                            highlight.style.display = 'block'
                                                                            break
                                                                        }
                                                                    }
                                                                }

                                                                const onUp = () => {
                                                                    window.removeEventListener('mousemove', onMove)
                                                                    window.removeEventListener('mouseup', onUp)
                                                                    ghost.remove()
                                                                    highlight.remove()
                                                                    srcEl.style.opacity = ''
                                                                    document.body.style.cursor = ''
                                                                    document.body.style.userSelect = ''

                                                                    if (targetMonth !== mi) {
                                                                        const phases = [...ms.project.phases].sort((a, b) => a.startMonth - b.startMonth)
                                                                        if (ms.type === 'start' && phases.length) {
                                                                            const first = phases[0]
                                                                            handleResizePhase(ms.project.id, first.id, targetMonth, first.endMonth)
                                                                        } else if (ms.type === 'finish' && phases.length) {
                                                                            const last = phases[phases.length - 1]
                                                                            handleResizePhase(ms.project.id, last.id, last.startMonth, targetMonth)
                                                                        }
                                                                    }
                                                                }

                                                                window.addEventListener('mousemove', onMove)
                                                                window.addEventListener('mouseup', onUp)
                                                            }}>
                                                            <span className="rm-bigpic-dot-emoji">{ms.project.icon || '📁'}</span>
                                                            <span className="rm-bigpic-dot-name">{ms.project.name}</span>
                                                            <span className="rm-bigpic-dot-type">{ms.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="rm-bigpic-add-year">
                                <button className="rm-add-year-btn" onClick={() => setExtraYears(e => e + 1)}
                                    title="Add another year">+ Year</button>
                                {extraYears > 0 && <button className="rm-add-year-btn rm-remove-year" onClick={() => setExtraYears(e => Math.max(0, e - 1))}
                                    title="Remove last year">− Year</button>}
                            </div>
                            </>
                        )
                    })()}
                </div>
            )}

            {/* ════ Phase Calendar View ════ */}
            {viewTab === 'phasecompare' && (
                <div className="rm-bigpic">
                    {(() => {
                        const thisYear = new Date().getFullYear()
                        const baseYears = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2]
                        const years = [...baseYears, ...Array.from({ length: extraYears }, (_, i) => thisYear + 3 + i)]
                        const thisMonth = new Date().getMonth()
                        const projects = visibleProjects
                        const selectedPT = phaseTypes.find(pt => pt.key === comparePhaseType)
                        const PTIcon = selectedPT ? getIcon(selectedPT.icon) : Code

                        return (
                            <>
                                {/* Phase type selector */}
                                <div className="rm-phase-compare-header">
                                    <span className="rm-pch-label">Compare by phase:</span>
                                    <div className="rm-pch-chips">
                                        {phaseTypes.map(pt => {
                                            const Icon = getIcon(pt.icon)
                                            return (
                                                <button key={pt.key}
                                                    className={`rm-pch-chip ${comparePhaseType === pt.key ? 'active' : ''}`}
                                                    style={{ '--pch-color': pt.color }}
                                                    onClick={() => setComparePhaseType(pt.key)}>
                                                    <Icon size={12} /> {pt.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Grid */}
                                {(() => {
                                    const totalPhases = projects.reduce((sum, p) => sum + (p.phases || []).length, 0)
                                    const matchingPhases = projects.reduce((sum, p) => sum + (p.phases || []).filter(ph => ph.type === comparePhaseType).length, 0)
                                    return totalPhases === 0 ? (
                                        <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', margin: '0 0 8px', fontSize: '12px', color: '#92400e' }}>
                                            ⚠️ Hiç phase verisi yok. Timeline'da projelere phase ekleyin.
                                        </div>
                                    ) : matchingPhases === 0 ? (
                                        <div style={{ padding: '12px 16px', background: '#fef3c7', borderRadius: '8px', margin: '0 0 8px', fontSize: '12px', color: '#92400e' }}>
                                            ⚠️ "{comparePhaseType}" tipinde phase bulunamadı. (Toplam {totalPhases} phase var, tipleri: {[...new Set(projects.flatMap(p => (p.phases||[]).map(ph => ph.type)))].join(', ')})
                                        </div>
                                    ) : null
                                })()}
                                <div className="rm-bigpic-grid">
                                    <div className="rm-bigpic-corner">Year</div>
                                    {MONTHS.map((m, i) => (
                                        <div key={m} className={`rm-bigpic-mhead ${thisYear === years[1] && i === thisMonth ? 'now' : ''}`}>{m}</div>
                                    ))}

                                    {years.map(year => (
                                        <React.Fragment key={year}>
                                            <div className={`rm-bigpic-year ${year === thisYear ? 'current' : ''}`}>
                                                <span>{year}</span>
                                            </div>
                                            {MONTHS.map((_, mi) => {
                                                const isNow = year === thisYear && mi === thisMonth
                                                const bars = []
                                                if (year === selectedYear) {
                                                    projects.forEach(proj => {
                                                        const matchPhases = (proj.phases || []).filter(p => p.type === comparePhaseType)
                                                        matchPhases.forEach(phase => {
                                                            if (mi >= phase.startMonth && mi <= phase.endMonth) {
                                                                bars.push({ project: proj, phase, isStart: mi === phase.startMonth, isEnd: mi === phase.endMonth })
                                                            }
                                                        })
                                                    })
                                                }

                                                return (
                                                    <div key={mi} className={`rm-bigpic-cell ${isNow ? 'now' : ''} ${mi % 3 === 0 ? 'q-start' : ''}`}>
                                                        {bars.map((bar, idx) => (
                                                            <div key={idx} className={`rm-phase-bar ${bar.isStart ? 'bar-start' : ''} ${bar.isEnd ? 'bar-end' : ''}`}
                                                                style={{ '--bar-color': bar.project.color }}
                                                                title={`${bar.project.name} — ${bar.phase.label || bar.phase.name || ''} (${MONTHS[bar.phase.startMonth]}–${MONTHS[bar.phase.endMonth]})`}>
                                                                {bar.isStart && (
                                                                    <span className="rm-phase-bar-label">
                                                                        <span className="rm-phase-bar-emoji">{bar.project.icon || '📁'}</span>
                                                                        {bar.project.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                <div className="rm-bigpic-add-year">
                                    <button className="rm-add-year-btn" onClick={() => setExtraYears(e => e + 1)}
                                        title="Add another year">+ Year</button>
                                    {extraYears > 0 && <button className="rm-add-year-btn rm-remove-year" onClick={() => setExtraYears(e => Math.max(0, e - 1))}
                                        title="Remove last year">− Year</button>}
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}

            {/* ════ Timeline View ════ */}
            {viewTab === 'timeline' && (roadmapData.projects.length === 0 ? (
                <div className="rm-empty-state">
                    <Calendar size={48} strokeWidth={1} />
                    <h3>No projects yet</h3>
                    <p>Add a project to start planning</p>
                    <button className="btn btn-primary" onClick={() => setProjectModal(true)}><Plus size={16} /> Add Project</button>
                </div>
            ) : (
                <div className="rm-gantt">


                    <div className="rm-gantt-scroll-area" ref={scrollRef}>
                    <div className="rm-gantt-table">
                        {/* ── Header row ── */}
                        <div className="rm-cell rm-cell-sidebar rm-sticky-col rm-sticky-row rm-gantt-sidebar-head">Projects</div>
                        <div className="rm-cell rm-cell-timeline rm-sticky-row rm-gantt-header">
                            <div className="rm-gantt-timeline">
                                {MONTHS.map((m, i) => (
                                    <div key={i} className={`rm-gantt-month ${isCurrentYear && i === currentMonth ? 'now' : ''}`}>
                                        <span>{m}</span>
                                        {isCurrentYear && i === currentMonth && <div className="rm-today-dot" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rm-cell rm-cell-actions rm-sticky-col-right rm-sticky-row" />

                        {/* ── Q labels row ── */}
                        <div className="rm-cell rm-cell-sidebar rm-sticky-col rm-sticky-row-q rm-gantt-qlabel-placeholder" />
                        <div className="rm-cell rm-cell-timeline rm-sticky-row-q rm-gantt-qdiv-row">
                            <div className="rm-gantt-timeline rm-gantt-qdiv-area">
                                {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
                                    <div key={q} className={`rm-gantt-qlabel ${isCurrentYear && Math.floor(currentMonth / 3) === i ? 'now' : ''}`}>{q}</div>
                                ))}
                            </div>
                        </div>
                        <div className="rm-cell rm-cell-actions rm-sticky-col-right rm-sticky-row-q" />

                        {/* ── Body rows ── */}
                        {visibleProjects.map(project => {
                            const filteredPhases = project.phases.filter(p => typeFilters[p.type] !== false)
                            const { phases: stacked } = stackPhases(filteredPhases)
                            const rh = rowHeights[project.id]

                            return (
                                <React.Fragment key={project.id}>
                                    {/* Sidebar cell */}
                                    <div className="rm-cell rm-cell-sidebar rm-sticky-col rm-gantt-project-info"
                                        style={{ height: rh, ...(colorPickerProject === project.id ? { zIndex: 100, overflow: 'visible' } : {}) }}>
                                        <div className="rm-project-color-wrap" onClick={e => e.stopPropagation()}>
                                            <div className="rm-project-color" style={{ background: project.color }}
                                                onClick={() => setColorPickerProject(colorPickerProject === project.id ? null : project.id)} />
                                            {colorPickerProject === project.id && (
                                                <div className="rm-color-popup" onClick={e => e.stopPropagation()}>
                                                    {PROJECT_COLORS.map(c => (
                                                        <button key={c} className={`rm-color-dot ${project.color === c ? 'active' : ''}`}
                                                            style={{ background: c }} onClick={() => handleChangeColor(project.id, c)} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="rm-project-details">
                                            {renamingProject === project.id ? (
                                                <InlineRename value={project.name}
                                                    onSave={n => handleRenameProject(project.id, n)}
                                                    onCancel={() => setRenamingProject(null)} />
                                            ) : (
                                                <span className="rm-project-name" title="Double-click to rename"
                                                    onDoubleClick={() => setRenamingProject(project.id)}>
                                                    {project.icon && <span className="rm-project-icon">{project.icon}</span>}
                                                    {project.name}
                                                </span>
                                            )}
                                            <span className="rm-project-meta">
                                                {project.phases.length} phases
                                                <span className="rm-edit-link"
                                                    onClick={() => setExpandedProject(project.id)}>
                                                    <Edit3 size={10} /> Edit
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timeline cell */}
                                    <div className="rm-cell rm-cell-timeline rm-gantt-row" style={{ height: rh }}>
                                        <div className="rm-gantt-timeline rm-gantt-track" style={{ height: rh }}>
                                            <div className="rm-gantt-grid">
                                                {MONTHS.map((_, i) => (
                                                    <div key={i} className={`rm-gantt-grid-cell ${isCurrentYear && i === currentMonth ? 'now' : ''}`}
                                                        onClick={() => handleCellClick(project.id, i)} />
                                                ))}
                                            </div>
                                            <div className="rm-gantt-qdividers">
                                                <div className="rm-gantt-qdiv" style={{ left: '25%' }} />
                                                <div className="rm-gantt-qdiv" style={{ left: '50%' }} />
                                                <div className="rm-gantt-qdiv" style={{ left: '75%' }} />
                                            </div>
                                            {todayPercent !== null && <div className="rm-gantt-today" style={{ left: `${todayPercent}%` }} />}

                                            {/* Dependency arrows */}
                                            <svg className="rm-dep-svg">
                                                <defs>
                                                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                                        <path d="M0,1 L7,4 L0,7" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.2" />
                                                    </marker>
                                                    <marker id="arrow-warn" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                                                        <path d="M0,1 L7,4 L0,7" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                                    </marker>
                                                </defs>
                                                {stacked.filter(p => p.dependsOn).map(phase => {
                                                    const dep = stacked.find(d => d.id === phase.dependsOn)
                                                    if (!dep) return null
                                                    const x1 = ((dep.endMonth + 1) / 12) * 100
                                                    const y1 = dep._row * (BAR_H + BAR_GAP) + BAR_GAP + BAR_H / 2
                                                    const x2 = (phase.startMonth / 12) * 100
                                                    const y2 = phase._row * (BAR_H + BAR_GAP) + BAR_GAP + BAR_H / 2
                                                    const isViolation = phase.startMonth <= dep.endMonth
                                                    const midX = (x1 + x2) / 2
                                                    return (
                                                        <path key={phase.id}
                                                            d={`M ${x1}% ${y1} C ${midX}% ${y1}, ${midX}% ${y2}, ${x2}% ${y2}`}
                                                            className={`rm-dep-line ${isViolation ? 'violation' : ''}`}
                                                            markerEnd={isViolation ? 'url(#arrow-warn)' : 'url(#arrow)'} />
                                                    )
                                                })}
                                            </svg>

                                            {/* Phase bars */}
                                            <div className="rm-gantt-bars" style={{ height: rh - 4 }}>
                                                {stacked.map(phase => {
                                                    const pt = phaseTypes.find(t => t.key === phase.type) || phaseTypes[0]
                                                    const Icon = getIcon(pt.icon)
                                                    const left = (phase.startMonth / 12) * 100
                                                    const width = ((phase.endMonth - phase.startMonth + 1) / 12) * 100
                                                    const top = phase._row * (BAR_H + BAR_GAP) + BAR_GAP
                                                    const violation = checkDependencyViolation(phase, project.phases)
                                                    const depPhase = phase.dependsOn ? project.phases.find(p => p.id === phase.dependsOn) : null

                                                    return (
                                                        <div key={phase.id} className={`rm-phase-bar ${violation ? 'has-warning' : ''}`}
                                                            style={{ left: `${left}%`, width: `${width}%`, top, height: BAR_H, background: pt.gradient }}
                                                            title={`${phase.label} (${MONTHS[phase.startMonth]}–${MONTHS[phase.endMonth]})${depPhase ? `\nDepends on: ${depPhase.label}` : ''}${violation ? `\n⚠ ${violation.message}` : ''}`}
                                                            onMouseDown={e => {
                                                                if (e.target.closest('.rm-phase-handle') || e.target.closest('button')) return
                                                                e.preventDefault()
                                                                const track = e.currentTarget.closest('.rm-gantt-track')
                                                                const rect = track.getBoundingClientRect()
                                                                const dur = phase.endMonth - phase.startMonth
                                                                const startMF = ((e.clientX - rect.left) / rect.width) * 12
                                                                const mm = ev => {
                                                                    const mf = ((ev.clientX - rect.left) / rect.width) * 12
                                                                    const d = Math.round(mf - startMF)
                                                                    const ns = Math.max(0, Math.min(11 - dur, phase.startMonth + d))
                                                                    if (ns !== phase.startMonth) handleResizePhase(project.id, phase.id, ns, ns + dur)
                                                                }
                                                                const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); document.body.style.cursor = ''; document.body.style.userSelect = '' }
                                                                document.body.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'
                                                                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu)
                                                            }}>
                                                            <div className="rm-phase-handle rm-phase-handle-left" onMouseDown={e => {
                                                                e.stopPropagation(); e.preventDefault()
                                                                const track = e.currentTarget.closest('.rm-gantt-track'), rect = track.getBoundingClientRect()
                                                                const mm = ev => { const m = Math.max(0, Math.min(phase.endMonth, Math.round(((ev.clientX - rect.left) / rect.width) * 12 - 0.5))); handleResizePhase(project.id, phase.id, m, phase.endMonth) }
                                                                const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); document.body.style.cursor = ''; document.body.style.userSelect = '' }
                                                                document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
                                                                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu)
                                                            }} />

                                                            <div className="rm-phase-bar-content">
                                                                <Icon size={11} />
                                                                <span className="rm-phase-bar-label">{phase.label}</span>
                                                                {violation && <AlertTriangle size={11} className="rm-bar-warn" />}
                                                                {phase.dependsOn && !violation && <Link2 size={9} className="rm-bar-dep-icon" />}
                                                            </div>

                                                            <div className="rm-phase-bar-actions">
                                                                <button onClick={() => setPhaseModal({ open: true, projectId: project.id, editingPhase: phase, defaultStartMonth: null })}><Edit3 size={10} /></button>
                                                                <button className="rm-act-danger" onClick={() => handleDeletePhase(project.id, phase.id)}><Trash2 size={10} /></button>
                                                            </div>

                                                            <div className="rm-phase-handle rm-phase-handle-right" onMouseDown={e => {
                                                                e.stopPropagation(); e.preventDefault()
                                                                const track = e.currentTarget.closest('.rm-gantt-track'), rect = track.getBoundingClientRect()
                                                                const mm = ev => { const m = Math.max(phase.startMonth, Math.min(11, Math.round(((ev.clientX - rect.left) / rect.width) * 12 - 0.5))); handleResizePhase(project.id, phase.id, phase.startMonth, m) }
                                                                const mu = () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); document.body.style.cursor = ''; document.body.style.userSelect = '' }
                                                                document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
                                                                window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu)
                                                            }} />
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {filteredPhases.length === 0 && (
                                                <div className="rm-gantt-row-empty"><span>Click any cell to add a phase</span></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions cell */}
                                    <div className="rm-cell rm-cell-actions rm-sticky-col-right" style={{ height: rh }}>
                                        <div className="rm-row-actions" onClick={e => e.stopPropagation()}>
                                            <button className="rm-row-btn" title="Add Phase"
                                                onClick={() => setPhaseModal({ open: true, projectId: project.id, editingPhase: null, defaultStartMonth: null })}>
                                                <Plus size={14} />
                                            </button>
                                            <div className="rm-row-dropdown-wrap">
                                                <button className="rm-row-btn" onClick={e => { e.stopPropagation(); setActiveMenu(activeMenu === project.id ? null : project.id) }}>
                                                    <MoreHorizontal size={14} />
                                                </button>
                                                {activeMenu === project.id && (
                                                    <div className="rm-row-dropdown" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => { setPhaseModal({ open: true, projectId: project.id, editingPhase: null, defaultStartMonth: null }); setActiveMenu(null) }}>
                                                            <Plus size={14} /> Add Phase</button>
                                                        <button onClick={() => { setRenamingProject(project.id); setActiveMenu(null) }}>
                                                            <Edit3 size={14} /> Rename</button>
                                                        <div className="rm-dropdown-divider" />
                                                        <button className="danger" onClick={() => { handleDeleteProject(project.id); setActiveMenu(null) }}>
                                                            <Trash2 size={14} /> Remove</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            )
                        })}
                    </div>
                    </div>
                </div>
            ))}


            {/* Modals */}
            <PhaseModal isOpen={phaseModal.open}
                onClose={() => setPhaseModal({ open: false, projectId: null, editingPhase: null, defaultStartMonth: null })}
                onSave={phase => handleAddPhase(phaseModal.projectId, phase)}
                editingPhase={phaseModal.editingPhase}
                projectName={activeProjectData?.name}
                defaultStartMonth={phaseModal.defaultStartMonth}
                phaseTypes={phaseTypes}
                allPhases={activeProjectData?.phases || []} />
            <ProjectModal isOpen={projectModal} onClose={() => setProjectModal(false)} onSave={handleAddProject} />
            <PhaseTypeSettings isOpen={settingsModal} onClose={() => setSettingsModal(false)}
                phaseTypes={phaseTypes} onSave={setPhaseTypes} />

            {/* Project Detail Panel */}
            {expandedProject && (() => {
                const proj = roadmapData.projects.find(p => p.id === expandedProject)
                if (!proj) return null
                return (
                    <div className="rm-detail-overlay" onClick={() => setExpandedProject(null)}>
                        <div className="rm-detail-panel" onClick={e => e.stopPropagation()}>
                            <div className="rm-detail-header">
                                <div className="rm-detail-title-row">
                                    <span className="rm-detail-icon">{proj.icon || '📁'}</span>
                                    <h2>{proj.name}</h2>
                                    <div className="rm-detail-color" style={{ background: proj.color }} />
                                </div>
                                <button className="btn-icon btn-ghost" onClick={() => setExpandedProject(null)}><X size={18} /></button>
                            </div>

                            {/* Icon picker */}
                            <div className="rm-detail-section">
                                <span className="rm-detail-section-label">Project Icon</span>
                                <div className="rm-icon-picker">
                                    {PROJECT_ICONS.map(ic => (
                                        <button key={ic} className={`rm-icon-btn ${proj.icon === ic ? 'active' : ''}`}
                                            onClick={() => updateProject(proj.id, p => ({ ...p, icon: ic }))}>
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Phases list */}
                            <div className="rm-detail-section">
                                <div className="rm-detail-section-head">
                                    <span className="rm-detail-section-label">Phases ({proj.phases.length})</span>
                                    <button className="btn btn-ghost btn-sm"
                                        onClick={() => { setPhaseModal({ open: true, projectId: proj.id, editingPhase: null, defaultStartMonth: null }); setExpandedProject(null) }}>
                                        <Plus size={12} /> Add
                                    </button>
                                </div>
                                <div className="rm-detail-phases">
                                    {proj.phases
                                        .sort((a, b) => a.startMonth - b.startMonth)
                                        .map(phase => {
                                            const pt = phaseTypes.find(t => t.key === phase.type)
                                            const Icon = pt ? getIcon(pt.icon) : Code
                                            return (
                                                <div key={phase.id} className="rm-detail-phase-card" style={{ '--dpc': pt?.color || '#888' }}>
                                                    <div className="rm-dpc-left">
                                                        <div className="rm-dpc-icon"><Icon size={13} /></div>
                                                        <div className="rm-dpc-info">
                                                            <span className="rm-dpc-label">{phase.label}</span>
                                                            <span className="rm-dpc-type">{pt?.label || phase.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="rm-dpc-right">
                                                        <span className="rm-dpc-range">{MONTHS[phase.startMonth]} — {MONTHS[phase.endMonth]}</span>
                                                        <div className="rm-dpc-actions">
                                                            <button className="btn-icon btn-ghost btn-xs"
                                                                onClick={() => { setPhaseModal({ open: true, projectId: proj.id, editingPhase: phase, defaultStartMonth: null }); setExpandedProject(null) }}>
                                                                <Edit3 size={12} />
                                                            </button>
                                                            <button className="btn-icon btn-ghost btn-xs danger-icon"
                                                                onClick={() => handleDeletePhase(proj.id, phase.id)}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
