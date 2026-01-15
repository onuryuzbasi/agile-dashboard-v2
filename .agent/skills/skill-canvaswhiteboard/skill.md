---
name: agile-dashboard
description: "Build a simplified Jira-like Agile Dashboard web application with bidirectional Jira integration. Use when (1) Creating sprint boards, backlogs, or kanban views (2) Building issue/task management interfaces (3) Integrating with Jira REST API for two-way sync (4) Implementing agile workflows with sprints, stories, epics (5) Creating project management dashboards with drag-drop functionality"
---

# Agile Dashboard Builder

Build a simplified, modern Agile project management dashboard with full Jira bidirectional sync.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Tailwind)                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │ Board   │  │ Backlog │  │ Sprint  │  │ Issue Detail    │    │
│  │ View    │  │ View    │  │ Planning│  │ Modal           │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Backend (Node.js/Express)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ REST API     │  │ Sync Engine  │  │ Webhook Handler    │    │
│  │ /api/*       │  │              │  │ /webhooks/jira     │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌─────────────────┐           ┌─────────────────┐
│  Local Database │           │   Jira Cloud    │
│  (SQLite/Postgres)│         │   REST API v3   │
└─────────────────┘           └─────────────────┘
```

## Core Features to Implement

### 1. Board Views
- **Kanban Board**: Drag-drop columns (To Do, In Progress, Review, Done)
- **Sprint Board**: Active sprint with swimlanes by assignee
- **Backlog View**: Prioritized list with drag-to-reorder

### 2. Issue Management
- Create/edit/delete issues with fields: title, description, type, priority, assignee, story points, labels
- Issue types: Epic, Story, Task, Bug, Subtask
- Priority levels: Highest, High, Medium, Low, Lowest
- Status workflow: customizable per project

### 3. Sprint Management
- Create/start/complete sprints
- Sprint planning: drag issues from backlog to sprint
- Sprint burndown chart
- Velocity tracking

## Data Models

```typescript
interface Project {
  id: string;
  key: string;           // e.g., "PROJ"
  name: string;
  jiraProjectId?: string;
}

interface Issue {
  id: string;
  key: string;           // e.g., "PROJ-123"
  projectId: string;
  type: 'epic' | 'story' | 'task' | 'bug' | 'subtask';
  status: string;
  priority: 'highest' | 'high' | 'medium' | 'low' | 'lowest';
  summary: string;
  description?: string;
  assigneeId?: string;
  reporterId: string;
  sprintId?: string;
  epicId?: string;
  storyPoints?: number;
  labels: string[];
  jiraIssueId?: string;
  jiraSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  state: 'future' | 'active' | 'closed';
  jiraSprintId?: string;
}
```

## Jira Two-Way Sync Strategy

### Dashboard → Jira (Push)
1. On local create/update → Queue sync job
2. Map local fields to Jira fields (see `references/field-mapping.md`)
3. POST/PUT to Jira REST API
4. Store `jiraIssueId` on success
5. Handle conflicts with resolution strategy

### Jira → Dashboard (Pull via Webhook)
1. Register Jira webhook for issue/sprint events
2. On webhook receive → Validate signature
3. Map Jira fields to local fields
4. Upsert local issue by `jiraIssueId`
5. Update `jiraSyncedAt` timestamp

### Key Jira API Endpoints

```
# Issues
GET    /rest/api/3/issue/{issueIdOrKey}
POST   /rest/api/3/issue
PUT    /rest/api/3/issue/{issueIdOrKey}
DELETE /rest/api/3/issue/{issueIdOrKey}
POST   /rest/api/3/issue/{issueIdOrKey}/transitions

# Sprints (Agile API)
GET    /rest/agile/1.0/board/{boardId}/sprint
POST   /rest/agile/1.0/sprint
POST   /rest/agile/1.0/sprint/{sprintId}/issue

# Webhooks
POST   /rest/webhooks/1.0/webhook
```

## Frontend Implementation

### Tech Stack
- React 18+ with hooks
- Tailwind CSS for styling
- @dnd-kit/core for drag-and-drop
- React Query for data fetching
- Zustand for state management

### Board Component Pattern

```jsx
<DndContext onDragEnd={handleDragEnd}>
  <div className="flex gap-4 p-4 overflow-x-auto">
    {columns.map(column => (
      <DroppableColumn key={column.id} column={column}>
        {issues
          .filter(i => i.status === column.status)
          .map(issue => (
            <DraggableIssueCard key={issue.id} issue={issue} />
          ))}
      </DroppableColumn>
    ))}
  </div>
</DndContext>
```

## Implementation Phases

### Phase 1: Core Dashboard
1. Set up React project with Tailwind
2. Implement data models and local storage
3. Build Kanban board with drag-drop
4. Create issue CRUD operations
5. Add sprint management

### Phase 2: Jira Integration
1. Set up backend Express server
2. Implement Jira API client
3. Create sync service (push)
4. Set up webhook endpoint (pull)
5. Add conflict resolution UI

### Phase 3: Polish
1. Real-time updates (WebSocket)
2. Offline support with sync queue
3. Sprint reports and charts

## Environment Variables

```env
DATABASE_URL=sqlite:./data/agile.db
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
WEBHOOK_BASE_URL=https://your-app.com
WEBHOOK_SECRET=random-secret
```

## API Routes

```
# Local API
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id/board
GET    /api/issues
POST   /api/issues
PATCH  /api/issues/:id
POST   /api/issues/:id/transition
GET    /api/sprints
POST   /api/sprints
POST   /api/sprints/:id/start

# Sync
POST   /api/sync/push/:issueId
POST   /api/sync/pull/:jiraIssueKey
POST   /api/sync/full

# Webhooks
POST   /webhooks/jira
```

## References

- `references/jira-api.md` - Complete Jira REST API documentation
- `references/field-mapping.md` - Jira ↔ Dashboard field mappings
- `references/webhook-events.md` - Jira webhook event types