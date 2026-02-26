# Feature Landscape: @glimmora/ui Design System + 5 Portal Frontends

**Domain:** Premium SaaS design system (Radix UI + Tailwind CSS + Framer Motion)
**Researched:** 2026-02-26
**Confidence:** MEDIUM (Radix UI and Tailwind knowledge from training data through May 2025; not verified against latest docs due to tool restrictions)

---

## How This Document Is Organized

This document maps every component the design system needs, categorized by:

1. **Table Stakes** -- Components without which the platform cannot function
2. **Differentiators** -- Components that elevate GlimmoraTeam above generic SaaS
3. **Anti-Features** -- Patterns to explicitly NOT build
4. **Complexity Estimates** -- Implementation effort per component area
5. **Radix Primitive Mapping** -- Which Radix primitive underlies each component
6. **Portal Dependency Map** -- Which portals need which components

---

## 1. Table Stakes Components

Components users expect from a premium SaaS platform. Missing any of these makes the product feel broken or amateurish.

### 1.1 Foundation Layer (Design Tokens + Primitives)

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **Color Token System** | Consistent theming across 5 portals; earthy palette (#A0614A terracotta primary) with per-portal accent variations | Medium | None (Tailwind config) | Must support gradient tokens for KPI cards and timeline bars. Define semantic tokens (surface, muted, accent, destructive, success, warning) not just color names. Portal theme switching via CSS custom properties. |
| **Typography Scale** | Readable hierarchy across dashboard-dense and onboarding-sparse layouts | Low | None (Tailwind config) | Use Tailwind `fontSize` extend. Need: display (KPI numbers), heading (h1-h4), body (default, small), caption, overline, code. Recommend Inter or similar variable-weight font. |
| **Spacing + Layout Tokens** | Consistent density. Dashboard views need tighter spacing than onboarding flows | Low | None (Tailwind config) | Extend Tailwind spacing scale. Define "compact" (dashboards, tables) vs "comfortable" (onboarding, forms) density modes. |
| **Icon System** | Every nav item, status, action needs an icon | Low | None | Use Lucide React (MIT, tree-shakeable, 1000+ icons, consistent 24px grid). Do NOT use multiple icon libraries. Single source. |
| **Focus Ring / Outline System** | Keyboard navigation must be visible and beautiful (accessibility law) | Low | All Radix primitives handle focus management | Tailwind `ring` utilities. Terracotta focus ring for primary actions, neutral for secondary. |

### 1.2 Core Interactive Components

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **Button** | Every action on the platform | Low | None (custom, but use Radix `Slot` for `asChild` pattern) | Variants: primary (terracotta fill), secondary (outline), ghost, destructive, icon-only. Sizes: sm/md/lg. States: default, hover, active, disabled, loading (spinner). |
| **Input / TextField** | Every form (onboarding, SOW upload, review, settings) | Low | None (custom) | Variants: default, error, disabled. Must support: label, helper text, error message, character count, prefix/suffix icons. |
| **Textarea** | Review feedback (100+ word requirement), SOW text input, community posts | Low | None (custom) | Auto-resize, character count, word count (mentor rejection requires min 100 words). |
| **Select / Dropdown** | Language selection (FIRST interactive element), role filters, domain filters | Medium | `@radix-ui/react-select` | Searchable variant needed for domain taxonomy (mentors select from 50+ skill tags). Must support grouped options. |
| **Checkbox** | Consent forms (section-by-section), submission checklists, criteria evaluation | Low | `@radix-ui/react-checkbox` | Indeterminate state needed for "select all" in tables. |
| **Radio Group** | Review decisions (Approve/Rework/Reject), onboarding choices | Low | `@radix-ui/react-radio-group` | Card-style radio for major decisions (review outcome). |
| **Switch / Toggle** | Notification preferences, availability toggle (mentor), feature flags | Low | `@radix-ui/react-switch` | |
| **Dialog / Modal** | Confirmations (role switch, payment release, task accept/decline), alerts | Medium | `@radix-ui/react-dialog` | Must support: standard, destructive confirmation, full-screen (mobile). Nested dialogs NOT needed (anti-pattern). |
| **Tooltip** | Information density requires explanatory tooltips everywhere | Low | `@radix-ui/react-tooltip` | Delay: 300ms show, instant hide. Max width 280px. |
| **Popover** | Filter panels, quick actions, user menu | Medium | `@radix-ui/react-popover` | |
| **Tabs** | Evidence viewer (Code/Document/Link/Video), review queue (Pending/In Progress/Completed), task lists | Medium | `@radix-ui/react-tabs` | Must support: icon + text tab labels, badge counts on tabs, animated underline indicator. |
| **Accordion** | FAQ pages, consent sections, settings groups | Low | `@radix-ui/react-accordion` | Multi-expand for FAQ, single-expand for settings. |
| **Avatar** | User representation (initials-only -- NO photos for contributors due to privacy) | Low | `@radix-ui/react-avatar` | Initials-based with earthy color assignment algorithm. NEVER show photos for contributors. Mentors: optional photo. Enterprise: company logo. |
| **Badge / Tag** | Status indicators, skill tags, domain labels, urgency markers | Low | None (custom) | 5 status types with earthy colors: Active (terracotta), Pending (amber/sand), Completed (sage green), At Risk (burnt orange), Blocked (muted red). Also: skill domain tags, evidence type tags. |
| **Toast / Notification** | Action confirmations, real-time updates, error messages | Medium | `@radix-ui/react-toast` | Position: bottom-right. Stack limit: 3. Auto-dismiss: 5s for success, persistent for errors. |
| **Dropdown Menu** | Row actions in tables, more-options menus | Medium | `@radix-ui/react-dropdown-menu` | Support: icons, keyboard shortcuts, dividers, destructive items. |
| **Context Menu** | Optional -- right-click on table rows, kanban cards | Low | `@radix-ui/react-context-menu` | Nice-to-have, not critical for MVP. |
| **Alert Dialog** | Destructive confirmations (delete account, reject submission, lock blueprint) | Low | `@radix-ui/react-alert-dialog` | Requires explicit action -- no accidental dismissal. |
| **Separator** | Visual section breaks in dense layouts | Low | `@radix-ui/react-separator` | |
| **Label** | Form accessibility | Low | `@radix-ui/react-label` | |
| **Scroll Area** | Custom scrollbars for panels, evidence viewer, long lists | Medium | `@radix-ui/react-scroll-area` | Needed for: slide-out panels, evidence viewer center pane, kanban columns. |
| **Progress** | Upload progress, task completion, verification status | Low | `@radix-ui/react-progress` | Linear variant for uploads/processing. |
| **Slider** | Optional -- capacity settings (mentor reviews per week) | Low | `@radix-ui/react-slider` | |

### 1.3 Layout Components

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **AppShell** | Consistent layout wrapper per portal (sidebar nav + header + content area) | Medium | None (custom) | Must support: collapsible sidebar, mobile drawer nav, role-indicator header color, breadcrumbs area. 5 portal variants share same shell with portal-specific theming. |
| **Sidebar Navigation** | Primary navigation for all portals | Medium | `@radix-ui/react-navigation-menu` (partial) | Collapsible, icon-only collapsed state, active indicator, section dividers, notification badges on nav items. Build custom -- Radix NavigationMenu is better for top-bar menus. |
| **Header Bar** | Global header: role badge, portal name, notifications, user menu, role switcher | Medium | None (custom) | Portal color theming (purple = Women, blue = University, green = Enterprise, orange = Mentor, red = Admin). Role switcher dropdown. |
| **Breadcrumbs** | Deep navigation paths (SOW > Project > Milestone > Evidence Pack) | Low | None (custom) | Truncation for mobile. Max 4 levels visible. |
| **Page Header** | Consistent page title + actions bar | Low | None (custom) | Title, subtitle/description, primary action button(s), back button. |
| **Card** | Universal container (KPI cards, task cards, project cards, review cards) | Low | None (custom) | Variants: default (bordered), elevated (shadow), gradient (KPI), interactive (hover state). Consistent padding, border-radius. |
| **EmptyState** | Every list/queue needs a "nothing here yet" state | Low | None (custom) | Illustration + message + CTA. Per-context: "No tasks yet", "No reviews pending", etc. |
| **LoadingState / Skeleton** | Every data-dependent view needs a loading skeleton | Medium | None (custom, Framer Motion for shimmer) | Skeleton variants that mirror actual content shape (card skeleton, table row skeleton, chart skeleton). Framer Motion shimmer animation. |
| **ErrorState** | API failures, permission errors, 404s | Low | None (custom) | Variants: inline error, full-page error, retry-able error. |

### 1.4 Data Display Components

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **DataTable** | User management, payment history, audit logs, evidence packs, completed reviews | High | None (custom, use TanStack Table v8 as headless engine) | Features: sorting, filtering, pagination, column visibility toggle, row selection, row actions dropdown, responsive (card view on mobile). Dense variant for admin, comfortable for contributor views. |
| **Pagination** | All table views | Low | None (custom) | Page numbers + prev/next. Show total count. |
| **EmptyTable** | When filters return no results | Low | None (custom) | "No results match your filters" with clear-filters action. |
| **DescriptionList / KeyValue** | Detail views (project overview, user detail, credential detail) | Low | None (custom) | Horizontal (label: value) and vertical (label above value) variants. |
| **Timeline / Activity Feed** | Dashboard activity feeds, task status history, rework cycles | Medium | None (custom) | Vertical timeline with: timestamp, actor (role label, not name), action, optional detail expand. |
| **Stat / KPI Card** | Every dashboard: active projects, earnings, reviews pending, etc. | Medium | None (custom) | Title, value (large number), trend indicator (up/down arrow + percentage), sparkline (optional). Gradient background variant for hero stats. |

### 1.5 Form Components

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **Form Wrapper** | All forms need consistent validation, error display, submission handling | Medium | None (custom, use React Hook Form + Zod) | Consistent error positioning, field-level and form-level errors, loading state on submit. |
| **FileUpload** | SOW upload (PDF/DOCX), ID verification, evidence submission, credential documents | High | None (custom) | Drag-and-drop zone, file type validation, size limit display, upload progress bar, preview (PDF thumbnail, image preview). Multi-file support for evidence submission. |
| **DatePicker** | Milestone dates, payment date ranges, report filters | Medium | `@radix-ui/react-popover` (as container) | Use a date picker library that outputs to Radix Popover container. Consider react-day-picker for the calendar grid. Range selection for reports. |
| **Combobox / Autocomplete** | Skill tag selection (50+ options), institution search, domain filter | Medium | `@radix-ui/react-popover` + custom | Searchable, multi-select variant for skill tags. Creatable variant NOT needed (controlled taxonomy). |
| **MultiSelect** | Mentor domain selection, skill tag multi-select | Medium | Custom (Radix Popover-based) | Tag-style display of selected items, removable tags, search within options. |
| **RichTextEditor** | Mentor review feedback, community posts, rework guidance | High | None (use Tiptap with custom toolbar) | Markdown output. Toolbar: bold, italic, lists, code inline, code block, links. NO image embedding in text (separate upload). Keep it simple -- not a word processor. |
| **CodeEditor / Viewer** | Evidence submission (code snippets), evidence review (code tab) | High | None (use CodeMirror 6 or Monaco -- recommend CodeMirror for lighter weight) | Read-only mode for evidence viewer, editable for submission. Syntax highlighting for common languages. Line numbers. |

### 1.6 Navigation Components

| Component | Why Expected | Complexity | Radix Primitive | Notes |
|-----------|-------------|------------|-----------------|-------|
| **Stepper** | Onboarding flows (Women: 7 steps, Enterprise: 4 steps, Student: 5 steps, Mentor: 4 steps) | Medium | None (custom) | Horizontal on desktop, vertical on mobile. States: completed (checkmark), active (filled), upcoming (outline), skipped (dashed). Step labels. Must allow "go back" to completed steps. |
| **CommandPalette** | Power-user navigation (Cmd+K) across any portal | Medium | `@radix-ui/react-dialog` (as container) | Search across: pages, projects, tasks, settings. Keyboard-driven. Grouped results. Nice premium touch but not MVP-critical. |
| **NotificationCenter** | Bell icon dropdown: task updates, payment updates, mentor messages | Medium | `@radix-ui/react-popover` | Unread count badge, mark-as-read, grouped by type, "view all" link to full notifications page. |

---

## 2. Differentiator Components

Components that elevate GlimmoraTeam to Linear/Height/Notion-level polish. Not expected from a generic SaaS tool, but these are what make the product feel premium and purpose-built.

### 2.1 Governance-Specific Components

| Component | Value Proposition | Complexity | Radix Primitive | Notes |
|-----------|-------------------|------------|-----------------|-------|
| **3-Panel Review Layout** | The mentor review experience is the governance heart of the platform. Left (task context + criteria) + Center (evidence viewer) + Right (review form) is a purpose-built layout no generic component provides. | High | `@radix-ui/react-tabs` (evidence tabs), `@radix-ui/react-scroll-area` (each panel), `@radix-ui/react-separator` | Resizable panels via drag handles. Collapsible left panel. Sticky right-panel header with decision buttons. This is the single most important custom component -- mentors spend 80% of their time here. |
| **Evidence Viewer** | Multi-type evidence display (code, document, link, video) in a single tabbed viewer. Blind review: shows evidence but hides contributor identity. | High | `@radix-ui/react-tabs` (type tabs) | Tabs: Code (syntax-highlighted, line numbers), Document (PDF inline viewer), Link (URL with preview card), Video (embedded player). Each tab type is a distinct sub-component. Download button per item. The viewer must NEVER show contributor name or personal info. |
| **Criteria Evaluation Grid** | Per-criterion assessment (Met / Partially Met / Not Met) with inline comments. No existing component library provides this. | Medium | `@radix-ui/react-radio-group` (per criterion row) | Each acceptance criterion displayed as a row with: criterion text, 3-state radio (Met/Partial/Not Met), optional comment field. Summary at bottom: X/Y criteria met. This drives the review decision. |
| **SOW Blueprint Editor** | 4-panel layout: Original SOW (left) + AI interpretation (center-left) + Diff view (center-right) + Questions/Actions (right). Enterprise trust fulcrum. | Very High | `@radix-ui/react-scroll-area`, custom | Diff-style highlighting (additions in green, AI interpretations in blue, flagged ambiguities in amber). Version history timeline. "Approve & Lock" action with confirmation. This is the highest-complexity single screen. |
| **Blueprint Decomposition Preview** | Visual display of how a SOW breaks into milestones and tasks. Tree/hierarchy view. | High | `@radix-ui/react-accordion` (for expandable tree nodes) | Shows: SOW > Milestones > Tasks with estimated effort, skill requirements, and acceptance criteria at each level. Expandable/collapsible tree. |

### 2.2 Timeline and Project Tracking

| Component | Value Proposition | Complexity | Radix Primitive | Notes |
|-----------|-------------------|------------|-----------------|-------|
| **Milestone Timeline** | Horizontal Gantt-style timeline with gradient milestone bars, date ruler, status colors. Enterprise project dashboards need this to replace status-check emails. | Very High | `@radix-ui/react-tooltip` (hover details), `@radix-ui/react-popover` (click details) | Gradient bars using earthy palette. Status overlay: on-track (sage), at-risk (amber), blocked (red), completed (filled terracotta). Today marker. Zoom levels: week/month/quarter. Scroll horizontally. Dependencies as connecting lines (phase 2 -- defer initially). |
| **Kanban Board** | Task management view: columns per status (Available, Active, Submitted, In Review, Completed). Cards with status-colored left border. | High | `@radix-ui/react-scroll-area` (horizontal scroll), custom DnD | Columns: configurable per portal. Cards: task title, domain tags, due date, priority badge. Drag-and-drop between columns (use @dnd-kit -- NOT react-beautiful-dnd which is deprecated). Column headers with count badges. Swim lanes optional (phase 2). |
| **Progress Ring** | Circular progress indicator for KPI display. Animates on load. | Medium | None (SVG custom + Framer Motion) | Used in: project completion %, AI Readiness Score, deployment rate. Animated fill with Framer Motion. Center text (percentage). Earthy gradient fill option. |

### 2.3 Data Visualization

| Component | Value Proposition | Complexity | Radix Primitive | Notes |
|-----------|-------------------|------------|-----------------|-------|
| **Sparkline** | Inline trend indicators in KPI cards and table cells. Premium SaaS signal. | Medium | None (SVG custom or lightweight chart lib) | Use Recharts (area chart variant, tiny, no axes). Alternatively hand-roll SVG path for maximum control. 60px wide, inline with stat numbers. |
| **Bar Chart** | Revenue breakdown, cohort analytics, review distribution | Medium | None (use Recharts) | Horizontal and vertical variants. Earthy color palette. Interactive tooltips. Responsive. |
| **Skill Heatmap** | University Governor: Departments x AI Skill Domains matrix. Color intensity shows proficiency level. | High | `@radix-ui/react-tooltip` (cell hover) | Grid of cells with color intensity mapping. Row and column labels. Tooltip with exact values. Unique to Governor Console. |
| **Deployment Funnel** | Eligible > Registered > Active > Delivering conversion funnel | Medium | None (SVG custom) | Horizontal funnel with stage widths proportional to counts. Labels and percentages. Earthy gradient. |
| **Donut / Pie Chart** | Budget utilization, evidence type distribution | Low | None (use Recharts) | Center-label donut preferred over pie. |

### 2.4 Premium Interaction Patterns

| Component | Value Proposition | Complexity | Radix Primitive | Notes |
|-----------|-------------------|------------|-----------------|-------|
| **SlideOutPanel** | ~380px right panel for quick detail views without leaving context. Used in: task detail from kanban, user detail from admin table, evidence detail from list. | Medium | `@radix-ui/react-dialog` (as Sheet) | Framer Motion slide-in from right. Overlay on mobile, side panel on desktop. Header with close button + title. Scrollable content. Action footer. This is used HEAVILY across all portals. Build it once, use it everywhere. |
| **Gradient KPI Card** | Dashboard hero stats with warm gradient backgrounds. The visual signature of GlimmoraTeam dashboards. | Low | None (custom Card variant) | CSS gradient backgrounds using the earthy palette. Terracotta-to-amber, sage-to-teal variants. White text on gradient. Sparkline overlay. |
| **Animated Skeleton Loader** | Content-shape-aware loading states with shimmer animation. Premium feel during data loads. | Medium | None (Framer Motion) | Shimmer uses Framer Motion `animate` with gradient translate. Skeleton shapes mirror actual content: card skeleton, table skeleton, chart skeleton, timeline skeleton. |
| **Micro-animations** | Hover states, card transitions, status badge pulses, number counting animations | Medium | None (Framer Motion) | Hover: subtle scale(1.02) + shadow elevation on cards. Page transitions: fade + slight translateY. Status pulse: soft glow animation on "in progress" badges. Number count-up on KPI cards when they enter viewport. |
| **Language Selector (First-Touch)** | Prominent, welcoming language picker as the FIRST interactive element on Women's Portal onboarding. Not a small dropdown -- a full-screen or prominent card-based selector. | Medium | `@radix-ui/react-radio-group` (card variant) | Shows all supported languages in their own script. Large, tappable cards. Warm illustration. No data collection at this step. This is a trust-building moment, not a settings toggle. |
| **Trust-First Information Display** | Read-only explainer screens (who sees your data, how payment works) shown BEFORE any data collection. Illustrated, progressive. | Low | None (custom) | Illustrated cards or accordion sections. "I understand" button to proceed. Not a checkbox wall. Each section is a standalone readable unit. |
| **Professional Credential Card** | PoDL credential as a shareable, screenshot-worthy card. Must be beautiful enough to share on WhatsApp and LinkedIn. | Medium | None (custom, potentially SVG/Canvas for export) | Card layout: task type, domain, criteria met, reviewer verification, date. Earthy design. QR code linking to verification URL. Export formats: image (for WhatsApp), PDF, LinkedIn-compatible. |
| **Onboarding Stepper with Illustration** | Multi-step onboarding with warm illustrations per step, progress indicator, and contextual messaging | Medium | None (custom Stepper variant) | Different from generic stepper: each step has a unique illustration/icon, warm encouraging copy, "you can leave and come back" messaging. Not a corporate wizard. |
| **Role Switcher** | Multi-role users need to switch context (Contributor to Mentor, etc.) with explicit confirmation and visual theming change. | Medium | `@radix-ui/react-dropdown-menu` + `@radix-ui/react-alert-dialog` (confirmation) | Dropdown in header shows all roles. Selecting triggers confirmation dialog: "You are switching from Contributor to Mentor. All actions will be in Mentor context." Entire app shell theme changes (header color, nav items). |

### 2.5 Communication Components

| Component | Value Proposition | Complexity | Radix Primitive | Notes |
|-----------|-------------------|------------|-----------------|-------|
| **MessageThread** | Private mentor-contributor conversations. Privacy-first: no names, only role labels. | Medium | `@radix-ui/react-scroll-area` | Chronological messages with: role label (not name), timestamp, message text, optional attachment. Reply box at bottom with rich-text and file attachment. SLA countdown visible. |
| **CommunityFeed** | Women's Circle and Student Community feeds. Moderated, professional. | Medium | None (custom) | Post cards with: author (first name only), timestamp, text, optional attachment, like/helpful count (NOT leaderboard), reply thread. Report button. |
| **NotificationItem** | Structured notification with: icon, title, description, timestamp, action link, read/unread state | Low | None (custom) | Grouped by type (task, payment, mentor, community). Dismissible. |

---

## 3. Anti-Features

Components and patterns to deliberately NOT build. These are common in SaaS products but violate GlimmoraTeam's core principles.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| **Public Profile Component** | GlimmoraTeam is private-by-default. No contributor profiles are ever public. This is architectural, not a toggle. | Private profile visible only to the contributor themselves. Skill Genome and PoDL are private documents the contributor controls. |
| **Leaderboard / Ranking Component** | Creates peer comparison, triggers anxiety for returning professionals, and contradicts the "no public ranking" principle. Scale AI and HackerEarth use this -- it is toxic for this user base. | Replace with private progress metrics: "You have completed X tasks" without any relative comparison. |
| **Star Rating Display (Contributor-Facing)** | Public star ratings create performance anxiety. Upwork's JSS score is specifically cited as a negative pattern. | Mentor feedback is narrative and specific ("Your test cases show systematic thinking"), not numerical. Internal quality scores exist but are NEVER shown to contributors. |
| **Competitive Bidding Interface** | Bidding against others is the structural exclusion mechanism GlimmoraTeam exists to eliminate. | Tasks are assigned by APG based on Skill Genome match. Contributors see "Task Available" -- not "15 others are bidding on this." |
| **Public Activity Feed (Cross-User)** | Showing what other users are doing creates comparison and surveillance dynamics. | Community feeds show professional discussion, not activity tracking. No "Fatima just completed a task" notifications to others. |
| **Gamification Points / XP System** | Gamification trivializes professional work. Women re-entering the workforce need to be treated as professionals, not players. | PoDL credentials and Skill Genome growth replace gamification. Progress is professional, not game-like. |
| **Photo/Avatar Upload for Contributors** | Photo requirements create safety risk for women in conservative contexts. | Initials-based avatars with algorithmically assigned earthy colors. Mentors can optionally add photos; contributors cannot be asked to. |
| **Real-time "Who's Online" Indicators** | Creates surveillance pressure. Contributors work in fragmented time windows; showing online status implies availability expectations. | Asynchronous-first. SLA-based response times, not "online now" indicators. |
| **Infinite Scroll (for Tables)** | Admin tables with 1000+ rows need pagination for accountability and URL-shareability, not infinite scroll. | Paginated tables with "show 25/50/100 per page" control. |
| **Dark Mode Toggle** | Not a priority for MVP. The warm earthy aesthetic is designed for light mode. Dark mode requires a complete parallel token system and doubles QA effort. | Ship light mode only for v1. Plan dark mode as a post-MVP enhancement with dedicated design token work. |
| **Nested Modals** | Stacking modals on modals is a UX anti-pattern that traps users. | Use slide-out panels for drill-down. Only one modal or panel open at a time. Close current before opening next. |
| **Complex Drag-and-Drop Everywhere** | DnD is expensive to build accessibly and mobile-compatibly. Only use where it genuinely adds value. | DnD for: kanban column moves ONLY. Everything else uses explicit button actions (move to, assign to, reorder). |

---

## 4. Complexity Analysis

### Tier 1: Very High Complexity (2-3 weeks each)

These components require the most custom engineering and have the highest risk of scope creep.

| Component | Why Complex | Risk Mitigation |
|-----------|------------|-----------------|
| **SOW Blueprint Editor (4-panel)** | Multi-panel synchronized scroll, diff highlighting, version history, inline editing. No existing library provides this. | Build incrementally: start with 2-panel (original + interpretation), add diff view and version history later. |
| **Milestone Timeline / Gantt** | Horizontal scroll, zoom levels, status overlays, date calculations, responsive behavior. Gantt libraries exist but are heavy and ugly. | Start with a simplified milestone list (vertical timeline) for MVP. Graduate to horizontal Gantt in phase 2. Use a lightweight approach (CSS Grid + custom positioning) rather than a full Gantt library. |
| **3-Panel Review Layout** | Three synchronized scrollable panels, responsive collapse on smaller screens, draft auto-save, complex form state. | This is the highest-value investment. Build it early and iterate. Start with non-resizable panels; add resize handles later. |

### Tier 2: High Complexity (1-2 weeks each)

| Component | Why Complex | Risk Mitigation |
|-----------|------------|-----------------|
| **DataTable** | Sorting, filtering, pagination, column visibility, row selection, responsive card view, row actions. | Use TanStack Table v8 as headless engine. Build the UI layer on top. Do NOT roll your own table logic. |
| **Kanban Board** | Drag-and-drop, horizontal scroll, responsive stacking, card variants, column configuration. | Use @dnd-kit for DnD. Start with fixed columns (no custom columns). Mobile: stack columns vertically with tabs. |
| **Evidence Viewer** | Multi-type content rendering (code, PDF, video, links), tab management, download handling. | Build each evidence type as an independent sub-component. Code: CodeMirror 6. PDF: react-pdf or pdf.js. Video: native HTML5 player. |
| **FileUpload (Multi-type)** | Drag-drop, multi-file, progress tracking, type validation, preview generation, error handling per file. | Use react-dropzone for the drop zone. Build upload progress UI on top. Backend presigned URLs for S3. |
| **RichTextEditor** | Toolbar, markdown output, consistent styling, keyboard shortcuts, link handling. | Use Tiptap (built on ProseMirror). Configure a restricted toolbar -- do NOT expose full word-processor features. |
| **CodeEditor/Viewer** | Syntax highlighting, line numbers, language detection, theme integration. | Use CodeMirror 6 with a custom theme matching the earthy palette. Read-only mode for viewers, editable for submissions. |
| **Skill Heatmap** | Grid rendering, color scale calculation, responsive behavior, tooltip positioning. | Use a simple CSS Grid + SVG cells approach. Avoid heavy charting libraries for this one-off component. |
| **Professional Credential Card** | Must look beautiful, be exportable as image/PDF, include QR code, work on WhatsApp share. | HTML/CSS for display. Use html-to-canvas for image export. QR code via qrcode.react. |

### Tier 3: Medium Complexity (3-5 days each)

| Component | Why Complex |
|-----------|------------|
| **AppShell + Sidebar** | Collapse behavior, mobile drawer, portal theming, role switcher integration |
| **SlideOutPanel (Sheet)** | Animation, responsive behavior, focus trapping, stacking context |
| **Stepper** | State management, step validation, back navigation, responsive layout |
| **Select (Searchable)** | Custom rendering, search filtering, keyboard navigation, grouped options |
| **DatePicker** | Calendar grid, range selection, locale formatting, popover positioning |
| **MultiSelect** | Tag display, search, remove, keyboard navigation |
| **NotificationCenter** | Real-time updates, grouping, mark-as-read, badge counting |
| **MessageThread** | Scroll behavior, new-message detection, attachment handling |
| **CommunityFeed** | Infinite load (scroll within page), reply threading, moderation flags |
| **Bar Chart / Sparkline** | Recharts integration, responsive sizing, custom tooltips, earthy theming |
| **Progress Ring** | SVG arc calculations, Framer Motion animation, responsive sizing |
| **Animated Skeleton** | Content-shape variants, shimmer animation, composition pattern |
| **Gradient KPI Card** | Gradient tokens, responsive layout, sparkline integration |
| **CommandPalette** | Search indexing, keyboard navigation, result grouping |
| **Combobox** | Search, filter, selection, keyboard, popover positioning |
| **Deployment Funnel** | SVG rendering, responsive, labels, hover states |
| **Criteria Evaluation Grid** | Per-row radio groups, inline comments, summary calculation |

### Tier 4: Low Complexity (1-2 days each)

| Component | Notes |
|-----------|-------|
| Button, Input, Textarea, Label, Separator, Checkbox, Radio, Switch | Standard primitives. Well-understood patterns. |
| Badge, Tag, Avatar (initials) | Simple styling variants. |
| Card, EmptyState, ErrorState, LoadingState | Container components with variant props. |
| Breadcrumbs, PageHeader, DescriptionList | Layout helpers. |
| Tooltip, Accordion, Alert Dialog | Direct Radix primitive wrapping with Tailwind styles. |
| Pagination | Simple page-number UI. |
| NotificationItem | Single list-item component. |
| Toast | Radix Toast with Tailwind styling. |
| Trust-First Information Display | Styled content blocks. No complex logic. |
| Language Selector | Card-based radio group. Simple but emotionally important. |

---

## 5. Portal Dependency Map

### Which portals need which components

| Component | Women | University (Contributor) | University (Governor) | Enterprise | Mentor | Admin |
|-----------|-------|-------------------------|----------------------|------------|--------|-------|
| **Foundation (tokens, typography, icons)** | Y | Y | Y | Y | Y | Y |
| **Button, Input, Select, Checkbox, etc.** | Y | Y | Y | Y | Y | Y |
| **AppShell + Sidebar + Header** | Y | Y | Y | Y | Y | Y |
| **DataTable** | - | - | Y | Y | Y | Y |
| **Kanban Board** | Y | Y | - | - | - | - |
| **Milestone Timeline** | - | - | - | Y | - | Y |
| **3-Panel Review Layout** | - | - | - | - | Y | - |
| **Evidence Viewer** | - | - | - | Y | Y | Y |
| **Evidence Submission Form** | Y | Y | - | - | - | - |
| **SOW Blueprint Editor** | - | - | - | Y | - | Y |
| **FileUpload** | Y | Y | - | Y | - | Y |
| **Stepper (Onboarding)** | Y | Y | - | Y | Y | - |
| **KPI / Stat Cards** | Y | Y | Y | Y | Y | Y |
| **Gradient KPI Card** | Y | Y | Y | Y | - | Y |
| **Progress Ring** | - | Y | Y | Y | - | Y |
| **Sparkline** | Y | Y | Y | Y | Y | Y |
| **Bar Chart** | - | - | Y | Y | - | Y |
| **Skill Heatmap** | - | - | Y | - | - | - |
| **Deployment Funnel** | - | - | Y | - | - | Y |
| **SlideOutPanel** | Y | Y | Y | Y | Y | Y |
| **MessageThread** | Y | Y | - | - | Y | - |
| **CommunityFeed** | Y | Y | - | - | - | - |
| **PoDL Credential Card** | Y | Y | - | Y | - | Y |
| **Criteria Evaluation Grid** | - | - | - | - | Y | - |
| **Role Switcher** | Y* | Y* | Y* | - | Y* | - |
| **Language Selector (First-Touch)** | Y | Y | - | - | - | - |
| **Trust-First Display** | Y | Y | - | - | - | - |
| **RichTextEditor** | - | - | - | - | Y | Y |
| **CodeEditor/Viewer** | Y | Y | - | - | Y | - |
| **DatePicker** | - | - | Y | Y | - | Y |
| **NotificationCenter** | Y | Y | Y | Y | Y | Y |
| **CommandPalette** | - | - | - | Y | Y | Y |
| **Toast** | Y | Y | Y | Y | Y | Y |

*Role Switcher: only for users who hold multiple roles simultaneously.

### Portal Complexity Ranking (by unique component needs)

1. **Mentor Portal** -- Most complex unique component (3-Panel Review Layout + Criteria Evaluation Grid + Evidence Viewer). Build this well and everything else benefits.
2. **Enterprise Portal** -- SOW Blueprint Editor (4-panel) is the single most complex screen. Milestone Timeline is the second-most complex.
3. **Admin Panel** -- Highest table density. DataTable must be excellent. Also needs every chart type.
4. **Women's Program Portal** -- Emotionally complex but technically simpler. Onboarding stepper, kanban, community feed.
5. **University Portal (Contributors)** -- Shares most components with Women's Portal. PoDL Credential Card is the unique piece.
6. **University Portal (Governor)** -- Mostly dashboards and analytics. Skill Heatmap is unique.

---

## 6. Shared vs Portal-Specific Component Split

### @glimmora/ui (Shared Package) -- Build Once

**ALL of the following go in the shared package:**

- Foundation: tokens, typography, spacing, icons, color system
- All Radix-wrapped primitives: Button, Input, Select, Dialog, Tooltip, Tabs, etc.
- Layout: AppShell, Sidebar, Header, Breadcrumbs, PageHeader, Card
- Data display: DataTable, Pagination, DescriptionList, Timeline/ActivityFeed, StatCard, GradientKPICard
- Forms: FormWrapper, FileUpload, DatePicker, Combobox, MultiSelect
- Navigation: Stepper, CommandPalette, NotificationCenter
- Feedback: Toast, EmptyState, ErrorState, LoadingState, Skeleton
- Communication: MessageThread (generic), NotificationItem
- Visualization: Sparkline, BarChart, ProgressRing, DonutChart
- Interactions: SlideOutPanel, RoleSwitcher, Badge, Avatar, Tag

### Portal-Specific Components -- Build Per Portal

| Portal | Portal-Specific Components |
|--------|---------------------------|
| **Women's Portal** | LanguageSelectorFirstTouch, TrustFirstExplainer, WomenOnboardingStepper (warm illustrations), SkillDiscoveryFlow, CommunityBuddy |
| **University Portal (Contributor)** | PoDLCredentialCard, AIReadinessScoreBadge, SkillGenomeVisualization, LinkedInExportButton |
| **University Portal (Governor)** | SkillHeatmap, DeploymentFunnel, CohortAnalyticsDashboard, AccreditationExportPanel |
| **Enterprise Portal** | SOWBlueprintEditor (4-panel), MilestoneTimeline, EvidencePackViewer, ReworkRequestForm, ESGExportPanel |
| **Mentor Portal** | ThreePanelReviewLayout, CriteriaEvaluationGrid, EvidenceViewer (configured for blind review), ReviewDecisionForm, SkillTagVerification |
| **Admin Portal** | PlatformHealthDashboard, APGOverridePanel, DisputeResolutionFlow, VerificationQueueTable, CustomReportBuilder |

---

## 7. Evidence Submission & Viewer Deep Dive

This is the single most cross-cutting complex feature. It appears in different modes across 4 portals.

### Evidence Types

| Type | Submission UI | Viewer UI | Portals (Submit) | Portals (View) |
|------|--------------|-----------|-------------------|-----------------|
| **Code** | CodeMirror editor with language selector | Syntax-highlighted viewer, line numbers, copy button | Women, University | Mentor, Enterprise, Admin |
| **Document** | FileUpload (PDF, DOCX, XLSX) | Inline PDF viewer (react-pdf), DOCX rendered to HTML, download fallback | Women, University | Mentor, Enterprise, Admin |
| **Link / URL** | URL input with validation + optional description | Clickable link with metadata preview card (title, favicon, description via og:tags) | Women, University | Mentor, Enterprise, Admin |
| **Video** | FileUpload (MP4, WebM) or URL (YouTube, Loom) | HTML5 video player or embedded iframe | Women, University | Mentor, Enterprise, Admin |
| **Text / Narrative** | Textarea or RichTextEditor | Formatted text display | Women, University | Mentor, Enterprise, Admin |

### Evidence Viewer Layout (Mentor Portal)

```
+---------------------------+----------------------------+----------------------+
| LEFT PANEL (280px)        | CENTER PANEL (flex)        | RIGHT PANEL (360px)  |
| Task Context              | Evidence Viewer            | Review Form          |
|                           |                            |                      |
| - Milestone name          | [Code] [Doc] [Link] [Vid] | Criteria Evaluation  |
| - Acceptance criteria     |                            | - Criterion 1: [Met] |
| - Skill tags required     | <Active tab content>      | - Criterion 2: [Met] |
| - Contributor role label  |                            | - Criterion 3: [!]   |
| - Previous reviews        |                            |                      |
|   (if rework cycle)       |                            | Quality Rating       |
|                           |                            | - Star rating        |
|                           |                            |                      |
|                           |                            | Review Notes         |
|                           |                            | - Strength (req)     |
|                           |                            | - Improvement (req)  |
|                           |                            |                      |
|                           |                            | Decision             |
|                           |                            | [Approve] [Rework]   |
|                           |                            | [Reject]             |
+---------------------------+----------------------------+----------------------+
```

### Blind Review Enforcement

The Evidence Viewer component must NEVER display:
- Contributor name
- Contributor photo
- Contributor location
- Contributor portal of origin (whether from Women's or University program)
- Any personally identifying metadata in uploaded files (strip EXIF data, document author metadata)

It MAY display:
- Contributor role label ("Women Contributor" or "Pass-Out AI Contributor") -- per Flow 10-E
- Domain tags
- Submission timestamp

---

## 8. Radix Primitive Coverage Summary

### Radix Primitives to Install

| Radix Package | Used By (Glimmora Components) | Priority |
|---------------|------------------------------|----------|
| `@radix-ui/react-dialog` | Dialog, AlertDialog, SlideOutPanel (Sheet), CommandPalette | Phase 1 |
| `@radix-ui/react-dropdown-menu` | DropdownMenu, RoleSwitcher, TableRowActions | Phase 1 |
| `@radix-ui/react-select` | Select (standard and searchable) | Phase 1 |
| `@radix-ui/react-tabs` | Tabs, EvidenceViewer, ReviewQueue | Phase 1 |
| `@radix-ui/react-tooltip` | Tooltip (used everywhere) | Phase 1 |
| `@radix-ui/react-popover` | Popover, NotificationCenter, DatePicker container, Combobox | Phase 1 |
| `@radix-ui/react-checkbox` | Checkbox, DataTable row selection | Phase 1 |
| `@radix-ui/react-radio-group` | RadioGroup, CriteriaEvaluation, LanguageSelector | Phase 1 |
| `@radix-ui/react-switch` | Switch/Toggle | Phase 1 |
| `@radix-ui/react-accordion` | Accordion, FAQ, BlueprintDecomposition | Phase 1 |
| `@radix-ui/react-toast` | Toast notifications | Phase 1 |
| `@radix-ui/react-scroll-area` | ScrollArea (panels, evidence viewer, kanban columns) | Phase 1 |
| `@radix-ui/react-progress` | Progress bar (uploads, processing) | Phase 1 |
| `@radix-ui/react-label` | Form labels (accessibility) | Phase 1 |
| `@radix-ui/react-separator` | Visual dividers | Phase 1 |
| `@radix-ui/react-alert-dialog` | Destructive confirmations | Phase 1 |
| `@radix-ui/react-context-menu` | Right-click menus (optional, Phase 2) | Phase 2 |
| `@radix-ui/react-slider` | Slider (mentor capacity, optional) | Phase 2 |
| `@radix-ui/react-navigation-menu` | Evaluate for top-bar nav if needed | Phase 2 |
| `@radix-ui/react-slot` | `asChild` pattern for polymorphic components | Phase 1 |
| `@radix-ui/react-collapsible` | Sidebar collapse, optional expandable sections | Phase 1 |
| `@radix-ui/react-hover-card` | Rich preview on hover (optional, Phase 2) | Phase 2 |
| `@radix-ui/react-toggle` | Toggle button states | Phase 2 |
| `@radix-ui/react-toggle-group` | Button group toggles (view mode: list/grid/kanban) | Phase 2 |
| `@radix-ui/react-aspect-ratio` | Video embeds, image containers | Phase 1 |
| `@radix-ui/react-visually-hidden` | Accessibility: screen-reader-only content | Phase 1 |

### Components NOT Covered by Radix (Need External Libraries)

| Need | Recommended Library | Why This One |
|------|-------------------|--------------|
| Headless table logic | TanStack Table v8 | Headless, TypeScript-first, sort/filter/paginate built in. Most adopted React table solution. |
| Drag and drop | @dnd-kit | Modern, accessible, composable. react-beautiful-dnd is deprecated (Atlassian stopped maintaining it). |
| Date picker calendar | react-day-picker v8 | Lightweight, composable, works with any popover. Used by shadcn (but we wrap it ourselves). |
| Rich text editing | Tiptap (ProseMirror-based) | Headless, extensible, Markdown-compatible, TypeScript. Lighter than Slate, more modern than Draft.js. |
| Code editing/viewing | CodeMirror 6 | Lighter than Monaco, excellent for embedded views. Language support via extensions. |
| PDF viewing | react-pdf (pdf.js wrapper) | Standard solution. Renders PDF pages as canvas/SVG. |
| Charts | Recharts | React-native (not a D3 wrapper), composable, well-typed. Lighter than Victory, more React-native than Chart.js. |
| Animation | Framer Motion | Already in stack. Handles: page transitions, panel slide-ins, hover states, skeleton shimmer, number counting. |
| Form validation | React Hook Form + Zod | RHF for form state, Zod for schema validation. Standard modern stack. |
| QR code | qrcode.react | For PoDL credential verification URLs |
| Image export | html-to-canvas | For PoDL credential card export as image |

---

## 9. MVP Component Prioritization

### Phase 1: Foundation + Shared Primitives (Build the Design System)

Build these first. Every portal needs them. This IS the @glimmora/ui package.

1. Design tokens (colors, typography, spacing, shadows, border-radius)
2. All Tier 4 (low complexity) components: Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label, Separator, Badge, Tag, Avatar, Card, Tooltip, Accordion, AlertDialog, Toast, Progress
3. AppShell + Sidebar + Header (with portal theming)
4. SlideOutPanel (Sheet)
5. Stepper
6. EmptyState + ErrorState + LoadingState + Skeleton
7. Tabs
8. StatCard + GradientKPICard

### Phase 2: Data + Forms (Enable Core Workflows)

9. DataTable (with TanStack Table)
10. FileUpload
11. Form components (FormWrapper, DatePicker, Combobox, MultiSelect)
12. NotificationCenter
13. MessageThread
14. Breadcrumbs + PageHeader

### Phase 3: Portal-Critical Complex Components

15. Evidence Viewer (tabbed multi-type)
16. 3-Panel Review Layout (Mentor Portal)
17. Criteria Evaluation Grid
18. Kanban Board (with @dnd-kit)
19. RichTextEditor (Tiptap)
20. CodeEditor/Viewer (CodeMirror 6)

### Phase 4: Premium Features + Visualization

21. Milestone Timeline
22. SOW Blueprint Editor
23. Sparkline + BarChart + ProgressRing (Recharts)
24. PoDL Credential Card (with export)
25. Skill Heatmap (Governor Console)
26. Deployment Funnel
27. CommandPalette
28. Micro-animations polish pass

### Defer to Post-MVP

- Dark mode (requires parallel token system)
- Context menu (right-click)
- Gantt dependencies (connecting lines between milestones)
- Kanban swim lanes
- Custom Report Builder (Admin)
- AI-powered search in CommandPalette

---

## 10. Component API Design Principles

These principles should govern how every @glimmora/ui component is built.

### Principle 1: Composition Over Configuration

```typescript
// GOOD: Composable
<Card>
  <CardHeader>
    <CardTitle>Active Projects</CardTitle>
    <CardDescription>3 projects in progress</CardDescription>
  </CardHeader>
  <CardContent>{/* ... */}</CardContent>
  <CardFooter>{/* ... */}</CardFooter>
</Card>

// BAD: Prop-heavy
<Card
  title="Active Projects"
  description="3 projects in progress"
  content={/* ... */}
  footer={/* ... */}
/>
```

### Principle 2: Variants via Props, Not Separate Components

```typescript
// GOOD: Variant prop
<Button variant="primary" size="md">Submit</Button>
<Button variant="destructive" size="sm">Delete</Button>

// BAD: Separate components
<PrimaryButton>Submit</PrimaryButton>
<DestructiveButton>Delete</DestructiveButton>
```

Use `cva` (class-variance-authority) for variant management with Tailwind classes.

### Principle 3: Portal Theme via Context, Not Props

```typescript
// AppShell provides portal theme context
<PortalThemeProvider portal="women"> {/* or "university", "enterprise", "mentor", "admin" */}
  <AppShell>
    {/* All children inherit portal-specific colors, header color, accent */}
  </AppShell>
</PortalThemeProvider>
```

### Principle 4: Accessible by Default

Every interactive component must:
- Have proper ARIA attributes (Radix handles most of this)
- Support keyboard navigation
- Have visible focus indicators
- Work with screen readers
- Have sufficient color contrast (WCAG AA minimum, AAA preferred for text)

### Principle 5: Storybook-First Development

Every component must have:
- A Storybook story with all variants
- Interactive controls for all props
- Documentation of the component's purpose
- Usage examples showing composition patterns
- Portal theme variants shown side by side

---

## 11. Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Radix UI primitive list | MEDIUM | Based on training data through May 2025. Radix may have added new primitives or changed APIs since then. Verify `@radix-ui/react-*` package availability before installing. |
| TanStack Table recommendation | HIGH | TanStack Table v8 is the dominant headless table solution in the React ecosystem. Stable and well-documented. |
| @dnd-kit recommendation | HIGH | @dnd-kit is the standard replacement for react-beautiful-dnd. Confirmed deprecated status of rbd. |
| Tiptap recommendation | MEDIUM | Tiptap is well-established but verify current version and pricing model (they have both open source and commercial tiers). |
| CodeMirror 6 recommendation | HIGH | CodeMirror 6 is mature and widely adopted. Lighter than Monaco for embedded use cases. |
| Recharts recommendation | MEDIUM | Recharts is solid but alternatives like Nivo or Tremor may have evolved. Verify current state. |
| react-day-picker | MEDIUM | Verify v8+ is current. The API changed significantly between v7 and v8. |
| Framer Motion | HIGH | Dominant React animation library. Stable API. |
| React Hook Form + Zod | HIGH | Standard modern React form validation stack. |
| Complexity estimates | MEDIUM | Based on general engineering experience. Actual effort depends on team familiarity and iteration requirements. |

---

## Sources

- GlimmoraTeam UX Research: `/Users/kavi/Baarez-Projects/Glimmora-Team/ux-research/04-information-architecture.md` (275 screens across 5 portals)
- GlimmoraTeam Competitive Analysis: `/Users/kavi/Baarez-Projects/Glimmora-Team/ux-research/02-competitive-analysis.md`
- GlimmoraTeam Problem-Solution Mapping: `/Users/kavi/Baarez-Projects/Glimmora-Team/ux-research/03-problem-solution-mapping.md`
- Portal Flow Documents: `/Users/kavi/Baarez-Projects/Glimmora-Team/ux-research/flows/06-12-*.md`
- Radix UI documentation (knowledge as of May 2025 -- verify for current state)
- Tailwind CSS documentation (knowledge as of May 2025)
- TanStack Table, @dnd-kit, Tiptap, CodeMirror 6, Recharts documentation (knowledge as of May 2025)
