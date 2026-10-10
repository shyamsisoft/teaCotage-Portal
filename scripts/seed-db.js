/**
 * Tea Cottage Portal — MySQL Database Seeder
 * Creates all 8 schema tables and seeds initial admin user, default site,
 * RBAC roles, permissions, and user-site-role assignments.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const argon2 = require('argon2');

// Load .env.local if present
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

async function seed() {
  console.log('🌱 Seeding Tea Cottage Portal MySQL database...\n');

  const host     = process.env.MYSQL_HOST     || 'localhost';
  const port     = Number(process.env.MYSQL_PORT) || 3306;
  const user     = process.env.MYSQL_USER     || 'root';
  const password = process.env.MYSQL_PASSWORD || 'root';
  const dbName   = process.env.MYSQL_DATABASE || 'teacottage_cms';

  let pool;
  try {
    // 1. Ensure database exists
    const root = await mysql.createConnection({ host, port, user, password });
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await root.end();
    console.log(`✅ Database \`${dbName}\` ready`);

    // 2. Connect to the target database
    pool = mysql.createPool({ host, port, user, password, database: dbName, multipleStatements: true });

    // ── DDL ─────────────────────────────────────────────────────────────────

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id          CHAR(36)      NOT NULL PRIMARY KEY,
        slug        VARCHAR(100)  NOT NULL UNIQUE,
        name        VARCHAR(255)  NOT NULL,
        domain      VARCHAR(255)  NULL,
        is_active   TINYINT(1)    NOT NULL DEFAULT 1,
        created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                     CHAR(36)      NOT NULL PRIMARY KEY,
        email                  VARCHAR(255)  NOT NULL UNIQUE,
        password_hash          VARCHAR(255)  NOT NULL,
        first_name             VARCHAR(100)  NOT NULL,
        last_name              VARCHAR(100)  NOT NULL,
        status                 VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE',
        global_role            VARCHAR(50)   NOT NULL DEFAULT 'SUPER_ADMIN',
        mfa_enabled            TINYINT(1)    NOT NULL DEFAULT 0,
        failed_login_attempts  INT           NOT NULL DEFAULT 0,
        locked_until           DATETIME(3)   NULL,
        created_at             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id                  CHAR(36)      NOT NULL PRIMARY KEY,
        user_id             CHAR(36)      NOT NULL,
        session_token_hash  VARCHAR(255)  NOT NULL,
        client_ip           VARCHAR(50)   NULL,
        user_agent          VARCHAR(500)  NULL,
        expires_at          DATETIME(3)   NOT NULL,
        is_revoked          TINYINT(1)    NOT NULL DEFAULT 0,
        created_at          DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_token_hash (session_token_hash),
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id          CHAR(36)      NOT NULL PRIMARY KEY,
        user_id     CHAR(36)      NULL,
        event_type  VARCHAR(100)  NOT NULL,
        ip_address  VARCHAR(50)   NULL,
        user_agent  VARCHAR(500)  NULL,
        metadata    TEXT          NULL,
        created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_event (event_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id           CHAR(36)      NOT NULL PRIMARY KEY,
        code         VARCHAR(50)   NOT NULL UNIQUE,
        name         VARCHAR(100)  NOT NULL,
        description  VARCHAR(255)  NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id           CHAR(36)      NOT NULL PRIMARY KEY,
        code         VARCHAR(100)  NOT NULL UNIQUE,
        description  VARCHAR(255)  NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id        CHAR(36) NOT NULL,
        permission_id  CHAR(36) NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_rp_role       FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
        CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_site_roles (
        user_id  CHAR(36) NOT NULL,
        site_id  CHAR(36) NOT NULL,
        role_id  CHAR(36) NOT NULL,
        PRIMARY KEY (user_id, site_id, role_id),
        CONSTRAINT fk_usr_user FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
        CONSTRAINT fk_usr_site FOREIGN KEY (site_id) REFERENCES sites(id)  ON DELETE CASCADE,
        CONSTRAINT fk_usr_role FOREIGN KEY (role_id) REFERENCES roles(id)  ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ All 8 tables created');

    // ── Seed Data ────────────────────────────────────────────────────────────

    const siteId  = '00000000-0000-0000-0000-000000000001';
    const userId  = '00000000-0000-0000-0000-000000000001';
    const roleId  = '00000000-0000-0000-0000-000000000001';

    // Default site
    await pool.execute(
      `INSERT INTO sites (id, slug, name, domain)
       VALUES (?, 'tea-cottage', 'Tea Cottage Website', 'teacottage.com')
       ON DUPLICATE KEY UPDATE name = 'Tea Cottage Website'`,
      [siteId]
    );

    // Roles
    const rolesData = [
      [roleId,                                  'SUPER_ADMIN',    'Super Administrator', 'Full system access'],
      ['00000000-0000-0000-0000-000000000002',  'SITE_ADMIN',     'Site Administrator',  'Full site-level access'],
      ['00000000-0000-0000-0000-000000000003',  'CONTENT_EDITOR', 'Content Editor',       'Create and edit content'],
      ['00000000-0000-0000-0000-000000000004',  'VIEWER',         'Viewer',               'Read-only access'],
    ];
    for (const [id, code, name, desc] of rolesData) {
      await pool.execute(
        `INSERT INTO roles (id, code, name, description) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [id, code, name, desc]
      );
    }

    // Permissions
    const permissionsData = [
      ['perm-0000-0000-0000-000000000001', 'content:pages:read',    'View pages'],
      ['perm-0000-0000-0000-000000000002', 'content:pages:write',   'Create/edit pages'],
      ['perm-0000-0000-0000-000000000003', 'content:pages:publish', 'Publish pages'],
      ['perm-0000-0000-0000-000000000004', 'content:pages:delete',  'Delete pages'],
      ['perm-0000-0000-0000-000000000005', 'media:read',            'View media library'],
      ['perm-0000-0000-0000-000000000006', 'media:upload',          'Upload media'],
      ['perm-0000-0000-0000-000000000007', 'media:delete',          'Delete media'],
      ['perm-0000-0000-0000-000000000008', 'users:read',            'View users'],
      ['perm-0000-0000-0000-000000000009', 'users:write',           'Create/edit users'],
      ['perm-0000-0000-0000-000000000010', 'settings:read',         'View settings'],
      ['perm-0000-0000-0000-000000000011', 'settings:write',        'Update settings'],
    ];
    for (const [id, code, desc] of permissionsData) {
      await pool.execute(
        `INSERT INTO permissions (id, code, description) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [id, code, desc]
      );
    }

    // Assign ALL permissions to SUPER_ADMIN role
    for (const [permId] of permissionsData) {
      await pool.execute(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [roleId, permId]
      );
    }

    // Admin user
    const adminEmail    = 'admin@teacottage.com';
    const plainPassword = 'SuperSecurePassword123!';
    const passwordHash  = await argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, status, global_role)
       VALUES (?, ?, ?, 'Super', 'Admin', 'ACTIVE', 'SUPER_ADMIN')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [userId, adminEmail, passwordHash]
    );

    // Assign SUPER_ADMIN role on Tea Cottage site
    await pool.execute(
      `INSERT IGNORE INTO user_site_roles (user_id, site_id, role_id) VALUES (?, ?, ?)`,
      [userId, siteId, roleId]
    );

    await pool.end();

    console.log('\n✅ Tea Cottage Portal Database Seeding Complete!');
    console.log('────────────────────────────────────────────────');
    console.log('👤 Admin Email:    admin@teacottage.com');
    console.log('🔑 Admin Password: SuperSecurePassword123!');
    console.log('🌐 Admin Portal:   http://localhost:3000/admin/login');
    console.log('────────────────────────────────────────────────\n');

  } catch (err) {
    if (pool) await pool.end().catch(() => {});
    console.error('\n❌ Seeding Failed!');
    console.error('Error:', err.code || err.message);
    console.error(`\nHint: Is MySQL running on ${host}:${port} with user "${user}"?\n`);
    process.exit(1);
  }
}

seed();
