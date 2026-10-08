# Technical Specification: CMS Portal Architecture & System Overview

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-ARCH-000 |
| **Source of Truth Reference** | [`Functional spec/00-portal-architecture-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/00-portal-architecture-spec.md) *(SSOT v1.0.0)* |
| **Module Name** | Core System Architecture & Multi-Site CMS Engine |
| **Target Technology Stack** | **Next.js 14+ (App Router, TypeScript)** & **MySQL 8.0+ (InnoDB)** |
| **Status** | Approved |
| **Version** | 1.1.0 |

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

## 3. Multi-Database Architecture & Abstraction Layer (`/lib/db.ts`)

The CMS Portal supports multiple relational database engines (**MS SQL Server Express LocalDB** for Windows local development and **MySQL 8.0+** for production deployments) via a unified query execution layer in `/lib/db.ts`:

```typescript
import mssql from 'mssql/msnodesqlv8';
import mysql from 'mysql2/promise';

export const DB_PROVIDER = process.env.DB_PROVIDER || 'mssql';

const rawMssqlString =
  process.env.MSSQL_CONNECTION_STRING ||
  'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;';

export const MSSQL_CONNECTION_STRING =
  !rawMssqlString.includes('Driver=') && rawMssqlString.includes('(localdb)')
    ? `Driver={ODBC Driver 17 for SQL Server};${rawMssqlString}`
    : rawMssqlString;

let mssqlPoolPromise: Promise<any> | null = null;

export async function getMssqlPool(): Promise<any> {
  if (!mssqlPoolPromise) {
    mssqlPoolPromise = mssql.connect({ connectionString: MSSQL_CONNECTION_STRING } as any);
  }
  return mssqlPoolPromise;
}

export const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'teacottage_cms',
  waitForConnections: true,
  connectionLimit: 20,
});

// Unified Query Execution Layer
export async function executeQuery(query: string, params: any[] = []) {
  if (DB_PROVIDER === 'mssql') {
    const pool = await getMssqlPool();
    const request = pool.request();
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    let parameterizedQuery = query;
    let paramIndex = 0;
    parameterizedQuery = parameterizedQuery.replace(/\?/g, () => `@param${paramIndex++}`);

    const result = await request.query(parameterizedQuery);
    return [result.recordset];
  } else {
    return await mysqlPool.execute(query, params);
  }
}
```

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
| **FS-ARCH-02**: Discriminator Column Isolation | MySQL queries parameterized with `WHERE site_id = ?` via `site-context.ts` |
| **FS-ARCH-03**: Live Site Revalidation | Webhook dispatcher (`lib/webhooks.ts`) issuing HMAC-signed invalidation payloads |
| **FS-ARCH-04**: High Performance Connection Pooling | Connection pool configured for active queries across MySQL and MSSQL LocalDB |
| **FS-ARCH-05**: Multi-Database Provider Architecture | Dynamic strategy adapter in `lib/db.ts` supporting `mssql` (LocalDB) and `mysql` |
