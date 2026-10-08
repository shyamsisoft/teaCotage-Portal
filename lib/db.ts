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

// MySQL Pool Fallback
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
