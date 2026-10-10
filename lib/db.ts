import { mysqlPool } from './db/pool';

export { DB_PROVIDER, mysqlPool } from './db/pool';

// Unified Query Execution Layer (Kept for backward compatibility in tests)
export async function executeQuery(query: string, params: any[] = []) {
  return await mysqlPool.execute(query, params);
}

// Export Drizzle ORM Instance, Schemas & Helper Operators
export { db } from './db/index';
export * from './db/schema';
export { eq, and, gte, sql, desc, isNull, lt, gt, ne, like } from 'drizzle-orm';

