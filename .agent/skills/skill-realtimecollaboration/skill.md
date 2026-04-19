---
name: realtime-collaboration
description: "Build real-time collaborative features for multi-user applications. Use when (1) Implementing WebSocket-based real-time sync (2) Building presence systems showing live cursors and user activity (3) Handling concurrent edits with conflict resolution (4) Implementing CRDTs or Operational Transform for collaborative editing (5) Building multiplayer features like shared cursors, selections, and live updates (6) Creating collaborative comments, reactions, and voting systems"
---

# Realtime Collaboration

Build robust real-time collaborative features for multi-user applications.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Clients                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   User A    │  │   User B    │  │   User C    │                     │
│  │  (Browser)  │  │  (Browser)  │  │  (Browser)  │                     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                     │
│         │                │                │                             │
│         └────────────────┼────────────────┘                             │
│                          │ WebSocket                                    │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────────┐
│                    Collaboration Server                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Connection  │  │   Room       │  │   Presence   │                  │
│  │  Manager     │  │   Manager    │  │   Manager    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Sync       │  │   Conflict   │  │   History    │                  │
│  │   Engine     │  │   Resolution │  │   Manager    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    │  (Postgres/ │
                    │   Redis)    │
                    └─────────────┘
```

## WebSocket Foundation

### Server Setup (Node.js + Socket.IO)

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyToken(token);
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.data.user.id}`);
  
  socket.on('join-room', (roomId) => handleJoinRoom(socket, roomId));
  socket.on('leave-room', (roomId) => handleLeaveRoom(socket, roomId));
  socket.on('operation', (op) => handleOperation(socket, op));
  socket.on('cursor-move', (pos) => handleCursorMove(socket, pos));
  socket.on('selection-change', (sel) => handleSelectionChange(socket, sel));
  
  socket.on('disconnect', () => handleDisconnect(socket));
});

httpServer.listen(3001);
```

### Client Connection

```typescript
import { io, Socket } from 'socket.io-client';

class CollaborationClient {
  private socket: Socket;
  private roomId: string | null = null;
  
  constructor(serverUrl: string, token: string) {
    this.socket = io(serverUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      if (this.roomId) {
        this.joinRoom(this.roomId);
      }
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.onDisconnect?.(reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    // Collaboration events
    this.socket.on('user-joined', this.handleUserJoined);
    this.socket.on('user-left', this.handleUserLeft);
    this.socket.on('operation', this.handleRemoteOperation);
    this.socket.on('cursor-update', this.handleCursorUpdate);
    this.socket.on('selection-update', this.handleSelectionUpdate);
    this.socket.on('presence-update', this.handlePresenceUpdate);
    this.socket.on('sync-state', this.handleSyncState);
  }
  
  joinRoom(roomId: string) {
    this.roomId = roomId;
    this.socket.emit('join-room', roomId);
  }
  
  leaveRoom() {
    if (this.roomId) {
      this.socket.emit('leave-room', this.roomId);
      this.roomId = null;
    }
  }
  
  sendOperation(operation: Operation) {
    this.socket.emit('operation', operation);
  }
  
  sendCursorPosition(position: { x: number; y: number }) {
    this.socket.volatile.emit('cursor-move', position);
  }
  
  sendSelection(elementIds: string[]) {
    this.socket.emit('selection-change', elementIds);
  }
}
```

## Room Management

### Room State

```typescript
interface Room {
  id: string;
  name: string;
  users: Map<string, RoomUser>;
  state: BoardState;
  history: Operation[];
  version: number;
}

interface RoomUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection: string[];
  lastActive: number;
}

class RoomManager {
  private rooms = new Map<string, Room>();
  
  async joinRoom(socket: Socket, roomId: string) {
    let room = this.rooms.get(roomId);
    
    if (!room) {
      // Load room from database or create new
      room = await this.loadOrCreateRoom(roomId);
      this.rooms.set(roomId, room);
    }
    
    // Add user to room
    const user: RoomUser = {
      id: socket.data.user.id,
      name: socket.data.user.name,
      color: this.assignColor(room),
      avatar: socket.data.user.avatar,
      selection: [],
      lastActive: Date.now(),
    };
    
    room.users.set(socket.id, user);
    socket.join(roomId);
    
    // Send current state to new user
    socket.emit('sync-state', {
      state: room.state,
      version: room.version,
      users: Array.from(room.users.values()),
    });
    
    // Notify others
    socket.to(roomId).emit('user-joined', user);
  }
  
  leaveRoom(socket: Socket, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const user = room.users.get(socket.id);
    room.users.delete(socket.id);
    socket.leave(roomId);
    
    // Notify others
    socket.to(roomId).emit('user-left', { userId: user?.id });
    
    // Cleanup empty rooms
    if (room.users.size === 0) {
      this.persistAndCleanup(room);
    }
  }
  
  private assignColor(room: Room): string {
    const colors = [
      '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
      '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    ];
    
    const usedColors = new Set(
      Array.from(room.users.values()).map(u => u.color)
    );
    
    return colors.find(c => !usedColors.has(c)) || colors[0];
  }
}
```

## Presence System

### Live Cursors

```typescript
// Server
function handleCursorMove(socket: Socket, position: { x: number; y: number }) {
  const roomId = Array.from(socket.rooms)[1]; // First room after socket.id
  if (!roomId) return;
  
  const room = roomManager.getRoom(roomId);
  const user = room?.users.get(socket.id);
  if (user) {
    user.cursor = position;
    user.lastActive = Date.now();
    
    // Broadcast to others (volatile = can be dropped)
    socket.volatile.to(roomId).emit('cursor-update', {
      userId: user.id,
      position,
    });
  }
}

// Client - Rendering cursors
interface RemoteCursor {
  userId: string;
  userName: string;
  color: string;
  position: { x: number; y: number };
  lastUpdate: number;
}

class CursorRenderer {
  private cursors = new Map<string, RemoteCursor>();
  private animationFrame: number | null = null;
  
  updateCursor(userId: string, position: { x: number; y: number }) {
    const cursor = this.cursors.get(userId);
    if (cursor) {
      cursor.position = position;
      cursor.lastUpdate = Date.now();
    }
  }
  
  render(ctx: CanvasRenderingContext2D, viewport: ViewportState) {
    const now = Date.now();
    
    for (const cursor of this.cursors.values()) {
      // Fade out inactive cursors
      const age = now - cursor.lastUpdate;
      if (age > 10000) continue;  // Hide after 10s
      
      const opacity = age > 5000 ? 1 - (age - 5000) / 5000 : 1;
      
      // Convert to screen coordinates
      const screenX = cursor.position.x * viewport.zoom + viewport.panX;
      const screenY = cursor.position.y * viewport.zoom + viewport.panY;
      
      this.drawCursor(ctx, screenX, screenY, cursor, opacity);
    }
  }
  
  private drawCursor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cursor: RemoteCursor,
    opacity: number
  ) {
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Cursor arrow
    ctx.fillStyle = cursor.color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3, y + 12);
    ctx.lineTo(x + 7, y + 8);
    ctx.lineTo(x + 12, y + 12);
    ctx.closePath();
    ctx.fill();
    
    // Name label
    ctx.font = '12px Inter, sans-serif';
    const textWidth = ctx.measureText(cursor.userName).width;
    
    ctx.fillStyle = cursor.color;
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 10, textWidth + 12, 20, 4);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.fillText(cursor.userName, x + 18, y + 24);
    
    ctx.restore();
  }
}
```

### Selection Highlighting

```typescript
// Server
function handleSelectionChange(socket: Socket, elementIds: string[]) {
  const roomId = Array.from(socket.rooms)[1];
  if (!roomId) return;
  
  const room = roomManager.getRoom(roomId);
  const user = room?.users.get(socket.id);
  if (user) {
    user.selection = elementIds;
    
    socket.to(roomId).emit('selection-update', {
      userId: user.id,
      elementIds,
    });
  }
}

// Client - Rendering remote selections
function renderRemoteSelections(
  ctx: CanvasRenderingContext2D,
  users: RoomUser[],
  elements: Map<string, Element>
) {
  for (const user of users) {
    if (user.selection.length === 0) continue;
    
    ctx.strokeStyle = user.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    for (const elementId of user.selection) {
      const element = elements.get(elementId);
      if (!element) continue;
      
      ctx.strokeRect(
        element.x - 2,
        element.y - 2,
        element.width + 4,
        element.height + 4
      );
    }
    
    ctx.setLineDash([]);
  }
}
```

### Presence Indicators

```typescript
// User avatars in header
const PresenceIndicator = ({ users, maxVisible = 5 }) => {
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = users.length - maxVisible;
  
  return (
    <div className="flex items-center -space-x-2">
      {visibleUsers.map(user => (
        <div
          key={user.id}
          className="relative"
          title={user.name}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: user.color }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          
          {/* Online indicator */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{
              backgroundColor: Date.now() - user.lastActive < 30000 ? '#22C55E' : '#9CA3AF'
            }}
          />
        </div>
      ))}
      
      {extraCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
          +{extraCount}
        </div>
      )}
    </div>
  );
};
```

## Conflict Resolution

### Operational Transform (OT)

```typescript
interface Operation {
  id: string;
  userId: string;
  type: 'insert' | 'update' | 'delete' | 'move';
  elementId?: string;
  data?: Partial<Element>;
  position?: number;  // for ordering
  timestamp: number;
  version: number;    // client version when op was created
}

class OTEngine {
  transform(op1: Operation, op2: Operation): Operation {
    // op1 is the operation to transform
    // op2 is the concurrent operation that was applied first
    
    if (op1.elementId !== op2.elementId) {
      // Different elements - no conflict
      return op1;
    }
    
    switch (`${op1.type}-${op2.type}`) {
      case 'update-update':
        return this.transformUpdateUpdate(op1, op2);
      case 'update-delete':
        return this.transformUpdateDelete(op1, op2);
      case 'delete-update':
        return this.transformDeleteUpdate(op1, op2);
      case 'move-move':
        return this.transformMoveMove(op1, op2);
      default:
        return op1;
    }
  }
  
  private transformUpdateUpdate(op1: Operation, op2: Operation): Operation {
    // Both updating same element - merge properties
    // Later timestamp wins for conflicting properties
    const merged = { ...op1.data };
    
    for (const key of Object.keys(op2.data || {})) {
      if (key in merged && op2.timestamp > op1.timestamp) {
        delete merged[key];  // op2's value takes precedence
      }
    }
    
    return { ...op1, data: merged };
  }
  
  private transformUpdateDelete(op1: Operation, op2: Operation): Operation {
    // Update on deleted element - discard
    return { ...op1, type: 'noop' as any };
  }
  
  private transformDeleteUpdate(op1: Operation, op2: Operation): Operation {
    // Delete overrides update
    return op1;
  }
  
  private transformMoveMove(op1: Operation, op2: Operation): Operation {
    // Both moving - adjust position based on which was applied first
    if (op1.position! >= op2.position!) {
      return { ...op1, position: op1.position! + 1 };
    }
    return op1;
  }
}

// Server-side OT handling
class SyncEngine {
  private otEngine = new OTEngine();
  private pendingOps = new Map<string, Operation[]>();
  
  async applyOperation(room: Room, op: Operation): Promise<Operation[]> {
    const serverVersion = room.version;
    
    // If client is behind, transform against missed operations
    if (op.version < serverVersion) {
      const missedOps = room.history.slice(op.version);
      for (const missedOp of missedOps) {
        op = this.otEngine.transform(op, missedOp);
      }
    }
    
    // Apply operation
    this.applyToState(room.state, op);
    room.history.push(op);
    room.version++;
    
    return [{ ...op, version: room.version }];
  }
}
```

### CRDT Approach (Yjs)

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

class CRDTSync {
  private doc: Y.Doc;
  private provider: WebsocketProvider;
  private elements: Y.Map<Element>;
  
  constructor(roomId: string, serverUrl: string) {
    this.doc = new Y.Doc();
    
    // Connect to y-websocket server
    this.provider = new WebsocketProvider(
      serverUrl,
      roomId,
      this.doc
    );
    
    // Shared map for elements
    this.elements = this.doc.getMap('elements');
    
    // Listen for changes
    this.elements.observe(event => {
      event.changes.keys.forEach((change, key) => {
        switch (change.action) {
          case 'add':
            this.onElementAdded(key, this.elements.get(key)!);
            break;
          case 'update':
            this.onElementUpdated(key, this.elements.get(key)!);
            break;
          case 'delete':
            this.onElementDeleted(key);
            break;
        }
      });
    });
    
    // Awareness for presence
    this.provider.awareness.on('change', this.onAwarenessChange);
  }
  
  addElement(element: Element) {
    this.elements.set(element.id, element);
  }
  
  updateElement(id: string, updates: Partial<Element>) {
    const element = this.elements.get(id);
    if (element) {
      this.elements.set(id, { ...element, ...updates });
    }
  }
  
  deleteElement(id: string) {
    this.elements.delete(id);
  }
  
  // Presence using Yjs awareness
  updatePresence(data: { cursor?: Point; selection?: string[] }) {
    this.provider.awareness.setLocalStateField('user', {
      ...this.provider.awareness.getLocalState()?.user,
      ...data,
    });
  }
  
  getOtherUsers(): RoomUser[] {
    const states = this.provider.awareness.getStates();
    const users: RoomUser[] = [];
    
    states.forEach((state, clientId) => {
      if (clientId !== this.doc.clientID && state.user) {
        users.push(state.user);
      }
    });
    
    return users;
  }
}
```

## Optimistic Updates

```typescript
class OptimisticSync {
  private pendingOps: Operation[] = [];
  private confirmedVersion = 0;
  
  // Apply locally immediately, then sync
  applyOptimistic(operation: Operation) {
    // Apply to local state immediately
    this.applyToLocalState(operation);
    
    // Queue for server
    operation.version = this.confirmedVersion;
    this.pendingOps.push(operation);
    
    // Send to server
    this.client.sendOperation(operation);
    
    // Update UI optimistically
    this.onStateChange?.(this.getState());
  }
  
  // Server confirmed operation
  handleConfirmation(serverOp: Operation) {
    // Remove from pending
    this.pendingOps = this.pendingOps.filter(op => op.id !== serverOp.id);
    this.confirmedVersion = serverOp.version;
  }
  
  // Server rejected or transformed operation
  handleRejection(originalOp: Operation, transformedOp: Operation | null) {
    // Remove original from pending
    this.pendingOps = this.pendingOps.filter(op => op.id !== originalOp.id);
    
    // Rollback local state
    this.rollbackOperation(originalOp);
    
    // Apply transformed version if provided
    if (transformedOp) {
      this.applyToLocalState(transformedOp);
    }
    
    // Re-apply pending ops
    for (const op of this.pendingOps) {
      this.applyToLocalState(op);
    }
    
    this.onStateChange?.(this.getState());
  }
  
  // Handle remote operation
  handleRemoteOperation(op: Operation) {
    // Transform pending ops against remote op
    this.pendingOps = this.pendingOps.map(pending =>
      this.transform(pending, op)
    );
    
    // Apply remote op
    this.applyToLocalState(op);
    this.confirmedVersion = op.version;
    
    this.onStateChange?.(this.getState());
  }
}
```

## Offline Support

```typescript
class OfflineQueue {
  private queue: Operation[] = [];
  private isOnline = navigator.onLine;
  
  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Load persisted queue
    this.loadFromStorage();
  }
  
  enqueue(operation: Operation) {
    this.queue.push(operation);
    this.persistToStorage();
    
    if (this.isOnline) {
      this.flush();
    }
  }
  
  private handleOnline = async () => {
    this.isOnline = true;
    await this.flush();
  };
  
  private handleOffline = () => {
    this.isOnline = false;
  };
  
  private async flush() {
    while (this.queue.length > 0 && this.isOnline) {
      const op = this.queue[0];
      
      try {
        await this.sendOperation(op);
        this.queue.shift();
        this.persistToStorage();
      } catch (error) {
        // Network error - will retry when online
        break;
      }
    }
  }
  
  private persistToStorage() {
    localStorage.setItem('offline-queue', JSON.stringify(this.queue));
  }
  
  private loadFromStorage() {
    const stored = localStorage.getItem('offline-queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}
```

## Comments & Reactions

```typescript
interface Comment {
  id: string;
  elementId?: string;  // Attached to element
  position?: Point;    // Or floating position
  userId: string;
  content: string;
  resolved: boolean;
  reactions: Reaction[];
  replies: Comment[];
  createdAt: number;
  updatedAt: number;
}

interface Reaction {
  emoji: string;
  userIds: string[];
}

// Real-time comment updates
socket.on('comment-added', (comment: Comment) => {
  commentsStore.add(comment);
});

socket.on('comment-updated', (comment: Partial<Comment> & { id: string }) => {
  commentsStore.update(comment.id, comment);
});

socket.on('reaction-added', ({ commentId, emoji, userId }) => {
  commentsStore.addReaction(commentId, emoji, userId);
});

// Comment thread component
const CommentThread = ({ comment, elementPosition }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div
      className="absolute"
      style={{
        left: elementPosition.x + 10,
        top: elementPosition.y - 10,
      }}
    >
      {/* Comment indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
      
      {/* Thread popup */}
      {isOpen && (
        <div className="absolute left-10 top-0 w-72 bg-white rounded-lg shadow-xl border">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <Avatar user={comment.user} size="sm" />
              <span className="font-medium">{comment.user.name}</span>
              <span className="text-xs text-gray-500">
                {formatRelative(comment.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm">{comment.content}</p>
            
            {/* Reactions */}
            <div className="flex gap-1 mt-2">
              {comment.reactions.map(r => (
                <button
                  key={r.emoji}
                  className="px-2 py-1 rounded bg-gray-100 text-xs"
                  onClick={() => toggleReaction(comment.id, r.emoji)}
                >
                  {r.emoji} {r.userIds.length}
                </button>
              ))}
            </div>
          </div>
          
          {/* Replies */}
          <div className="max-h-60 overflow-y-auto p-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentReply key={reply.id} reply={reply} />
            ))}
          </div>
          
          {/* Reply input */}
          <div className="p-3 border-t">
            <input
              type="text"
              placeholder="Reply..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  addReply(comment.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

## References

- `references/websocket-patterns.md` - Advanced WebSocket patterns
- `references/sync-strategies.md` - Different sync approaches compared
- `references/scaling.md` - Scaling collaboration to many users