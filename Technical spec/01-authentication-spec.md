# Technical Specification: CMS Admin Portal Authentication & Authorization

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | TS-AUTH-001 |
| **Source of Truth Reference** | [`Functional spec/01-authentication-spec.md`](file:///d:/teaCotage-Portal/Functional%20spec/01-authentication-spec.md) *(SSOT v1.3.0)* |
| **Module Name** | Core Identity, Authentication & Authorization |
| **Target Technology Stack** | **Next.js 14+ (App Router, TypeScript)** & **MySQL 8.0+ (InnoDB)** |
| **Status** | Approved |
| **Version** | 1.2.0 |

> [!IMPORTANT]
> **Source of Truth Compliance Governance**:
> The [Functional Specification](file:///d:/teaCotage-Portal/Functional%20spec/01-authentication-spec.md) is the authoritative **Single Source of Truth (SSOT)**. This Technical Specification defines the physical **MySQL database schema**, **Next.js middleware guard**, and TypeScript session implementations derived directly from the SSOT.

---

## 1. Physical MySQL Database Schema (MySQL 8.0+ DDL)

All tables use `ENGINE=InnoDB` with `utf8mb4` character set and `utf8mb4_unicode_ci` collation. IDs use 36-character UUID strings (`CHAR(36)`).

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS `teacottage_cms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `teacottage_cms`;

-- Disable foreign key checks for schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. USERS TABLE
-- =============================================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED') NOT NULL DEFAULT 'PENDING',
    `global_role` ENUM('SUPER_ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `mfa_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `mfa_secret` VARCHAR(255) NULL,
    `failed_login_attempts` INT NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_users_email` (`email`),
    KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. SITES TABLE (Managed Websites / Tenants)
-- =============================================================================
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites` (
    `id` CHAR(36) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `domain` VARCHAR(255) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sites_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Initial Site: Tea Cottage
INSERT INTO `sites` (`id`, `slug`, `name`, `domain`) 
VALUES ('00000000-0000-0000-0000-000000000001', 'tea-cottage', 'Tea Cottage Website', 'teacottage.com');

-- =============================================================================
-- 3. ROLES TABLE
-- =============================================================================
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_roles_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `code`, `name`, `description`) VALUES
(UUID(), 'SITE_ADMIN', 'Site Administrator', 'Full administrative control over a specific site'),
(UUID(), 'CONTENT_EDITOR', 'Content Editor', 'Can create and edit content drafts'),
(UUID(), 'PUBLISHER', 'Content Publisher', 'Can review and publish content to live environment'),
(UUID(), 'AUDITOR', 'Site Auditor', 'Read-only preview access');

-- =============================================================================
-- 4. PERMISSIONS TABLE
-- =============================================================================
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_permissions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`id`, `code`, `description`) VALUES
(UUID(), 'site:settings:update', 'Update site configurations'),
(UUID(), 'site:users:invite', 'Invite users to site'),
(UUID(), 'content:pages:create', 'Create content pages'),
(UUID(), 'content:pages:update', 'Edit content pages'),
(UUID(), 'content:pages:publish', 'Publish content pages'),
(UUID(), 'content:pages:delete', 'Delete content pages'),
(UUID(), 'content:pages:preview', 'Preview unpublished content'),
(UUID(), 'media:upload', 'Upload media assets');

-- =============================================================================
-- 5. ROLE_PERMISSIONS JOIN TABLE
-- =============================================================================
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
    `role_id` CHAR(36) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. USER_SITE_ROLES (Multi-Site Role Assignment)
-- =============================================================================
DROP TABLE IF EXISTS `user_site_roles`;
CREATE TABLE `user_site_roles` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `site_id` CHAR(36) NOT NULL,
    `role_id` CHAR(36) NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_site_role` (`user_id`, `site_id`, `role_id`),
    CONSTRAINT `fk_usr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_usr_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_usr_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. ADMIN_SESSIONS
-- =============================================================================
DROP TABLE IF EXISTS `admin_sessions`;
CREATE TABLE `admin_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `session_token_hash` VARCHAR(255) NOT NULL,
    `client_ip` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_accessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_session_token_hash` (`session_token_hash`),
    KEY `idx_admin_sessions_user` (`user_id`),
    CONSTRAINT `fk_sess_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. INVITATION_TOKENS
-- =============================================================================
DROP TABLE IF EXISTS `invitation_tokens`;
CREATE TABLE `invitation_tokens` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `invited_by_user_id` CHAR(36) NOT NULL,
    `initial_site_roles` JSON NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `is_consumed` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_invite_token_hash` (`token_hash`),
    CONSTRAINT `fk_invite_user` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. ADMIN_AUDIT_LOGS
-- =============================================================================
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `site_id` CHAR(36) NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    KEY `idx_audit_user` (`user_id`),
    KEY `idx_audit_event` (`event_type`),
    KEY `idx_audit_created` (`created_at`),
    CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_audit_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

---

## 2. Next.js App Router Architecture & Authentication Middleware

### 2.1 Next.js Root Middleware (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/activate'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Only intercept /admin dashboard routes & /api/v1/admin protected APIs
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/v1/admin')) {
    return NextResponse.next();
  }

  // 2. Allow public admin routes
  if (PUBLIC_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 3. Extract Session Cookie
  const sessionToken = request.cookies.get('cms_admin_session')?.value;

  if (!sessionToken) {
    if (pathname.startsWith('/api/v1/admin')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/admin/:path*'],
};
```

---

### 2.2 Next.js Auth API Handler (`/app/api/v1/admin/auth/login/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import argon2 from 'argon2';
import crypto from 'crypto';
import { mysqlPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'MISSING_CREDENTIALS' }, { status: 400 });
    }

    // 1. Query User in MySQL
    const [rows]: any = await mysqlPool.execute(
      'SELECT id, email, password_hash, first_name, last_name, status, global_role FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'ACCOUNT_NOT_ACTIVE' }, { status: 403 });
    }

    // 2. Verify Argon2id Password
    const isValidPassword = await argon2.verify(user.password_hash, password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    // 3. Generate Session Token & Hash
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 min

    // 4. Save Session in MySQL
    const sessionId = crypto.randomUUID();
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    await mysqlPool.execute(
      `INSERT INTO admin_sessions (id, user_id, session_token_hash, client_ip, user_agent, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, tokenHash, clientIp, userAgent, expiresAt]
    );

    // 5. Set HTTP-Only Cookie in Next.js
    const cookieStore = cookies();
    cookieStore.set('cms_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresAt,
    });

    return NextResponse.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          global_role: user.global_role,
        },
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
```

---

## 3. SSOT Traceability Matrix

| SSOT Requirement (Functional Spec) | Technical Implementation (Next.js & MySQL) |
| :--- | :--- |
| **FS-01**: Admin Invitation Flow | MySQL `invitation_tokens` table + Next.js token activation route `/admin/activate` |
| **FS-02**: Multi-Site Role Isolation | MySQL `user_site_roles` composite unique constraint `(user_id, site_id, role_id)` |
| **FS-03**: Secure Admin Session | Next.js `cookies().set()` with `HttpOnly`, `SameSite=Strict` + MySQL `admin_sessions` table |
| **FS-04**: Password Hashing | Argon2id verification using `argon2` npm library |
| **FS-05**: Audit Trail | `admin_audit_logs` MySQL InnoDB table with JSON metadata column |
