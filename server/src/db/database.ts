import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Auto-detect mode: if DATABASE_URL is set, use Postgres; otherwise use SQLite
const usePostgres = !!process.env.DATABASE_URL;

let pool: pg.Pool;
let sqliteDb: any; // better-sqlite3 Database instance

async function initSqlite() {
  if (sqliteDb) return sqliteDb;
  const Database = (await import("better-sqlite3")).default;
  const dbPath = path.resolve(__dirname, "../../local.db");
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma("journal_mode = WAL");
  sqliteDb.pragma("foreign_keys = ON");
  console.log(`Connected to SQLite (${dbPath})`);
  return sqliteDb;
}

export async function getDb(): Promise<any> {
  if (usePostgres) {
    if (pool) return pool;
    const { config } = await import("../config/env.js");
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
    const client = await pool.connect();
    console.log("Connected to Postgres (Supabase)");
    client.release();
    return pool;
  } else {
    return initSqlite();
  }
}

// Convert ? placeholders to $1, $2, etc. (for Postgres only)
function pgParams(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function queryAll(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  if (usePostgres) {
    const result = await pool.query(pgParams(sql), params);
    return result.rows;
  } else {
    const db = await initSqlite();
    const stmt = db.prepare(sql);
    return stmt.all(...params) as Record<string, unknown>[];
  }
}

export async function queryOne(sql: string, params: unknown[] = []): Promise<Record<string, unknown> | undefined> {
  if (usePostgres) {
    const rows = await queryAll(sql, params);
    return rows[0];
  } else {
    const db = await initSqlite();
    const stmt = db.prepare(sql);
    return stmt.get(...params) as Record<string, unknown> | undefined;
  }
}

export async function run(sql: string, params: unknown[] = []): Promise<void> {
  if (usePostgres) {
    await pool.query(pgParams(sql), params);
  } else {
    const db = await initSqlite();
    const stmt = db.prepare(sql);
    stmt.run(...params);
  }
}

export async function exec(sql: string): Promise<void> {
  if (usePostgres) {
    await pool.query(sql);
  } else {
    const db = await initSqlite();
    db.exec(sql);
  }
}

export function isLocalMode(): boolean {
  return !usePostgres;
}
