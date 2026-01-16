---
name: canvas-whiteboard
description: "Build infinite canvas whiteboard applications like Miro, FigJam, or Excalidraw. Use when (1) Creating zoomable and pannable canvas interfaces (2) Implementing drawing tools, shapes, and freehand sketching (3) Building sticky notes, text boxes, and card-based UIs (4) Creating connectors and arrows between elements (5) Implementing selection, multi-select, and transform handles (6) Building frames, grouping, and layering systems"
---

# Canvas Whiteboard Builder

Build professional infinite canvas applications with drawing, shapes, and interactive elements.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Application                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │   Toolbar   │  │  Canvas     │  │  Layers     │  │  Properties   │  │
│  │   Panel     │  │  Viewport   │  │  Panel      │  │  Panel        │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                           Canvas Engine                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Renderer    │  │  Scene Graph │  │  Input       │  │  History   │  │
│  │  (Canvas2D/  │  │  (Elements)  │  │  Handler     │  │  (Undo/    │  │
│  │   WebGL)     │  │              │  │              │  │   Redo)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                           State Management                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Elements    │  │  Viewport    │  │  Selection   │                  │
│  │  Store       │  │  State       │  │  State       │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Coordinate Systems

```
┌─────────────────────────────────────────────────────────────────┐
│ Screen Space (pixels)                                           │
│   - Mouse events, DOM positions                                 │
│   - Origin: top-left of viewport                                │
│                                                                 │
│ Canvas Space (world coordinates)                                │
│   - Element positions, dimensions                               │
│   - Infinite in all directions                                  │
│   - Transform: pan (offset) + zoom (scale)                      │
│                                                                 │
│ Conversion:                                                     │
│   canvasX = (screenX - panX) / zoom                             │
│   canvasY = (screenY - panY) / zoom                             │
│   screenX = canvasX * zoom + panX                               │
│   screenY = canvasY * zoom + panY                               │
└─────────────────────────────────────────────────────────────────┘
```

### Element Data Model

```typescript
interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;        // degrees
  opacity: number;         // 0-1
  locked: boolean;
  visible: boolean;
  parentId?: string;       // for grouping
  zIndex: number;
  
  // Type-specific properties
  style: ElementStyle;
  content?: string;        // for text/sticky
  points?: Point[];        // for path/line
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

type ElementType = 
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'line'
  | 'arrow'
  | 'path'           // freehand drawing
  | 'text'
  | 'sticky'
  | 'image'
  | 'frame'
  | 'connector'
  | 'group';

interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

interface Point {
  x: number;
  y: number;
  pressure?: number;  // for pen input
}
```

### Viewport State

```typescript
interface ViewportState {
  // Pan offset (screen coordinates)
  panX: number;
  panY: number;
  
  // Zoom level (1 = 100%)
  zoom: number;
  minZoom: number;      // e.g., 0.1 (10%)
  maxZoom: number;      // e.g., 5 (500%)
  
  // Viewport dimensions
  width: number;
  height: number;
}

// Zoom to fit selection
function zoomToFit(elements: Element[], viewport: ViewportState, padding = 50) {
  const bounds = getBoundingBox(elements);
  const scaleX = (viewport.width - padding * 2) / bounds.width;
  const scaleY = (viewport.height - padding * 2) / bounds.height;
  const zoom = Math.min(scaleX, scaleY, 1);
  
  return {
    zoom,
    panX: viewport.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    panY: viewport.height / 2 - (bounds.y + bounds.height / 2) * zoom,
  };
}
```

## Rendering Approaches

### Canvas 2D (Recommended for Start)

```typescript
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private viewport: ViewportState;
  
  render(elements: Element[]) {
    const { ctx, viewport } = this;
    
    // Clear canvas
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    
    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.panX, viewport.panY);
    ctx.scale(viewport.zoom, viewport.zoom);
    
    // Sort by z-index and render
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const element of sorted) {
      this.renderElement(element);
    }
    
    ctx.restore();
    
    // Render UI overlays (selection, handles) in screen space
    this.renderSelection();
  }
  
  private renderElement(element: Element) {
    const { ctx } = this;
    
    ctx.save();
    
    // Apply element transform
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    ctx.translate(-element.width / 2, -element.height / 2);
    ctx.globalAlpha = element.opacity;
    
    // Render based on type
    switch (element.type) {
      case 'rectangle':
        this.renderRect(element);
        break;
      case 'ellipse':
        this.renderEllipse(element);
        break;
      case 'text':
        this.renderText(element);
        break;
      case 'sticky':
        this.renderSticky(element);
        break;
      case 'path':
        this.renderPath(element);
        break;
      case 'arrow':
        this.renderArrow(element);
        break;
      // ... more types
    }
    
    ctx.restore();
  }
  
  private renderRect(element: Element) {
    const { ctx } = this;
    const { fill, stroke, strokeWidth, cornerRadius } = element.style;
    
    ctx.beginPath();
    if (cornerRadius) {
      this.roundRect(0, 0, element.width, element.height, cornerRadius);
    } else {
      ctx.rect(0, 0, element.width, element.height);
    }
    
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth || 1;
      ctx.stroke();
    }
  }
  
  private renderPath(element: Element) {
    const { ctx } = this;
    const { points } = element;
    if (!points || points.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    // Smooth curve through points
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    
    ctx.strokeStyle = element.style.stroke || '#000';
    ctx.lineWidth = element.style.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}
```

### WebGL (For Performance)

Use libraries like PixiJS or custom WebGL for 1000+ elements:

```typescript
// With PixiJS
import * as PIXI from 'pixi.js';

class PixiRenderer {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private elementSprites: Map<string, PIXI.DisplayObject>;
  
  constructor(canvas: HTMLCanvasElement) {
    this.app = new PIXI.Application({
      view: canvas,
      antialias: true,
      backgroundColor: 0xffffff,
      resolution: window.devicePixelRatio,
    });
    
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    this.elementSprites = new Map();
  }
  
  updateViewport(viewport: ViewportState) {
    this.container.x = viewport.panX;
    this.container.y = viewport.panY;
    this.container.scale.set(viewport.zoom);
  }
  
  syncElements(elements: Element[]) {
    // Add/update sprites for each element
    for (const element of elements) {
      let sprite = this.elementSprites.get(element.id);
      if (!sprite) {
        sprite = this.createSprite(element);
        this.elementSprites.set(element.id, sprite);
        this.container.addChild(sprite);
      }
      this.updateSprite(sprite, element);
    }
    
    // Remove deleted elements
    const elementIds = new Set(elements.map(e => e.id));
    for (const [id, sprite] of this.elementSprites) {
      if (!elementIds.has(id)) {
        this.container.removeChild(sprite);
        this.elementSprites.delete(id);
      }
    }
  }
}
```

## Input Handling

### Unified Input System

```typescript
interface PointerState {
  isDown: boolean;
  button: number;           // 0=left, 1=middle, 2=right
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  pressure: number;         // pen pressure
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

class InputHandler {
  private pointer: PointerState;
  private viewport: ViewportState;
  
  constructor(canvas: HTMLCanvasElement) {
    this.setupEventListeners(canvas);
  }
  
  private setupEventListeners(canvas: HTMLCanvasElement) {
    // Pointer events (unified mouse/touch/pen)
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointerleave', this.handlePointerUp);
    
    // Wheel for zoom
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }
  
  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Pinch zoom
      this.handleZoom(e.deltaY, e.clientX, e.clientY);
    } else {
      // Pan
      this.handlePan(-e.deltaX, -e.deltaY);
    }
  };
  
  private handleZoom(delta: number, centerX: number, centerY: number) {
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = clamp(
      this.viewport.zoom * zoomFactor,
      this.viewport.minZoom,
      this.viewport.maxZoom
    );
    
    // Zoom toward cursor
    const canvasX = (centerX - this.viewport.panX) / this.viewport.zoom;
    const canvasY = (centerY - this.viewport.panY) / this.viewport.zoom;
    
    this.viewport.zoom = newZoom;
    this.viewport.panX = centerX - canvasX * newZoom;
    this.viewport.panY = centerY - canvasY * newZoom;
  }
  
  // Convert screen to canvas coordinates
  screenToCanvas(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.viewport.panX) / this.viewport.zoom,
      y: (screenY - this.viewport.panY) / this.viewport.zoom,
    };
  }
}
```

### Tool System

```typescript
type ToolType = 
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'sticky'
  | 'connector'
  | 'eraser';

interface Tool {
  type: ToolType;
  cursor: string;
  onPointerDown(point: Point, state: PointerState): void;
  onPointerMove(point: Point, state: PointerState): void;
  onPointerUp(point: Point, state: PointerState): void;
  onKeyDown?(e: KeyboardEvent): void;
  render?(ctx: CanvasRenderingContext2D): void;  // preview
}

class SelectTool implements Tool {
  type: ToolType = 'select';
  cursor = 'default';
  
  private selectionBox: { x: number; y: number; width: number; height: number } | null = null;
  
  onPointerDown(point: Point, state: PointerState) {
    const element = this.hitTest(point);
    
    if (element) {
      if (state.modifiers.shift) {
        // Add to selection
        this.toggleSelection(element.id);
      } else if (!this.isSelected(element.id)) {
        // Select single
        this.setSelection([element.id]);
      }
      // Start drag
      this.startDrag(point);
    } else {
      // Start selection box
      this.selectionBox = { x: point.x, y: point.y, width: 0, height: 0 };
      if (!state.modifiers.shift) {
        this.clearSelection();
      }
    }
  }
  
  onPointerMove(point: Point, state: PointerState) {
    if (this.selectionBox) {
      // Update selection box
      this.selectionBox.width = point.x - this.selectionBox.x;
      this.selectionBox.height = point.y - this.selectionBox.y;
    } else if (this.isDragging) {
      // Move selected elements
      this.moveSelection(state.deltaX, state.deltaY);
    }
  }
  
  onPointerUp(point: Point, state: PointerState) {
    if (this.selectionBox) {
      // Select elements in box
      const elements = this.getElementsInRect(this.normalizeRect(this.selectionBox));
      this.addToSelection(elements.map(e => e.id));
      this.selectionBox = null;
    }
    this.endDrag();
  }
}

class PenTool implements Tool {
  type: ToolType = 'pen';
  cursor = 'crosshair';
  
  private currentPath: Point[] = [];
  
  onPointerDown(point: Point, state: PointerState) {
    this.currentPath = [{ ...point, pressure: state.pressure }];
  }
  
  onPointerMove(point: Point, state: PointerState) {
    if (state.isDown) {
      // Smooth the path by skipping points too close together
      const lastPoint = this.currentPath[this.currentPath.length - 1];
      const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
      
      if (distance > 2) {  // minimum distance threshold
        this.currentPath.push({ ...point, pressure: state.pressure });
      }
    }
  }
  
  onPointerUp(point: Point, state: PointerState) {
    if (this.currentPath.length > 1) {
      // Simplify path to reduce points
      const simplified = this.simplifyPath(this.currentPath, 1);
      
      // Create path element
      this.createElement({
        type: 'path',
        points: simplified,
        ...this.getBounds(simplified),
      });
    }
    this.currentPath = [];
  }
  
  private simplifyPath(points: Point[], tolerance: number): Point[] {
    // Ramer-Douglas-Peucker algorithm
    if (points.length <= 2) return points;
    
    // Find point with maximum distance
    let maxDist = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], start, end);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    if (maxDist > tolerance) {
      const left = this.simplifyPath(points.slice(0, maxIndex + 1), tolerance);
      const right = this.simplifyPath(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    }
    
    return [start, end];
  }
}
```

## Selection & Transform

### Selection Handles

```typescript
interface SelectionState {
  selectedIds: Set<string>;
  bounds: BoundingBox | null;
  handles: Handle[];
  activeHandle: HandleType | null;
  rotationAnchor: Point | null;
}

type HandleType = 
  | 'nw' | 'n' | 'ne'
  | 'w'  |       'e'
  | 'sw' | 's' | 'se'
  | 'rotation';

class SelectionManager {
  renderSelection(ctx: CanvasRenderingContext2D) {
    if (!this.bounds) return;
    
    const { x, y, width, height } = this.bounds;
    
    // Selection box
    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    
    // Resize handles
    const handleSize = 8;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#0066ff';
    
    const handles = [
      { x: x, y: y, type: 'nw' },
      { x: x + width / 2, y: y, type: 'n' },
      { x: x + width, y: y, type: 'ne' },
      { x: x + width, y: y + height / 2, type: 'e' },
      { x: x + width, y: y + height, type: 'se' },
      { x: x + width / 2, y: y + height, type: 's' },
      { x: x, y: y + height, type: 'sw' },
      { x: x, y: y + height / 2, type: 'w' },
    ];
    
    for (const handle of handles) {
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
    }
    
    // Rotation handle
    const rotateY = y - 30;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, rotateY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x + width / 2, rotateY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  handleResize(handleType: HandleType, delta: Point, keepAspectRatio: boolean) {
    const { bounds } = this;
    let { x, y, width, height } = bounds;
    
    const aspectRatio = width / height;
    
    switch (handleType) {
      case 'se':
        width += delta.x;
        height += delta.y;
        if (keepAspectRatio) {
          height = width / aspectRatio;
        }
        break;
      case 'e':
        width += delta.x;
        if (keepAspectRatio) {
          const newHeight = width / aspectRatio;
          y -= (newHeight - height) / 2;
          height = newHeight;
        }
        break;
      case 'nw':
        x += delta.x;
        y += delta.y;
        width -= delta.x;
        height -= delta.y;
        break;
      // ... other handles
    }
    
    // Apply to selected elements proportionally
    this.scaleSelectedElements({ x, y, width, height });
  }
}
```

## Connectors

```typescript
interface Connector extends Element {
  type: 'connector';
  startElementId: string;
  endElementId: string;
  startAnchor: AnchorPoint;
  endAnchor: AnchorPoint;
  pathType: 'straight' | 'elbow' | 'curved';
  startArrow: ArrowType;
  endArrow: ArrowType;
}

type AnchorPoint = 'top' | 'right' | 'bottom' | 'left' | 'center' | 'auto';
type ArrowType = 'none' | 'arrow' | 'triangle' | 'circle' | 'diamond';

function calculateConnectorPath(
  connector: Connector,
  startBounds: BoundingBox,
  endBounds: BoundingBox
): Point[] {
  // Get anchor positions
  const start = getAnchorPosition(startBounds, connector.startAnchor);
  const end = getAnchorPosition(endBounds, connector.endAnchor);
  
  switch (connector.pathType) {
    case 'straight':
      return [start, end];
      
    case 'elbow':
      // Create orthogonal path with rounded corners
      const midX = (start.x + end.x) / 2;
      return [
        start,
        { x: midX, y: start.y },
        { x: midX, y: end.y },
        end,
      ];
      
    case 'curved':
      // Bezier curve
      const controlOffset = Math.abs(end.x - start.x) * 0.5;
      return [
        start,
        { x: start.x + controlOffset, y: start.y },  // control point 1
        { x: end.x - controlOffset, y: end.y },      // control point 2
        end,
      ];
  }
}

function getAnchorPosition(bounds: BoundingBox, anchor: AnchorPoint): Point {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;
  
  switch (anchor) {
    case 'top': return { x: cx, y };
    case 'right': return { x: x + width, y: cy };
    case 'bottom': return { x: cx, y: y + height };
    case 'left': return { x, y: cy };
    case 'center': return { x: cx, y: cy };
    case 'auto': return findClosestAnchor(bounds, /* target */);
  }
}
```

## Undo/Redo History

```typescript
interface HistoryEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'batch';
  timestamp: number;
  before: Partial<Element>[];
  after: Partial<Element>[];
}

class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxHistory = 100;
  
  push(entry: HistoryEntry) {
    this.undoStack.push(entry);
    this.redoStack = [];  // Clear redo on new action
    
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }
  
  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    
    this.redoStack.push(entry);
    return entry;
  }
  
  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;
    
    this.undoStack.push(entry);
    return entry;
  }
  
  // Batch multiple operations into single undo
  batch<T>(fn: () => T): T {
    const startLength = this.undoStack.length;
    const result = fn();
    
    // Merge all entries since start into one
    const entries = this.undoStack.splice(startLength);
    if (entries.length > 0) {
      this.push({
        id: generateId(),
        type: 'batch',
        timestamp: Date.now(),
        before: entries.flatMap(e => e.before),
        after: entries.flatMap(e => e.after),
      });
    }
    
    return result;
  }
}
```

## Performance Optimization

### Spatial Indexing (R-Tree)

```typescript
import RBush from 'rbush';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
}

class SpatialIndex {
  private tree = new RBush<SpatialItem>();
  
  update(elements: Element[]) {
    this.tree.clear();
    
    const items = elements.map(el => ({
      minX: el.x,
      minY: el.y,
      maxX: el.x + el.width,
      maxY: el.y + el.height,
      id: el.id,
    }));
    
    this.tree.load(items);
  }
  
  // Get elements in viewport
  getVisible(viewport: ViewportState): string[] {
    const viewBounds = this.getViewBounds(viewport);
    return this.tree.search(viewBounds).map(item => item.id);
  }
  
  // Hit test at point
  getAtPoint(point: Point): string[] {
    return this.tree.search({
      minX: point.x,
      minY: point.y,
      maxX: point.x,
      maxY: point.y,
    }).map(item => item.id);
  }
  
  // Get elements in rect
  getInRect(rect: BoundingBox): string[] {
    return this.tree.search({
      minX: rect.x,
      minY: rect.y,
      maxX: rect.x + rect.width,
      maxY: rect.y + rect.height,
    }).map(item => item.id);
  }
}
```

### Render Culling

```typescript
function getVisibleElements(
  elements: Element[],
  viewport: ViewportState,
  padding = 100
): Element[] {
  // Calculate visible canvas bounds
  const viewBounds = {
    x: -viewport.panX / viewport.zoom - padding,
    y: -viewport.panY / viewport.zoom - padding,
    width: viewport.width / viewport.zoom + padding * 2,
    height: viewport.height / viewport.zoom + padding * 2,
  };
  
  return elements.filter(el => 
    intersects(
      { x: el.x, y: el.y, width: el.width, height: el.height },
      viewBounds
    )
  );
}
```

## References

- `references/rendering-techniques.md` - Advanced rendering patterns
- `references/gesture-handling.md` - Touch and pen gesture implementation
- `references/export-import.md` - SVG, PNG, JSON export/import