import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForPool = globalThis as unknown as { dbPool: Pool | undefined };
let pool: Pool;
let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

function getPool() {
  if (globalForPool.dbPool) return globalForPool.dbPool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  pool = new Pool({ connectionString: url, max: 5 });
  if (process.env.NODE_ENV !== "production") {
    globalForPool.dbPool = pool;
  }
  return pool;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}
