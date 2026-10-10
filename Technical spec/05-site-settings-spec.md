# Technical Specification: Site Settings Module

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-SS-005 |
| **Matching Functional Spec** | [`Functional spec/05-site-settings-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/05-site-settings-spec.md) |
| **System Scope** | Multi-Site Management Portal (Tea Cottage & Future Managed Sites) |
| **Target Technology Stack** | **Next.js 14+** (App Router / React) & **MySQL 8.0+** with **Drizzle ORM** |
| **Status** | Approved |
| **Version** | 1.0.0 |

---

## 1. System Architecture & Component Mapping

```
[UI Layer]
  app/admin/settings/page.tsx
  ├── components/admin/settings/site-selector.tsx
  └── components/admin/settings/site-settings-form.tsx

[API Gateway Layer]
  app/api/v1/admin/sites/route.ts        (GET list)
  app/api/v1/admin/sites/[id]/route.ts   (GET detail, PATCH update)

[Business & Data Layer]
  lib/validations/site-settings.ts (Zod)
  lib/db (Drizzle ORM)
  ├── sites table
  └── admin_audit_logs table
```

---

## 2. Runtime Validation Schema (Zod)

```typescript
import { z } from 'zod';

export const UpdateSiteSettingsSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(255).optional(),
  domain: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});
```

---

## 3. Database Layer (Drizzle ORM)

```typescript
// GET site details
const site = await db.select().from(sites).where(eq(sites.id, id));

// PATCH site settings
await db.update(sites).set(updates).where(eq(sites.id, id));

// Record audit log
await db.insert(adminAuditLogs).values({
  id: crypto.randomUUID(),
  userId,
  eventType: 'SITE_UPDATE',
  ipAddress,
  userAgent,
  metadata: JSON.stringify(updates),
});
```

---

## 4. Requirements Traceability Matrix (RTM)

| Functional Spec Req | Technical Implementation | QA Test Case ID | Status |
| :--- | :--- | :--- | :--- |
| `FS-SS-01` | `GET /api/v1/admin/sites` & `site-selector.tsx` | `TC-SS-001` | Planned |
| `FS-SS-02` | `PATCH /api/v1/admin/sites/[id]` & `site-settings-form.tsx` | `TC-SS-002` | Planned |
| `FS-SS-03` | Audit logging (`SITE_UPDATE`) | `TC-SS-003` | Planned |
