import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DATABASE_URL, NODE_ENV } from '../config/env.js';

const isProduction = NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);

export type Database = typeof db;