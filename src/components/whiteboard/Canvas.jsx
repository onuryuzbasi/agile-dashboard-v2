import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useProjectStore } from '../../stores/projectStore'

export default function Canvas() {
    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [draggedElement, setDraggedElement] = useState(null)

    const {
        elements,
        viewport,
        selectedIds,
        activeTool,
        pendingConnector,
        pan,
        zoom,
        setSelection,
        clearSelection,
        createElement,
        moveSelected,
        hitTest,
        screenToCanvas,
        startConnector,
        completeConnector,
        cancelConnector
    } = useCanvasStore()

    const { getUserById } = useProjectStore()

    // Render canvas
    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const { width, height } = canvas

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Draw grid background
        ctx.save()
        ctx.translate(viewport.panX, viewport.panY)
        ctx.scale(viewport.zoom, viewport.zoom)

        // Grid
        const gridSize = 50
        const gridColor = 'rgba(0, 0, 0, 0.05)'
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1 / viewport.zoom

        const startX = Math.floor(-viewport.panX / viewport.zoom / gridSize) * gridSize - gridSize
        const startY = Math.floor(-viewport.panY / viewport.zoom / gridSize) * gridSize - gridSize
        const endX = startX + width / viewport.zoom + gridSize * 2
        const endY = startY + height / viewport.zoom + gridSize * 2

        ctx.beginPath()
        for (let x = startX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY)
            ctx.lineTo(x, endY)
        }
        for (let y = startY; y < endY; y += gridSize) {
            ctx.moveTo(startX, y)
            ctx.lineTo(endX, y)
        }
        ctx.stroke()

        // Draw connectors first (below elements)
        elements.filter(el => el.type === 'connector').forEach(el => {
            const startEl = elements.find(e => e.id === el.startElementId)
            const endEl = elements.find(e => e.id === el.endElementId)
            if (!startEl || !endEl) return

            const startX = startEl.x + startEl.width / 2
            const startY = startEl.y + startEl.height / 2
            const endX = endEl.x + endEl.width / 2
            const endY = endEl.y + endEl.height / 2

            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.strokeStyle = el.stroke || '#64748b'
            ctx.lineWidth = el.strokeWidth || 2
            ctx.stroke()

            // Arrow head
            const angle = Math.atan2(endY - startY, endX - startX)
            const arrowSize = 10
            ctx.beginPath()
            ctx.moveTo(endX, endY)
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6)
            )
            ctx.moveTo(endX, endY)
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6)
            )
            ctx.stroke()
        })

        // Draw elements
        elements.filter(el => el.type !== 'connector').forEach(el => {
            ctx.save()

            // Transform for rotation (if any)
            if (el.rotation) {
                const cx = el.x + el.width / 2
                const cy = el.y + el.height / 2
                ctx.translate(cx, cy)
                ctx.rotate((el.rotation * Math.PI) / 180)
                ctx.translate(-cx, -cy)
            }

            // Draw based on type
            switch (el.type) {
                case 'sticky':
                    drawSticky(ctx, el)
                    break
                case 'epic':
                    drawEpic(ctx, el)
                    break
                case 'shape':
                    drawShape(ctx, el)
                    break
                case 'text':
                    drawText(ctx, el)
                    break
            }

            // Selection highlight
            if (selectedIds.includes(el.id)) {
                ctx.strokeStyle = '#6366f1'
                ctx.lineWidth = 2 / viewport.zoom
                ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom])
                ctx.strokeRect(el.x - 4, el.y - 4, el.width + 8, el.height + 8)
                ctx.setLineDash([])

                // Resize handles
                const handleSize = 8 / viewport.zoom
                ctx.fillStyle = '#fff'
                ctx.strokeStyle = '#6366f1'
                ctx.lineWidth = 1 / viewport.zoom

                const handles = [
                    { x: el.x, y: el.y },
                    { x: el.x + el.width, y: el.y },
                    { x: el.x + el.width, y: el.y + el.height },
                    { x: el.x, y: el.y + el.height }
                ]

                handles.forEach(h => {
                    ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
                    ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize)
                })
            }

            ctx.restore()
        })

        // Draw pending connector
        if (pendingConnector) {
            const startEl = elements.find(e => e.id === pendingConnector.startElementId)
            if (startEl) {
                const startX = startEl.x + startEl.width / 2
                const startY = startEl.y + startEl.height / 2

                // Draw line to mouse (would need mouse position)
                ctx.setLineDash([5 / viewport.zoom, 5 / viewport.zoom])
                ctx.strokeStyle = '#6366f1'
                ctx.lineWidth = 2 / viewport.zoom
                // Line will be drawn on mouse move
                ctx.setLineDash([])
            }
        }

        ctx.restore()
    }, [elements, viewport, selectedIds, pendingConnector])

    // Draw functions
    function drawSticky(ctx, el) {
        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 4

        // Background
        ctx.fillStyle = el.fill || '#fef3c7'
        ctx.fillRect(el.x, el.y, el.width, el.height)

        ctx.shadowColor = 'transparent'

        // Border
        ctx.strokeStyle = el.stroke || '#f59e0b'
        ctx.lineWidth = el.strokeWidth || 2
        ctx.strokeRect(el.x, el.y, el.width, el.height)

        // Text
        if (el.content) {
            ctx.fillStyle = '#1e293b'
            ctx.font = '14px Inter, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            // Word wrap
            const words = el.content.split(' ')
            const lineHeight = 20
            const maxWidth = el.width - 20
            let lines = []
            let currentLine = ''

            words.forEach(word => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine)
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            })
            lines.push(currentLine)

            const textY = el.y + el.height / 2 - ((lines.length - 1) * lineHeight) / 2
            lines.forEach((line, i) => {
                ctx.fillText(line, el.x + el.width / 2, textY + i * lineHeight)
            })
        }
    }

    function drawEpic(ctx, el) {
        const radius = 8

        // Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4

        // Background with rounded corners
        ctx.fillStyle = el.fill || '#e9d5ff'
        ctx.beginPath()
        ctx.roundRect(el.x, el.y, el.width, el.height, radius)
        ctx.fill()

        ctx.shadowColor = 'transparent'

        // Border
        ctx.strokeStyle = el.stroke || '#a855f7'
        ctx.lineWidth = el.strokeWidth || 2
        ctx.stroke()

        // Epic icon
        ctx.fillStyle = '#a855f7'
        ctx.beginPath()
        ctx.arc(el.x + 20, el.y + 20, 8, 0, Math.PI * 2)
        ctx.fill()

        // Lightning bolt icon
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚡', el.x + 20, el.y + 20)

        // Title
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 14px Inter, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'

        const title = el.content || 'Epic'
        const maxWidth = el.width - 50
        const truncated = ctx.measureText(title).width > maxWidth
            ? title.slice(0, Math.floor(title.length * (maxWidth / ctx.measureText(title).width))) + '...'
            : title

        ctx.fillText(truncated, el.x + 40, el.y + 14)

        // Priority badge
        if (el.priority) {
            const priorityColors = {
                highest: '#dc2626',
                high: '#f97316',
                medium: '#eab308',
                low: '#22c55e',
                lowest: '#94a3b8'
            }

            ctx.fillStyle = priorityColors[el.priority] || '#94a3b8'
            ctx.font = '10px Inter, sans-serif'
            ctx.fillText(el.priority.toUpperCase(), el.x + 40, el.y + 35)
        }

        // "Epic" label
        ctx.fillStyle = '#7c3aed'
        ctx.font = '10px Inter, sans-serif'
        ctx.fillText('EPIC', el.x + 40, el.y + el.height - 20)

        // Linked indicator
        if (el.issueId) {
            ctx.fillStyle = '#22c55e'
            ctx.beginPath()
            ctx.arc(el.x + el.width - 15, el.y + 15, 5, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    function drawShape(ctx, el) {
        ctx.fillStyle = el.fill || '#dbeafe'
        ctx.strokeStyle = el.stroke || '#3b82f6'
        ctx.lineWidth = el.strokeWidth || 2

        ctx.beginPath()
        ctx.rect(el.x, el.y, el.width, el.height)
        ctx.fill()
        ctx.stroke()
    }

    function drawText(ctx, el) {
        ctx.fillStyle = '#1e293b'
        ctx.font = '16px Inter, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(el.content || 'Text', el.x, el.y)
    }

    // Resize canvas on window resize
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const resizeCanvas = () => {
            const canvas = canvasRef.current
            if (!canvas) return

            const rect = container.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
            render()
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
        return () => window.removeEventListener('resize', resizeCanvas)
    }, [render])

    // Render on state change
    useEffect(() => {
        render()
    }, [render])

    // Mouse handlers
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const canvasPos = screenToCanvas(x, y)

        setDragStart({ x: e.clientX, y: e.clientY })

        switch (activeTool) {
            case 'select': {
                const hit = hitTest(x, y)
                if (hit) {
                    if (!selectedIds.includes(hit.id)) {
                        setSelection([hit.id])
                    }
                    setDraggedElement(hit)
                    setIsDragging(true)
                } else {
                    clearSelection()
                }
                break
            }

            case 'pan':
                setIsDragging(true)
                break

            case 'sticky':
                createElement('sticky', canvasPos.x, canvasPos.y)
                break

            case 'epic':
                createElement('epic', canvasPos.x, canvasPos.y, {
                    content: 'New Epic',
                    priority: 'medium'
                })
                break

            case 'shape':
                createElement('shape', canvasPos.x, canvasPos.y)
                break

            case 'text':
                createElement('text', canvasPos.x, canvasPos.y, {
                    content: 'Text'
                })
                break

            case 'connector': {
                const hit = hitTest(x, y)
                if (hit && hit.type !== 'connector') {
                    if (pendingConnector) {
                        completeConnector(hit.id)
                    } else {
                        startConnector(hit.id)
                    }
                } else if (pendingConnector) {
                    cancelConnector()
                }
                break
            }
        }
    }

    const handleMouseMove = (e) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y

        if (activeTool === 'pan') {
            pan(deltaX, deltaY)
        } else if (activeTool === 'select' && draggedElement) {
            moveSelected(deltaX / viewport.zoom, deltaY / viewport.zoom)
        }

        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setDraggedElement(null)
    }

    const handleWheel = (e) => {
        e.preventDefault()

        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const factor = e.deltaY > 0 ? 0.9 : 1.1
            zoom(factor, x, y)
        } else {
            // Pan
            pan(-e.deltaX, -e.deltaY)
        }
    }

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                cursor: activeTool === 'pan' ? 'grab' :
                    activeTool === 'select' ? 'default' :
                        'crosshair'
            }}
        >
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{
                    display: 'block',
                    background: 'var(--bg-secondary)'
                }}
            />

            {/* Zoom indicator */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    background: 'var(--bg-primary)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)'
                }}
            >
                {Math.round(viewport.zoom * 100)}%
            </div>
        </div>
    )
}
