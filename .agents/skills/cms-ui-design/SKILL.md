---
name: cms-ui-design
description: >-
  Use this skill when designing, prototyping, or implementing Next.js React UI components,
  dashboards, layouts, forms, tables, and themes for the CMS Admin Portal.
---

# CMS UI & Layout Design Skill

This skill provides step-by-step instructions for constructing modern, responsive, premium UI components for the CMS Admin Portal.

## UI Design Checklist

- [ ] **Color Palette**: Uses Tea Cottage Leaf Green (`#1B4D3E`), Amber (`#D4AF37`), Dark Charcoal (`#111827`), and Slate Gray background.
- [ ] **Typography**: Clean sans-serif hierarchy (Inter / Outfit / Roboto).
- [ ] **State Feedback**: Loading spinners, skeleton loaders, success toasts, and error badges.
- [ ] **Accessibility**: High contrast ratios, accessible form inputs, clear focus rings.

---

## Core Component Patterns

### 1. Admin Dashboard Layout (`app/admin/layout.tsx`)
```tsx
// Sidebar + TopBar + Main Content Canvas
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 2. Status Badge Helper
- `ACTIVE`: Emerald green background with dark text.
- `PENDING`: Amber background with dark text.
- `LOCKED`: Red background with white text.
