import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  NODE_ENV,
  POSTGRES_DB,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER,
} from "../config/env.js";

const isProduction = NODE_ENV === "production";

const pool = new Pool({
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);

export type Database = typeof db;