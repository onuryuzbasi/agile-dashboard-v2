import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProjectStore } from './projectStore'

// Generate unique ID
const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Default element styles by type
const defaultStyles = {
    sticky: { fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2 },
    epic: { fill: '#e9d5ff', stroke: '#a855f7', strokeWidth: 2 },
    shape: { fill: '#dbeafe', stroke: '#3b82f6', strokeWidth: 2 },
    connector: { fill: 'transparent', stroke: '#64748b', strokeWidth: 2 },
    text: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 }
}

// Default dimensions by type
const defaultDimensions = {
    sticky: { width: 200, height: 200 },
    epic: { width: 280, height: 120 },
    shape: { width: 150, height: 100 },
    connector: { width: 100, height: 2 },
    text: { width: 200, height: 40 }
}

export const useCanvasStore = create(
    persist(
        (set, get) => ({
            // Elements on the canvas
            elements: [],

            // Viewport state
            viewport: {
                panX: 0,
                panY: 0,
                zoom: 1
            },

            // Selection
            selectedIds: [],

            // Active tool
            activeTool: 'select',

            // Available tools
            tools: ['select', 'pan', 'sticky', 'epic', 'shape', 'connector', 'text'],

            // Shape subtype (for shape tool)
            shapeType: 'rectangle',

            // Connector state (for drawing connectors)
            pendingConnector: null,

            // Actions
            setActiveTool: (tool) => set({ activeTool: tool }),

            setShapeType: (type) => set({ shapeType: type }),

            // Viewport actions
            setViewport: (viewport) => set((state) => ({
                viewport: { ...state.viewport, ...viewport }
            })),

            pan: (deltaX, deltaY) => set((state) => ({
                viewport: {
                    ...state.viewport,
                    panX: state.viewport.panX + deltaX,
                    panY: state.viewport.panY + deltaY
                }
            })),

            zoom: (factor, centerX, centerY) => set((state) => {
                const { viewport } = state
                const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * factor))

                // Zoom toward center point
                const canvasX = (centerX - viewport.panX) / viewport.zoom
                const canvasY = (centerY - viewport.panY) / viewport.zoom

                return {
                    viewport: {
                        ...viewport,
                        zoom: newZoom,
                        panX: centerX - canvasX * newZoom,
                        panY: centerY - canvasY * newZoom
                    }
                }
            }),

            resetViewport: () => set({
                viewport: { panX: 0, panY: 0, zoom: 1 }
            }),

            // Selection actions
            setSelection: (ids) => set({ selectedIds: ids }),

            addToSelection: (id) => set((state) => ({
                selectedIds: state.selectedIds.includes(id)
                    ? state.selectedIds
                    : [...state.selectedIds, id]
            })),

            removeFromSelection: (id) => set((state) => ({
                selectedIds: state.selectedIds.filter(i => i !== id)
            })),

            clearSelection: () => set({ selectedIds: [] }),

            // Element CRUD
            createElement: (type, x, y, overrides = {}) => {
                const id = generateId()
                const defaults = defaultDimensions[type] || { width: 100, height: 100 }
                const styles = defaultStyles[type] || {}

                const element = {
                    id,
                    type,
                    x: x - defaults.width / 2,
                    y: y - defaults.height / 2,
                    width: defaults.width,
                    height: defaults.height,
                    rotation: 0,
                    content: type === 'epic' ? 'New Epic' : '',
                    ...styles,
                    ...overrides,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }

                set((state) => ({
                    elements: [...state.elements, element],
                    selectedIds: [id]
                }))

                // If it's an epic, create corresponding issue
                if (type === 'epic') {
                    const projectStore = useProjectStore.getState()
                    const newIssue = projectStore.addIssue({
                        type: 'epic',
                        status: 'todo',
                        priority: overrides.priority || 'medium',
                        summary: overrides.content || 'New Epic',
                        description: 'Created from whiteboard',
                        sprintId: null,
                        storyPoints: null,
                        labels: ['whiteboard'],
                        assigneeId: overrides.assigneeId || null,
                        reporterId: projectStore.users?.[0]?.id || null
                    })

                    // Link the element to the issue
                    set((state) => ({
                        elements: state.elements.map(el =>
                            el.id === id ? { ...el, issueId: newIssue.id } : el
                        )
                    }))
                }

                return id
            },

            updateElement: (id, updates) => {
                set((state) => ({
                    elements: state.elements.map(el =>
                        el.id === id
                            ? { ...el, ...updates, updatedAt: Date.now() }
                            : el
                    )
                }))

                // If it's an epic with a linked issue, update the issue too
                const element = get().elements.find(el => el.id === id)
                if (element?.type === 'epic' && element.issueId) {
                    const projectStore = useProjectStore.getState()
                    const issueUpdates = {}

                    if (updates.content !== undefined) {
                        issueUpdates.summary = updates.content
                    }
                    if (updates.priority !== undefined) {
                        issueUpdates.priority = updates.priority
                    }
                    if (updates.assigneeId !== undefined) {
                        issueUpdates.assigneeId = updates.assigneeId
                    }

                    if (Object.keys(issueUpdates).length > 0) {
                        projectStore.updateIssue(element.issueId, issueUpdates)
                    }
                }
            },

            deleteElement: (id) => {
                const element = get().elements.find(el => el.id === id)

                // If it's an epic with linked issue, optionally delete the issue
                if (element?.type === 'epic' && element.issueId) {
                    // Keep the issue but unlink it (user can delete from board if needed)
                    // Alternatively: useProjectStore.getState().deleteIssue(element.issueId)
                }

                // Also delete any connectors attached to this element
                set((state) => ({
                    elements: state.elements.filter(el =>
                        el.id !== id &&
                        el.startElementId !== id &&
                        el.endElementId !== id
                    ),
                    selectedIds: state.selectedIds.filter(i => i !== id)
                }))
            },

            deleteSelected: () => {
                const { selectedIds } = get()
                selectedIds.forEach(id => get().deleteElement(id))
            },

            // Move elements
            moveElement: (id, deltaX, deltaY) => {
                set((state) => ({
                    elements: state.elements.map(el =>
                        el.id === id
                            ? { ...el, x: el.x + deltaX, y: el.y + deltaY, updatedAt: Date.now() }
                            : el
                    )
                }))
            },

            moveSelected: (deltaX, deltaY) => {
                const { selectedIds } = get()
                set((state) => ({
                    elements: state.elements.map(el =>
                        selectedIds.includes(el.id)
                            ? { ...el, x: el.x + deltaX, y: el.y + deltaY, updatedAt: Date.now() }
                            : el
                    )
                }))
            },

            // Resize element
            resizeElement: (id, width, height, x, y) => {
                set((state) => ({
                    elements: state.elements.map(el =>
                        el.id === id
                            ? {
                                ...el,
                                width: Math.max(50, width),
                                height: Math.max(30, height),
                                x: x !== undefined ? x : el.x,
                                y: y !== undefined ? y : el.y,
                                updatedAt: Date.now()
                            }
                            : el
                    )
                }))
            },

            // Connector actions
            startConnector: (elementId) => set({ pendingConnector: { startElementId: elementId } }),

            completeConnector: (endElementId) => {
                const { pendingConnector } = get()
                if (!pendingConnector || pendingConnector.startElementId === endElementId) {
                    set({ pendingConnector: null })
                    return
                }

                const id = generateId()
                const connector = {
                    id,
                    type: 'connector',
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    rotation: 0,
                    content: '',
                    startElementId: pendingConnector.startElementId,
                    endElementId,
                    ...defaultStyles.connector,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }

                set((state) => ({
                    elements: [...state.elements, connector],
                    pendingConnector: null,
                    selectedIds: [id]
                }))
            },

            cancelConnector: () => set({ pendingConnector: null }),

            // Sync epic from issue board changes
            syncEpicFromIssue: (issueId, updates) => {
                set((state) => ({
                    elements: state.elements.map(el =>
                        el.issueId === issueId
                            ? {
                                ...el,
                                content: updates.summary || el.content,
                                priority: updates.priority || el.priority,
                                assigneeId: updates.assigneeId || el.assigneeId,
                                updatedAt: Date.now()
                            }
                            : el
                    )
                }))
            },

            // Get element by ID
            getElementById: (id) => get().elements.find(el => el.id === id),

            // Get selected elements
            getSelectedElements: () => {
                const { elements, selectedIds } = get()
                return elements.filter(el => selectedIds.includes(el.id))
            },

            // Hit test - find element at point
            hitTest: (x, y) => {
                const { elements, viewport } = get()

                // Convert screen to canvas coordinates
                const canvasX = (x - viewport.panX) / viewport.zoom
                const canvasY = (y - viewport.panY) / viewport.zoom

                // Check elements in reverse order (top to bottom)
                for (let i = elements.length - 1; i >= 0; i--) {
                    const el = elements[i]
                    if (el.type === 'connector') continue // Skip connectors for hit test

                    if (
                        canvasX >= el.x &&
                        canvasX <= el.x + el.width &&
                        canvasY >= el.y &&
                        canvasY <= el.y + el.height
                    ) {
                        return el
                    }
                }

                return null
            },

            // Screen to canvas coordinate conversion
            screenToCanvas: (screenX, screenY) => {
                const { viewport } = get()
                return {
                    x: (screenX - viewport.panX) / viewport.zoom,
                    y: (screenY - viewport.panY) / viewport.zoom
                }
            },

            // Canvas to screen coordinate conversion
            canvasToScreen: (canvasX, canvasY) => {
                const { viewport } = get()
                return {
                    x: canvasX * viewport.zoom + viewport.panX,
                    y: canvasY * viewport.zoom + viewport.panY
                }
            }
        }),
        {
            name: 'whiteboard-storage',
            partialize: (state) => ({
                elements: state.elements,
                viewport: state.viewport
            })
        }
    )
)
