import { useEffect, useRef } from 'react'

/**
 * Hook that detects clicks outside of the specified element and calls the handler.
 * Essential for dismissing dropdowns, modals, and context menus.
 * 
 * @param {Function} handler - Callback to execute when clicking outside
 * @param {Array} excludeRefs - Optional array of additional refs to exclude from triggering the handler
 * @returns {React.RefObject} - Ref to attach to the element you want to monitor
 * 
 * @example
 * const dropdownRef = useOnClickOutside(() => setIsOpen(false));
 * return <div ref={dropdownRef}>Dropdown content</div>;
 */
export function useOnClickOutside(handler, excludeRefs = []) {
    const ref = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside the main ref
            if (ref.current && ref.current.contains(event.target)) {
                return
            }

            // Check if click is inside any of the excluded refs
            for (const excludeRef of excludeRefs) {
                if (excludeRef?.current && excludeRef.current.contains(event.target)) {
                    return
                }
            }

            // Click is outside - call the handler
            handler(event)
        }

        // Use mousedown for faster response (before click completes)
        document.addEventListener('mousedown', handleClickOutside)
        // Also listen for touchstart for mobile
        document.addEventListener('touchstart', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [handler, excludeRefs])

    return ref
}

/**
 * Hook that combines a ref with click-outside detection.
 * Use when you already have a ref and want to add click-outside behavior.
 * 
 * @param {React.RefObject} ref - Existing ref to monitor
 * @param {Function} handler - Callback to execute when clicking outside
 * @param {boolean} isActive - Whether the listener should be active
 */
export function useClickOutsideListener(ref, handler, isActive = true) {
    useEffect(() => {
        if (!isActive) return

        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                handler(event)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [ref, handler, isActive])
}

/**
 * Hook for dismissible UI elements with Escape key support.
 * Combines click-outside with keyboard dismissal.
 * 
 * @param {Function} onDismiss - Callback to execute on dismissal
 * @param {boolean} isOpen - Whether the element is currently visible
 * @returns {React.RefObject} - Ref to attach to the dismissible element
 */
export function useDismissible(onDismiss, isOpen) {
    const ref = useRef(null)

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                onDismiss()
            }
        }

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                onDismiss()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        document.addEventListener('keydown', handleEscapeKey)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [onDismiss, isOpen])

    return ref
}

export default useOnClickOutside
