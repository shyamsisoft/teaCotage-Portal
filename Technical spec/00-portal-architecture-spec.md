# Technical Specification: CMS Portal Architecture & System Overview

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-ARCH-000 |
| **Source of Truth Reference** | [`Functional spec/00-portal-architecture-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/00-portal-architecture-spec.md) *(SSOT v1.0.0)* |
| **Module Name** | Core System Architecture & Multi-Site CMS Engine |
| **Target Technology Stack** | **Next.js 14+ (App Router, TypeScript)** & **MySQL 8.0+ (InnoDB)** |
| **Status** | Approved |
| **Version** | 1.2.0 |

> [!IMPORTANT]
> **Source of Truth Compliance Governance**:
> The [Portal Architecture Functional Specification](file:///d:/teaCotage-Portal/Functional%20spec/00-portal-architecture-spec.md) is the authoritative **Single Source of Truth (SSOT)** for overall system scope and multi-tenant isolation. This Technical Specification defines the codebase monorepo structure, core database connection management, and cross-cutting infrastructure patterns.

---

## 1. Core Software Engineering Principles

### 1.1 Architectural & Code Quality Principles
1. **SOLID Principles**:
   - **Single Responsibility (SRP)**: UI components handle display; service files in `/lib/services/` handle business logic & queries; Next.js route handlers handle HTTP request/response orchestration.
   - **Open/Closed (OCP)**: UI primitives in `/components/ui/` are open for extension via props/variants without altering internal implementation.
   - **Dependency Inversion (DIP)**: Components & service layers depend on abstract TypeScript interfaces and types.
2. **DRY (Don't Repeat Yourself)**: Common database queries, permission validators, date formatters, and Zod validation schemas are shared from `/lib/`.
3. **Defensive Programming & Security**:
   - Runtime request payload validation via **Zod** schemas.
   - 100% prepared SQL parameters (`mysqlPool.execute(sql, [params])`) to prevent SQL injection.
   - SameSite HTTP-Only cookie security for admin sessions.

---

## 2. Next.js 14+ Project & Folder Architecture

The CMS Admin Portal is structured inside a clean Next.js 14+ App Router directory layout:

```text
d:\teaCotage-Portal\
├── app/
│   ├── (admin)/                       # Admin Portal SPA Layout & Pages
│   │   ├── admin/
│   │   │   ├── login/                 # Staff Login Screen
│   │   │   ├── dashboard/             # System Dashboard
│   │   │   ├── sites/                 # Multi-Site Management
│   │   │   ├── content/               # Pages & Content Collections
│   │   │   ├── media/                 # Asset Manager Library
│   │   │   └── users/                 # Staff & Role Management
│   │   └── layout.tsx                 # Master Admin Sidebar + TopBar Shell
│   ├── api/                           # Backend API Routes
│   │   └── v1/
│   │       ├── admin/                 # Internal Admin API Endpoints
│   │       └── content/               # Public Content Delivery API
│   ├── layout.tsx                     # Root App HTML Layout
│   └── page.tsx                       # Root Landing / Redirect to /admin
├── components/
│   ├── ui/                            # Generic UI Primitives (Button, Modal, Input, Badge)
│   └── admin/                         # CMS Business Components (SiteSelector, MediaGrid, Editor)
├── lib/
│   ├── db.ts                          # MySQL 8.0 connection pool
│   ├── auth.ts                        # Password hashing (Argon2id) & Session cookies
│   ├── site-context.ts                # Active site context resolver
│   ├── webhooks.ts                    # Revalidation & Webhook dispatcher
│   └── services/                      # Business Logic & Database Queries (SRP)
├── middleware.ts                      # Root Next.js Route Guard & Auth Middleware
├── GEMINI.md                          # AI Agent Directives & Rules
├── Functional spec/                   # Single Source of Truth Specs
│   ├── 00-portal-architecture-spec.md
│   └── 01-authentication-spec.md
└── Technical spec/                    # Matching Technical Specs
    ├── 00-portal-architecture-spec.md
    └── 01-authentication-spec.md
```

---

## 3. Database Architecture & Connection Layer (`/lib/db/`)

The CMS Portal uses **MySQL 8.0+ (InnoDB)** as its sole database engine via **Drizzle ORM**. All raw SQL is prohibited in route handlers — only Drizzle query builders are used.

### 3.1 File Structure
```text
lib/
├── db/
│   ├── pool.ts       # MySQL2 connection pool (eager warmup)
│   ├── schema.ts     # Drizzle table definitions (SSOT for all 8 tables)
│   └── index.ts      # Drizzle ORM instance + re-exports
└── db.ts             # Public export facade (db, schemas, operators)
```

### 3.2 MySQL Connection Pool (`lib/db/pool.ts`)
```typescript
import mysql from 'mysql2/promise';

export const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'teacottage_cms',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
});

// Eager warmup — eliminates cold-start latency on first API request
mysqlPool.getConnection().then(conn => conn.release()).catch(() => {});
```

### 3.3 Drizzle ORM Instance (`lib/db/index.ts`)
```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlPool } from './pool';
import * as schema from './schema';

export const db = drizzle(mysqlPool, { schema, mode: 'default' });
export * from './schema';
export { eq, and, gte, sql, desc, isNull, lt, gt, ne } from 'drizzle-orm';
```

### 3.4 Required Environment Variables
```env
DB_PROVIDER=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=teacottage_cms
```

### 3.5 Drizzle Schema Tables (`lib/db/schema.ts`)
| # | Table | Purpose |
|---|---|---|
| 1 | `sites` | Multi-tenant managed web properties |
| 2 | `users` | Staff portal accounts |
| 3 | `user_sessions` | Secure HTTP-only session tokens |
| 4 | `admin_audit_logs` | Security event audit trail |
| 5 | `roles` | RBAC role definitions |
| 6 | `permissions` | Granular permission codes |
| 7 | `role_permissions` | Role → Permission assignments |
| 8 | `user_site_roles` | User → Site → Role scoped assignments |

---

## 4. Site Context Resolution Engine

### 4.1 Context Resolver Helper (`/lib/site-context.ts`)

```typescript
import { NextRequest } from 'next/server';

export interface SiteContext {
  siteId: string;
  siteSlug: string;
}

export function getActiveSiteContext(req: NextRequest): string | null {
  // 1. Check custom Header (set by Admin Portal Frontend or API client)
  const headerSiteId = req.headers.get('x-site-id');
  if (headerSiteId) return headerSiteId;

  // 2. Check Site Context Cookie
  const cookieSiteId = req.cookies.get('cms_active_site_id')?.value;
  if (cookieSiteId) return cookieSiteId;

  // 3. Fallback to default site (Tea Cottage)
  return '00000000-0000-0000-0000-000000000001';
}
```

---

## 5. Multi-Site Publishing & Webhook Dispatcher

When content is published in the Admin Portal for a specific site (e.g. Tea Cottage), the CMS triggers **On-Demand Revalidation** webhooks to notify the live website frontend.

```typescript
// lib/webhooks.ts
export async function triggerSiteRevalidation(siteSlug: string, paths: string[]) {
  const webhookUrl = process.env[`WEBHOOK_URL_${siteSlug.toUpperCase().replace('-', '_')}`];
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.warn(`No webhook URL configured for site: ${siteSlug}`);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CMS-Webhook-Secret': webhookSecret || '',
      },
      body: JSON.stringify({
        event: 'content.published',
        site_slug: siteSlug,
        revalidate_paths: paths,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`Failed to dispatch revalidation webhook to ${siteSlug}:`, error);
  }
}
```

---

## 6. SSOT Traceability Matrix

| SSOT Requirement (Functional Spec) | Technical Architecture Implementation |
| :--- | :--- |
| **FS-ARCH-01**: Multi-Site Decoupled CMS | Next.js App Router monorepo split into `app/(admin)` and `app/api/v1` |
| **FS-ARCH-02**: Discriminator Column Isolation | Drizzle ORM queries parameterized with `where(eq(table.siteId, siteId))` via `site-context.ts` |
| **FS-ARCH-03**: Live Site Revalidation | Webhook dispatcher (`lib/webhooks.ts`) issuing HMAC-signed invalidation payloads |
| **FS-ARCH-04**: High Performance Connection Pooling | MySQL2 pool (`connectionLimit: 20`) with eager warmup in `lib/db/pool.ts` |
| **FS-ARCH-05**: Single MySQL 8.0+ Provider | Pure Drizzle ORM against MySQL 8.0+ in `lib/db/index.ts` — no raw SQL, no fallback providers |
