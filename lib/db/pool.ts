import mysql from 'mysql2/promise';

export const DB_PROVIDER = process.env.DB_PROVIDER || 'mysql';

// MySQL Pool Configuration
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

// Background eager warmup for instant initial API responses
mysqlPool.getConnection().then(conn => conn.release()).catch(() => {});
