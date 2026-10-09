import { Pool } from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connStr =
      process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
    pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function query(text: string, params: any[] = []) {
  const p = getPool();
  return p.query(text, params);
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const r = await query(text, params);
  return (r.rows[0] as T) ?? null;
}
