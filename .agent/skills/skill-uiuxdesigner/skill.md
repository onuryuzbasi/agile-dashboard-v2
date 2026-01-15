---
name: ui-ux-designer
description: "UI/UX design expertise for creating user-centered digital products. Use when (1) Conducting user research and creating personas (2) Designing wireframes, mockups, and prototypes (3) Creating design systems and component libraries (4) Applying visual design principles like color theory, typography, and layout (5) Improving usability and user flows (6) Designing for accessibility and inclusivity"
---

# UI/UX Designer Skill

Guide for creating exceptional user experiences through research-driven design.

## Design Process Overview

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Discover   │──▶│   Define    │──▶│   Design    │──▶│  Deliver    │──▶│   Iterate   │
│  (Research) │   │  (Problem)  │   │ (Solutions) │   │  (Handoff)  │   │ (Feedback)  │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

## 1. User Research

### Research Methods

| Method | When to Use | Output |
|--------|-------------|--------|
| User Interviews | Understanding motivations, pain points | Insights, quotes |
| Surveys | Quantitative validation at scale | Statistics, trends |
| Usability Testing | Validating designs with real users | Task success rates |
| Card Sorting | Information architecture decisions | Category groupings |
| Competitive Analysis | Understanding market landscape | Feature matrix |
| Analytics Review | Identifying behavior patterns | Drop-off points |

### User Persona Template

```markdown
## Persona: [Name]

**Demographics:** Age, occupation, location, tech proficiency
**Goals:** What they want to achieve
**Frustrations:** Current pain points
**Behaviors:** How they currently solve the problem
**Quote:** A representative statement

**Scenario:** A day-in-the-life story showing context of use
```

### Empathy Map

```
         SAYS                    THINKS
    ┌─────────────┐         ┌─────────────┐
    │ Quotes and  │         │ Beliefs,    │
    │ statements  │         │ concerns    │
    └─────────────┘         └─────────────┘
              \                 /
               \   ┌───────┐   /
                ──▶│ USER  │◀──
               /   └───────┘   \
              /                 \
    ┌─────────────┐         ┌─────────────┐
    │ Actions,    │         │ Emotions,   │
    │ behaviors   │         │ feelings    │
    └─────────────┘         └─────────────┘
         DOES                    FEELS
```

## 2. Information Architecture

### User Flow Principles

- **Entry points:** Where users begin (homepage, deep link, notification)
- **Decision points:** Where users make choices
- **Exit points:** Task completion or abandonment
- **Error states:** What happens when things go wrong

### Navigation Patterns

| Pattern | Best For | Example |
|---------|----------|---------|
| Tab Bar | 3-5 primary destinations | Mobile apps |
| Sidebar | Complex apps with hierarchy | Dashboards |
| Hamburger | Secondary navigation | Mobile web |
| Breadcrumbs | Deep hierarchies | E-commerce |
| Search | Large content libraries | Documentation |

### Content Hierarchy

```
1. Primary Action    → Most prominent, one per screen
2. Secondary Actions → Supporting tasks, less emphasis  
3. Tertiary Actions  → Rarely used, often in menus
```

## 3. Visual Design Principles

### Color Theory

**60-30-10 Rule:**
- 60% Primary/neutral (backgrounds, large areas)
- 30% Secondary (cards, sections, supporting elements)
- 10% Accent (CTAs, highlights, interactive elements)

**Semantic Colors:**
```
Success  → Green  (#22C55E) - Confirmations, completed states
Warning  → Amber  (#F59E0B) - Caution, pending states
Error    → Red    (#EF4444) - Errors, destructive actions
Info     → Blue   (#3B82F6) - Information, links
```

**Contrast Requirements (WCAG):**
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Typography Scale

```
Display:   48-72px  → Hero sections, marketing
H1:        32-40px  → Page titles
H2:        24-28px  → Section headers
H3:        20-22px  → Subsection headers
Body:      16px     → Default reading text
Small:     14px     → Secondary text, captions
Micro:     12px     → Labels, timestamps
```

**Line Height Guidelines:**
- Headings: 1.2-1.3
- Body text: 1.5-1.6
- UI elements: 1.2

### Spacing System (8px Grid)

```
4px   → Micro spacing (icon padding)
8px   → Tight spacing (related elements)
16px  → Default spacing (between elements)
24px  → Comfortable spacing (between groups)
32px  → Loose spacing (between sections)
48px  → Section breaks
64px+ → Major divisions
```

### Layout Principles

**Visual Hierarchy Techniques:**
1. Size - Larger = more important
2. Color - Contrast draws attention
3. Position - Top-left scans first (F-pattern)
4. Whitespace - Isolation creates focus
5. Typography - Weight and style differentiation

**Alignment:**
- Left-align body text (easier to read)
- Center sparingly (short headings, CTAs)
- Use consistent grid (12-column common)

## 4. Component Design

### Button Hierarchy

```jsx
// Primary - Main action, one per section
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
  Save Changes
</button>

// Secondary - Supporting actions
<button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg">
  Cancel
</button>

// Tertiary/Ghost - Least emphasis
<button className="text-blue-600 hover:underline">
  Learn more
</button>

// Destructive - Dangerous actions
<button className="bg-red-600 text-white px-4 py-2 rounded-lg">
  Delete Account
</button>
```

### Form Design Best Practices

1. **Labels:** Always visible, above input (not placeholder-only)
2. **Placeholder:** Example format, not instructions
3. **Validation:** Inline, real-time when possible
4. **Error messages:** Specific, actionable ("Enter a valid email" not "Invalid")
5. **Required fields:** Mark optional fields instead (fewer markers)
6. **Grouping:** Related fields together with visual separation

### Card Design

```
┌────────────────────────────────────┐
│  [Image/Icon]                      │  ← Visual anchor
│                                    │
│  Title                             │  ← Primary info
│  Subtitle or metadata              │  ← Secondary info
│                                    │
│  Description text that can span    │  ← Supporting content
│  multiple lines if needed...       │
│                                    │
│  [Action Button]    [Secondary]    │  ← Actions at bottom
└────────────────────────────────────┘
```

## 5. Interaction Design

### Feedback Principles

| User Action | System Feedback | Timing |
|-------------|-----------------|--------|
| Click/Tap | Visual state change | Immediate (<100ms) |
| Form submit | Loading indicator | Immediate |
| Async operation | Progress indicator | If >1 second |
| Success | Confirmation message | On completion |
| Error | Error message + guidance | On detection |

### Microinteractions

```
Trigger → Rules → Feedback → Loops/Modes

Example: Like button
- Trigger: User taps heart icon
- Rules: Toggle liked state, increment count
- Feedback: Heart fills with color, count animates
- Loops: None (one-time action)
```

### Loading States

```
Skeleton screens  → Content-heavy pages (preferred)
Spinners          → Short operations (<3 seconds)
Progress bars     → Known duration operations
Optimistic UI     → High-confidence operations
```

## 6. Accessibility (a11y)

### WCAG 2.1 Checklist

**Perceivable:**
- [ ] Color is not the only means of conveying information
- [ ] Text has sufficient contrast (4.5:1)
- [ ] Images have alt text
- [ ] Videos have captions

**Operable:**
- [ ] All functionality available via keyboard
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Touch targets ≥44x44px

**Understandable:**
- [ ] Language is declared
- [ ] Navigation is consistent
- [ ] Error messages are clear
- [ ] Labels are associated with inputs

**Robust:**
- [ ] Valid HTML structure
- [ ] ARIA used correctly
- [ ] Works with assistive tech

### Focus Management

```
Tab order: Left-to-right, top-to-bottom (logical flow)
Focus trap: Keep focus inside modals until dismissed
Skip links: Allow skipping to main content
Focus restoration: Return focus after modal closes
```

## 7. Design Handoff

### Specification Checklist

- [ ] All states documented (default, hover, active, disabled, error)
- [ ] Responsive breakpoints defined
- [ ] Spacing values specified (use design tokens)
- [ ] Color values with accessibility notes
- [ ] Typography specs (font, size, weight, line-height)
- [ ] Animation timing and easing
- [ ] Edge cases and error states
- [ ] Empty states designed

### Design Tokens Format

```json
{
  "colors": {
    "primary": { "value": "#3B82F6", "description": "Primary brand blue" },
    "primary-hover": { "value": "#2563EB" },
    "text-primary": { "value": "#111827" },
    "text-secondary": { "value": "#6B7280" }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  },
  "typography": {
    "heading-1": {
      "fontSize": "32px",
      "fontWeight": "700",
      "lineHeight": "1.2"
    }
  }
}
```

## 8. Design System Structure

```
design-system/
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   ├── grid.md
│   └── icons.md
├── components/
│   ├── buttons.md
│   ├── forms.md
│   ├── cards.md
│   ├── navigation.md
│   └── modals.md
├── patterns/
│   ├── authentication.md
│   ├── data-tables.md
│   ├── empty-states.md
│   └── error-handling.md
└── templates/
    ├── dashboard.md
    ├── settings.md
    └── onboarding.md
```

## References

- `references/design-patterns.md` - Common UI patterns and when to use them
- `references/accessibility-guide.md` - Detailed WCAG implementation guide
- `references/design-tokens.md` - Token naming conventions and structure