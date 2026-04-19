import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook for smart viewport positioning of menus/dropdowns.
 * Calculates optimal position with flip behavior when menus would extend beyond viewport.
 * 
 * @param {Object} triggerCoords - { x, y } click/trigger coordinates
 * @param {boolean} isOpen - Whether the menu is currently open
 * @param {Object} options - Optional configuration
 * @param {number} options.padding - Padding from viewport edges (default: 8)
 * @param {number} options.estimatedHeight - Estimated menu height if ref not available (default: 200)
 * @param {number} options.estimatedWidth - Estimated menu width if ref not available (default: 200)
 * @returns {Object} { menuRef, position: { left, top }, placement: { vertical, horizontal } }
 */
export function useViewportPosition(triggerCoords, isOpen, options = {}) {
    const {
        padding = 8,
        estimatedHeight = 200,
        estimatedWidth = 200
    } = options

    const menuRef = useRef(null)
    const [position, setPosition] = useState({ left: 0, top: 0 })
    const [placement, setPlacement] = useState({ vertical: 'below', horizontal: 'right' })

    // Store coordinates in refs to prevent dependency issues
    const coordsRef = useRef({ x: 0, y: 0 })
    coordsRef.current = triggerCoords || { x: 0, y: 0 }

    const calculatePosition = useCallback(() => {
        if (!isOpen || !coordsRef.current) return

        const { x, y } = coordsRef.current
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Get actual menu dimensions if available, otherwise use estimates
        const menuRect = menuRef.current?.getBoundingClientRect()
        const menuWidth = menuRect?.width || estimatedWidth
        const menuHeight = menuRect?.height || estimatedHeight

        // Calculate available space in each direction
        const spaceBelow = viewportHeight - y - padding
        const spaceAbove = y - padding
        const spaceRight = viewportWidth - x - padding
        const spaceLeft = x - padding

        // Determine vertical placement (flip if needed)
        let newTop = y
        let vertical = 'below'

        if (menuHeight > spaceBelow) {
            // Not enough space below - try above
            if (menuHeight <= spaceAbove) {
                newTop = y - menuHeight
                vertical = 'above'
            } else {
                // Neither direction has enough space - position at top of viewport with scroll
                newTop = Math.max(padding, viewportHeight - menuHeight - padding)
                vertical = 'constrained'
            }
        }

        // Determine horizontal placement (flip if needed)
        let newLeft = x
        let horizontal = 'right'

        if (menuWidth > spaceRight) {
            // Not enough space to the right - try left
            if (menuWidth <= spaceLeft) {
                newLeft = x - menuWidth
                horizontal = 'left'
            } else {
                // Neither direction has enough space - center or align to edge
                newLeft = Math.max(padding, Math.min(x, viewportWidth - menuWidth - padding))
                horizontal = 'constrained'
            }
        }

        // Ensure minimum bounds
        newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - menuWidth - padding))
        newTop = Math.max(padding, Math.min(newTop, viewportHeight - menuHeight - padding))

        // Only update if values changed to prevent infinite loops
        setPosition(prev => {
            if (prev.left === newLeft && prev.top === newTop) return prev
            return { left: newLeft, top: newTop }
        })
        setPlacement(prev => {
            if (prev.vertical === vertical && prev.horizontal === horizontal) return prev
            return { vertical, horizontal }
        })
    }, [isOpen, padding, estimatedHeight, estimatedWidth])

    // Calculate position when menu opens
    useEffect(() => {
        if (isOpen) {
            // Initial calculation
            calculatePosition()

            // Recalculate after a small delay to get actual menu dimensions
            const timer = setTimeout(calculatePosition, 10)
            return () => clearTimeout(timer)
        }
    }, [isOpen, calculatePosition])

    // Recalculate on window resize
    useEffect(() => {
        if (!isOpen) return

        const handleResize = () => calculatePosition()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isOpen, calculatePosition])

    return { menuRef, position, placement }
}

/**
 * Simpler utility function for one-off position calculations.
 * Use this when you don't need the full hook capabilities.
 * 
 * @param {number} x - Trigger X coordinate
 * @param {number} y - Trigger Y coordinate
 * @param {number} menuWidth - Menu width
 * @param {number} menuHeight - Menu height
 * @param {number} padding - Viewport padding (default: 8)
 * @returns {Object} { left, top, flippedVertical, flippedHorizontal }
 */
export function calculateMenuPosition(x, y, menuWidth, menuHeight, padding = 8) {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const spaceBelow = viewportHeight - y - padding
    const spaceRight = viewportWidth - x - padding

    let left = x
    let top = y
    let flippedVertical = false
    let flippedHorizontal = false

    // Flip vertical if needed
    if (menuHeight > spaceBelow && y - menuHeight >= padding) {
        top = y - menuHeight
        flippedVertical = true
    }

    // Flip horizontal if needed
    if (menuWidth > spaceRight && x - menuWidth >= padding) {
        left = x - menuWidth
        flippedHorizontal = true
    }

    // Ensure bounds
    left = Math.max(padding, Math.min(left, viewportWidth - menuWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - menuHeight - padding))

    return { left, top, flippedVertical, flippedHorizontal }
}

export default useViewportPosition
