# AI Design & Code Architecture Rules

This rule file defines the design standards, component architecture guidelines, and UI/UX conventions for the **CMS Admin Portal**.

---

## 1. UI/UX Design System Guidelines

### Color Palette & Theme Tokens
- **Primary Color**: Deep Forest / Tea Leaf Green (`#1B4D3E` / HSL `162, 48%, 21%`).
- **Secondary / Accent**: Warm Amber / Gold (`#D4AF37` / HSL `45, 65%, 52%`).
- **Neutral Dark**: Dark Charcoal (`#111827`).
- **Neutral Light**: Crisp Off-White (`#F9FAFB`).
- **Status Colors**:
  - Success / Active: `#10B981` (Emerald)
  - Warning / Pending: `#F59E0B` (Amber)
  - Error / Locked: `#EF4444` (Rose)
  - Info / Draft: `#3B82F6` (Blue)

### Component Conventions
1. **Admin Layout**:
   - Collapsible Left Sidebar (Site switcher, Navigation links, Profile menu).
   - Sticky Top Bar (Active Site indicator, Search, Breadcrumbs, Notifications).
   - Main Content Canvas with responsive padding and clear page titles.
2. **Data Tables & Lists**:
   - Pagination, search input, status filter dropdowns.
   - Action buttons (Edit, Delete, Preview) grouped cleanly in action columns.
3. **Forms & Drawer Editors**:
   - Inline field validation with clear error messages.
   - Slide-over drawers or modal dialogs for quick edits.

---

## 2. Next.js Code Architecture Guidelines

1. **Folder Structure**:
   ```text
   app/
   ├── (admin)/
   │   └── admin/
   │       ├── login/
   │       ├── dashboard/
   │       ├── sites/
   │       └── users/
   ├── api/
   │   └── v1/
   │       └── admin/
   components/
   ├── ui/               # Generic reusable UI primitives (Button, Modal, Input, Badge)
   └── admin/            # Admin portal domain components (SiteSelector, UserTable)
   lib/
   ├── db.ts             # MySQL pool / ORM client
   ├── auth.ts           # Argon2 & Session utilities
   └── permissions.ts    # Permission check helpers
   ```

2. **Server vs. Client Components**:
   - Default to React Server Components (`RSC`) for data fetching.
   - Use `'use client'` only when state (`useState`), effects (`useEffect`), or interactive browser events are required.
