# Technical Specification: Logged User Profile Management & Password Workflow

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-USR-003 |
| **Source of Truth Reference** | [`Functional spec/03-user-profile-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/03-user-profile-spec.md) *(SSOT v1.0.0)* |
| **Module Name** | Core Identity, User Profile Management & Account Security |
| **Target Technology Stack** | **Next.js 14+ (App Router, TypeScript)** & **MySQL 8.0+ (InnoDB)** |
| **Status** | Approved |
| **Version** | 1.0.0 |

> [!IMPORTANT]
> **Source of Truth Compliance Governance**:
> The [Functional Specification](file:///d:/teaCotage-Portal/Functional%20spec/03-user-profile-spec.md) is the authoritative **Single Source of Truth (SSOT)**. This Technical Specification defines Zod runtime schemas, API route handler logic, and UI component architecture derived directly from the SSOT.

---

## 1. Zod Validation Schemas (`lib/validations/user-profile.ts`)

```typescript
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'New password must be at least 12 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one numeric digit')
      .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
```

---

## 2. API Route Handlers

### 2.1 Profile API (`/app/api/v1/admin/users/me/route.ts`)
- **GET**: Resolves active session token from cookie, queries `users` and `user_site_roles` tables, returns `{ user: { id, email, firstName, lastName, globalRole, status, assignedSites, createdAt } }`.
- **PATCH**: Validates request body with `UpdateProfileSchema`, updates `first_name` and `last_name` in `users` table, writes `PROFILE_UPDATE` audit log.

### 2.2 Password API (`/app/api/v1/admin/users/me/password/route.ts`)
- **POST**: Validates body with `ChangePasswordSchema`, verifies `currentPassword` using Argon2id, hashes `newPassword` with Argon2id, updates `password_hash` in `users`, sets `is_revoked = 1` for other active sessions, writes `PASSWORD_CHANGE_SUCCESS` audit log.

---

## 3. UI Page Architecture (`app/admin/profile/page.tsx`)

Tabbed or card-based React Client component:
- **Header Card**: User Avatar, Full Name, Email, Global Role Badge, Account Creation Date.
- **Personal Details Form Card**: Inputs for First Name & Last Name, with Save Changes button & toast feedback.
- **Password & Security Card**: Form for Current Password, New Password, Confirm Password, with live strength feedback.
- **Assigned Managed Sites Card**: List of assigned sites and roles (e.g. Tea Cottage Website - Site Admin).

---

## 4. SSOT Traceability Matrix

| SSOT Requirement (Functional Spec) | Technical Implementation (Next.js & MySQL) |
| :--- | :--- |
| **FS-USR-01**: Profile View | `GET /api/v1/admin/users/me` + MySQL `users` & `user_site_roles` |
| **FS-USR-02**: Profile Update | `PATCH /api/v1/admin/users/me` + `UpdateProfileSchema` validation |
| **FS-USR-03**: Password Change | `POST /api/v1/admin/users/me/password` + `ChangePasswordSchema` + Argon2id |
| **FS-USR-04**: Session Cleanup | `UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ? AND id != current` |
| **FS-USR-05**: Audit Log | `INSERT INTO admin_audit_logs` (`PROFILE_UPDATE`, `PASSWORD_CHANGE_SUCCESS`) |
