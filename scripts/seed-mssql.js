/**
 * MSSQL LocalDB Database Seeder Script
 * Automatically connects to LocalDB named pipe via socketPath / tedious options
 */

const mssql = require('mssql');
const argon2 = require('argon2');
const { execSync } = require('child_process');

function getPipePath() {
  try {
    const output = execSync('sqllocaldb info MSSQLLocalDB', { encoding: 'utf8' });
    const match = output.match(/Instance pipe name:\s+(.+)/i);
    if (match && match[1]) {
      let rawPipe = match[1].trim();
      if (rawPipe.startsWith('np:')) {
        rawPipe = rawPipe.substring(3);
      }
      return rawPipe;
    }
  } catch (e) {
    // Return fallback
  }
  return null;
}

async function seedMSSQL() {
  console.log('🌱 Seeding CMS Admin Portal database in (localdb)\\MSSQLLocalDB...\n');

  const pipePath = getPipePath();
  console.log(`📍 LocalDB Named Pipe: ${pipePath || '(localdb)\\MSSQLLocalDB'}`);

  const database = process.env.MSSQL_DATABASE || 'teacottage_cms';

  // Config using named pipe socketPath & server placeholder
  const baseConfig = {
    server: '.',
    options: {
      socketPath: pipePath || undefined,
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true,
    },
  };

  try {
    // 1. Connect to master DB first
    const masterPool = await mssql.connect({ ...baseConfig, database: 'master' });
    await masterPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${database}')
      BEGIN
        CREATE DATABASE [${database}];
      END
    `);
    await masterPool.close();
    console.log(`✅ Database [${database}] created/verified in (localdb)\\MSSQLLocalDB.`);

    // 2. Connect to teacottage_cms DB
    const pool = await mssql.connect({ ...baseConfig, database });

    // Create Sites table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sites')
      BEGIN
        CREATE TABLE sites (
          id CHAR(36) PRIMARY KEY,
          slug VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255) NULL,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    // Create Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id CHAR(36) PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
          global_role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
          mfa_enabled BIT NOT NULL DEFAULT 0,
          failed_login_attempts INT NOT NULL DEFAULT 0,
          locked_until DATETIME2 NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    // Create Admin Sessions table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
      BEGIN
        CREATE TABLE user_sessions (
          id CHAR(36) PRIMARY KEY,
          user_id CHAR(36) NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          session_token_hash VARCHAR(255) NOT NULL UNIQUE,
          client_ip VARCHAR(45) NOT NULL,
          user_agent VARCHAR(MAX) NULL,
          expires_at DATETIME2 NOT NULL,
          is_revoked BIT NOT NULL DEFAULT 0,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          last_accessed_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    // Create Admin Audit Logs table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'admin_audit_logs')
      BEGIN
        CREATE TABLE admin_audit_logs (
          id CHAR(36) PRIMARY KEY,
          user_id CHAR(36) NULL FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL,
          event_type VARCHAR(100) NOT NULL,
          site_id CHAR(36) NULL,
          ip_address VARCHAR(45) NOT NULL,
          user_agent VARCHAR(MAX) NULL,
          metadata VARCHAR(MAX) NULL,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END
    `);

    // 3. Seed Default Admin User & Default Site
    const adminEmail = 'admin@teacottage.com';
    const plainPassword = 'SuperSecurePassword123!';

    const passwordHash = await argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const userId = '00000000-0000-0000-0000-000000000001';
    const siteId = '00000000-0000-0000-0000-000000000001';

    // Seed Site
    await pool.request()
      .input('id', siteId)
      .query(`
        IF NOT EXISTS (SELECT * FROM sites WHERE id = @id)
        BEGIN
          INSERT INTO sites (id, slug, name, domain) VALUES (@id, 'tea-cottage', 'Tea Cottage Website', 'teacottage.com');
        END
      `);

    // Seed User
    await pool.request()
      .input('id', userId)
      .input('email', adminEmail)
      .input('hash', passwordHash)
      .query(`
        IF NOT EXISTS (SELECT * FROM users WHERE email = @email)
        BEGIN
          INSERT INTO users (id, email, password_hash, first_name, last_name, status, global_role)
          VALUES (@id, @email, @hash, 'Super', 'Admin', 'ACTIVE', 'SUPER_ADMIN');
        END
        ELSE
        BEGIN
          UPDATE users SET password_hash = @hash WHERE email = @email;
        END
      `);

    await pool.close();

    console.log('\n====================================================');
    console.log('🎉 LOCALDB SEEDING COMPLETED SUCCESSFULLY!');
    console.log('====================================================');
    console.log('👤 Admin Email:    admin@teacottage.com');
    console.log('🔑 Admin Password: SuperSecurePassword123!');
    console.log('🖥️ Server:         (localdb)\\MSSQLLocalDB');
    console.log(`🗄️ Database Name: ${database}`);
    console.log('🌐 Admin Portal:   http://localhost:3000/admin/login');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ SQL Server Seeding Error:', err.message);
  }
}

seedMSSQL();
