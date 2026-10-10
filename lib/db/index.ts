import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { mysqlPool } from './pool';
import * as schema from './schema';

// Multi-Environment Drizzle ORM Instance
export const db = drizzleMysql(mysqlPool, { schema, mode: 'default' });

export * from './schema';
export { eq, and, gte, sql, desc, isNull, lt, gt, ne, like } from 'drizzle-orm';
