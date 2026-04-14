import pg from "pg";
import { config } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool;

export async function getDb(): Promise<pg.Pool> {
  if (pool) return pool;

  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  console.log("Connected to Postgres (Supabase)");
  client.release();

  return pool;
}

// Convert ? placeholders to $1, $2, etc.
function pgParams(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function queryAll(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const result = await pool.query(pgParams(sql), params);
  return result.rows;
}

export async function queryOne(sql: string, params: unknown[] = []): Promise<Record<string, unknown> | undefined> {
  const rows = await queryAll(sql, params);
  return rows[0];
}

export async function run(sql: string, params: unknown[] = []): Promise<void> {
  await pool.query(pgParams(sql), params);
}

export async function exec(sql: string): Promise<void> {
  await pool.query(sql);
}
