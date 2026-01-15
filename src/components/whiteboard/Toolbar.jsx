import { useCanvasStore } from '../../stores/canvasStore'
import {
    MousePointer2,
    Hand,
    StickyNote,
    Layers,
    Square,
    ArrowRight,
    Type,
    Trash2,
    ZoomIn,
    ZoomOut,
    Maximize2
} from 'lucide-react'

const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)', shortcut: 'V' },
    { id: 'pan', icon: Hand, label: 'Pan (H)', shortcut: 'H' },
    { id: 'sticky', icon: StickyNote, label: 'Sticky Note (S)', shortcut: 'S' },
    { id: 'epic', icon: Layers, label: 'Epic (E)', shortcut: 'E' },
    { id: 'shape', icon: Square, label: 'Shape (R)', shortcut: 'R' },
    { id: 'connector', icon: ArrowRight, label: 'Connector (C)', shortcut: 'C' },
    { id: 'text', icon: Type, label: 'Text (T)', shortcut: 'T' },
]

export default function Toolbar() {
    const {
        activeTool,
        setActiveTool,
        selectedIds,
        deleteSelected,
        viewport,
        zoom,
        resetViewport
    } = useCanvasStore()

    const handleZoomIn = () => {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        zoom(1.2, center.x, center.y)
    }

    const handleZoomOut = () => {
        const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        zoom(0.8, center.x, center.y)
    }

    return (
        <div className="whiteboard-toolbar">
            {/* Tool buttons */}
            <div className="toolbar-group">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
                        onClick={() => setActiveTool(tool.id)}
                        title={tool.label}
                    >
                        <tool.icon size={20} />
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="toolbar-divider" />

            {/* Actions */}
            <div className="toolbar-group">
                <button
                    className="toolbar-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out (-)"
                >
                    <ZoomOut size={20} />
                </button>

                <span className="toolbar-zoom-label">
                    {Math.round(viewport.zoom * 100)}%
                </span>

                <button
                    className="toolbar-btn"
                    onClick={handleZoomIn}
                    title="Zoom In (+)"
                >
                    <ZoomIn size={20} />
                </button>

                <button
                    className="toolbar-btn"
                    onClick={resetViewport}
                    title="Reset View"
                >
                    <Maximize2 size={20} />
                </button>
            </div>

            {/* Delete */}
            {selectedIds.length > 0 && (
                <>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                        <button
                            className="toolbar-btn danger"
                            onClick={deleteSelected}
                            title="Delete Selected (Del)"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
