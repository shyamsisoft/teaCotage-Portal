# Technical Specification: User Management Module

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-UM-004 |
| **Matching Functional Spec** | [`Functional spec/04-user-management-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/04-user-management-spec.md) |
| **System Scope** | Multi-Site Management Portal (Tea Cottage & Future Managed Sites) |
| **Target Technology Stack** | **Next.js 14+** (App Router / React) & **MySQL 8.0+** with **Drizzle ORM** |
| **Status** | Approved |
| **Version** | 1.0.0 |

---

## 1. System Architecture & Component Mapping

```
[UI Layer]
  app/admin/users/page.tsx
  ├── components/admin/users/user-management-table.tsx
  ├── components/admin/users/create-user-modal.tsx
  └── components/admin/users/edit-user-modal.tsx

[API Gateway Layer]
  app/api/v1/admin/users/route.ts        (GET list, POST create)
  app/api/v1/admin/users/[id]/route.ts   (GET detail, PATCH update)

[Business & Data Layer]
  lib/auth.ts / lib/db (Drizzle ORM)
  ├── users table
  ├── user_site_roles table
  ├── roles table
  ├── sites table
  └── admin_audit_logs table
```

---

## 2. Runtime Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const UserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a digit")
    .regex(/[@$!%*?&]/, "Password must contain a special character (@$!%*?&)"),
  globalRole: z.enum(['SUPER_ADMIN', 'SITE_ADMIN', 'CONTENT_EDITOR', 'VIEWER']),
  siteRoles: z.array(z.object({
    siteId: z.string().uuid(),
    roleId: z.string().uuid(),
  })).optional().default([]),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  globalRole: z.enum(['SUPER_ADMIN', 'SITE_ADMIN', 'CONTENT_EDITOR', 'VIEWER']).optional(),
  siteRoles: z.array(z.object({
    siteId: z.string().uuid(),
    roleId: z.string().uuid(),
  })).optional(),
});
```

---

## 3. Database Layer (Drizzle ORM)

### 3.1 Queries Executed
- **Fetch Users with Site Count & Roles**:
  ```typescript
  db.select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    status: users.status,
    globalRole: users.globalRole,
    createdAt: users.createdAt,
  }).from(users)...
  ```
- **Insert User & Site Roles**:
  ```typescript
  await db.insert(users).values({ ... });
  await db.insert(userSiteRoles).values([ ... ]);
  await db.insert(adminAuditLogs).values({ eventType: 'USER_CREATE', ... });
  ```

---

## 4. Requirements Traceability Matrix (RTM)

| Functional Spec Req | Technical Implementation | QA Test Case ID | Status |
| :--- | :--- | :--- | :--- |
| `FS-UM-01` | `GET /api/v1/admin/users` & `user-management-table.tsx` | `TC-UM-001` | Planned |
| `FS-UM-02` | `POST /api/v1/admin/users` & `create-user-modal.tsx` | `TC-UM-002` | Planned |
| `FS-UM-03` | `PATCH /api/v1/admin/users/[id]` & `edit-user-modal.tsx` | `TC-UM-003` | Planned |
| `FS-UM-04` | Permission verification (`users:read`, `users:write`) | `TC-UM-004` | Planned |
