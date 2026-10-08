/**
 * Local MySQL Database Seeder Script
 * Automatically creates teacottage_cms database and seeds initial admin user & default site
 */

const mysql = require('mysql2/promise');
const argon2 = require('argon2');

async function seed() {
  console.log('🌱 Seeding CMS Admin Portal local MySQL database...');

  const host = process.env.MYSQL_HOST || 'localhost';
  const port = Number(process.env.MYSQL_PORT) || 3306;
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const databaseName = process.env.MYSQL_DATABASE || 'teacottage_cms';

  try {
    // 1. Connect without database name to ensure DB exists
    const rootConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConnection.end();

    // 2. Connect to teacottage_cms database
    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database: databaseName,
    });

    // Create DDL tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sites (
        id CHAR(36) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        global_role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
        mfa_enabled TINYINT(1) NOT NULL DEFAULT 0,
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME(3) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

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

    // Insert Default Site
    await pool.execute(
      `INSERT INTO sites (id, slug, name, domain) 
       VALUES (?, 'tea-cottage', 'Tea Cottage Website', 'teacottage.com')
       ON DUPLICATE KEY UPDATE name = 'Tea Cottage Website'`,
      [siteId]
    );

    // Insert Default Super Admin User
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, status, global_role)
       VALUES (?, ?, ?, 'Super', 'Admin', 'ACTIVE', 'SUPER_ADMIN')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [userId, adminEmail, passwordHash]
    );

    await pool.end();

    console.log('\n✅ Local Database Seeding Complete!');
    console.log('----------------------------------------------------');
    console.log('👤 Admin Email:    admin@teacottage.com');
    console.log('🔑 Admin Password: SuperSecurePassword123!');
    console.log('🌐 Admin Portal:   http://localhost:3000/admin/login');
    console.log('----------------------------------------------------\n');
  } catch (err) {
    console.error('\n❌ Seeding Failed!');
    console.error('Error Details:', err.code || err.message);
    console.error('Hint: Make sure your MySQL server is running on ' + host + ':' + port + ' with user "' + user + '".\n');
  }
}

seed();
