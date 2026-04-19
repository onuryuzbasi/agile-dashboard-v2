import { useEffect } from 'react'
import Canvas from '../components/whiteboard/Canvas'
import Toolbar from '../components/whiteboard/Toolbar'
import ElementEditor from '../components/whiteboard/ElementEditor'
import { useCanvasStore } from '../stores/canvasStore'

export default function Whiteboard() {
    const { activeTool, setActiveTool, deleteSelected, selectedIds } = useCanvasStore()

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            switch (e.key.toLowerCase()) {
                case 'v':
                    setActiveTool('select')
                    break
                case 'h':
                    setActiveTool('pan')
                    break
                case 's':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        setActiveTool('sticky')
                    }
                    break
                case 'e':
                    setActiveTool('epic')
                    break
                case 'r':
                    setActiveTool('shape')
                    break
                case 'c':
                    if (!e.ctrlKey && !e.metaKey) {
                        setActiveTool('connector')
                    }
                    break
                case 't':
                    setActiveTool('text')
                    break
                case 'delete':
                case 'backspace':
                    if (selectedIds.length > 0) {
                        deleteSelected()
                    }
                    break
                case 'escape':
                    setActiveTool('select')
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [setActiveTool, deleteSelected, selectedIds])

    return (
        <div className="whiteboard-page">
            {/* Main canvas area */}
            <div className="whiteboard-main">
                <Canvas />

                {/* Floating toolbar */}
                <Toolbar />
            </div>

            {/* Properties panel */}
            <ElementEditor />

            {/* Instructions overlay (shown when empty) */}
            <div className="whiteboard-instructions">
                <div className="instruction-card">
                    <h4>Quick Start</h4>
                    <ul>
                        <li><kbd>S</kbd> Sticky Note</li>
                        <li><kbd>E</kbd> Epic (syncs to board)</li>
                        <li><kbd>C</kbd> Connect elements</li>
                        <li><kbd>V</kbd> Select tool</li>
                        <li><kbd>H</kbd> Pan/Hand tool</li>
                        <li><kbd>Scroll</kbd> Pan canvas</li>
                        <li><kbd>Ctrl+Scroll</kbd> Zoom</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
