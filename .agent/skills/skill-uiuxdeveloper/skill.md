---
name: ui-ux-developer
description: "Frontend development expertise for implementing high-quality UI/UX designs. Use when (1) Building React/Vue/HTML components from designs (2) Implementing responsive layouts and CSS architecture (3) Creating smooth animations and micro-interactions (4) Building accessible, WCAG-compliant interfaces (5) Optimizing frontend performance and Core Web Vitals (6) Implementing design systems and component libraries"
---

# UI/UX Developer Skill

Guide for implementing polished, performant, and accessible user interfaces.

## Component Architecture

### React Component Structure

```
components/
├── ui/                    # Primitive components
│   ├── Button/
│   │   ├── Button.jsx
│   │   ├── Button.test.jsx
│   │   └── index.js
│   ├── Input/
│   ├── Card/
│   └── Modal/
├── patterns/              # Composite components
│   ├── SearchBar/
│   ├── DataTable/
│   └── FormField/
├── layouts/               # Page layouts
│   ├── DashboardLayout/
│   ├── AuthLayout/
│   └── PageHeader/
└── features/              # Feature-specific
    ├── UserProfile/
    ├── ProjectBoard/
    └── Settings/
```

### Component Design Principles

```jsx
// 1. Single Responsibility
// BAD: Component does too much
const UserCard = ({ user, onEdit, onDelete, showStats, allowChat }) => {...}

// GOOD: Compose smaller components
const UserCard = ({ user, children }) => (
  <Card>
    <UserAvatar user={user} />
    <UserInfo user={user} />
    {children}
  </Card>
);

// 2. Composition over Props
// Usage with composition
<UserCard user={user}>
  <UserStats />
  <UserActions onEdit={...} onDelete={...} />
</UserCard>

// 3. Controlled vs Uncontrolled
// Controlled: Parent manages state
<Input value={value} onChange={setValue} />

// Uncontrolled: Component manages state
<Input defaultValue="initial" ref={inputRef} />
```

### Props API Design

```jsx
// Consistent prop naming
interface ButtonProps {
  // Content
  children: React.ReactNode;
  
  // Variants (use enums, not booleans)
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  
  // States
  isLoading?: boolean;
  isDisabled?: boolean;
  
  // Icons (flexible positioning)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Events (consistent naming)
  onClick?: (e: MouseEvent) => void;
  
  // HTML passthrough
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

## CSS Architecture

### Tailwind Best Practices

```jsx
// 1. Use component classes for complex patterns
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      // Custom utilities
    }
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        '.btn-base': {
          '@apply inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
      });
    }),
  ],
};

// 2. Extract repeated patterns with @apply
// styles/components.css
@layer components {
  .card {
    @apply bg-white rounded-lg shadow-md p-4;
  }
  
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg 
           focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  }
}

// 3. Use CSS variables for theming
:root {
  --color-primary: theme('colors.blue.600');
  --color-primary-hover: theme('colors.blue.700');
}

.dark {
  --color-primary: theme('colors.blue.400');
  --color-primary-hover: theme('colors.blue.300');
}
```

### Responsive Patterns

```jsx
// Mobile-first approach
<div className="
  px-4           /* Mobile: 16px padding */
  sm:px-6        /* ≥640px: 24px padding */
  lg:px-8        /* ≥1024px: 32px padding */
  
  grid
  grid-cols-1    /* Mobile: single column */
  md:grid-cols-2 /* ≥768px: two columns */
  lg:grid-cols-3 /* ≥1024px: three columns */
  gap-4
  md:gap-6
">

// Container queries (modern)
<div className="@container">
  <div className="@md:flex @md:gap-4">
    {/* Responds to container, not viewport */}
  </div>
</div>
```

### CSS Grid Layouts

```jsx
// Dashboard layout
<div className="
  grid
  grid-cols-[auto_1fr]     /* Sidebar + content */
  grid-rows-[auto_1fr]     /* Header + body */
  min-h-screen
">
  <header className="col-span-2">...</header>
  <aside className="w-64">...</aside>
  <main className="overflow-auto">...</main>
</div>

// Card grid with auto-fill
<div className="
  grid
  grid-cols-[repeat(auto-fill,minmax(280px,1fr))]
  gap-4
">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>
```

## Animation & Transitions

### CSS Transitions

```jsx
// Button hover/focus states
<button className="
  bg-blue-600 
  hover:bg-blue-700 
  active:bg-blue-800
  transition-colors 
  duration-150 
  ease-in-out
  
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:ring-offset-2
">

// Scale on hover (cards)
<div className="
  transition-transform 
  duration-200 
  hover:scale-[1.02]
  hover:shadow-lg
">
```

### Framer Motion Patterns

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Fade in on mount
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>

// List animations
<motion.ul>
  <AnimatePresence>
    {items.map(item => (
      <motion.li
        key={item.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        layout // Smooth reordering
      >
        {item.name}
      </motion.li>
    ))}
  </AnimatePresence>
</motion.ul>

// Modal animation
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Skeleton Loading

```jsx
// Skeleton component
const Skeleton = ({ className }) => (
  <div 
    className={`
      animate-pulse 
      bg-gray-200 
      rounded 
      ${className}
    `} 
  />
);

// Usage
const CardSkeleton = () => (
  <div className="p-4 border rounded-lg">
    <Skeleton className="h-40 w-full mb-4" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

// Content loading pattern
{isLoading ? (
  <div className="grid grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
  </div>
) : (
  <div className="grid grid-cols-3 gap-4">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
)}
```

## Accessibility Implementation

### Focus Management

```jsx
// Focus trap for modals
import { FocusTrap } from '@headlessui/react';

<FocusTrap>
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">Modal Title</h2>
    {/* Focus stays inside until closed */}
  </div>
</FocusTrap>

// Return focus after close
const Modal = ({ isOpen, onClose }) => {
  const triggerRef = useRef(null);
  
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen]);
  
  return <button ref={triggerRef}>Open Modal</button>;
};

// Skip link
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:p-2 focus:rounded"
>
  Skip to main content
</a>
```

### Screen Reader Support

```jsx
// Live regions for dynamic content
const Toast = ({ message }) => (
  <div 
    role="alert" 
    aria-live="polite"
    aria-atomic="true"
    className="toast"
  >
    {message}
  </div>
);

// Visually hidden but accessible
<span className="sr-only">
  {unreadCount} unread notifications
</span>

// Accessible icon buttons
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>

// Accessible loading state
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? (
    <>
      <Spinner aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </>
  ) : (
    'Submit'
  )}
</button>
```

### Form Accessibility

```jsx
const FormField = ({ label, error, hint, id, children }) => {
  const inputId = id || useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      {React.cloneElement(children, {
        id: inputId,
        'aria-describedby': [
          hint && hintId,
          error && errorId
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
      })}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
```

## Performance Optimization

### React Performance

```jsx
// 1. Memoize expensive components
const ExpensiveList = memo(({ items }) => (
  items.map(item => <ExpensiveItem key={item.id} {...item} />)
));

// 2. Use useMemo for expensive calculations
const sortedItems = useMemo(() => 
  [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// 3. useCallback for stable references
const handleClick = useCallback((id) => {
  setSelected(id);
}, []);

// 4. Virtualize long lists
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Image Optimization

```jsx
// Next.js Image
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Above the fold
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// Lazy loading with native HTML
<img
  src="image.jpg"
  alt="Description"
  loading="lazy"
  decoding="async"
/>

// Responsive images
<picture>
  <source media="(min-width: 1024px)" srcSet="large.webp" type="image/webp" />
  <source media="(min-width: 768px)" srcSet="medium.webp" type="image/webp" />
  <img src="small.jpg" alt="Responsive image" loading="lazy" />
</picture>
```

### Core Web Vitals

```jsx
// LCP: Largest Contentful Paint
// - Preload critical images
<link rel="preload" as="image" href="/hero.webp" />
// - Use priority loading for above-fold images
// - Avoid lazy-loading LCP elements

// FID/INP: Input Delay / Interaction to Next Paint
// - Keep JavaScript bundles small
// - Defer non-critical scripts
// - Use web workers for heavy computation

// CLS: Cumulative Layout Shift
// - Always set dimensions on images/videos
<img src="..." width={400} height={300} alt="..." />

// - Reserve space for dynamic content
<div className="min-h-[200px]">
  {isLoading ? <Skeleton /> : <Content />}
</div>

// - Use transform instead of top/left for animations
// BAD: causes layout shift
.animate { top: 0; transition: top 0.3s; }
.animate:hover { top: -10px; }

// GOOD: no layout shift
.animate { transform: translateY(0); transition: transform 0.3s; }
.animate:hover { transform: translateY(-10px); }
```

## Drag and Drop

### @dnd-kit Implementation

```jsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable item
const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// Sortable list
const SortableList = ({ items, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={item.id}>
            {item.content}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
};
```

## Dark Mode

```jsx
// Tailwind dark mode setup
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
};

// Theme toggle hook
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });
  
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  return [theme, setTheme];
};

// Component with dark mode
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border-gray-200 dark:border-gray-700
">
```

## References

- `references/component-patterns.md` - Common component implementation patterns
- `references/animation-recipes.md` - Ready-to-use animation code
- `references/testing-guide.md` - Component testing strategies