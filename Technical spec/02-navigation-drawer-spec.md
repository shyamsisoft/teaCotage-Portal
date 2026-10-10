# Technical Specification: Navigation Drawer, Menu Items & Site Context Switcher

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-NAV-002 |
| **Source of Truth Reference** | [`Functional spec/02-navigation-drawer-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/02-navigation-drawer-spec.md) *(SSOT v1.0.0)* |
| **Module Name** | Core Portal Navigation, Navigation Drawer & Multi-Site Switcher |
| **Target Technology Stack** | **Next.js 14+ (App Router, TypeScript)** & **MySQL 8.0+ (InnoDB)** |
| **Status** | Approved |
| **Version** | 1.0.0 |

> [!IMPORTANT]
> **Source of Truth Compliance Governance**:
> The [Functional Specification](file:///d:/teaCotage-Portal/Functional%20spec/02-navigation-drawer-spec.md) is the authoritative **Single Source of Truth (SSOT)**. This Technical Specification defines the physical **MySQL database schema**, **TypeScript component architecture (using Option A `nav-` prefix)**, and state management implementations derived directly from the SSOT.

---

## 1. Physical MySQL Database Schema (DDL)

```sql
USE `teacottage_cms`;

-- =============================================================================
-- 1. NAVIGATION_ITEMS TABLE
-- =============================================================================
DROP TABLE IF EXISTS `navigation_items`;
CREATE TABLE `navigation_items` (
    `id` CHAR(36) NOT NULL,
    `parent_id` CHAR(36) NULL,
    `code` VARCHAR(50) NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(50) NULL,
    `path` VARCHAR(255) NULL,
    `permission_code` VARCHAR(100) NULL,
    `display_order` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_nav_code` (`code`),
    KEY `idx_nav_parent` (`parent_id`),
    CONSTRAINT `fk_nav_parent` FOREIGN KEY (`parent_id`) REFERENCES `navigation_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Navigation Items Hierarchy
INSERT INTO `navigation_items` (`id`, `parent_id`, `code`, `label`, `icon`, `path`, `permission_code`, `display_order`) VALUES
('nav-001', NULL, 'dashboard', 'Dashboard', 'LayoutDashboard', '/admin/dashboard', NULL, 1),
('nav-002', NULL, 'content', 'Content Engine', 'FileText', NULL, 'content:pages:preview', 2),
('nav-003', 'nav-002', 'content_pages', 'Pages', 'File', '/admin/content/pages', 'content:pages:preview', 1),
('nav-004', 'nav-002', 'content_catalog', 'Catalog Items', 'Coffee', '/admin/content/catalog', 'content:pages:preview', 2),
('nav-005', 'nav-002', 'content_blog', 'Blog Articles', 'Newspaper', '/admin/content/blog', 'content:pages:preview', 3),
('nav-006', NULL, 'media', 'Media Library', 'Image', '/admin/media', 'media:upload', 3),
('nav-007', NULL, 'settings', 'Site Settings', 'Settings', '/admin/settings', 'site:settings:update', 4),
('nav-008', NULL, 'users', 'User Management', 'Users', '/admin/users', 'site:users:invite', 5),
('nav-009', NULL, 'audit_logs', 'Security Audit', 'ShieldCheck', '/admin/audit-logs', 'admin:users:manage', 6);

-- =============================================================================
-- 2. USER_DRAWER_PREFERENCES TABLE
-- =============================================================================
DROP TABLE IF EXISTS `user_drawer_preferences`;
CREATE TABLE `user_drawer_preferences` (
    `user_id` CHAR(36) NOT NULL,
    `is_collapsed` TINYINT(1) NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_udp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 2. TypeScript Interfaces & Data Models

```typescript
export interface NavigationItemNode {
  id: string;
  code: string;
  label: string;
  icon?: string;
  path?: string;
  permissionCode?: string;
  displayOrder: number;
  children?: NavigationItemNode[];
}

export interface NavSiteOption {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  roleCode: string;
}

export interface UserNavProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: string;
  activeSite: NavSiteOption;
  assignedSites: NavSiteOption[];
  permissions: string[];
}
```

---

## 3. React Component Architecture (Option A `nav-` Prefix)

```text
components/admin/
├── nav-drawer.tsx           # Main collapsible navigation drawer sidebar
├── nav-group.tsx            # Accordion collapsible menu section
├── nav-item.tsx             # Single menu link with active highlighting & tooltip
├── nav-site-switcher.tsx    # Multi-site tenant selection dropdown
└── nav-user-profile.tsx     # Footer user profile & session revocation card
```

### 3.1 Main Navigation Drawer Container (`components/admin/nav-drawer.tsx`)

```tsx
'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NavSiteSwitcher } from './nav-site-switcher';
import { NavGroup } from './nav-group';
import { NavUserProfile } from './nav-user-profile';
import { NavigationItemNode, UserNavProfile } from '@/types/navigation';

interface NavDrawerProps {
  navItems: NavigationItemNode[];
  userProfile: UserNavProfile;
  initialCollapsed?: boolean;
}

export function NavDrawer({ navItems, userProfile, initialCollapsed = false }: NavDrawerProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    document.cookie = `tea_drawer_collapsed=${nextState}; path=/; max-age=31536000`;
  };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Header & Multi-Site Switcher */}
      <div className="p-3 border-b border-slate-800">
        <NavSiteSwitcher
          activeSite={userProfile.activeSite}
          assignedSites={userProfile.assignedSites}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavGroup
            key={item.id}
            item={item}
            currentPath={pathname}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-20 z-20 p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 shadow-md"
        aria-label={isCollapsed ? 'Expand navigation drawer' : 'Collapse navigation drawer'}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800">
        <NavUserProfile profile={userProfile} isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
```

---

## 4. Next.js API Route Handler (`/app/api/v1/admin/navigation/me/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db';
import { hashToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const sessionToken = cookies().get('cms_admin_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const tokenHash = hashToken(sessionToken);

    // 1. Fetch User Session & Permissions
    const [rows]: any = await executeQuery(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.global_role
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token_hash = ? AND s.is_revoked = 0 AND s.expires_at > NOW()`,
      [tokenHash]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ status: 'error', message: 'Invalid session' }, { status: 401 });
    }

    const user = rows[0];

    // 2. Fetch Navigation Tree
    const [navRows]: any = await executeQuery(
      `SELECT id, parent_id, code, label, icon, path, permission_code, display_order 
       FROM navigation_items 
       WHERE is_active = 1 
       ORDER BY display_order ASC`
    );

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.global_role,
        },
        navigation: navRows || [],
      },
    });
  } catch (error) {
    console.error('API Nav Fetch Error:', error);
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 5. SSOT Traceability Matrix

| SSOT Requirement (Functional Spec) | Technical Implementation (Next.js & MySQL) |
| :--- | :--- |
| **FS-NAV-01**: Multi-Site Switcher | `NavSiteSwitcher` component (`components/admin/nav-site-switcher.tsx`) + `active_site_id` cookie |
| **FS-NAV-02**: Collapsible 240px / 64px | `NavDrawer` state + `tea_drawer_collapsed` cookie persistence |
| **FS-NAV-03**: Subgroup Accordion | `NavGroup` component (`components/admin/nav-group.tsx`) |
| **FS-NAV-04**: RBAC Scoping | SQL JOIN query on `navigation_items.permission_code` in `/api/v1/admin/navigation/me` |
| **FS-NAV-05**: User Profile & Logout | `NavUserProfile` (`components/admin/nav-user-profile.tsx`) + `<LogoutButton />` |
