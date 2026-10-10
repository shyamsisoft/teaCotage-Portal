import {
  mysqlTable,
  varchar,
  char,
  datetime,
  boolean,
  int,
  text,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// 1. Sites Table (Multi-Tenant Managed Properties)
export const sites = mysqlTable('sites', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 2. Users Table (Staff Accounts)
export const users = mysqlTable('users', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('ACTIVE').notNull(),
  globalRole: varchar('global_role', { length: 50 }).default('SUPER_ADMIN').notNull(),
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  failedLoginAttempts: int('failed_login_attempts').default(0).notNull(),
  lockedUntil: datetime('locked_until'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 3. User Sessions Table (Session Token Security & Revocation)
export const userSessions = mysqlTable('user_sessions', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull(),
  sessionTokenHash: varchar('session_token_hash', { length: 255 }).notNull(),
  clientIp: varchar('client_ip', { length: 50 }),
  userAgent: varchar('user_agent', { length: 500 }),
  expiresAt: datetime('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 4. Admin Audit Logs Table (Security Event Logging)
export const adminAuditLogs = mysqlTable('admin_audit_logs', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: varchar('user_agent', { length: 500 }),
  metadata: text('metadata'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// 5. Roles Table (System RBAC Roles)
export const roles = mysqlTable('roles', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
});

// 6. User Site Roles Table (Site-Scoped Role Assignments)
export const userSiteRoles = mysqlTable(
  'user_site_roles',
  {
    userId: char('user_id', { length: 36 }).notNull(),
    siteId: char('site_id', { length: 36 }).notNull(),
    roleId: char('role_id', { length: 36 }).notNull(),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.userId, table.siteId, table.roleId] }),
  })
);

// 7. Permissions Table
export const permissions = mysqlTable('permissions', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

// 8. Role Permissions Table
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    roleId: char('role_id', { length: 36 }).notNull(),
    permissionId: char('permission_id', { length: 36 }).notNull(),
  },
  (table: any) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  })
);
