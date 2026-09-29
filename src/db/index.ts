import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { DATABASE_URL, NODE_ENV } from "../config/env.js";

const isProduction = NODE_ENV === "production";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction,
});

export const db = drizzle(pool);

export type Database = typeof db;