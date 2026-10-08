# AI Design & Code Architecture Rules

This rule file defines the software engineering principles, design standards, component architecture guidelines, and UI/UX conventions for the **CMS Admin Portal**.

---

## 1. Core Software Design Principles

### SOLID & Clean Architecture
1. **Single Responsibility Principle (SRP)**:
   - Separate UI presentation from data fetching and mutation logic.
   - Keep API route handlers concise by delegating database queries to dedicated service helpers in `/lib/services/`.
2. **Open/Closed Principle (OCP)**:
   - UI primitives (`Button`, `Modal`, `Input`, `Badge`) must accept customizable variants/props without modifying core component source code.
3. **Dependency Inversion Principle (DIP)**:
   - Services and utilities rely on TypeScript interfaces rather than hardcoding tightly-coupled implementations.

### Defensive Security & Quality Principles
1. **Never Trust Client Input (Zod Validation)**:
   - All incoming API request bodies, query params, and Server Action payloads MUST be validated using **Zod** schemas before processing.
2. **SQL Injection Prevention**:
   - Never concatenate raw user input into SQL strings. Always use prepared statement parameters (`mysqlPool.execute(sql, [params])`).
3. **DRY & Reusability**:
   - Shared utility functions (date formatters, permission checks, string sanitizers) belong in `/lib/utils/`.

---

## 2. UI/UX Design System Guidelines

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

## 3. Next.js Code Architecture Guidelines

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
   ├── db.ts             # MySQL pool client
   ├── auth.ts           # Argon2 & Session utilities
   ├── permissions.ts    # Permission check helpers
   └── services/         # Modular service layer (UserService, ContentService)
   ```

2. **Server vs. Client Components**:
   - Default to React Server Components (`RSC`) for data fetching.
   - Use `'use client'` only when state (`useState`), effects (`useEffect`), or interactive browser events are required.

---

## 4. Semantic Naming Conventions & Standards

1. **Database Schema Naming**:
   - Tables: Plural `snake_case` (`users`, `sites`, `cms_sessions`, `audit_logs`).
   - Primary Keys: `id` (CHAR(36) UUID).
   - Foreign Keys: `table_name_singular_id` (`user_id`, `site_id`, `role_id`).
   - Avoid ambiguous or misleading table names (e.g. use `cms_sessions` instead of `admin_sessions` when tracking sessions for all portal users).

2. **Files & Folders**:
   - `kebab-case` for TypeScript, component files, and folders (`site-context.ts`, `admin-login-flow.test.ts`).

3. **Code & Symbols**:
   - `PascalCase` for React components and Zod validation schemas (`LoginSchema`, `SiteSelector`).
   - `camelCase` for functions, methods, and variables (`verifyPassword`, `generateSessionToken`).
   - Self-describing variable names without vague abbreviations (`paramIndex` instead of `p`, `userData` instead of `usr`).
