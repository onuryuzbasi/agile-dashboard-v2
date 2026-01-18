/**
 * Field Configuration Utility
 * 
 * This module provides helper functions to work with the centralized
 * field configuration from the project store.
 */
import {
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Circle
} from 'lucide-react'

// Icon mapping for dynamic icon rendering from string names
export const iconMap = {
    BookOpen,
    Bug,
    CheckSquare,
    Layers,
    ListTree,
    ArrowUp,
    ArrowDown,
    Minus,
    Circle
}

/**
 * Get icon component from string name
 */
export const getIconByName = (iconName, fallback = CheckSquare) => {
    return iconMap[iconName] || fallback
}

/**
 * Build a lookup object from field config array by key
 * e.g., { "todo": { id, key, label, ... }, "progress": {...} }
 */
export const buildConfigLookup = (configArray, keyField = 'key') => {
    if (!configArray || !Array.isArray(configArray)) return {}
    return configArray.reduce((acc, item) => {
        acc[item[keyField]] = item
        return acc
    }, {})
}

/**
 * Get a specific config item by key
 */
export const getConfigByKey = (configArray, key, keyField = 'key') => {
    if (!configArray || !Array.isArray(configArray)) return null
    return configArray.find(item => item[keyField] === key)
}

/**
 * Build priority config lookup with icon components resolved
 */
export const buildPriorityConfig = (priorities) => {
    if (!priorities) return {}
    return priorities.reduce((acc, p) => {
        acc[p.key] = {
            ...p,
            icon: getIconByName(p.icon, Minus)
        }
        return acc
    }, {})
}

/**
 * Build status config lookup
 */
export const buildStatusConfig = (statuses) => {
    if (!statuses) return {}
    return statuses.reduce((acc, s) => {
        acc[s.key] = {
            ...s,
            className: `status-${s.key}`
        }
        return acc
    }, {})
}

/**
 * Build type icons lookup with icon components resolved
 */
export const buildTypeConfig = (issueTypes) => {
    if (!issueTypes) return {}
    return issueTypes.reduce((acc, t) => {
        acc[t.key] = {
            ...t,
            icon: getIconByName(t.icon, CheckSquare)
        }
        return acc
    }, {})
}

/**
 * Build labels lookup by name
 */
export const buildLabelsConfig = (labels) => {
    if (!labels) return {}
    return labels.reduce((acc, l) => {
        acc[l.name] = l
        return acc
    }, {})
}
